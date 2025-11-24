/**
 * Integration tests for async processing system
 *
 * These tests verify end-to-end async operation flows:
 * - Execute → process → complete flow
 * - Execute → fail → retry → complete flow
 * - Multiple async operations executing concurrently
 * - Async error handling in real scenarios
 *
 * **Rails Implementation Reference:**
 * - `jarek-va/spec/jobs/application_job_spec.rb` - Job execution and retry behavior tests
 * - `jarek-va/spec/support/sidekiq.rb` - Sidekiq test helpers
 *
 * This is part of PHASE2-017 task to test async processing system.
 */

// Mock the logger utility first (before any imports)
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

jest.mock('../../../src/utils/logger', () => {
  return {
    __esModule: true,
    default: mockLogger,
  };
});

import { BaseAsyncHandler, DeserializationError } from '../../../src/handlers/base-async-handler';
import {
  withErrorHandling,
  isRetryableError,
  clearFailedOperations,
  getFailedOperations,
} from '../../../src/handlers/async-error-handler';
import { withRetry, withTimeout, withConcurrencyLimit, TimeoutError } from '../../../src/utils/async';
import { asyncConfig } from '../../../src/config/async';

describe('Async Processing System - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearFailedOperations();
    jest.useFakeTimers();
  });

  afterEach(async () => {
    await jest.runAllTimersAsync();
    jest.useRealTimers();
  });

  describe('End-to-End Async Operation Flow', () => {
    it('should execute → process → complete successfully', async () => {
      class TestHandler extends BaseAsyncHandler<string, string> {
        async handle(data: string): Promise<string> {
          return `processed: ${data}`;
        }
      }

      const handler = new TestHandler();
      const result = await handler.execute('test-data');

      expect(result).toBe('processed: test-data');
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          handlerName: 'default',
          operationId: expect.any(String),
        }),
        'Starting async handler: default',
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          handlerName: 'default',
          operationId: expect.any(String),
        }),
        'Completed async handler: default',
      );
    });

    it('should execute → fail → retry → complete', async () => {
      let attemptCount = 0;
      class RetryHandler extends BaseAsyncHandler<string, string> {
        async handle(data: string): Promise<string> {
          attemptCount++;
          if (attemptCount < 3) {
            throw new Error('Temporary error');
          }
          return `processed: ${data} after ${attemptCount} attempts`;
        }
      }

      const handler = new RetryHandler();
      jest.useRealTimers(); // Use real timers for retry delays

      const result = await handler.execute('test-data', {
        retryOptions: {
          attempts: 3,
          initialDelayMs: 10, // Fast retries for testing
        },
      });

      expect(result).toBe('processed: test-data after 3 attempts');
      expect(attemptCount).toBe(3);
      jest.useFakeTimers();
    });

    it('should handle operation with error handling wrapper', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      const result = await withErrorHandling(operation, {
        operationId: 'test-op',
        logCompletion: true,
      });

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          operationId: 'test-op',
        }),
        'Starting async operation: test-op',
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          operationId: 'test-op',
        }),
        'Completed async operation: test-op',
      );
    });
  });

  describe('Async Retry Flow', () => {
    it('should retry on failure and eventually succeed', async () => {
      let attemptCount = 0;
      const operation = jest.fn().mockImplementation(async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Temporary error');
        }
        return 'success';
      });

      jest.useRealTimers();
      const result = await withRetry(operation, {
        attempts: 3,
        initialDelayMs: 10, // Fast retries for testing
      });

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
      expect(attemptCount).toBe(3);
      jest.useFakeTimers();
    });

    it('should exhaust retries and throw error', async () => {
      const error = new Error('Always fails');
      const operation = jest.fn().mockRejectedValue(error);

      jest.useRealTimers();
      await expect(
        withRetry(operation, {
          attempts: 2,
          initialDelayMs: 10,
        }),
      ).rejects.toThrow('Always fails');

      expect(operation).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
      jest.useFakeTimers();
    });

    it('should use exponential backoff between retries', async () => {
      let attemptCount = 0;
      const operation = jest.fn().mockImplementation(async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Temporary error');
        }
        return 'success';
      });

      const start = Date.now();
      jest.useRealTimers();

      await withRetry(operation, {
        attempts: 2,
        initialDelayMs: 50,
        backoffMultiplier: 2,
      });

      const end = Date.now();
      const elapsed = end - start;

      // Should have waited: 50ms (after attempt 1) + 100ms (after attempt 2) = ~150ms
      expect(elapsed).toBeGreaterThanOrEqual(140);
      expect(elapsed).toBeLessThan(300);

      jest.useFakeTimers();
    });

    it('should handle retry with error handler', async () => {
      let attemptCount = 0;
      const operation = jest.fn().mockImplementation(async () => {
        attemptCount++;
        if (attemptCount < 2) {
          throw new Error('Temporary error');
        }
        return 'success';
      });

      jest.useRealTimers();
      const result = await withErrorHandling(operation, {
        operationId: 'retry-op',
        retries: 1,
      });

      expect(result).toBe('success');
      expect(attemptCount).toBe(2);
      jest.useFakeTimers();
    });
  });

  describe('Multiple Async Operations Concurrently', () => {
    it('should execute multiple operations concurrently', async () => {
      const operations = Array.from({ length: 5 }, (_, i) => {
        return jest.fn().mockResolvedValue(`result-${i}`);
      });

      const tasks = operations.map((op) => () => op());
      const results = await withConcurrencyLimit(tasks, 5);

      expect(results).toEqual(['result-0', 'result-1', 'result-2', 'result-3', 'result-4']);
      operations.forEach((op) => {
        expect(op).toHaveBeenCalledTimes(1);
      });
    });

    it('should respect concurrency limit', async () => {
      const executionOrder: number[] = [];
      const tasks = Array.from({ length: 10 }, (_, i) => {
        return () => {
          return new Promise<number>((resolve) => {
            executionOrder.push(i);
            setTimeout(() => resolve(i), 100);
          });
        };
      });

      const resultsPromise = withConcurrencyLimit(tasks, 3);

      // Allow some time for initial tasks to start
      jest.advanceTimersByTime(50);

      // With limit of 3, only first 3 tasks should have started
      expect(executionOrder.length).toBeLessThanOrEqual(3);

      // Fast-forward to complete all tasks
      jest.advanceTimersByTime(500);
      await jest.runAllTimersAsync();

      const results = await resultsPromise;

      expect(results).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    it('should handle multiple handlers executing concurrently', async () => {
      class ConcurrentHandler extends BaseAsyncHandler<number, number> {
        async handle(data: number): Promise<number> {
          return data * 2;
        }
      }

      const handler = new ConcurrentHandler();
      const tasks = Array.from({ length: 5 }, (_, i) => () => handler.execute(i));

      const results = await withConcurrencyLimit(tasks, 3);

      expect(results).toEqual([0, 2, 4, 6, 8]);
    });

    it('should handle mixed success and failure in concurrent operations', async () => {
      jest.useRealTimers();
      const tasks = [
        () => Promise.resolve(1),
        () => Promise.reject(new Error('Task failed')),
        () => Promise.resolve(3),
      ];

      await expect(withConcurrencyLimit(tasks, 2)).rejects.toThrow('Failed to execute 1 of 3 tasks');
      jest.useFakeTimers();
    });
  });

  describe('Async Error Handling in Real Scenarios', () => {
    it('should handle deserialization errors (non-retryable)', async () => {
      class DeserializationHandler extends BaseAsyncHandler<string, string> {
        async handle(data: string): Promise<string> {
          throw new SyntaxError('Unexpected token in JSON');
        }
      }

      const handler = new DeserializationHandler();
      jest.useRealTimers();

      await expect(handler.execute('invalid-json')).rejects.toThrow();

      // Deserialization errors should not be retried
      expect(mockLogger.error).toHaveBeenCalled();
      jest.useFakeTimers();
    });

    it('should handle timeout errors', async () => {
      const slowOperation = new Promise((resolve) => {
        setTimeout(() => resolve('too late'), 10000);
      });

      const timeoutPromise = withTimeout(slowOperation, 5000);

      jest.advanceTimersByTime(5000);

      await expect(timeoutPromise).rejects.toThrow(TimeoutError);
    });

    it('should handle timeout errors with retry', async () => {
      let attemptCount = 0;
      const operation = jest.fn().mockImplementation(async () => {
        attemptCount++;
        if (attemptCount < 2) {
          // First attempt times out
          return new Promise((resolve) => {
            setTimeout(() => resolve('success'), 10000);
          });
        }
        return 'success';
      });

      const retryPromise = withRetry(
        async () => {
          return withTimeout(operation(), 5000);
        },
        {
          attempts: 2,
          initialDelayMs: 100,
        },
      );

      // Fast-forward through timeout and retry
      jest.advanceTimersByTime(5000); // Timeout
      jest.advanceTimersByTime(100); // Retry delay
      await jest.runAllTimersAsync();

      const result = await retryPromise;

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should store failed operations after retries exhausted', async () => {
      const error = new Error('Final error');
      const operation = jest.fn().mockRejectedValue(error);

      jest.useRealTimers();
      try {
        await withErrorHandling(operation, {
          operationId: 'failed-op',
          retries: 1,
        });
      } catch {
        // Expected to throw
      }

      const failedOps = getFailedOperations();
      expect(failedOps.length).toBe(1);
      expect(failedOps[0].operationId).toBe('failed-op');
      expect(failedOps[0].error).toBe(error);
      expect(failedOps[0].attempts).toBe(2); // 1 initial + 1 retry

      jest.useFakeTimers();
    });

    it('should classify errors correctly', () => {
      const deserializationError = new DeserializationError('Invalid data');
      const timeoutError = new TimeoutError(5000);
      const standardError = new Error('Standard error');

      expect(isRetryableError(deserializationError)).toBe(false);
      expect(isRetryableError(timeoutError)).toBe(true);
      expect(isRetryableError(standardError)).toBe(true);
    });

    it('should handle errors with full stack traces', async () => {
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.js:1:1';
      const operation = jest.fn().mockRejectedValue(error);

      jest.useRealTimers();
      try {
        await withErrorHandling(operation, { operationId: 'test-op', retries: 0 });
      } catch {
        // Expected to throw
      }

      // Should log error with stack trace
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          operationId: 'test-op',
          errorClassName: 'Error',
          errorMessage: 'Test error',
        }),
        expect.stringContaining('Error in async operation'),
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          operationId: 'test-op',
          stackTrace: 'Error: Test error\n    at test.js:1:1',
        }),
        expect.stringContaining('Stack trace'),
      );

      jest.useFakeTimers();
    });
  });

  describe('Handler with Async Utilities Integration', () => {
    it('should use withRetry within handler', async () => {
      let attemptCount = 0;
      class RetryHandler extends BaseAsyncHandler<string, string> {
        async handle(data: string): Promise<string> {
          return await withRetry(
            async () => {
              attemptCount++;
              if (attemptCount < 2) {
                throw new Error('Temporary error');
              }
              return `processed: ${data}`;
            },
            {
              attempts: 1,
              initialDelayMs: 10,
            },
          );
        }
      }

      const handler = new RetryHandler();
      jest.useRealTimers();

      const result = await handler.execute('test-data');

      expect(result).toBe('processed: test-data');
      expect(attemptCount).toBe(2);
      jest.useFakeTimers();
    });

    it('should use withTimeout within handler', async () => {
      class TimeoutHandler extends BaseAsyncHandler<string, string> {
        async handle(data: string): Promise<string> {
          const operation = Promise.resolve(`processed: ${data}`);
          return await withTimeout(operation, 5000);
        }
      }

      const handler = new TimeoutHandler();
      const result = await handler.execute('test-data');

      expect(result).toBe('processed: test-data');
    });

    it('should use withConcurrencyLimit with handlers', async () => {
      class ConcurrentHandler extends BaseAsyncHandler<number, number> {
        async handle(data: number): Promise<number> {
          return data * 2;
        }
      }

      const handler = new ConcurrentHandler();
      const tasks = Array.from({ length: 10 }, (_, i) => () => handler.execute(i));

      const results = await withConcurrencyLimit(tasks, 5);

      expect(results).toEqual([0, 2, 4, 6, 8, 10, 12, 14, 16, 18]);
    });

    it('should combine error handling with async utilities', async () => {
      let attemptCount = 0;
      const operation = jest.fn().mockImplementation(async () => {
        attemptCount++;
        if (attemptCount < 2) {
          throw new Error('Temporary error');
        }
        return 'success';
      });

      jest.useRealTimers();
      const result = await withErrorHandling(
        () =>
          withRetry(operation, {
            attempts: 1,
            initialDelayMs: 10,
          }),
        {
          operationId: 'combined-op',
          retries: 1,
        },
      );

      expect(result).toBe('success');
      expect(attemptCount).toBe(2);
      jest.useFakeTimers();
    });
  });

  describe('Configuration Integration', () => {
    it('should use async config timeout in operations', async () => {
      const fastOperation = Promise.resolve('success');

      // Use asyncConfig.timeout
      const result = await withTimeout(fastOperation, asyncConfig.timeout);

      expect(result).toBe('success');
    });

    it('should use async config retry options', () => {
      expect(asyncConfig.retry.maxAttempts).toBe(3);
      expect(asyncConfig.retry.initialDelayMs).toBe(1000);
      expect(asyncConfig.retry.maxDelayMs).toBe(30000);
      expect(asyncConfig.retry.backoffMultiplier).toBe(2);
    });
  });
});
