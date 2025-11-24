/**
 * Unit tests for async processing utilities (src/utils/async.ts)
 *
 * These tests verify that the async utilities correctly:
 * - Implement retry logic with exponential backoff
 * - Handle timeouts properly
 * - Control concurrency with semaphore pattern
 * - Handle errors gracefully
 * - Log operations appropriately
 *
 * This is part of PHASE2-014 task to create async processing utilities.
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

import {
  withRetry,
  withTimeout,
  withConcurrencyLimit,
  TimeoutError,
  RetryOptions,
  AsyncResult,
  calculateBackoffDelay,
  sleep,
} from '../../../src/utils/async';

describe('Async Processing Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(async () => {
    // Run any pending timers before switching to real timers
    await jest.runAllTimersAsync();
    jest.useRealTimers();
  });

  describe('calculateBackoffDelay', () => {
    it('should calculate exponential backoff delay correctly', () => {
      // First retry (attempt 0): 2000 * 2^0 = 2000ms
      expect(calculateBackoffDelay(0, 2000, 30000, 2)).toBe(2000);

      // Second retry (attempt 1): 2000 * 2^1 = 4000ms
      expect(calculateBackoffDelay(1, 2000, 30000, 2)).toBe(4000);

      // Third retry (attempt 2): 2000 * 2^2 = 8000ms
      expect(calculateBackoffDelay(2, 2000, 30000, 2)).toBe(8000);
    });

    it('should cap delay at maxDelayMs', () => {
      // Without cap: 2000 * 2^5 = 64000ms
      // With cap at 30000ms
      expect(calculateBackoffDelay(5, 2000, 30000, 2)).toBe(30000);
    });

    it('should handle custom backoff multiplier', () => {
      // With multiplier 3: 1000 * 3^2 = 9000ms
      expect(calculateBackoffDelay(2, 1000, 30000, 3)).toBe(9000);
    });
  });

  describe('sleep', () => {
    it('should sleep for specified duration', async () => {
      const sleepPromise = sleep(1000);

      // Fast-forward time
      jest.advanceTimersByTime(1000);

      await expect(sleepPromise).resolves.toBeUndefined();
    });

    it('should handle zero delay', async () => {
      const sleepPromise = sleep(0);
      jest.advanceTimersByTime(0);
      await expect(sleepPromise).resolves.toBeUndefined();
    });
  });

  describe('withRetry', () => {
    it('should return result on first attempt', async () => {
      const fn = jest.fn().mockResolvedValue('success');

      const result = await withRetry(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure with exponential backoff', async () => {
      let attemptCount = 0;
      const fn = jest.fn().mockImplementation(async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Temporary error');
        }
        return 'success';
      });

      const retryPromise = withRetry(fn, { attempts: 3, initialDelayMs: 100 });

      // Fast-forward through retries
      await jest.runAllTimersAsync();

      const result = await retryPromise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
      expect(mockLogger.warn).toHaveBeenCalledTimes(2); // Two retry warnings
      expect(mockLogger.info).toHaveBeenCalled(); // Success after retry
    });

    it(
      'should use default retry options when not provided',
      async () => {
        jest.useRealTimers(); // Use real timers for this test
        const fn = jest.fn().mockRejectedValue(new Error('Error'));

        const retryPromise = withRetry(fn);

        await expect(retryPromise).rejects.toThrow('Error');
        expect(fn).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
        jest.useFakeTimers(); // Restore fake timers
      },
      20000, // 20 second timeout (default retries take ~14 seconds)
    );

    it('should respect shouldRetry function', async () => {
      class NonRetryableError extends Error {}
      class RetryableError extends Error {}

      const fn = jest.fn().mockRejectedValue(new NonRetryableError('Non-retryable'));

      const retryPromise = withRetry(fn, {
        shouldRetry: (error) => error instanceof RetryableError,
      });

      await expect(retryPromise).rejects.toThrow('Non-retryable');
      expect(fn).toHaveBeenCalledTimes(1); // Should not retry
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          err: expect.any(NonRetryableError),
        }),
        'Async operation failed with non-retryable error',
      );
    });

    it('should throw last error after all retries exhausted', async () => {
      jest.useRealTimers(); // Use real timers for this test
      const error = new Error('Final error');
      const fn = jest.fn().mockRejectedValue(error);

      const retryPromise = withRetry(fn, { attempts: 2, initialDelayMs: 10 });

      await expect(retryPromise).rejects.toThrow('Final error');
      expect(fn).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          attempt: 3,
          maxAttempts: 3,
        }),
        'Async operation failed after all retry attempts',
      );
      jest.useFakeTimers(); // Restore fake timers
    });

    it('should log retry attempts with correct delay information', async () => {
      let attemptCount = 0;
      const fn = jest.fn().mockImplementation(async () => {
        attemptCount++;
        if (attemptCount < 2) {
          throw new Error('Error');
        }
        return 'success';
      });

      const retryPromise = withRetry(fn, { attempts: 3, initialDelayMs: 2000 });

      // Fast-forward through first retry
      jest.advanceTimersByTime(2000);
      await jest.runAllTimersAsync();

      await retryPromise;

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          delayMs: 2000,
          attempt: 1, // First retry attempt is logged as attempt 1 (0-indexed + 1)
          maxAttempts: 4,
        }),
        'Async operation failed, retrying with exponential backoff',
      );
    });
  });

  describe('withTimeout', () => {
    it('should return result if promise resolves before timeout', async () => {
      const promise = Promise.resolve('success');

      const result = await withTimeout(promise, 5000);

      expect(result).toBe('success');
    });

    it('should throw TimeoutError if promise exceeds timeout', async () => {
      const slowPromise = new Promise((resolve) => {
        setTimeout(() => resolve('slow'), 10000);
      });

      const timeoutPromise = withTimeout(slowPromise, 5000);

      // Fast-forward past timeout
      jest.advanceTimersByTime(5000);

      await expect(timeoutPromise).rejects.toThrow(TimeoutError);
      await expect(timeoutPromise).rejects.toThrow('Operation timed out after 5000ms');
    });

    it('should clean up timeout if promise resolves early', async () => {
      const fastPromise = Promise.resolve('fast');
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      await withTimeout(fastPromise, 5000);

      // Timeout should be cleared
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('should clean up timeout if promise rejects early', async () => {
      const failingPromise = Promise.reject(new Error('Failed'));
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      await expect(withTimeout(failingPromise, 5000)).rejects.toThrow('Failed');

      // Timeout should be cleared
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('should handle zero timeout', async () => {
      const promise = new Promise((resolve) => {
        setTimeout(() => resolve('slow'), 1000);
      });

      const timeoutPromise = withTimeout(promise, 0);

      jest.advanceTimersByTime(0);

      await expect(timeoutPromise).rejects.toThrow(TimeoutError);
    });
  });

  describe('withConcurrencyLimit', () => {
    it('should execute all tasks successfully', async () => {
      const tasks = [
        () => Promise.resolve(1),
        () => Promise.resolve(2),
        () => Promise.resolve(3),
      ];

      const results = await withConcurrencyLimit(tasks, 2);

      expect(results).toEqual([1, 2, 3]);
    });

    it('should respect concurrency limit', async () => {
      const executionOrder: number[] = [];
      const tasks = Array.from({ length: 5 }, (_, i) => () => {
        return new Promise<number>((resolve) => {
          executionOrder.push(i);
          setTimeout(() => resolve(i), 100);
        });
      });

      const resultsPromise = withConcurrencyLimit(tasks, 2);

      // Allow some time for initial tasks to start
      jest.advanceTimersByTime(50);

      // With limit of 2, only first 2 tasks should have started
      expect(executionOrder.length).toBeLessThanOrEqual(2);

      // Fast-forward to complete all tasks
      jest.advanceTimersByTime(500);
      await jest.runAllTimersAsync();

      const results = await resultsPromise;

      expect(results).toEqual([0, 1, 2, 3, 4]);
    });

    it('should handle empty task array', async () => {
      const results = await withConcurrencyLimit([], 5);

      expect(results).toEqual([]);
    });

    it('should throw error if any task fails', async () => {
      jest.useRealTimers(); // Use real timers for this test
      const tasks = [
        () => Promise.resolve(1),
        () => Promise.reject(new Error('Task failed')),
        () => Promise.resolve(3),
      ];

      const resultsPromise = withConcurrencyLimit(tasks, 2);

      await expect(resultsPromise).rejects.toThrow('Failed to execute 1 of 3 tasks');
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          taskIndex: 1,
        }),
        'Task failed in concurrency-limited execution',
      );
      jest.useFakeTimers(); // Restore fake timers
    });

    it('should preserve task order in results', async () => {
      const tasks = Array.from({ length: 5 }, (_, i) => () => {
        return new Promise<number>((resolve) => {
          // Tasks complete in reverse order
          setTimeout(() => resolve(i), (5 - i) * 10);
        });
      });

      const resultsPromise = withConcurrencyLimit(tasks, 2);

      jest.advanceTimersByTime(100);
      await jest.runAllTimersAsync();

      const results = await resultsPromise;

      // Results should be in original task order, not completion order
      expect(results).toEqual([0, 1, 2, 3, 4]);
    });

    it('should use default concurrency limit of 5', async () => {
      const tasks = Array.from({ length: 10 }, (_, i) => () => Promise.resolve(i));

      const results = await withConcurrencyLimit(tasks);

      expect(results).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    it('should handle multiple task failures', async () => {
      jest.useRealTimers(); // Use real timers for this test
      const tasks = [
        () => Promise.resolve(1),
        () => Promise.reject(new Error('Error 1')),
        () => Promise.reject(new Error('Error 2')),
        () => Promise.resolve(4),
      ];

      const resultsPromise = withConcurrencyLimit(tasks, 2);

      await expect(resultsPromise).rejects.toThrow('Failed to execute 2 of 4 tasks');
      jest.useFakeTimers(); // Restore fake timers
    });
  });

  describe('Error handling', () => {
    it('should handle non-Error objects in withRetry', async () => {
      jest.useRealTimers(); // Use real timers for this test
      const fn = jest.fn().mockRejectedValue('string error');

      const retryPromise = withRetry(fn, { attempts: 1, initialDelayMs: 10 });

      await expect(retryPromise).rejects.toBe('string error');
      jest.useFakeTimers(); // Restore fake timers
    });

    it('should handle non-Error objects in withConcurrencyLimit', async () => {
      jest.useRealTimers(); // Use real timers for this test
      const tasks = [() => Promise.reject('string error')];

      const resultsPromise = withConcurrencyLimit(tasks, 1);

      await expect(resultsPromise).rejects.toThrow('Failed to execute 1 of 1 tasks');
      jest.useFakeTimers(); // Restore fake timers
    });
  });

  describe('Composition of utilities', () => {
    it('should compose withRetry and withTimeout', async () => {
      let attemptCount = 0;
      const fn = jest.fn().mockImplementation(async () => {
        attemptCount++;
        if (attemptCount < 2) {
          // First attempt times out
          return new Promise((resolve) => {
            setTimeout(() => resolve('success'), 10000);
          });
        }
        return 'success';
      });

      const composedPromise = withRetry(
        async () => {
          return withTimeout(fn(), 5000);
        },
        { attempts: 2, initialDelayMs: 100 },
      );

      // Fast-forward through timeout and retry
      jest.advanceTimersByTime(5000); // Timeout
      jest.advanceTimersByTime(100); // Retry delay
      await jest.runAllTimersAsync();

      const result = await composedPromise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should compose withConcurrencyLimit with withRetry', async () => {
      let attemptCounts = [0, 0, 0];
      const tasks = [
        jest.fn().mockImplementation(async () => {
          attemptCounts[0]++;
          if (attemptCounts[0] < 2) throw new Error('Error');
          return 1;
        }),
        jest.fn().mockImplementation(async () => {
          attemptCounts[1]++;
          if (attemptCounts[1] < 2) throw new Error('Error');
          return 2;
        }),
        jest.fn().mockResolvedValue(3),
      ];

      const resultsPromise = withConcurrencyLimit(
        tasks.map((task) => () => withRetry(task, { attempts: 2, initialDelayMs: 10 })),
        2,
      );

      await jest.runAllTimersAsync();

      const results = await resultsPromise;

      expect(results).toEqual([1, 2, 3]);
    });
  });

  describe('TypeScript types', () => {
    it('should export RetryOptions interface', () => {
      const options: RetryOptions = {
        attempts: 5,
        initialDelayMs: 1000,
        maxDelayMs: 5000,
        backoffMultiplier: 3,
        shouldRetry: (error) => error instanceof Error,
      };

      expect(options.attempts).toBe(5);
    });

    it('should export AsyncResult type', () => {
      const successResult: AsyncResult<string> = { success: true, value: 'test' };
      const failureResult: AsyncResult<string> = { success: false, error: new Error('test') };

      expect(successResult.success).toBe(true);
      expect(failureResult.success).toBe(false);
    });

    it('should export TimeoutError class', () => {
      const error = new TimeoutError(5000);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(TimeoutError);
      expect(error.name).toBe('TimeoutError');
      expect(error.message).toBe('Operation timed out after 5000ms');
    });
  });
});
