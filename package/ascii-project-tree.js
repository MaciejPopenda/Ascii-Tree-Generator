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
  'project-ascii-tree.txt' // Don't include the output file itself
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
      ...options
    };
    
    this.ignorePaths = this.loadIgnorePatterns();
  }

  loadIgnorePatterns() {
    let patterns = [...ALWAYS_IGNORE];
    
    // If --all flag is used, only use ALWAYS_IGNORE patterns
    if (this.options.all) {
      console.log('Using --all flag: including all files except system files');
    } else {
      // Try to load .gitignore
      try {
        if (fs.existsSync('.gitignore')) {
          const content = fs.readFileSync('.gitignore', 'utf8');
          const gitignorePatterns = this.parseGitignoreContent(content);
          patterns.push(...gitignorePatterns);
          console.log(`Loaded ${gitignorePatterns.length} patterns from .gitignore`);
        } else {
          console.log('No .gitignore found, using default ignore patterns');
          patterns.push(...DEFAULT_IGNORE_PATTERNS);
        }
      } catch (err) {
        console.warn(`Warning: Could not read .gitignore: ${err.message}`);
        patterns.push(...DEFAULT_IGNORE_PATTERNS);
      }
    }
    
    // Add custom exceptions
    patterns.push(...this.options.exceptDirs);
    patterns.push(...this.options.exceptFiles);
    
    return patterns;
  }

  parseGitignoreContent(content) {
    const patterns = [];
    const lines = content.split('\n');
    
    for (let line of lines) {
      line = line.trim();
      
      // Skip empty lines and comments
      if (!line || line.startsWith('#')) continue;
      
      // Handle negation patterns (! prefix) - for now we'll skip these
      if (line.startsWith('!')) continue;
      
      // Remove trailing slashes for directory patterns
      if (line.endsWith('/')) {
        line = line.slice(0, -1);
      }
      
      // Remove leading slash for root-relative patterns
      if (line.startsWith('/')) {
        line = line.slice(1);
      }
      
      patterns.push(line);
    }
    
    return patterns;
  }

  shouldIgnore(itemName, relativePath) {
    return this.ignorePaths.some(pattern => {
      // Normalize paths for comparison (use forward slashes)
      const normalizedRelativePath = relativePath.split(path.sep).join('/');
      const normalizedPattern = pattern.split(path.sep).join('/');
      
      // Handle wildcard patterns
      if (pattern.includes('*')) {
        const regexPattern = normalizedPattern
          .replace(/\./g, '\\.')  // Escape dots
          .replace(/\*/g, '.*')   // Convert * to .*
          .replace(/\?/g, '.');   // Convert ? to .
        
        const regex = new RegExp(`^${regexPattern}$`);
        
        // Test filename and relative path
        if (regex.test(itemName) || regex.test(normalizedRelativePath)) {
          return true;
        }
        
        // Also test if any parent directory matches
        const pathParts = normalizedRelativePath.split('/');
        for (let i = 0; i < pathParts.length; i++) {
          const partialPath = pathParts.slice(0, i + 1).join('/');
          if (regex.test(partialPath)) {
            return true;
          }
        }
        
        return false;
      }
      
      // Exact filename match
      if (itemName === normalizedPattern) return true;
      
      // Exact relative path match (for patterns like frontend/.next)
      if (normalizedRelativePath === normalizedPattern) return true;
      
      // Directory-specific patterns (frontend/.next should match frontend/.next/*)
      if (normalizedPattern.includes('/')) {
        if (normalizedRelativePath.startsWith(normalizedPattern + '/') || 
            normalizedRelativePath === normalizedPattern) {
          return true;
        }
      } else {
        // Global patterns (node_modules should match anywhere)
        const pathParts = normalizedRelativePath.split('/');
        
        // Check if any part of the path matches the pattern
        if (pathParts.includes(normalizedPattern)) return true;
        
        // Check if the pattern matches the end of the path
        if (normalizedRelativePath.endsWith('/' + normalizedPattern) || 
            normalizedRelativePath === normalizedPattern) {
          return true;
        }
      }
      
      return false;
    });
  }

  generateTree(dirPath, prefix = '', projectRoot = null, currentDepth = 0) {
    let result = '';
    
    if (!projectRoot) {
      projectRoot = dirPath;
    }
    
    try {
      const items = fs.readdirSync(dirPath)
        .filter(item => {
          const fullPath = path.join(dirPath, item);
          const relativePath = path.relative(projectRoot, fullPath);
          return !this.shouldIgnore(item, relativePath);
        })
        .sort((a, b) => {
          const aPath = path.join(dirPath, a);
          const bPath = path.join(dirPath, b);
          const aIsDir = fs.statSync(aPath).isDirectory();
          const bIsDir = fs.statSync(bPath).isDirectory();
          
          // Directories first, then files
          if (aIsDir && !bIsDir) return -1;
          if (!aIsDir && bIsDir) return 1;
          return a.localeCompare(b);
        });

      items.forEach((item, index) => {
        const fullPath = path.join(dirPath, item);
        const isLast = index === items.length - 1;
        const connector = isLast ? '└── ' : '├── ';
        
        result += `${prefix}${connector}${item}\n`;
        
        try {
          const stats = fs.statSync(fullPath);
          if (stats.isDirectory() && currentDepth < this.options.maxDepth) {
            const newPrefix = prefix + (isLast ? '    ' : '│   ');
            result += this.generateTree(fullPath, newPrefix, projectRoot, currentDepth + 1);
          }
        } catch (err) {
          // Skip files we can't read (permissions, etc.)
          console.warn(`Warning: Cannot read ${fullPath}`);
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
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(this.options.outputPath)) {
      fs.mkdirSync(this.options.outputPath, { recursive: true });
    }
    
    // Write to file
    const outputFile = path.join(this.options.outputPath, this.options.outputName);
    fs.writeFileSync(outputFile, output);
    
    console.log(`Project structure saved to: ${outputFile}`);
  }
}

// CLI argument parsing
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--all':
        options.all = true;
        break;
        
      case '--except-dir':
        i++;
        if (i < args.length) {
          options.exceptDirs = JSON.parse(args[i]);
        }
        break;
        
      case '--except-file':
        i++;
        if (i < args.length) {
          options.exceptFiles = JSON.parse(args[i]);
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
        
      case '--max-depth':
        i++;
        if (i < args.length) {
          options.maxDepth = parseInt(args[i]);
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
  --except-dir ["dir1","dir2"]   Additional directories to ignore (JSON array)
  --except-file ["f1","f2"]      Additional files to ignore (JSON array)
  --output-name <filename>       Output filename (default: project-ascii-tree.txt)
  --output-path <path>           Output directory (default: current directory)
  --dry-run                      Show what would be generated without creating file
  --max-depth <number>           Maximum directory depth to traverse
  --help, -h                     Show this help message

EXAMPLES:
  ascii-project-tree
  ascii-project-tree --max-depth 3 --dry-run
  ascii-project-tree --all --output-name my-tree.txt
  ascii-project-tree --except-dir '["build","dist"]' --output-path docs/
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