# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2025-07-28

### Added
- **Hierarchical .gitignore support** - Now finds ALL .gitignore files in your project and applies them exactly like git does
- **Git-like pattern application** - Root .gitignore applies globally, subdirectory .gitignore files only affect their scope  
- **Smart directory skipping** - Won't search for .gitignore files in directories that are already ignored
- **Proper negation pattern handling** - `!` patterns work correctly to override parent directory patterns
- **Improved .gitignore reporting** - Shows which .gitignore files were found and how many patterns each contains
- **Enhanced debug mode** - Debug output now shows hierarchical .gitignore processing

### Changed
- **BREAKING**: .gitignore behavior now matches git exactly instead of using only the first .gitignore found
- .gitignore search now starts from current working directory and searches recursively
- Third-party .gitignore files (from `node_modules`, `.venv`, etc.) are no longer processed
- Console output now shows clean list of relevant .gitignore files instead of including noise from dependencies

### Fixed
- Eliminated processing of irrelevant .gitignore files from third-party packages and dependencies
- Fixed .gitignore patterns not being applied in correct hierarchical order
- Resolved issue where subdirectory .gitignore files could affect files outside their scope

### Technical Details
- Replaced single .gitignore finder with recursive discovery system
- Added `isDirectoryIgnoredBySoFar()` method to check if directories should be skipped during .gitignore search
- Implemented proper git-like pattern scope resolution for nested .gitignore files
- Enhanced pattern matching to respect directory boundaries

## [1.0.2] - 2025-07-24

### Fixed
- Fixed display of ignore patterns showing `[object Object]` instead of actual pattern names
- Ignore patterns now display correctly in console output

## [1.0.1] - 2025-07-24

### Added
- Initial release
- ASCII tree generation with .gitignore support
- Command line options for filtering and customization