# Test Directory Structure

This directory contains all tests for the telegram-receiver project, organized by test type and following best practices.

## Directory Structure

```
tests/
├── unit/              # Unit tests for individual components
│   ├── controllers/  # Controller unit tests
│   ├── services/     # Service unit tests
│   ├── routes/       # Route handler unit tests
│   ├── middleware/   # Middleware unit tests
│   ├── utils/        # Utility function tests
│   ├── models/       # Model tests
│   ├── config/       # Configuration tests
│   └── types/        # Type definition tests
├── integration/      # Integration tests
│   ├── api/          # API endpoint integration tests
│   └── services/     # Service integration tests
├── e2e/              # End-to-end tests (Playwright)
├── fixtures/         # Test data fixtures
├── mocks/            # Mock implementations
├── helpers/          # Test helper utilities
└── setup.ts          # Jest setup file
```

## Test Types

### Unit Tests (`tests/unit/`)

- Test individual functions, classes, and modules in isolation
- Mock all external dependencies
- Fast execution, high coverage
- Run with: `npm run test:unit`

### Integration Tests (`tests/integration/`)

- Test how multiple modules/components work together
- May use real dependencies (databases, external APIs with mocks)
- Test API endpoints with Supertest
- Run with: `npm run test:integration`

### E2E Tests (`tests/e2e/`)

- Test complete user flows end-to-end
- Use Playwright for browser automation
- Test full application stack
- Run with: `npm run test:e2e`

## Test Naming Conventions

- **Unit tests**: Use `*.test.ts` suffix (e.g., `userService.test.ts`)
- **Integration tests**: Use `*.test.ts` suffix (e.g., `apiRoutes.test.ts`)
- **E2E tests**: Use `*.spec.ts` suffix (e.g., `userFlow.spec.ts`) - Playwright convention

**Standard**: Jest-based tests (unit and integration) use `.test.ts`, Playwright E2E tests use `.spec.ts`

Examples:

- Unit: `tests/unit/services/userService.test.ts`
- Integration: `tests/integration/api/webhook.test.ts`
- E2E: `tests/e2e/userRegistration.spec.ts`

## Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run E2E tests only
npm run test:e2e

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run all tests (unit + E2E)
npm run test:all
```

## Test Best Practices

1. **Follow AAA Pattern**: Arrange, Act, Assert
2. **Use Descriptive Names**: Test names should clearly describe what is being tested
3. **Test Both Happy Paths and Edge Cases**: Include error conditions and validation failures
4. **Keep Tests Independent**: Tests should not depend on each other
5. **Mock External Dependencies**: Use mocks for APIs, databases, and external services
6. **Use Fixtures**: Reuse test data through fixtures
7. **Clean Up**: Ensure tests clean up after themselves

## Example Test Structure

```typescript
describe('YourClass', () => {
  describe('yourMethod', () => {
    it('should return expected result when conditions are met', () => {
      // Arrange
      const instance = new YourClass();
      const input = {
        /* test data */
      };

      // Act
      const result = instance.yourMethod(input);

      // Assert
      expect(result).toEqual(expectedOutput);
    });

    it('should handle edge case gracefully', () => {
      // Test edge case
      const instance = new YourClass();
      expect(() => instance.yourMethod(null)).toThrow('Expected error');
    });
  });
});
```

## Coverage Goals

- Minimum 80% code coverage for new code
- Aim for 100% coverage of critical business logic
- Use `npm run test:coverage` to check coverage
