/**
 * Jest test setup file
 * This file runs before all tests
 */

// Set test environment variables if needed
process.env.NODE_ENV = 'test';

// Increase timeout for integration tests
jest.setTimeout(10000);

// Global test utilities or mocks can be added here
// Example: Mock external services, setup test database, etc.
