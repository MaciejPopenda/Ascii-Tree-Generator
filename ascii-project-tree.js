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
    
    this.ignorePaths = this.loadIgnorePatterns();
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

  loadIgnorePatterns() {
    let patterns = [...ALWAYS_IGNORE];
    
    if (this.options.all) {
      console.log('Using --all flag: including all files except system files');
    } else {
      const gitignorePath = this.findGitignore();
      
      if (gitignorePath) {
        try {
          const content = fs.readFileSync(gitignorePath, 'utf8');
          const gitignorePatterns = this.parseGitignoreContent(content);
          patterns.push(...gitignorePatterns);
          console.log(`Loaded ${gitignorePatterns.length} patterns from .gitignore (${gitignorePath})`);
        } catch (err) {
          console.warn(`Warning: Could not read .gitignore at ${gitignorePath}: ${err.message}`);
          patterns.push(...DEFAULT_IGNORE_PATTERNS);
        }
      } else {
        console.log('No .gitignore found in current or parent directories, using default ignore patterns');
        patterns.push(...DEFAULT_IGNORE_PATTERNS);
      }
    }
    
    patterns.push(...this.options.exceptDirs);
    patterns.push(...this.options.exceptFiles);
    
    return patterns;
  }

  // Search up directory tree for .gitignore
  findGitignore() {
    let currentDir = process.cwd();
    const root = path.parse(currentDir).root;
    
    while (currentDir !== root) {
      const gitignorePath = path.join(currentDir, '.gitignore');
      
      if (fs.existsSync(gitignorePath)) {
        try {
          const content = fs.readFileSync(gitignorePath, 'utf8').trim();
          if (content.length > 0) {
            return gitignorePath;
          }
        } catch (err) {
          // Continue searching if can't read
        }
      }
      
      const parentDir = path.dirname(currentDir);
      if (parentDir === currentDir) {
        break;
      }
      currentDir = parentDir;
    }
    
    return null;
  }

  parseGitignoreContent(content) {
    const patterns = [];
    const lines = content.split('\n');
    
    for (let line of lines) {
      line = line.trim();
      
      if (!line || line.startsWith('#')) continue;
      if (line.startsWith('!')) continue; // Skip negation patterns for now
      
      // Clean up directory and root patterns
      if (line.endsWith('/')) {
        line = line.slice(0, -1);
      }
      if (line.startsWith('/')) {
        line = line.slice(1);
      }
      
      patterns.push(line);
    }
    
    return patterns;
  }

  shouldIgnore(itemName, relativePath) {
    return this.ignorePaths.some(pattern => {
      const normalizedRelativePath = relativePath.split(path.sep).join('/');
      const normalizedPattern = pattern.split(path.sep).join('/');
      
      // Handle wildcard patterns
      if (pattern.includes('*')) {
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
    });
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
    console.log(`Ignoring patterns: ${this.ignorePaths.join(', ')}`);
    
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
ascii-project-tree - Generate ASCII directory tree structure

USAGE:
  ascii-project-tree [OPTIONS]

OPTIONS:
  --all                          Include all files (ignore .gitignore and defaults)
  --except-dir "dir1,dir2"       Additional directories to ignore (comma separated names in quotes)
  --except-file "f1,f2"          Additional files to ignore (comma separated names in quotes)
  --output-name <filename>       Output filename (default: project-ascii-tree.txt)
  --output-path <path>           Output directory. (default: current directory)
  --dry-run                      Show what would be generated without creating file
  --debug                        Show debug info for pattern matching
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

NOTE: Include patterns only apply to files (directories shown for structure).
      Exclude patterns apply to both files and directories.
      To generate tree for specific directory and to NOT include other directories simply run the script from the desired directory.

EXAMPLES:
  ascii-project-tree
  ascii-project-tree --max-depth 3 --dry-run
  ascii-project-tree --all --output-name my-tree.txt
  ascii-project-tree --except-dir "build,dist" --output-path docs/
  ascii-project-tree --include-pattern "\.js$" --exclude-pattern "test"
  ascii-project-tree --include-pattern "src/" --max-depth 2
  ascii-project-tree --all --include-pattern "\.(js|ts|json)$"
  ascii-project-tree --debug --include-pattern "\.js$"

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