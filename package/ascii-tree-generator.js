#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Default ignore patterns when no .gitignore exists
const DEFAULT_IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  '*.log',
  'dist',
  'build',
  '.vscode',
  '.idea',
  '.DS_Store',
  'Thumbs.db',
  '*.tmp',
  '*.cache'
];

// Always ignore these (even if not in .gitignore)
const ALWAYS_IGNORE = [
  '.git',
  'project-ascii-tree.txt'
];

class AsciiTreeGenerator {
  constructor(options = {}) {
    this.options = {
      all: false,
      exceptDirs: [],
      exceptFiles: [],
      outputName: 'project-ascii-tree.txt',
      outputPath: '.',
      dryRun: false,
      maxDepth: Infinity,
      includePattern: null,
      excludePattern: null,
      minSize: 0,
      maxSize: Infinity,
      debug: false,
      ...options
    };
    
    this.projectRoot = process.cwd();
    this.gitignoreFiles = this.findAllGitignores();
    this.includeRegex = this.createRegex(this.options.includePattern, 'include');
    this.excludeRegex = this.createRegex(this.options.excludePattern, 'exclude');
  }

  createRegex(pattern, type) {
    if (!pattern) return null;
    
    try {
      const regex = new RegExp(pattern);
      
      if (this.options.debug) {
        console.log(`\n=== ${type.toUpperCase()} REGEX DEBUG ===`);
        console.log(`Original pattern: "${pattern}"`);
        console.log(`Regex source: ${regex.source}`);
        console.log(`Sample tests:`);
        
        const testFiles = ['database.js', 'config.json', 'types.ts', 'style.css', 'README.md'];
        testFiles.forEach(file => {
          const result = regex.test(file);
          console.log(`  ${file}: ${result ? '✓' : '✗'}`);
        });
        console.log('========================\n');
      }
      
      return regex;
    } catch (e) {
      console.error(`Error creating ${type} regex from pattern "${pattern}": ${e.message}`);
      return null;
    }
  }

  // Recursively find all .gitignore files in the project
  findAllGitignores() {
    const gitignoreFiles = [];
    
    if (this.options.all) {
      console.log('Using --all flag: including all files except system files');
      return this.createDefaultGitignoreStructure();
    }

    this.findGitignoresRecursive(this.projectRoot, '', gitignoreFiles);
    
    if (gitignoreFiles.length === 0) {
      console.log('No .gitignore files found, using default ignore patterns');
      return this.createDefaultGitignoreStructure();
    }

    // Sort by specificity (root first, then more specific)
    gitignoreFiles.sort((a, b) => a.relativePath.length - b.relativePath.length);
    
    const totalPatterns = gitignoreFiles.reduce((sum, gi) => sum + gi.patterns.length, 0);
    console.log(`Found ${gitignoreFiles.length} .gitignore file(s) with ${totalPatterns} total patterns:`);
    gitignoreFiles.forEach(gi => {
      const location = gi.relativePath === '' ? 'root' : gi.relativePath;
      console.log(`  - ${location}: ${gi.patterns.length} patterns`);
    });

    return gitignoreFiles;
  }

  createDefaultGitignoreStructure() {
    const patterns = [...ALWAYS_IGNORE, ...DEFAULT_IGNORE_PATTERNS];
    
    // Add command-line exceptions
    patterns.push(...this.options.exceptDirs);
    patterns.push(...this.options.exceptFiles);
    
    return [{
      absolutePath: this.projectRoot,
      relativePath: '',
      patterns: patterns.map(pattern => ({
        pattern: typeof pattern === 'string' ? pattern : pattern.pattern,
        isNegation: typeof pattern === 'object' ? pattern.isNegation : false
      }))
    }];
  }

  findGitignoresRecursive(currentDir, relativePath, gitignoreFiles) {
    try {
      const items = fs.readdirSync(currentDir);
      
      // Check for .gitignore in current directory first
      if (items.includes('.gitignore')) {
        const gitignorePath = path.join(currentDir, '.gitignore');
        
        try {
          const content = fs.readFileSync(gitignorePath, 'utf8').trim();
          if (content.length > 0) {
            const patterns = this.parseGitignoreContent(content);
            
            // Add ALWAYS_IGNORE patterns to root .gitignore only
            if (relativePath === '') {
              const alwaysIgnorePatterns = ALWAYS_IGNORE.map(pattern => ({
                pattern,
                isNegation: false
              }));
              patterns.unshift(...alwaysIgnorePatterns);
            }
            
            // Add command-line exceptions to root .gitignore only
            if (relativePath === '') {
              const exceptPatterns = [
                ...this.options.exceptDirs,
                ...this.options.exceptFiles
              ].map(pattern => ({
                pattern,
                isNegation: false
              }));
              patterns.push(...exceptPatterns);
            }
            
            gitignoreFiles.push({
              absolutePath: currentDir,
              relativePath: relativePath,
              patterns: patterns
            });
          }
        } catch (err) {
          console.warn(`Warning: Could not read .gitignore at ${gitignorePath}: ${err.message}`);
        }
      }
      
      // Recursively search subdirectories that are not ignored
      for (const item of items) {
        const itemPath = path.join(currentDir, item);
        const itemRelativePath = relativePath ? path.join(relativePath, item) : item;
        
        try {
          const stats = fs.statSync(itemPath);
          if (stats.isDirectory()) {
            // Skip known system directories to avoid deep recursion
            if (ALWAYS_IGNORE.includes(item)) {
              continue;
            }
            
            // Check if this directory is ignored by .gitignore files we've found so far
            if (this.isDirectoryIgnoredBySoFar(item, itemRelativePath, gitignoreFiles)) {
              if (this.options.debug) {
                console.log(`Skipping ignored directory: ${itemRelativePath}`);
              }
              continue;
            }
            
            this.findGitignoresRecursive(itemPath, itemRelativePath, gitignoreFiles);
          }
        } catch (err) {
          // Skip inaccessible directories
          continue;
        }
      }
    } catch (err) {
      console.warn(`Warning: Could not read directory ${currentDir}: ${err.message}`);
    }
  }

  parseGitignoreContent(content) {
    const patterns = [];
    const lines = content.split('\n');
    
    for (let line of lines) {
      line = line.trim();
      
      // Skip empty lines and comments
      if (!line || line.startsWith('#')) continue;
      
      // Handle negation patterns
      const isNegation = line.startsWith('!');
      if (isNegation) {
        line = line.slice(1); // Remove the ! prefix
      }
      
      // Clean up directory and root patterns
      if (line.endsWith('/')) {
        line = line.slice(0, -1);
      }
      if (line.startsWith('/')) {
        line = line.slice(1);
      }
      
      // Store pattern with negation flag
      patterns.push({
        pattern: line,
        isNegation: isNegation
      });
    }
    
    return patterns;
  }

  // Check if a directory should be ignored based on .gitignore files found so far
  isDirectoryIgnoredBySoFar(itemName, relativePath, gitignoreFiles) {
    // Get directory path of the item
    const itemDirectory = path.dirname(relativePath);
    const normalizedItemDir = itemDirectory === '.' ? '' : itemDirectory;
    
    // Find all .gitignore files that apply to this path
    const applicableGitignores = gitignoreFiles.filter(gitignore => {
      return this.isPathInDirectory(normalizedItemDir, gitignore.relativePath);
    });
    
    // Sort by specificity (root first, then more specific)
    applicableGitignores.sort((a, b) => a.relativePath.length - b.relativePath.length);
    
    let shouldIgnoreItem = false;
    
    // Apply patterns in hierarchical order
    for (const gitignore of applicableGitignores) {
      // Calculate relative path from this .gitignore's directory to the item
      let relativeFromGitignore;
      if (gitignore.relativePath === '') {
        relativeFromGitignore = relativePath;
      } else {
        relativeFromGitignore = path.relative(gitignore.relativePath, relativePath);
      }
      
      // Normalize path separators
      relativeFromGitignore = relativeFromGitignore.split(path.sep).join('/');
      
      // Apply patterns from this .gitignore
      for (const patternObj of gitignore.patterns) {
        if (this.matchesPattern(patternObj.pattern, itemName, relativeFromGitignore)) {
          shouldIgnoreItem = patternObj.isNegation ? false : true;
        }
      }
    }
    
    return shouldIgnoreItem;
  }

  matchesPattern(pattern, itemName, relativePath) {
    const normalizedRelativePath = relativePath.split(path.sep).join('/');
    const normalizedPattern = pattern.split(path.sep).join('/');
    
    // Handle wildcard patterns
    if (pattern.includes('*') || pattern.includes('?')) {
      const regexPattern = normalizedPattern
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.');
      
      const regex = new RegExp(`^${regexPattern}$`);
      
      if (regex.test(itemName) || regex.test(normalizedRelativePath)) {
        return true;
      }
      
      // Check parent directories
      const pathParts = normalizedRelativePath.split('/');
      for (let i = 0; i < pathParts.length; i++) {
        const partialPath = pathParts.slice(0, i + 1).join('/');
        if (regex.test(partialPath)) {
          return true;
        }
      }
      
      return false;
    }
    
    // Exact name match
    if (itemName === normalizedPattern) return true;
    if (normalizedRelativePath === normalizedPattern) return true;
    
    // Handle directory-specific patterns
    if (normalizedPattern.includes('/')) {
      if (normalizedRelativePath.startsWith(normalizedPattern + '/') || 
          normalizedRelativePath === normalizedPattern) {
        return true;
      }
    } else {
      const pathParts = normalizedRelativePath.split('/');
      
      if (pathParts.includes(normalizedPattern)) return true;
      
      if (normalizedRelativePath.endsWith('/' + normalizedPattern) || 
          normalizedRelativePath === normalizedPattern) {
        return true;
      }
    }
    
    return false;
  }

  // Check if a path is within a directory or its subdirectories
  isPathInDirectory(itemPath, directoryPath) {
    if (directoryPath === '') return true; // Root applies to everything
    
    const normalizedItemPath = itemPath.split(path.sep).join('/');
    const normalizedDirPath = directoryPath.split(path.sep).join('/');
    
    return normalizedItemPath.startsWith(normalizedDirPath + '/') || 
           normalizedItemPath === normalizedDirPath;
  }

  shouldIgnore(itemName, relativePath) {
    if (this.options.debug) {
      console.log(`\n--- Checking ignore for: ${itemName} ---`);
      console.log(`Relative path: ${relativePath}`);
    }
    
    // Get directory path of the item
    const itemDirectory = path.dirname(relativePath);
    const normalizedItemDir = itemDirectory === '.' ? '' : itemDirectory;
    
    // Find all .gitignore files that apply to this path
    const applicableGitignores = this.gitignoreFiles.filter(gitignore => {
      const applies = this.isPathInDirectory(normalizedItemDir, gitignore.relativePath);
      if (this.options.debug && applies) {
        const location = gitignore.relativePath === '' ? 'root' : gitignore.relativePath;
        console.log(`  Applies: ${location} .gitignore`);
      }
      return applies;
    });
    
    // Sort by specificity (root first, then more specific)
    applicableGitignores.sort((a, b) => a.relativePath.length - b.relativePath.length);
    
    let shouldIgnoreItem = false;
    
    // Apply patterns in hierarchical order
    for (const gitignore of applicableGitignores) {
      // Calculate relative path from this .gitignore's directory to the item
      let relativeFromGitignore;
      if (gitignore.relativePath === '') {
        relativeFromGitignore = relativePath;
      } else {
        relativeFromGitignore = path.relative(gitignore.relativePath, relativePath);
      }
      
      // Normalize path separators
      relativeFromGitignore = relativeFromGitignore.split(path.sep).join('/');
      
      if (this.options.debug) {
        const location = gitignore.relativePath === '' ? 'root' : gitignore.relativePath;
        console.log(`  Checking against ${location} .gitignore (${gitignore.patterns.length} patterns)`);
        console.log(`  Relative from .gitignore: ${relativeFromGitignore}`);
      }
      
      // Apply patterns from this .gitignore
      for (const patternObj of gitignore.patterns) {
        if (this.matchesPattern(patternObj.pattern, itemName, relativeFromGitignore)) {
          const previousState = shouldIgnoreItem;
          shouldIgnoreItem = patternObj.isNegation ? false : true;
          
          if (this.options.debug) {
            const action = patternObj.isNegation ? 'unignored' : 'ignored';
            const patternDisplay = patternObj.isNegation ? `!${patternObj.pattern}` : patternObj.pattern;
            console.log(`    Pattern "${patternDisplay}" matched → ${action} (was: ${previousState}, now: ${shouldIgnoreItem})`);
          }
        }
      }
    }
    
    if (this.options.debug) {
      console.log(`  Final result: ${shouldIgnoreItem ? 'IGNORE' : 'INCLUDE'}`);
    }
    
    return shouldIgnoreItem;
  }

  shouldIncludeByPatterns(itemName, relativePath, isDirectory) {
    const normalizedRelativePath = relativePath.split(path.sep).join('/');
    
    if (this.options.debug) {
      console.log(`\n--- Checking: ${itemName} (${isDirectory ? 'DIR' : 'FILE'}) ---`);
      console.log(`Path: ${normalizedRelativePath}`);
    }
    
    // Directories: only apply exclude patterns
    if (isDirectory) {
      if (this.excludeRegex) {
        const nameMatch = this.excludeRegex.test(itemName);
        const pathMatch = this.excludeRegex.test(normalizedRelativePath);
        
        if (this.options.debug) {
          console.log(`Exclude test - Name: ${nameMatch}, Path: ${pathMatch}`);
        }
        
        if (nameMatch || pathMatch) {
          if (this.options.debug) console.log(`❌ Directory excluded by pattern`);
          return false;
        }
      }
      if (this.options.debug) console.log(`✅ Directory included`);
      return true;
    }
    
    // Files: apply both include and exclude patterns
    if (this.excludeRegex) {
      const nameMatch = this.excludeRegex.test(itemName);
      const pathMatch = this.excludeRegex.test(normalizedRelativePath);
      
      if (this.options.debug) {
        console.log(`Exclude test - Name: ${nameMatch}, Path: ${pathMatch}`);
      }
      
      if (nameMatch || pathMatch) {
        if (this.options.debug) console.log(`❌ File excluded by pattern`);
        return false;
      }
    }
    
    if (this.includeRegex) {
      const nameMatch = this.includeRegex.test(itemName);
      const pathMatch = this.includeRegex.test(normalizedRelativePath);
      
      if (this.options.debug) {
        console.log(`Include test - Name: ${nameMatch}, Path: ${pathMatch}`);
      }
      
      if (!nameMatch && !pathMatch) {
        if (this.options.debug) console.log(`❌ File doesn't match include pattern`);
        return false;
      }
      if (this.options.debug) console.log(`✅ File matches include pattern`);
    }
    
    if (this.options.debug) console.log(`✅ File included`);
    return true;
  }

  shouldIncludeItem(itemName, relativePath, isDirectory) {
    if (this.shouldIgnore(itemName, relativePath)) {
      return false;
    }
    
    return this.shouldIncludeByPatterns(itemName, relativePath, isDirectory);
  }

  // Recursively generate tree structure
  generateTree(dirPath, prefix = '', projectRoot = null, currentDepth = 0) {
    let result = '';
    
    if (!projectRoot) {
      projectRoot = dirPath;
    }
    
    try {
      const allItems = fs.readdirSync(dirPath);
      
      // Filter and sort items
      const items = allItems
        .map(item => {
          const fullPath = path.join(dirPath, item);
          const relativePath = path.relative(projectRoot, fullPath);
          
          try {
            const stats = fs.statSync(fullPath);
            const isDirectory = stats.isDirectory();
            const shouldInclude = this.shouldIncludeItem(item, relativePath, isDirectory);
            
            return {
              name: item,
              fullPath,
              relativePath,
              isDirectory,
              shouldInclude,
              stats
            };
          } catch (err) {
            console.warn(`Warning: Cannot stat ${fullPath}`);
            return null;
          }
        })
        .filter(item => item && item.shouldInclude)
        .sort((a, b) => {
          // Directories first, then files alphabetically
          if (a.isDirectory && !b.isDirectory) return -1;
          if (!a.isDirectory && b.isDirectory) return 1;
          return a.name.localeCompare(b.name);
        });

      items.forEach((item, index) => {
        const isLast = index === items.length - 1;
        const connector = isLast ? '└── ' : '├── ';
        
        result += `${prefix}${connector}${item.name}\n`;
        
        // Recurse into directories within depth limit
        if (item.isDirectory && currentDepth < this.options.maxDepth) {
          const newPrefix = prefix + (isLast ? '    ' : '│   ');
          result += this.generateTree(item.fullPath, newPrefix, projectRoot, currentDepth + 1);
        }
      });
    } catch (err) {
      console.error(`Error reading directory ${dirPath}:`, err.message);
    }
    
    return result;
  }

  run() {
    const projectName = path.basename(process.cwd());
    
    console.log(`Generating ASCII tree for: ${projectName}`);
    
    if (this.options.includePattern) {
      console.log(`Include pattern: ${this.options.includePattern}`);
    }
    if (this.options.excludePattern) {
      console.log(`Exclude pattern: ${this.options.excludePattern}`);
    }
    console.log('');
    
    const tree = this.generateTree('.', '', null, 0);
    const output = `${projectName}/\n${tree}`;
    
    if (this.options.dryRun) {
      console.log('=== DRY RUN ===');
      console.log('Would generate:');
      console.log(output);
      console.log(`Would save to: ${path.join(this.options.outputPath, this.options.outputName)}`);
      return;
    }
    
    if (!fs.existsSync(this.options.outputPath)) {
      fs.mkdirSync(this.options.outputPath, { recursive: true });
    }
    
    const outputFile = path.join(this.options.outputPath, this.options.outputName);
    fs.writeFileSync(outputFile, output);
    
    console.log(`Project structure saved to: ${outputFile}`);
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse array arguments from various formats
  function parseArrayArg(arg, optionName) {
    console.log(`Debug: Received ${optionName} argument:`, JSON.stringify(arg));
    
    // Try JSON parsing first
    try {
      const parsed = JSON.parse(arg);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (e) {
      // Fall through to other parsing methods
    }
    
    // Handle [item1,item2] format
    if (arg.startsWith('[') && arg.endsWith(']')) {
      try {
        const content = arg.slice(1, -1);
        const items = content.split(',').map(item => {
          return item.trim().replace(/^["']|["']$/g, '');
        }).filter(item => item.length > 0);
        
        return items;
      } catch (e) {
        // Continue to next method
      }
    }
    
    // Handle comma-separated values
    if (arg.includes(',')) {
      return arg.split(',').map(item => item.trim().replace(/^["']|["']$/g, '')).filter(item => item.length > 0);
    }
    
    // Single value
    return [arg.replace(/^["']|["']$/g, '')];
  }
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--all':
        options.all = true;
        break;
        
      case '--except-dir':
        i++;
        if (i < args.length) {
          try {
            options.exceptDirs = parseArrayArg(args[i], '--except-dir');
            console.log(`Parsed exceptDirs:`, options.exceptDirs);
          } catch (e) {
            console.error(`Error parsing --except-dir: ${e.message}`);
            console.log('Try: --except-dir "node_modules,build" or --except-dir node_modules');
            process.exit(1);
          }
        }
        break;
        
      case '--except-file':
        i++;
        if (i < args.length) {
          try {
            options.exceptFiles = parseArrayArg(args[i], '--except-file');
            console.log(`Parsed exceptFiles:`, options.exceptFiles);
          } catch (e) {
            console.error(`Error parsing --except-file: ${e.message}`);
            console.log('Try: --except-file "*.log,*.tmp" or --except-file *.log');
            process.exit(1);
          }
        }
        break;
        
      case '--output-name':
        i++;
        if (i < args.length) {
          options.outputName = args[i];
        }
        break;
        
      case '--output-path':
        i++;
        if (i < args.length) {
          options.outputPath = args[i];
        }
        break;
        
      case '--dry-run':
        options.dryRun = true;
        break;
        
      case '--debug':
        options.debug = true;
        break;
        
      case '--max-depth':
        i++;
        if (i < args.length) {
          const depth = parseInt(args[i]);
          if (isNaN(depth) || depth < 0) {
            console.error('Error: --max-depth requires a positive number');
            process.exit(1);
          }
          options.maxDepth = depth;
        }
        break;
        
      case '--include-pattern':
        i++;
        if (i < args.length) {
          try {
            new RegExp(args[i]); // Validate regex
            options.includePattern = args[i];
          } catch (e) {
            console.error(`Error: Invalid regex pattern for --include-pattern: ${e.message}`);
            process.exit(1);
          }
        }
        break;
        
      case '--exclude-pattern':
        i++;
        if (i < args.length) {
          try {
            new RegExp(args[i]); // Validate regex
            options.excludePattern = args[i];
          } catch (e) {
            console.error(`Error: Invalid regex pattern for --exclude-pattern: ${e.message}`);
            process.exit(1);
          }
        }
        break;
        
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
        break;
        
      default:
        console.log(`Unknown option: ${arg}`);
        console.log('Use --help for usage information');
        process.exit(1);
    }
  }
  
  return options;
}

function showHelp() {
  console.log(`
ascii-tree-generator - Generate ASCII directory tree structure

USAGE:
  ascii-tree-generator [OPTIONS]

OPTIONS:
  --all                          Include all files (ignore .gitignore and defaults)
  --except-dir "dir1,dir2"       Additional directories to ignore (comma separated names in quotes)
  --except-file "f1,f2"          Additional files to ignore (comma separated names in quotes)
  --output-name <filename>       Output filename (default: project-ascii-tree.txt)
  --output-path <path>           Output directory. (default: current directory)
  --dry-run                      Show what would be generated without creating file
  --debug                        Show debug info for pattern matching and .gitignore processing
  --max-depth <number>           Maximum directory depth to traverse
  --include-pattern <regex>      Only show files matching this regex pattern
  --exclude-pattern <regex>      Exclude files/dirs matching this regex pattern
  --help, -h                     Show this help message

PATTERN EXAMPLES:
  --include-pattern "\.js$"            Only show JavaScript files
  --include-pattern "\.(js|ts|json)$"  Only show JS, TS, and JSON files
  --include-pattern "src|test"         Only show items with 'src' or 'test' in path/name
  --exclude-pattern "test|spec"        Exclude test files and directories entirely
  --exclude-pattern "\.tmp$"           Exclude temporary files

REGEX ESCAPING TIPS:
  - Use SINGLE backslash in quotes: "\.js$" not \\\\js$
  - In shell, you may need quotes: --include-pattern "\.js$"
  - Test your pattern with --debug to see what gets matched

GITIGNORE BEHAVIOR:
  This tool searches for ALL .gitignore files in your project and applies them hierarchically, just like git does:
  - Root .gitignore applies to the entire project
  - Subdirectory .gitignore files only apply to their subdirectory and below
  - Patterns are applied in order from root to most specific
  - Negation patterns (!) work correctly to override parent directory patterns
  - .gitignore files in ignored directories are skipped (e.g., won't read .gitignore files from node_modules, .venv, or other ignored directories)

NOTE: Include patterns only apply to files (directories shown for structure).
      Exclude patterns apply to both files and directories.
      To generate tree for specific directory and to NOT include other directories simply run the script from the desired directory.

EXAMPLES:
  ascii-tree-generator
  ascii-tree-generator --max-depth 3 --dry-run
  ascii-tree-generator --all --output-name my-tree.txt
  ascii-tree-generator --except-dir "build,dist" --output-path docs/
  ascii-tree-generator --include-pattern "\.js$" --exclude-pattern "test"
  ascii-tree-generator --include-pattern "src/" --max-depth 2
  ascii-tree-generator --all --include-pattern "\.(js|ts|json)$"
  ascii-tree-generator --debug --include-pattern "\.js$"

  `);
}

function main() {
  try {
    const options = parseArgs();
    const generator = new AsciiTreeGenerator(options);
    generator.run();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { AsciiTreeGenerator };