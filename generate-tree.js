const fs = require('fs');
const path = require('path');

// Always ignore these (even if not in .gitignore)
const ALWAYS_IGNORE = [
  '.git',
  'project-structure.txt' // Don't include the output file itself
];

function parseGitignore(gitignorePath = '.gitignore') {
  const patterns = [...ALWAYS_IGNORE];
  
  try {
    if (fs.existsSync(gitignorePath)) {
      const content = fs.readFileSync(gitignorePath, 'utf8');
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
      
      console.log(`==========\nLoaded ${patterns.length - ALWAYS_IGNORE.length} patterns from .gitignore`);
    } else {
      console.log('No .gitignore found, using default patterns');
      // Add some sensible defaults if no .gitignore exists
      patterns.push('node_modules', '*.log', 'dist', 'build', '.vscode', '.idea');
    }
  } catch (err) {
    console.warn(`Warning: Could not read .gitignore: ${err.message}`);
  }
  
  return patterns;
}

function shouldIgnore(itemName, relativePath, ignorePaths) {
  return ignorePaths.some(pattern => {
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

function generateTree(dirPath, prefix = '', ignorePaths, projectRoot = null) {
  let result = '';
  
  if (!projectRoot) {
    projectRoot = dirPath;
  }
  
  try {
    const items = fs.readdirSync(dirPath)
      .filter(item => {
        const fullPath = path.join(dirPath, item);
        const relativePath = path.relative(projectRoot, fullPath);
        return !shouldIgnore(item, relativePath, ignorePaths);
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
        if (stats.isDirectory()) {
          const newPrefix = prefix + (isLast ? '    ' : '│   ');
          result += generateTree(fullPath, newPrefix, ignorePaths, projectRoot);
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

function main() {
  const projectName = path.basename(process.cwd());
  const ignorePaths = parseGitignore();
  
  console.log(`Generating tree for: ${projectName}`);
  console.log(`Ignoring patterns: ${ignorePaths.join(', ')}`);
  console.log('');
  
  const tree = generateTree('.', '', ignorePaths);
  
  const output = `${projectName}/\n${tree}`;
  
  // Write to file
  fs.writeFileSync('project-structure.txt', output);
  
  // Also log to console
  console.log('Project structure generated. \nSaved to project-structure.txt\n==========\n');
  // console.log(output);
}

if (require.main === module) {
  main();
}

module.exports = { generateTree, parseGitignore };