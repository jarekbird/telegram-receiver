/**
 * Jest test setup file
 * This file runs before all tests
 *
 * This setup file is referenced in jest.config.ts via setupFilesAfterEnv
 * and provides basic Jest configuration including:
 * - NODE_ENV=test environment variable
 * - Timeout settings for different test types
 * - Global test setup and cleanup hooks
 * - Per-test setup and cleanup hooks
 * - Mock reset utilities
 *
 * This file replaces the functionality from Rails' spec/spec_helper.rb and
 * spec/rails_helper.rb, providing global test configuration, setup hooks,
 * and cleanup hooks that run before and after all tests.
 */

// Set test environment to 'test'
// This ensures the application runs in test mode, similar to Rails' ENV['RAILS_ENV'] = 'test'
process.env.NODE_ENV = 'test';

// Configure Jest timeout settings
// Default timeout for all tests (can be overridden in individual test files)
jest.setTimeout(10000);

// Import mock reset functions
import { resetRedisMocks } from './mocks/redis';
import { resetTelegramApiMocks } from './mocks/telegramApi';
import { resetCursorRunnerApiMocks } from './mocks/cursorRunnerApi';

/**
 * Global setup hook that runs once before all tests
 * Similar to Rails' before(:all) blocks in rails_helper.rb
 *
 * This hook:
 * - Initializes test infrastructure (if needed)
 * - Sets up test environment variables
 * - Clears/resets any global mocks to ensure a clean state
 */
beforeAll(async () => {
  // Set up test environment variables if needed
  // These can be overridden in individual test files if necessary
  process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379/0';
  process.env.TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'test-token';
  process.env.CURSOR_RUNNER_URL =
    process.env.CURSOR_RUNNER_URL || 'http://localhost:3001';

  // Clear/reset any global mocks (Redis, Telegram API, Cursor Runner API)
  // This ensures a clean state before all tests run
  resetRedisMocks();
  resetTelegramApiMocks();
  resetCursorRunnerApiMocks();

  // Initialize any test infrastructure here (e.g., test database connections, Redis connections)
  // Note: For now, we're using mocks, so no actual connections are needed
  // If real connections are needed in the future, they should be initialized here
});

/**
 * Global cleanup hook that runs once after all tests complete
 * Similar to Rails' after(:all) blocks in rails_helper.rb
 *
 * This hook:
 * - Cleans up any resources created during tests
 * - Closes connections (database, Redis, etc.)
 * - Verifies no test leaks or hanging promises
 */
afterAll(async () => {
  // Clean up any resources created during tests
  // If test database connections were created, close them here
  // If Redis connections were created, close them here

  // Verify no test leaks or hanging promises
  // Jest will automatically fail if there are unhandled promise rejections
  // but we can add additional cleanup here if needed

  // Reset all mocks one final time
  resetRedisMocks();
  resetTelegramApiMocks();
  resetCursorRunnerApiMocks();
});

/**
 * Per-test setup hook that runs before each test
 * Similar to Rails' before(:each) blocks in rails_helper.rb
 *
 * This hook:
 * - Clears mocks before each test to ensure test isolation
 * - Resets Redis mocks using resetRedisMocks()
 * - Resets Telegram API mocks using resetTelegramApiMocks()
 * - Resets Cursor Runner API mocks using resetCursorRunnerApiMocks()
 *
 * This ensures each test starts with a clean state and prevents test pollution.
 */
beforeEach(() => {
  // Clear mocks before each test to ensure test isolation
  // This prevents test pollution where one test's mocks affect another test
  jest.clearAllMocks();

  // Reset Redis mocks to ensure clean state
  resetRedisMocks();

  // Reset Telegram API mocks to ensure clean state
  resetTelegramApiMocks();

  // Reset Cursor Runner API mocks to ensure clean state
  resetCursorRunnerApiMocks();
});

/**
 * Per-test cleanup hook that runs after each test
 * Similar to Rails' after(:each) blocks in rails_helper.rb
 *
 * This hook:
 * - Clears any test-specific state
 * - Ensures no async operations are left hanging
 * - Clears all Jest mocks (in addition to specific mock resets in beforeEach)
 *
 * Note: The specific mock resets (Redis, Telegram API, Cursor Runner API)
 * are done in beforeEach to ensure a clean state at the start of each test.
 * This afterEach hook provides additional cleanup for any test-specific state.
 */
afterEach(() => {
  // Clear all Jest mocks (this is a catch-all for any mocks not explicitly reset)
  jest.clearAllMocks();

  // Clear any test-specific state here if needed
  // Ensure no async operations are left hanging
  // Jest will automatically fail tests with unhandled promise rejections
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

// Note: Test utilities are available in tests/helpers/testUtils.ts
// They don't need to be re-exported from setup.ts as they can be imported
// directly in test files where needed.
