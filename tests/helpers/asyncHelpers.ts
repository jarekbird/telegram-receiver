/**
 * Async test utilities and helpers
 *
 * This module provides helper functions for testing async operations, handlers,
 * and retry behavior. It replaces Rails' ActiveJob::TestHelper functionality
 * for async testing in Node.js.
 *
 * **Rails Patterns Replicated:**
 * - `ActiveJob::TestHelper` → Async test utilities
 * - `have_enqueued_job` matchers → Direct operation state checking
 * - `ActiveJob::Base.queue_adapter.enqueued_jobs.clear` → Test state cleanup
 *
 * **Features:**
 * - Mock async handlers for testing
 * - Helper functions to create test async operations
 * - Helper functions to wait for async operation completion
 * - Helper functions to test retry behavior
 * - Test state cleanup utilities
 */

import { waitFor } from './testUtils';

/**
 * Mock async handler for testing
 * Provides a simple async handler implementation that can be configured
 * to succeed, fail, or throw specific errors
 */
export interface MockAsyncHandler {
  /** Handler identifier/name */
  name: string;
  /** Handler function */
  perform: (...args: unknown[]) => Promise<unknown>;
  /** Execution count */
  executionCount: number;
  /** Execution arguments */
  executionArgs: unknown[][];
  /** Whether the handler should succeed or fail */
  shouldSucceed: boolean;
  /** Error to throw if shouldSucceed is false */
  errorToThrow?: Error;
  /** Delay before execution (in milliseconds) */
  executionDelay?: number;
}

/**
 * Create a mock async handler for testing
 *
 * @param name - Handler name/identifier
 * @param options - Handler configuration options
 * @returns Mock async handler
 *
 * @example
 * ```typescript
 * // Create a handler that always succeeds
 * const handler = createMockAsyncHandler('test-handler', {
 *   shouldSucceed: true,
 * });
 *
 * // Create a handler that fails with a specific error
 * const handler = createMockAsyncHandler('failing-handler', {
 *   shouldSucceed: false,
 *   errorToThrow: new Error('Test error'),
 * });
 *
 * // Create a handler with execution delay
 * const handler = createMockAsyncHandler('delayed-handler', {
 *   shouldSucceed: true,
 *   executionDelay: 100,
 * });
 * ```
 */
export function createMockAsyncHandler(
  name: string,
  options: {
    shouldSucceed?: boolean;
    errorToThrow?: Error;
    executionDelay?: number;
    perform?: (...args: unknown[]) => Promise<unknown>;
  } = {},
): MockAsyncHandler {
  const {
    shouldSucceed = true,
    errorToThrow = new Error('Mock handler error'),
    executionDelay = 0,
    perform: customPerform,
  } = options;

  const handler: MockAsyncHandler = {
    name,
    executionCount: 0,
    executionArgs: [],
    shouldSucceed,
    errorToThrow,
    executionDelay,
    perform: async (...args: unknown[]): Promise<unknown> => {
      handler.executionCount++;
      handler.executionArgs.push(args);

      if (executionDelay > 0) {
        await waitFor(executionDelay);
      }

      if (customPerform) {
        return await customPerform(...args);
      }

      if (!shouldSucceed) {
        throw errorToThrow;
      }

      return { success: true, args };
    },
  };

  return handler;
}

/**
 * Create a test async operation
 * Returns a function that can be executed as an async operation
 *
 * @param handler - Mock async handler
 * @param args - Arguments to pass to the handler
 * @returns Async operation function
 *
 * @example
 * ```typescript
 * const handler = createMockAsyncHandler('test-handler');
 * const operation = createTestAsyncOperation(handler, ['arg1', 'arg2']);
 * const result = await operation();
 * ```
 */
export function createTestAsyncOperation<T>(
  handler: MockAsyncHandler,
  args: unknown[] = [],
): () => Promise<T> {
  return async (): Promise<T> => {
    return (await handler.perform(...args)) as T;
  };
}

/**
 * Wait for an async operation to complete
 * Polls the operation state until it completes or times out
 *
 * @param checkComplete - Function that returns true when operation is complete
 * @param timeoutMs - Maximum time to wait (default: 5000ms)
 * @param pollIntervalMs - Interval between checks (default: 100ms)
 * @returns Promise that resolves when operation completes
 *
 * @example
 * ```typescript
 * // Wait for handler to execute
 * await waitForAsyncOperation(() => handler.executionCount > 0);
 *
 * // Wait with custom timeout
 * await waitForAsyncOperation(() => operation.complete, 10000);
 * ```
 */
export async function waitForAsyncOperation(
  checkComplete: () => boolean,
  timeoutMs = 5000,
  pollIntervalMs = 100,
): Promise<void> {
  const startTime = Date.now();

  while (!checkComplete()) {
    if (Date.now() - startTime > timeoutMs) {
      throw new Error(`Async operation did not complete within ${timeoutMs}ms`);
    }
    await waitFor(pollIntervalMs);
  }
}

/**
 * Test retry behavior by executing an operation and tracking retry attempts
 *
 * @param operation - Async operation to test
 * @param options - Retry test options
 * @returns Retry test result with attempt count and errors
 *
 * @example
 * ```typescript
 * let attemptCount = 0;
 * const operation = async () => {
 *   attemptCount++;
 *   if (attemptCount < 3) {
 *     throw new Error('Retry me');
 *   }
 *   return 'success';
 * };
 *
 * const result = await testRetryBehavior(operation, {
 *   maxAttempts: 3,
 * });
 *
 * expect(result.attempts).toBe(3);
 * expect(result.success).toBe(true);
 * ```
 */
export async function testRetryBehavior<T>(
  operation: () => Promise<T>,
  options: {
    maxAttempts?: number;
    shouldRetry?: (error: unknown) => boolean;
  } = {},
): Promise<{
  success: boolean;
  attempts: number;
  errors: unknown[];
  result?: T;
}> {
  const { maxAttempts = 3, shouldRetry = () => true } = options;
  let attempts = 0;
  const errors: unknown[] = [];
  let result: T | undefined;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    attempts++;
    try {
      result = await operation();
      return { success: true, attempts, errors, result };
    } catch (error) {
      errors.push(error);
      if (!shouldRetry(error) || attempt === maxAttempts - 1) {
        return { success: false, attempts, errors, result };
      }
      // Wait a bit before retry (simulating backoff)
      await waitFor(50);
    }
  }

  return { success: false, attempts, errors, result };
}

/**
 * Clean up test state for async operations
 * Resets handler execution counts and clears execution arguments
 *
 * @param handlers - Array of mock handlers to clean up
 *
 * @example
 * ```typescript
 * const handler1 = createMockAsyncHandler('handler1');
 * const handler2 = createMockAsyncHandler('handler2');
 *
 * // ... run tests ...
 *
 * cleanupAsyncTestState([handler1, handler2]);
 * ```
 */
export function cleanupAsyncTestState(handlers: MockAsyncHandler[]): void {
  handlers.forEach((handler) => {
    handler.executionCount = 0;
    handler.executionArgs = [];
  });
}

/**
 * Create a handler that succeeds after N failures
 * Useful for testing retry behavior
 *
 * @param name - Handler name
 * @param failuresBeforeSuccess - Number of failures before success
 * @param errorToThrow - Error to throw on failures
 * @returns Mock handler that fails N times then succeeds
 *
 * @example
 * ```typescript
 * // Handler that fails twice then succeeds
 * const handler = createRetryTestHandler('retry-handler', 2);
 * const result = await handler.perform();
 * // First two calls will fail, third will succeed
 * ```
 */
export function createRetryTestHandler(
  name: string,
  failuresBeforeSuccess: number,
  errorToThrow: Error = new Error('Retry test error'),
): MockAsyncHandler {
  let failureCount = 0;

  return createMockAsyncHandler(name, {
    shouldSucceed: true,
    perform: async (...args: unknown[]) => {
      if (failureCount < failuresBeforeSuccess) {
        failureCount++;
        throw errorToThrow;
      }
      return { success: true, args, attempts: failureCount + 1 };
    },
  });
}

/**
 * Create a handler that always fails
 * Useful for testing error handling and retry exhaustion
 *
 * @param name - Handler name
 * @param errorToThrow - Error to throw
 * @returns Mock handler that always fails
 *
 * @example
 * ```typescript
 * const handler = createFailingHandler('failing-handler', new Error('Always fails'));
 * await expect(handler.perform()).rejects.toThrow('Always fails');
 * ```
 */
export function createFailingHandler(
  name: string,
  errorToThrow: Error = new Error('Handler failed'),
): MockAsyncHandler {
  return createMockAsyncHandler(name, {
    shouldSucceed: false,
    errorToThrow,
  });
}

/**
 * Create a handler that succeeds after a delay
 * Useful for testing timeout behavior
 *
 * @param name - Handler name
 * @param delayMs - Delay in milliseconds before success
 * @returns Mock handler that succeeds after delay
 *
 * @example
 * ```typescript
 * const handler = createDelayedHandler('delayed-handler', 2000);
 * // Handler will succeed after 2 seconds
 * ```
 */
export function createDelayedHandler(
  name: string,
  delayMs: number,
): MockAsyncHandler {
  return createMockAsyncHandler(name, {
    shouldSucceed: true,
    executionDelay: delayMs,
  });
}
