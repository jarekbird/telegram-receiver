/**
 * Jest test setup file
 * This file runs before all tests
 *
 * This setup file is referenced in jest.config.ts via setupFilesAfterEnv
 * and provides basic Jest configuration including:
 * - NODE_ENV=test environment variable
 * - Timeout settings for different test types
 * - Global test utilities
 */

// Set test environment to 'test'
process.env.NODE_ENV = 'test';

// Configure Jest timeout settings
// Default timeout for all tests (can be overridden in individual test files)
jest.setTimeout(10000);

// Global test utilities
// These utilities are available in all test files without importing

/**
 * Helper to reset all mocks between tests
 * This ensures test isolation and prevents test pollution
 */
afterEach(() => {
  jest.clearAllMocks();
});

// Suppress console output during tests (optional - uncomment if needed)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };

// Global test utilities or mocks can be added here
// Example: Mock external services, setup test database, etc.
