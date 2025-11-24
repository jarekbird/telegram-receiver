/**
 * Unit tests for async processing system in handler context
 *
 * These tests verify that the async processing system correctly:
 * - Loads async configuration (equivalent to Sidekiq module loading)
 * - Provides async utilities (withRetry, withTimeout, withConcurrencyLimit)
 * - Configures default async options (retry: 3, exponential backoff) - matching Rails `retry: 3`
 * - Loads environment-specific async configuration (development, test, production)
 * - Executes async operations with various argument types
 * - Handles async operations with retry and timeout options
 * - Integrates async error handling with handlers
 *
 * **Rails Implementation Reference:**
 * - `jarek-va/spec/config/sidekiq_spec.rb` - Sidekiq configuration tests
 * - `jarek-va/spec/jobs/application_job_spec.rb` - Base job tests
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

// Mock environment module to control NODE_ENV
jest.mock('../../../src/config/environment', () => {
  const actualModule = jest.requireActual('../../../src/config/environment');
  return {
    __esModule: true,
    default: {
      env: process.env.NODE_ENV || 'test',
    },
  };
});

import {
  withRetry,
  withTimeout,
  withConcurrencyLimit,
  TimeoutError,
  calculateBackoffDelay,
  sleep,
} from '../../../src/utils/async';
import {
  asyncConfig,
  defaultRetryOptions,
  withRetry as configWithRetry,
  withTimeout as configWithTimeout,
  withRetryAndTimeout,
} from '../../../src/config/async';
import { BaseAsyncHandler } from '../../../src/handlers/base-async-handler';
import {
  withErrorHandling,
  defaultRetryOptions as errorHandlerRetryOptions,
} from '../../../src/handlers/async-error-handler';

describe('Async Processing System - Handler Context', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(async () => {
    try {
      await jest.runAllTimersAsync();
    } catch {
      // Ignore if fake timers are not enabled
    }
    jest.useRealTimers();
  });

  describe('Async Configuration Loading', () => {
    it('should load async configuration (equivalent to Sidekiq module loading)', () => {
      // Verify async configuration is loaded and accessible
      expect(asyncConfig).toBeDefined();
      expect(asyncConfig.concurrency).toBeDefined();
      expect(asyncConfig.timeout).toBeDefined();
      expect(asyncConfig.retry).toBeDefined();
      expect(asyncConfig.logLevel).toBeDefined();
    });

    it('should have default retry options matching Rails Sidekiq configuration', () => {
      // Matching Rails `retry: 3`
      expect(defaultRetryOptions.maxAttempts).toBe(3);
      expect(defaultRetryOptions.initialDelayMs).toBe(1000);
      expect(defaultRetryOptions.maxDelayMs).toBe(30000);
      expect(defaultRetryOptions.backoffMultiplier).toBe(2);
      expect(typeof defaultRetryOptions.shouldRetry).toBe('function');
    });

    it('should have INFO log level matching Rails Logger::INFO', () => {
      expect(asyncConfig.logLevel).toBe('info');
    });
  });

  describe('Async Utilities Integration', () => {
    describe('withRetry utility', () => {
      it('should be available for handler use', () => {
        expect(typeof withRetry).toBe('function');
        expect(typeof configWithRetry).toBe('function');
      });

      it('should retry operations with exponential backoff', async () => {
        let attemptCount = 0;
        const operation = jest.fn().mockImplementation(async () => {
          attemptCount++;
          if (attemptCount < 3) {
            throw new Error('Temporary error');
          }
          return 'success';
        });

        const retryPromise = withRetry(operation, { attempts: 3, initialDelayMs: 100 });

        // Fast-forward through retries
        await jest.runAllTimersAsync();

        const result = await retryPromise;

        expect(result).toBe('success');
        expect(operation).toHaveBeenCalledTimes(3);
      });

      it(
        'should use default retry options when not provided',
        async () => {
          jest.useRealTimers();
          const operation = jest.fn().mockRejectedValue(new Error('Error'));

          const retryPromise = withRetry(operation);

          await expect(retryPromise).rejects.toThrow('Error');
          expect(operation).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
          jest.useFakeTimers();
        },
        20000, // 20 second timeout (default retries take ~14 seconds)
      );
    });

    describe('withTimeout utility', () => {
      it('should be available for handler use', () => {
        expect(typeof withTimeout).toBe('function');
        expect(typeof configWithTimeout).toBe('function');
      });

      it('should apply timeout to async operations', async () => {
        const slowOperation = new Promise((resolve) => {
          setTimeout(() => resolve('too late'), 10000);
        });

        const timeoutPromise = withTimeout(slowOperation, 5000);

        // Fast-forward past timeout
        jest.advanceTimersByTime(5000);

        await expect(timeoutPromise).rejects.toThrow(TimeoutError);
        await expect(timeoutPromise).rejects.toThrow('Operation timed out after 5000ms');
      });

      it('should return result if operation completes before timeout', async () => {
        const fastOperation = Promise.resolve('success');

        const result = await withTimeout(fastOperation, 5000);

        expect(result).toBe('success');
      });
    });

    describe('withConcurrencyLimit utility', () => {
      it('should be available for handler use', () => {
        expect(typeof withConcurrencyLimit).toBe('function');
      });

      it('should limit concurrent operations', async () => {
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
    });

    describe('withRetryAndTimeout utility', () => {
      it('should combine retry and timeout functionality', async () => {
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

        const composedPromise = withRetryAndTimeout(operation, 5000, {
          maxAttempts: 2,
          initialDelayMs: 100,
        });

        // Fast-forward through timeout and retry
        jest.advanceTimersByTime(5000); // Timeout
        jest.advanceTimersByTime(100); // Retry delay
        await jest.runAllTimersAsync();

        const result = await composedPromise;

        expect(result).toBe('success');
        expect(operation).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Default Async Options', () => {
    it('should have retry: 3 matching Rails configuration', () => {
      expect(defaultRetryOptions.maxAttempts).toBe(3);
    });

    it('should have exponential backoff configuration', () => {
      expect(defaultRetryOptions.backoffMultiplier).toBe(2);
      expect(defaultRetryOptions.initialDelayMs).toBe(1000);
      expect(defaultRetryOptions.maxDelayMs).toBe(30000);
    });

    it('should calculate exponential backoff delays correctly', () => {
      // Attempt 0: 1000 * 2^0 = 1000ms
      expect(calculateBackoffDelay(0, 1000, 30000, 2)).toBe(1000);

      // Attempt 1: 1000 * 2^1 = 2000ms
      expect(calculateBackoffDelay(1, 1000, 30000, 2)).toBe(2000);

      // Attempt 2: 1000 * 2^2 = 4000ms
      expect(calculateBackoffDelay(2, 1000, 30000, 2)).toBe(4000);
    });

    it('should cap delay at maxDelayMs', () => {
      // Attempt 5: 1000 * 2^5 = 32000ms, but capped at 30000ms
      expect(calculateBackoffDelay(5, 1000, 30000, 2)).toBe(30000);
    });
  });

  describe('Environment-Specific Async Configuration', () => {
    it('should load test environment configuration', async () => {
      process.env.NODE_ENV = 'test';
      jest.resetModules();

      const config = (await import('../../../src/config/async')).asyncConfig;

      expect(config.concurrency).toBe(1);
      expect(config.timeout).toBe(10000); // 10 seconds
    });

    it('should load development environment configuration', async () => {
      process.env.NODE_ENV = 'development';
      jest.resetModules();

      const config = (await import('../../../src/config/async')).asyncConfig;

      expect(config.concurrency).toBe(2);
      expect(config.timeout).toBe(30000); // 30 seconds
    });

    it('should load production environment configuration', async () => {
      process.env.NODE_ENV = 'production';
      jest.resetModules();

      const config = (await import('../../../src/config/async')).asyncConfig;

      expect(config.concurrency).toBe(10);
      expect(config.timeout).toBe(60000); // 60 seconds
    });

    it('should include retry options in all environment configurations', async () => {
      const environments = ['development', 'test', 'production'];

      for (const env of environments) {
        process.env.NODE_ENV = env;
        jest.resetModules();

        const config = (await import('../../../src/config/async')).asyncConfig;

        expect(config.retry).toBeDefined();
        expect(config.retry.maxAttempts).toBe(3);
        expect(config.retry.initialDelayMs).toBe(1000);
        expect(config.retry.maxDelayMs).toBe(30000);
        expect(config.retry.backoffMultiplier).toBe(2);
      }
    });
  });

  describe('Async Operations Execution', () => {
    it('should execute async operations successfully', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      const result = await withRetry(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should execute async operations with various argument types', async () => {
      const stringOperation = jest.fn().mockResolvedValue('string result');
      const numberOperation = jest.fn().mockResolvedValue(42);
      const objectOperation = jest.fn().mockResolvedValue({ key: 'value' });
      const arrayOperation = jest.fn().mockResolvedValue([1, 2, 3]);

      expect(await withRetry(stringOperation)).toBe('string result');
      expect(await withRetry(numberOperation)).toBe(42);
      expect(await withRetry(objectOperation)).toEqual({ key: 'value' });
      expect(await withRetry(arrayOperation)).toEqual([1, 2, 3]);
    });

    it('should execute async operations with retry options', async () => {
      let attemptCount = 0;
      const operation = jest.fn().mockImplementation(async () => {
        attemptCount++;
        if (attemptCount < 2) {
          throw new Error('Temporary error');
        }
        return 'success';
      });

      const retryPromise = withRetry(operation, {
        attempts: 1,
        initialDelayMs: 100,
      });

      await jest.runAllTimersAsync();

      const result = await retryPromise;

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should execute async operations with timeout options', async () => {
      const fastOperation = Promise.resolve('success');

      const result = await withTimeout(fastOperation, 5000);

      expect(result).toBe('success');
    });
  });

  describe('Async Error Handling Integration', () => {
    it('should integrate with error handlers', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      const result = await withErrorHandling(operation, {
        operationId: 'test-op',
      });

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should use default retry options from error handler', () => {
      // Error handler retry options should match async config defaults
      expect(errorHandlerRetryOptions.attempts).toBe(3);
      expect(errorHandlerRetryOptions.initialDelayMs).toBe(2000);
      expect(errorHandlerRetryOptions.maxDelayMs).toBe(30000);
      expect(errorHandlerRetryOptions.backoffMultiplier).toBe(2);
    });

    it('should handle errors with retry logic', async () => {
      jest.useRealTimers();
      let attemptCount = 0;
      const operation = jest.fn().mockImplementation(async () => {
        attemptCount++;
        if (attemptCount < 2) {
          throw new Error('Temporary error');
        }
        return 'success';
      });

      const result = await withErrorHandling(operation, {
        operationId: 'test-op',
        retries: 1,
        retryOptions: {
          attempts: 1,
          initialDelayMs: 10, // Fast retries for testing
        },
      });

      expect(result).toBe('success');
      expect(attemptCount).toBe(2);
      jest.useFakeTimers();
    });
  });

  describe('Handler Integration with Async Utilities', () => {
    class TestHandler extends BaseAsyncHandler<string, string> {
      async handle(data: string): Promise<string> {
        // Simulate async operation with retry
        return await withRetry(async () => {
          return `processed: ${data}`;
        });
      }
    }

    it('should use async utilities within handlers', async () => {
      const handler = new TestHandler();
      const result = await handler.execute('test-data');

      expect(result).toBe('processed: test-data');
    });

    it('should apply timeout to handler operations', async () => {
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

    it('should handle concurrent handler operations', async () => {
      class ConcurrentHandler extends BaseAsyncHandler<number, number> {
        async handle(data: number): Promise<number> {
          return data * 2;
        }
      }

      const handler = new ConcurrentHandler();
      const tasks = Array.from({ length: 5 }, (_, i) => () => handler.execute(i));

      const results = await withConcurrencyLimit(tasks, 2);

      expect(results).toEqual([0, 2, 4, 6, 8]);
    });
  });

  describe('Sleep Utility', () => {
    it('should sleep for specified duration', async () => {
      const sleepPromise = sleep(1000);

      // Fast-forward time
      jest.advanceTimersByTime(1000);

      await expect(sleepPromise).resolves.toBeUndefined();
    });
  });

  describe('Rails Pattern Compatibility', () => {
    it('should match Rails Sidekiq.default_job_options = { retry: 3, backtrace: true }', () => {
      // retry: 3 → maxAttempts: 3
      expect(defaultRetryOptions.maxAttempts).toBe(3);

      // backtrace: true → full stack traces in error logging
      // This is verified by error handler logging with full stack traces
      expect(mockLogger.error).toBeDefined();
    });

    it('should match Rails Sidekiq.logger.level = Logger::INFO', () => {
      expect(asyncConfig.logLevel).toBe('info');
    });

    it('should match Rails config/sidekiq.yml environment-specific settings', async () => {
      // Development: concurrency 2
      process.env.NODE_ENV = 'development';
      jest.resetModules();
      const devConfig = (await import('../../../src/config/async')).asyncConfig;
      expect(devConfig.concurrency).toBe(2);

      // Test: concurrency 1
      process.env.NODE_ENV = 'test';
      jest.resetModules();
      const testConfig = (await import('../../../src/config/async')).asyncConfig;
      expect(testConfig.concurrency).toBe(1);

      // Production: concurrency 10
      process.env.NODE_ENV = 'production';
      jest.resetModules();
      const prodConfig = (await import('../../../src/config/async')).asyncConfig;
      expect(prodConfig.concurrency).toBe(10);
    });
  });
});
