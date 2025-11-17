# ESLint Configuration and Usage Guide

This document explains the ESLint configuration, setup, and usage guidelines for the Telegram Receiver project.

## Overview

ESLint is configured with TypeScript support to ensure code quality, maintainability, and consistency across the codebase. The configuration includes:

- TypeScript parser and plugin (`@typescript-eslint/parser` and `@typescript-eslint/eslint-plugin`)
- Recommended TypeScript rules
- Prettier integration for code formatting
- Custom rules for project-specific requirements

## Configuration Files

### `.eslintrc.json`

The main ESLint configuration file located at the project root.

**Key Configuration:**

```json
{
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module",
    "project": "./tsconfig.eslint.json"
  },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "prettier"
  ],
  "plugins": ["@typescript-eslint", "prettier"],
  "env": {
    "node": true,
    "es2022": true,
    "jest": true
  },
  "ignorePatterns": ["dist", "node_modules", "coverage", "*.js"]
}
```

### `.eslintignore`

Files and directories that ESLint should ignore:

```
node_modules
dist
coverage
*.config.js
*.config.ts
```

**Note:** Both `.eslintignore` and `ignorePatterns` in `.eslintrc.json` are configured. While this is redundant, it's acceptable and provides flexibility.

### `tsconfig.eslint.json`

TypeScript configuration file used by ESLint for type-aware linting:

```json
{
  "extends": "./tsconfig.json",
  "include": ["src/**/*", "tests/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## TypeScript Parser Configuration

The ESLint configuration uses `@typescript-eslint/parser` with the following settings:

- **ECMAScript Version**: 2022
- **Source Type**: Module (ES modules)
- **Project Reference**: `./tsconfig.eslint.json` (enables type-aware linting)

Type-aware linting allows ESLint to use TypeScript's type information to catch more errors and enforce stricter rules.

## Enabled Rule Sets

### 1. ESLint Recommended Rules (`eslint:recommended`)

Base JavaScript best practices and common error detection.

### 2. TypeScript ESLint Recommended (`plugin:@typescript-eslint/recommended`)

TypeScript-specific rules that don't require type information. Includes:
- Type safety rules
- TypeScript-specific patterns
- Best practices for TypeScript code

### 3. TypeScript ESLint Recommended Requiring Type Checking (`plugin:@typescript-eslint/recommended-requiring-type-checking`)

Advanced TypeScript rules that require type information. These rules can catch:
- Type-related bugs
- Unsafe type operations
- Potential runtime errors

**Note:** These rules require the `project` option in `parserOptions` to be set.

### 4. Prettier Integration (`prettier`)

The `eslint-config-prettier` package disables ESLint rules that conflict with Prettier formatting, ensuring ESLint focuses on code quality while Prettier handles formatting.

## Custom Rules

### TypeScript Rules

```json
{
  "@typescript-eslint/explicit-function-return-type": "off",
  "@typescript-eslint/explicit-module-boundary-types": "off",
  "@typescript-eslint/no-explicit-any": "warn",
  "@typescript-eslint/no-unused-vars": [
    "error",
    {
      "argsIgnorePattern": "^_",
      "varsIgnorePattern": "^_"
    }
  ]
}
```

**Rule Explanations:**

- **`explicit-function-return-type: off`**: Allows TypeScript to infer return types. This is acceptable for most code but can be enabled for stricter type safety.
- **`explicit-module-boundary-types: off`**: Allows TypeScript to infer module boundary types. Similar to above, can be enabled for stricter enforcement.
- **`no-explicit-any: warn`**: Warns when `any` type is used. This helps catch places where proper types should be used instead of `any`. Use `unknown` when the type is truly unknown.
- **`no-unused-vars`**: Errors on unused variables and parameters. Variables/parameters prefixed with `_` are ignored (useful for required but unused parameters).

### General Rules

```json
{
  "prettier/prettier": "error",
  "no-console": ["warn", { "allow": ["warn", "error"] }],
  "no-debugger": "error"
}
```

**Rule Explanations:**

- **`prettier/prettier: error`**: Treats Prettier formatting violations as ESLint errors. Ensures code is properly formatted.
- **`no-console: warn`**: Warns on `console.log` and `console.debug` but allows `console.warn` and `console.error`. Prevents accidental debug statements in production code.
- **`no-debugger: error`**: Errors on `debugger` statements. Prevents debugger statements from being committed.

## Running ESLint

### Basic Commands

```bash
# Run ESLint on all TypeScript files
npm run lint

# Run ESLint and automatically fix issues where possible
npm run lint:fix
```

### What Gets Linted

ESLint checks all `.ts` files in:
- `src/` directory (source code)
- `tests/` directory (test files)

### Ignored Files/Directories

The following are automatically ignored:
- `node_modules/` - Dependencies
- `dist/` - Compiled output
- `coverage/` - Test coverage reports
- `*.js` - JavaScript files (only TypeScript is linted)
- `*.config.js` and `*.config.ts` - Configuration files

## Common ESLint Errors and How to Fix Them

### 1. `@typescript-eslint/no-explicit-any`

**Error:** `Unexpected any. Specify a different type`

**Fix:** Replace `any` with a proper type or use `unknown` when the type is truly unknown.

**Example:**
```typescript
// ❌ Bad
function processData(data: any): any {
  return data;
}

// ✅ Good - Use proper types
function processData<T>(data: T): T {
  return data;
}

// ✅ Good - Use unknown when type is truly unknown
function processData(data: unknown): unknown {
  return data;
}
```

### 2. `@typescript-eslint/no-unused-vars`

**Error:** `'variableName' is defined but never used`

**Fix:** Remove the unused variable or prefix it with `_` if it's required but intentionally unused.

**Example:**
```typescript
// ❌ Bad
function handler(req: Request, res: Response) {
  const unused = 42;
  res.send('OK');
}

// ✅ Good - Remove unused variable
function handler(req: Request, res: Response) {
  res.send('OK');
}

// ✅ Good - Prefix with _ if required but unused
function handler(_req: Request, res: Response) {
  res.send('OK');
}
```

### 3. `no-console`

**Warning:** `Unexpected console statement`

**Fix:** Remove `console.log` or `console.debug` statements, or use `console.warn`/`console.error` if logging is needed.

**Example:**
```typescript
// ❌ Bad
console.log('Debug info');
console.debug('More debug info');

// ✅ Good - Use warn or error
console.warn('Warning message');
console.error('Error message');

// ✅ Good - Remove in production code
// Debug statements should be removed before committing
```

### 4. `prettier/prettier`

**Error:** Prettier formatting violations

**Fix:** Run `npm run lint:fix` to automatically fix formatting issues, or run `npm run format` to format all files.

**Example:**
```typescript
// ❌ Bad - Inconsistent formatting
const obj={a:1,b:2};

// ✅ Good - Properly formatted
const obj = { a: 1, b: 2 };
```

### 5. `no-debugger`

**Error:** `Unexpected 'debugger' statement`

**Fix:** Remove `debugger` statements before committing.

**Example:**
```typescript
// ❌ Bad
function debugFunction() {
  debugger; // Remove this
  return true;
}

// ✅ Good
function debugFunction() {
  return true;
}
```

## ESLint and Prettier Integration

ESLint and Prettier work together seamlessly:

1. **ESLint** handles code quality (unused variables, type safety, etc.)
2. **Prettier** handles code formatting (indentation, spacing, quotes, etc.)
3. **`eslint-config-prettier`** disables ESLint formatting rules that conflict with Prettier
4. **`eslint-plugin-prettier`** runs Prettier as an ESLint rule, ensuring formatting violations are caught by ESLint

### Running Both Tools

```bash
# Check formatting
npm run format:check

# Fix formatting
npm run format

# Check linting
npm run lint

# Fix linting (includes formatting fixes)
npm run lint:fix
```

## Best Practices

### 1. Run ESLint Before Committing

The project uses `lint-staged` and `husky` to automatically run ESLint on staged files before committing. However, it's good practice to run ESLint manually:

```bash
npm run lint
```

### 2. Fix Issues Automatically When Possible

Use `lint:fix` to automatically fix issues:

```bash
npm run lint:fix
```

**Note:** Some issues require manual fixes (e.g., replacing `any` with proper types).

### 3. Use Proper TypeScript Types

Avoid `any` types. Use:
- Specific types when known
- Generics (`<T>`) for reusable code
- `unknown` when the type is truly unknown

### 4. Prefix Unused Parameters with `_`

When a parameter is required but unused, prefix it with `_`:

```typescript
// Required by interface but not used
function handler(_event: Event): void {
  // Implementation
}
```

### 5. Remove Debug Code

Remove `console.log`, `console.debug`, and `debugger` statements before committing. Use `console.warn` or `console.error` if logging is necessary.

## CI/CD Integration

ESLint runs automatically in the deployment script (`./deploy.sh`). The script will fail if:
- ESLint finds errors
- Code formatting doesn't match Prettier rules

This ensures code quality is maintained before deployment.

## Configuration Updates

### Adding New Rules

To add new ESLint rules, edit `.eslintrc.json`:

```json
{
  "rules": {
    "your-rule-name": "error"
  }
}
```

### Adding Plugins

1. Install the plugin: `npm install --save-dev eslint-plugin-plugin-name`
2. Add to `plugins` array in `.eslintrc.json`
3. Add plugin rules to `rules` or extend recommended config

### Modifying TypeScript Rules

TypeScript-specific rules are prefixed with `@typescript-eslint/`. Refer to the [TypeScript ESLint documentation](https://typescript-eslint.io/rules/) for available rules.

## Troubleshooting

### ESLint Not Running on Files

1. Check that files are not in `.eslintignore`
2. Verify files have `.ts` extension
3. Ensure files are in `src/` or `tests/` directories

### Type-Aware Rules Not Working

1. Verify `tsconfig.eslint.json` exists and is properly configured
2. Check that `parserOptions.project` points to the correct config file
3. Ensure TypeScript can compile the project (`npm run type-check`)

### Prettier Conflicts

If Prettier and ESLint conflict:
1. Ensure `eslint-config-prettier` is in the `extends` array (after other configs)
2. Verify `eslint-plugin-prettier` is installed and configured
3. Run `npm run format` then `npm run lint:fix`

## Related Documentation

- [Prettier Configuration](./PRETTIER.md) - Code formatting guidelines
- [TypeScript Configuration](./TYPESCRIPT.md) - TypeScript setup and usage
- [Testing Guide](./TESTING.md) - Testing best practices

## Resources

- [ESLint Documentation](https://eslint.org/docs/latest/)
- [TypeScript ESLint Documentation](https://typescript-eslint.io/)
- [Prettier Documentation](https://prettier.io/docs/en/)
- [ESLint Config Prettier](https://github.com/prettier/eslint-config-prettier)

---

**Last Updated:** 2025-01-17  
**Configuration Version:** ESLint 8.56.0, @typescript-eslint 6.15.0
