# Contributing Guide

Thanks for your interest in contributing!

## Getting Started

1. Fork and clone the repository:
   ```bash
   git clone https://github.com/yourusername/your-repo-name.git
   cd your-repo-name
   ```

2. Create a branch for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Testing Your Changes

I dont have automatic tests yet, so please test manually. Before submitting:

1. Go to the test directory and run the setup script:
   ```bash
   cd test
   ./create_test_dirs.sh
   ```

2. Test the main script on the generated directories

3. Verify the ASCII tree output looks correct

## Submitting Changes

1. Commit with a clear message:
   ```bash
   git commit -m "Add feature: description of changes"
   ```

2. Push and create a Pull Request:
   ```bash
   git push origin feature/your-feature-name
   ```

3. In your PR, include:
   - What you changed and why
   - Testing results
   - ASCII tree output examples if relevant

## Code Style

- Use consistent indentation
- Clear variable names
- Comment complex logic
- Keep functions focused

## Need Help?

- Check existing issues first
- Create a new issue for bugs
- Start a discussion for questions

*Beginner-friendly project - all contributions welcome!*