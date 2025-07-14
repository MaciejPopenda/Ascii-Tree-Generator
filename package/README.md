# ASCII Project Tree Generator

A powerful Node.js command-line tool that generates beautiful ASCII directory tree structures for your projects. Perfect for documentation, AI / vibe coding and sharing your project structure.

[![npm version](https://badge.fury.io/js/YOUR_PACKAGE_NAME.svg)](https://www.npmjs.com/package/ascii-tree-generator)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

## ✨ Features

- 🌳 **Smart .gitignore parsing** - Automatically respects your project's .gitignore rules
- 🎯 **Flexible filtering** - Include/exclude files using regex patterns
- 📁 **Directory depth control** - Limit how deep the tree goes
- 🔍 **Debug mode** - See exactly what gets matched by your patterns
- 💾 **Custom output** - Save to any file location with custom naming
- 🚀 **Dry run mode** - Preview results before saving the file
- ⚡ **Fast and lightweight** - No external dependencies

## 📦 Installation

### Global Installation (Recommended)
```bash
npm install -g ascii-tree-generator
```

### Local Installation
```bash
npm install ascii-tree-generator
```

### Or use directly with npx
```bash
npx ascii-tree-generator
```

## 🚀 Quick Start

Generate a tree for your current project:
```bash
ascii-tree-generator
```

This creates `project-ascii-tree.txt` in your current directory with output like:
```
my-project/
├── src/
│ ├── components/
│ │ ├── Header.js
│ │ └── Footer.js
│ ├── utils/
│ │ └── helpers.js
│ └── index.js
├── package.json
└── README.md
```

## 📖 Usage Examples

### Basic Usage
```bash
# Generate tree with default settings
ascii-tree-generator

# Preview without creating file
ascii-tree-generator --dry-run

# Include all files (ignore .gitignore)
ascii-tree-generator --all
```

### Filtering Examples
```bash
# Only show JavaScript and TypeScript files
ascii-tree-generator --include-pattern "\.(js|ts)$"

# Only show source code (exclude tests)
ascii-tree-generator --exclude-pattern "test|spec"

# Show only files in src/ directory
ascii-tree-generator --include-pattern "src/"

# Exclude temporary and log files
ascii-tree-generator --exclude-pattern "\.(tmp|log)$"
```

### Depth and Output Control
```bash
# Limit to 2 levels deep
ascii-tree-generator --max-depth 2

# Custom output file and location
ascii-tree-generator --output-name "structure.txt" --output-path "./docs/"

# Exclude specific directories
ascii-tree-generator --except-dir "node_modules, build, dist"

# Exclude specific files
ascii-tree-generator --except-file "README.md, script.js"
```

### Advanced Examples
```bash
# Only source files, limited depth
ascii-tree-generator --include-pattern "\.(js|ts|jsx|tsx|json)$" --max-depth 3

# Debug your patterns
ascii-tree-generator --debug --include-pattern "component"

# Generate tree for specific file types with custom output
ascii-tree-generator --include-pattern "\.(md|txt|json)$" --output-name "docs-structure.txt"
```

## ⚙️ Command Line Options

| Option | Description | Example |
|--------|-------------|---------|
| `--all` | Include all files (ignore .gitignore) | `--all` |
| `--except-dir` | Additional directories to ignore | `--except-dir "build,dist"` |
| `--except-file` | Additional files to ignore | `--except-file "*.log,*.tmp"` |
| `--output-name` | Custom output filename | `--output-name "my-tree.txt"` |
| `--output-path` | Custom output directory | `--output-path "./docs/"` |
| `--dry-run` | Preview without creating file | `--dry-run` |
| `--debug` | Show pattern matching debug info | `--debug` |
| `--max-depth` | Maximum directory depth | `--max-depth 3` |
| `--include-pattern` | Regex to include files | `--include-pattern "\.js$"` |
| `--exclude-pattern` | Regex to exclude files/dirs | `--exclude-pattern "\.tmp$"` |
| `--help, -h` | Show help message | `--help` |

## 🎯 Pattern Matching Guide

### Include Patterns (Files Only)
Include patterns only apply to files, not directories. Directories are shown for structure.

```bash
# JavaScript files only
--include-pattern "\.js$"

# Multiple file types
--include-pattern "\.(js|ts|json)$"

# Files containing 'component' in name
--include-pattern "component"

# Files in specific directory
--include-pattern "src/"
```

### Exclude Patterns (Files & Directories)
Exclude patterns apply to both files and directories.

```bash
# Exclude test files and directories
--exclude-pattern "test|spec"

# Exclude by file extension
--exclude-pattern "\.(tmp|log|cache)$"

# Exclude by directory name
--exclude-pattern "build|dist|coverage"
```

### Regex Tips
- Use single backslash while using CLI: `"\.js$"` not `"\\.js$"`
- Quote your patterns to avoid shell interpretation
- Use `--debug` to test your patterns
- `$` means end of string, `^` means start of string

## 🔧 Programmatic Usage

You can also use this tool in your Node.js applications:

```javascript
const { AsciiTreeGenerator } = require('ascii-tree-generator');

const generator = new AsciiTreeGenerator({
  includePattern: '\\.js$',
  maxDepth: 3,
  outputName: 'custom-tree.txt',
  dryRun: false
});

generator.run();
```

### Configuration Options
```javascript
const options = {
  all: false, // Include all files
  exceptDirs: [], // Additional dirs to ignore
  exceptFiles: [], // Additional files to ignore
  outputName: 'project-ascii-tree.txt',
  outputPath: '.', // Output directory
  dryRun: false, // Preview mode
  maxDepth: Infinity, // Directory depth limit
  includePattern: null, // Regex for including files
  excludePattern: null, // Regex for excluding files/dirs
  debug: false // Show debug information
};
```

## 📝 Output Formats

The tool generates clean, readable ASCII trees:

```
project-name/
├── src/
│ ├── components/
│ │ ├── Header.js
│ │ ├── Footer.js
│ │ └── Navigation.js
│ ├── utils/
│ │ ├── helpers.js
│ │ └── constants.js
│ └── index.js
├── tests/
│ └── app.test.js
├── package.json
├── README.md
└── .gitignore
```

## 🐛 Troubleshooting

### Common Issues

**Pattern not matching anything?**
- Use `--debug` to see what your pattern is matching
- Remember to escape special regex characters
- Test with simple patterns first

**Too many files shown?**
- Check your .gitignore is being found and parsed correctly
- Use `--exclude-pattern` to filter out unwanted files
- Consider using `--max-depth` to limit depth


### Debug Mode
Use `--debug` to see detailed information about pattern matching:

```bash
ascii-tree-generator --debug --include-pattern "\.js$"
```

This shows:
- Which patterns are being applied
- What files are being tested
- Why files are included or excluded

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/MaciejPopenda/Ascii-Tree-Generator/blob/main/HOW-TO-CONTRIBUTE.md) for details.


## 📄 License

This project is licensed under the MIT License.

## 🔗 Links

- [npm package](https://www.npmjs.com/package/ascii-tree-generator)
- [Issue Tracker](https://github.com/MaciejPopenda/Ascii-Tree-Generator/issues)
- [Changelog](https://github.com/MaciejPopenda/Ascii-Tree-Generator/blob/main/CHANGELOG.md)

---

**Made with ❤️ by Maciej Popenda for the developer community**