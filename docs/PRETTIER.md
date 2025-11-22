# Prettier Configuration and Usage Guide

This document explains the Prettier configuration, setup, and usage guidelines for the Telegram Receiver project.

## Overview

Prettier is configured to automatically format code according to consistent style rules. It works seamlessly with ESLint to ensure code quality and formatting consistency across the codebase.

## Configuration Files

### `.prettierrc.json`

The main Prettier configuration file located at the project root.

**Current Configuration:**

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

**Configuration Options Explained:**

- **`semi: true`**: Adds semicolons at the end of statements. This is the standard for TypeScript/Node.js projects and improves code clarity.
- **`trailingComma: "es5"`**: Adds trailing commas where valid in ES5 (objects, arrays, etc.). This creates cleaner git diffs when adding new items. Note: `"all"` is also a valid option (adds trailing commas in function parameters), but `"es5"` is the current standard for this project.
- **`singleQuote: true`**: Uses single quotes instead of double quotes for strings. This is a common preference in JavaScript/TypeScript projects and reduces the need to escape quotes.
- **`printWidth: 100`**: Maximum line length before wrapping. 100 characters is a good balance between readability and modern wide screens.
- **`tabWidth: 2`**: Number of spaces per indentation level. 2 spaces is standard for JavaScript/TypeScript projects.
- **`useTabs: false`**: Uses spaces instead of tabs for indentation. This ensures consistent formatting across different editors and systems.
- **`arrowParens: "always"`**: Always includes parentheses around arrow function parameters, even for single parameters. Example: `(x) => x` instead of `x => x`. This improves consistency and makes refactoring easier.
- **`endOfLine: "lf"`**: Uses Unix-style line endings (LF). This ensures consistent line endings across different operating systems and prevents git diff issues.

**Default Options (Not Explicitly Set):**

- **`bracketSpacing: true`**: Adds spaces inside object literals. Example: `{ foo: bar }` instead of `{foo: bar}`.
- **`bracketSameLine: false`**: Puts the `>` of a multi-line JSX element on a new line. Not applicable for this project (no JSX).
- **`proseWrap: "preserve"`**: Preserves markdown prose wrapping. Only applies to markdown files.

### `.prettierignore`

Files and directories that Prettier should ignore:

```
node_modules
dist
coverage
*.log
.env
.env.local
.DS_Store
```

**Ignore Patterns Explained:**

- **`node_modules`**: Dependencies installed via npm
- **`dist`**: Compiled TypeScript output
- **`coverage`**: Test coverage reports
- **`*.log`**: Log files
- **`.env` and `.env.local`**: Environment variable files (may contain sensitive data)
- **`.DS_Store`**: macOS system files

## Running Prettier

### Basic Commands

```bash
# Format all TypeScript files
npm run format

# Check if files are formatted correctly (without modifying them)
npm run format:check
```

### What Gets Formatted

Prettier formats all `.ts` files in:

- `src/` directory (source code)
- `tests/` directory (test files)

### Formatting Specific Files

You can also format specific files or directories:

```bash
# Format a specific file
npx prettier --write src/path/to/file.ts

# Format a specific directory
npx prettier --write src/controllers/

# Check formatting without modifying
npx prettier --check src/path/to/file.ts
```

## Prettier and ESLint Integration

Prettier works seamlessly with ESLint:

1. **`eslint-config-prettier`**: Disables ESLint formatting rules that conflict with Prettier, ensuring ESLint focuses on code quality while Prettier handles formatting.
2. **`eslint-plugin-prettier`**: Runs Prettier as an ESLint rule, ensuring formatting violations are caught by ESLint.

**ESLint Configuration:**

The `.eslintrc.json` includes:

- `"prettier"` in the `extends` array (disables conflicting rules)
- `"prettier/prettier": "error"` rule (treats Prettier violations as ESLint errors)

**Running Both Tools:**

```bash
# Check formatting
npm run format:check

# Fix formatting
npm run format

# Check linting (includes formatting checks)
npm run lint

# Fix linting (includes formatting fixes)
npm run lint:fix
```

## Pre-commit Integration

The project uses `lint-staged` and `husky` to automatically format code before committing:

**Configuration in `package.json`:**

```json
{
  "lint-staged": {
    "*.ts": ["eslint --fix", "prettier --write"]
  }
}
```

**How It Works:**

1. When you commit files, `lint-staged` runs on staged `.ts` files
2. ESLint fixes issues automatically where possible
3. Prettier formats the files
4. Files are automatically staged again with formatting changes
5. Commit proceeds with formatted code

**Note:** If formatting or linting fails, the commit will be blocked until issues are resolved.

## Formatting Examples

### Object Literals

```typescript
// ✅ Formatted (with trailing comma)
const config = {
  host: 'localhost',
  port: 3000,
  timeout: 5000,
};

// ❌ Not formatted
const config = { host: 'localhost', port: 3000, timeout: 5000 };
```

### Arrow Functions

```typescript
// ✅ Formatted (with parentheses)
const add = (a: number, b: number) => a + b;
const process = (data: Data) => {
  return data.process();
};

// ❌ Not formatted
const add = (a) => a + 1;
const process = (data) => {
  return data.process();
};
```

### Arrays

```typescript
// ✅ Formatted (with trailing comma)
const items = ['item1', 'item2', 'item3'];

// ❌ Not formatted
const items = ['item1', 'item2', 'item3'];
```

### Long Lines

```typescript
// ✅ Formatted (wrapped at 100 characters)
const longFunctionCall = someVeryLongFunctionName(parameter1, parameter2, parameter3);

// ❌ Not formatted (exceeds printWidth)
const longFunctionCall = someVeryLongFunctionName(parameter1, parameter2, parameter3);
```

### Quotes

```typescript
// ✅ Formatted (single quotes)
const message = 'Hello, world!';
const template = `Template string with ${variable}`;

// ❌ Not formatted (double quotes)
const message = 'Hello, world!';
```

## Best Practices

### 1. Run Prettier Before Committing

While `lint-staged` automatically formats code before commits, it's good practice to format manually:

```bash
npm run format
```

### 2. Use format:check in CI/CD

The `format:check` command is perfect for CI/CD pipelines as it fails if files aren't formatted:

```bash
npm run format:check
```

### 3. Configure Your Editor

Most editors support Prettier with "format on save":

**VS Code:**

1. Install the "Prettier - Code formatter" extension
2. Add to `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

**Other Editors:**

- See [Prettier Editor Integration](https://prettier.io/docs/en/editors.html)

### 4. Don't Mix Formatting Tools

Prettier handles all formatting. Don't use other formatters (like ESLint's formatting rules) that might conflict.

### 5. Trust Prettier's Decisions

Prettier makes opinionated formatting decisions. Trust its choices rather than disabling rules for specific cases.

## CI/CD Integration

Prettier runs automatically in the deployment script (`./deploy.sh`). The script will fail if:

- Code formatting doesn't match Prettier rules (`npm run format:check`)

This ensures code formatting consistency before deployment.

**Note:** No GitHub Actions workflows are currently configured in `.github/workflows/`. If CI/CD is added in the future, include `npm run format:check` in the pipeline.

## Configuration Updates

### Adding New Options

To add new Prettier options, edit `.prettierrc.json`:

```json
{
  "semi": true,
  "newOption": "value"
}
```

### Common Options to Consider

- **`trailingComma: "all"`**: Adds trailing commas in function parameters. Provides better git diffs but requires ES2017+.
- **`bracketSpacing: false`**: Removes spaces inside object literals. Example: `{foo: bar}` instead of `{ foo: bar }`.
- **`bracketSameLine: true`**: Puts `>` of multi-line JSX on the same line. Only relevant for JSX/React projects.

**Current Recommendation:** The current configuration is optimal for TypeScript/Node.js projects. Consider `trailingComma: "all"` if you want better git diffs, but `"es5"` is perfectly fine and more conservative.

### Modifying Ignore Patterns

To ignore additional files or directories, edit `.prettierignore`:

```
# Add new patterns
*.min.js
build/
```

## Troubleshooting

### Prettier Not Formatting Files

1. Check that files are not in `.prettierignore`
2. Verify files have `.ts` extension (or are included in format scripts)
3. Ensure files are in `src/` or `tests/` directories (or update format scripts)

### Prettier Conflicts with ESLint

If Prettier and ESLint conflict:

1. Ensure `eslint-config-prettier` is in the `extends` array (after other configs)
2. Verify `eslint-plugin-prettier` is installed and configured
3. Run `npm run format` then `npm run lint:fix`

### Formatting Changes on Every Run

If Prettier keeps making changes:

1. Check that all team members are using the same Prettier version
2. Verify `.prettierrc.json` is committed to the repository
3. Ensure editor settings match the Prettier configuration

### Line Ending Issues

If you see line ending warnings:

1. Ensure `endOfLine: "lf"` is set in `.prettierrc.json`
2. Configure git to handle line endings: `git config core.autocrlf false`
3. Run `npm run format` to normalize line endings

## Related Documentation

- [ESLint Configuration](./ESLINT.md) - Code quality and linting guidelines
- [TypeScript Configuration](./TYPESCRIPT.md) - TypeScript setup and usage
- [Testing Guide](./TESTING.md) - Testing best practices

## Resources

- [Prettier Documentation](https://prettier.io/docs/en/)
- [Prettier Options](https://prettier.io/docs/en/options.html)
- [Prettier Playground](https://prettier.io/playground/) - Test formatting options
- [ESLint Config Prettier](https://github.com/prettier/eslint-config-prettier)

---

**Last Updated:** 2025-01-17  
**Configuration Version:** Prettier 3.1.1  
**Status:** ✅ All files pass Prettier formatting checks
