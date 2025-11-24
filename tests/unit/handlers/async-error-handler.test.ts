/**
 * Unit tests for async error handler (src/handlers/async-error-handler.ts)
 *
 * These tests verify that the async error handler correctly:
 * - Wraps async operations with error handling and retry logic
 * - Implements retry configuration matching Rails Sidekiq behavior (3 attempts, exponential backoff)
 * - Logs errors with full stack traces (matching Rails `backtrace: true`)
 * - Handles operation failures after all retries are exhausted
 * - Classifies errors as retryable vs non-retryable
 * - Handles timeout errors appropriately
 * - Provides comprehensive logging for all async events
 * - Never throws errors from error handlers (prevents cascading failures)
 *
 * This is part of PHASE2-016 task to add async error handling.
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

// Mock the async utilities
const mockWithRetry = jest.fn();
jest.mock('../../../src/utils/async', () => {
  return {
    __esModule: true,
    withRetry: (...args: unknown[]) => mockWithRetry(...args),
    TimeoutError: class TimeoutError extends Error {
      constructor(timeoutMs: number) {
        super(`Operation timed out after ${timeoutMs}ms`);
        this.name = 'TimeoutError';
      }
    },
  };
});

import {
  withErrorHandling,
  wrapHandlerWithErrorHandling,
  defaultRetryOptions,
  isRetryableError,
  isTimeoutError,
  getFailedOperations,
  clearFailedOperations,
  type ErrorHandlerOptions,
  type OperationFailure,
} from '../../../src/handlers/async-error-handler';
import { DeserializationError } from '../../../src/handlers/base-async-handler';
import { TimeoutError } from '../../../src/utils/async';

describe('async-error-handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearFailedOperations();
    mockWithRetry.mockImplementation(async (fn: () => Promise<unknown>) => fn());
  });

  describe('withErrorHandling', () => {
    it('should execute operation successfully', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      const result = await withErrorHandling(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
      expect(mockWithRetry).toHaveBeenCalledTimes(1);
    });

    it('should log operation start', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      await withErrorHandling(operation, { operationId: 'test-op' });

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          operationId: 'test-op',
          retries: 3,
        }),
        'Starting async operation: test-op',
      );
    });

    it('should generate operation ID if not provided', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      await withErrorHandling(operation);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          operationId: expect.stringMatching(/^op-\d+-[a-z0-9]+$/),
        }),
        expect.stringMatching(/^Starting async operation: op-\d+-[a-z0-9]+$/),
      );
    });

    it('should use default retry options (3 attempts)', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      await withErrorHandling(operation);

      expect(mockWithRetry).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          attempts: 3,
          initialDelayMs: 2000,
          maxDelayMs: 30000,
          backoffMultiplier: 2,
        }),
      );
    });

    it('should allow custom retry configuration', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      await withErrorHandling(operation, {
        retries: 5,
        retryOptions: {
          attempts: 5,
          initialDelayMs: 1000,
        },
      });

      expect(mockWithRetry).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          attempts: 5,
          initialDelayMs: 1000,
        }),
      );
    });

    it('should log operation completion when enabled', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      await withErrorHandling(operation, {
        operationId: 'test-op',
        logCompletion: true,
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          operationId: 'test-op',
        }),
        'Completed async operation: test-op',
      );
    });

    it('should not log operation completion by default', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      await withErrorHandling(operation, {
        operationId: 'test-op',
      });

      const completionLog = mockLogger.info.mock.calls.find(
        (call) => call[1] === 'Completed async operation: test-op',
      );
      expect(completionLog).toBeUndefined();
    });

    it('should include context in logs', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      await withErrorHandling(operation, {
        operationId: 'test-op',
        context: { userId: 123, action: 'test' },
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          operationId: 'test-op',
          userId: 123,
          action: 'test',
        }),
        'Starting async operation: test-op',
      );
    });
  });

  describe('Error handling and logging', () => {
    it('should log errors with full stack trace', async () => {
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.js:1:1';
      const operation = jest.fn().mockRejectedValue(error);
      mockWithRetry.mockRejectedValueOnce(error);

      try {
        await withErrorHandling(operation, { operationId: 'test-op' });
      } catch {
        // Expected to throw
      }

      // Should log error class name and message
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          operationId: 'test-op',
          errorClassName: 'Error',
          errorMessage: 'Test error',
        }),
        'Error in async operation (test-op): Error: Test error',
      );

      // Should log stack trace
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          operationId: 'test-op',
          stackTrace: 'Error: Test error\n    at test.js:1:1',
        }),
        'Stack trace for operation (test-op)',
      );
    });

    it('should log error even without stack trace', async () => {
      const error = new Error('Test error');
      error.stack = undefined;
      const operation = jest.fn().mockRejectedValue(error);
      mockWithRetry.mockRejectedValueOnce(error);

      try {
        await withErrorHandling(operation, { operationId: 'test-op' });
      } catch {
        // Expected to throw
      }

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          operationId: 'test-op',
        }),
        'No stack trace available for operation (test-op)',
      );
    });

    it('should handle operation failure after all retries', async () => {
      const error = new Error('Final error');
      const operation = jest.fn().mockRejectedValue(error);
      mockWithRetry.mockRejectedValueOnce(error);

      try {
        await withErrorHandling(operation, { operationId: 'test-op', retries: 2 });
      } catch {
        // Expected to throw
      }

      // Should log operation failure
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          operationId: 'test-op',
          attempts: 3, // 1 initial + 2 retries
          errorClassName: 'Error',
          errorMessage: 'Final error',
        }),
        'Operation failed after 3 attempts (test-op)',
      );

      // Should log stack trace for failed operation
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          operationId: 'test-op',
          attempts: 3,
        }),
        'Stack trace for failed operation (test-op)',
      );
    });

    it('should store failed operations', async () => {
      const error = new Error('Final error');
      const operation = jest.fn().mockRejectedValue(error);
      mockWithRetry.mockRejectedValueOnce(error);

      try {
        await withErrorHandling(operation, {
          operationId: 'test-op',
          retries: 2,
          context: { userId: 123 },
        });
      } catch {
        // Expected to throw
      }

      const failedOps = getFailedOperations();
      expect(failedOps.length).toBe(1);
      expect(failedOps[0].operationId).toBe('test-op');
      expect(failedOps[0].error).toBe(error);
      expect(failedOps[0].attempts).toBe(3);
      expect(failedOps[0].context).toEqual({ userId: 123 });
    });

    it('should limit stored failed operations', async () => {
      // Create more than MAX_FAILED_OPERATIONS failures
      for (let i = 0; i < 105; i++) {
        const error = new Error(`Error ${i}`);
        const operation = jest.fn().mockRejectedValue(error);
        mockWithRetry.mockRejectedValueOnce(error);

        try {
          await withErrorHandling(operation, { operationId: `op-${i}`, retries: 0 });
        } catch {
          // Expected to throw
        }
      }

      const failedOps = getFailedOperations();
      expect(failedOps.length).toBeLessThanOrEqual(100);
    });

    it('should never throw errors from error handlers', async () => {
      // Mock logger.error to throw an error on first call (simulating handler failure in error logging)
      mockLogger.error.mockImplementationOnce(() => {
        throw new Error('Handler error');
      });

      const error = new Error('Operation error');
      const operation = jest.fn().mockRejectedValue(error);
      mockWithRetry.mockRejectedValueOnce(error);

      // Should not throw the handler error (prevent cascading failures)
      await expect(
        withErrorHandling(operation, { operationId: 'test-op', retries: 0 }),
      ).rejects.toThrow('Operation error');

      // Should log the handler error from error logging catch block
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          originalOperationId: 'test-op',
          logError: 'Handler error',
        }),
        'Error in error logging (prevented cascading failure)',
      );
    });
  });

  describe('Timeout error handling', () => {
    it('should detect timeout errors', () => {
      const timeoutError = new TimeoutError(5000);
      expect(isTimeoutError(timeoutError)).toBe(true);
    });

    it('should not detect non-timeout errors as timeout', () => {
      const regularError = new Error('Regular error');
      expect(isTimeoutError(regularError)).toBe(false);
    });

    it('should log timeout errors with warning', async () => {
      const timeoutError = new TimeoutError(5000);
      const operation = jest.fn().mockRejectedValue(timeoutError);
      mockWithRetry.mockRejectedValueOnce(timeoutError);

      try {
        await withErrorHandling(operation, { operationId: 'test-op' });
      } catch {
        // Expected to throw
      }

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          operationId: 'test-op',
        }),
        'Timeout error in operation: test-op',
      );
    });
  });

  describe('Error classification', () => {
    it('should classify DeserializationError as non-retryable', () => {
      const error = new DeserializationError('Invalid data');
      expect(isRetryableError(error)).toBe(false);
    });

    it('should classify TimeoutError as retryable', () => {
      const error = new TimeoutError(5000);
      expect(isRetryableError(error)).toBe(true);
    });

    it('should classify standard errors as retryable', () => {
      const error = new Error('Standard error');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should use error classification in retry options', async () => {
      const deserializationError = new DeserializationError('Invalid data');
      const operation = jest.fn().mockRejectedValue(deserializationError);
      mockWithRetry.mockRejectedValueOnce(deserializationError);

      try {
        await withErrorHandling(operation, { operationId: 'test-op' });
      } catch {
        // Expected to throw
      }

      // Should have called withRetry with shouldRetry function
      expect(mockWithRetry).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          shouldRetry: expect.any(Function),
        }),
      );

      // shouldRetry should return false for DeserializationError
      const retryOptions = mockWithRetry.mock.calls[0][1];
      expect(retryOptions.shouldRetry(deserializationError)).toBe(false);
    });
  });

  describe('wrapHandlerWithErrorHandling', () => {
    it('should wrap handler function with error handling', async () => {
      const handlerFn = jest.fn().mockResolvedValue('result');
      const wrapped = wrapHandlerWithErrorHandling(handlerFn, 'test-handler');

      const result = await wrapped('test-data');

      expect(result).toBe('result');
      expect(handlerFn).toHaveBeenCalledWith('test-data');
      expect(mockWithRetry).toHaveBeenCalled();
    });

    it('should include handler name in context', async () => {
      const handlerFn = jest.fn().mockResolvedValue('result');
      const wrapped = wrapHandlerWithErrorHandling(handlerFn, 'test-handler');

      await wrapped('test-data');

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          handlerName: 'test-handler',
        }),
        expect.stringMatching(/^Starting async operation: test-handler-/),
      );
    });

    it('should use custom operation ID if provided', async () => {
      const handlerFn = jest.fn().mockResolvedValue('result');
      const wrapped = wrapHandlerWithErrorHandling(handlerFn, 'test-handler', {
        operationId: 'custom-op-id',
      });

      await wrapped('test-data');

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          handlerName: 'test-handler',
          operationId: 'custom-op-id',
        }),
        'Starting async operation: custom-op-id',
      );
    });

    it('should merge custom context with handler name', async () => {
      const handlerFn = jest.fn().mockResolvedValue('result');
      const wrapped = wrapHandlerWithErrorHandling(handlerFn, 'test-handler', {
        context: { userId: 123 },
      });

      await wrapped('test-data');

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          handlerName: 'test-handler',
          userId: 123,
        }),
        expect.any(String),
      );
    });

    it('should handle errors in wrapped handler', async () => {
      const error = new Error('Handler error');
      const handlerFn = jest.fn().mockRejectedValue(error);
      const wrapped = wrapHandlerWithErrorHandling(handlerFn, 'test-handler');
      mockWithRetry.mockRejectedValueOnce(error);

      await expect(wrapped('test-data')).rejects.toThrow('Handler error');

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('defaultRetryOptions', () => {
    it('should match Rails Sidekiq behavior (3 attempts)', () => {
      expect(defaultRetryOptions.attempts).toBe(3);
    });

    it('should use exponential backoff (2000ms initial delay)', () => {
      expect(defaultRetryOptions.initialDelayMs).toBe(2000);
      expect(defaultRetryOptions.maxDelayMs).toBe(30000);
      expect(defaultRetryOptions.backoffMultiplier).toBe(2);
    });

    it('should not retry DeserializationError', () => {
      const error = new DeserializationError('Invalid data');
      expect(defaultRetryOptions.shouldRetry?.(error)).toBe(false);
    });

    it('should retry standard errors', () => {
      const error = new Error('Standard error');
      expect(defaultRetryOptions.shouldRetry?.(error)).toBe(true);
    });

    it('should retry TimeoutError', () => {
      const error = new TimeoutError(5000);
      expect(defaultRetryOptions.shouldRetry?.(error)).toBe(true);
    });
  });

  describe('Failed operations management', () => {
    it('should return empty array when no failures', () => {
      const failedOps = getFailedOperations();
      expect(failedOps).toEqual([]);
    });

    it('should return stored failed operations', async () => {
      const error = new Error('Test error');
      const operation = jest.fn().mockRejectedValue(error);
      mockWithRetry.mockRejectedValueOnce(error);

      try {
        await withErrorHandling(operation, { operationId: 'test-op', retries: 0 });
      } catch {
        // Expected to throw
      }

      const failedOps = getFailedOperations();
      expect(failedOps.length).toBe(1);
      expect(failedOps[0].operationId).toBe('test-op');
    });

    it('should clear failed operations', async () => {
      const error = new Error('Test error');
      const operation = jest.fn().mockRejectedValue(error);
      mockWithRetry.mockRejectedValueOnce(error);

      try {
        await withErrorHandling(operation, { operationId: 'test-op', retries: 0 });
      } catch {
        // Expected to throw
      }

      expect(getFailedOperations().length).toBe(1);

      clearFailedOperations();

      expect(getFailedOperations().length).toBe(0);
    });
  });

  describe('TypeScript types and exports', () => {
    it('should export ErrorHandlerOptions interface', () => {
      const options: ErrorHandlerOptions = {
        operationId: 'test-op',
        retries: 5,
        logCompletion: true,
        context: { userId: 123 },
      };

      expect(options.operationId).toBe('test-op');
      expect(options.retries).toBe(5);
      expect(options.logCompletion).toBe(true);
      expect(options.context).toEqual({ userId: 123 });
    });

    it('should export OperationFailure interface', () => {
      const failure: OperationFailure = {
        operationId: 'test-op',
        error: new Error('Test error'),
        attempts: 3,
        timestamp: new Date(),
        context: { userId: 123 },
      };

      expect(failure.operationId).toBe('test-op');
      expect(failure.error).toBeInstanceOf(Error);
      expect(failure.attempts).toBe(3);
      expect(failure.timestamp).toBeInstanceOf(Date);
      expect(failure.context).toEqual({ userId: 123 });
    });

    it('should export utility functions', () => {
      expect(typeof withErrorHandling).toBe('function');
      expect(typeof wrapHandlerWithErrorHandling).toBe('function');
      expect(typeof isRetryableError).toBe('function');
      expect(typeof isTimeoutError).toBe('function');
      expect(typeof getFailedOperations).toBe('function');
      expect(typeof clearFailedOperations).toBe('function');
    });
  });

  describe('Integration with retry logic', () => {
    it('should propagate errors after retries exhausted', async () => {
      const error = new Error('Final error');
      const operation = jest.fn().mockRejectedValue(error);
      mockWithRetry.mockRejectedValueOnce(error);

      await expect(
        withErrorHandling(operation, { operationId: 'test-op', retries: 2 }),
      ).rejects.toThrow('Final error');
    });

    it('should return result after successful retry', async () => {
      let attemptCount = 0;
      const operation = jest.fn().mockImplementation(async () => {
        attemptCount++;
        if (attemptCount < 2) {
          throw new Error('Temporary error');
        }
        return 'success';
      });

      // Mock withRetry to actually retry
      mockWithRetry.mockImplementation(async (fn: () => Promise<unknown>) => {
        try {
          return await fn();
        } catch (err) {
          // Retry once
          return await fn();
        }
      });

      const result = await withErrorHandling(operation, { operationId: 'test-op' });

      expect(result).toBe('success');
    });
  });
});
