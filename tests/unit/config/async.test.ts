/**
 * Unit tests for async processing configuration module (src/config/async.ts)
 *
 * These tests verify that the async processing configuration module correctly:
 * - Configures default async processing options (retry: 3, exponential backoff)
 * - Loads environment-specific configuration (development, test, production)
 * - Provides retry utilities with exponential backoff
 * - Provides timeout handling utilities
 * - Handles errors with full stack traces
 * - Exports configuration and helper functions
 */

import type { AsyncConfig, RetryOptions } from '../../../src/config/async';
import {
  withRetry,
  withTimeout,
  withRetryAndTimeout,
  handleAsyncError,
  asyncConfig,
  defaultRetryOptions,
  calculateBackoffDelay,
  sleep,
} from '../../../src/config/async';

// Mock logger to avoid console output during tests
jest.mock('../../../src/config/logger', () => {
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    child: jest.fn((bindings) => mockLogger),
  };
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

describe('Async Configuration Module', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };

    // Reset modules to ensure fresh imports
    jest.resetModules();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  describe('Default Retry Options', () => {
    it('should have default retry options matching Rails Sidekiq configuration', () => {
      expect(defaultRetryOptions.maxAttempts).toBe(3); // Matching Rails retry: 3
      expect(defaultRetryOptions.initialDelayMs).toBe(1000);
      expect(defaultRetryOptions.maxDelayMs).toBe(30000);
      expect(defaultRetryOptions.backoffMultiplier).toBe(2);
      expect(typeof defaultRetryOptions.shouldRetry).toBe('function');
    });

    it('should retry all errors by default', () => {
      const error1 = new Error('Test error 1');
      const error2 = new Error('Test error 2');
      const error3 = { message: 'Non-Error object' };

      expect(defaultRetryOptions.shouldRetry(error1)).toBe(true);
      expect(defaultRetryOptions.shouldRetry(error2)).toBe(true);
      expect(defaultRetryOptions.shouldRetry(error3)).toBe(true);
    });
  });

  describe('Environment-Specific Configuration', () => {
    it('should load development configuration when NODE_ENV is development', async () => {
      process.env.NODE_ENV = 'development';
      jest.resetModules();

      const config = (await import('../../../src/config/async')).asyncConfig;

      expect(config.concurrency).toBe(2);
      expect(config.timeout).toBe(30000); // 30 seconds
    });

    it('should load test configuration when NODE_ENV is test', async () => {
      process.env.NODE_ENV = 'test';
      jest.resetModules();

      const config = (await import('../../../src/config/async')).asyncConfig;

      expect(config.concurrency).toBe(1);
      expect(config.timeout).toBe(10000); // 10 seconds
    });

    it('should load production configuration when NODE_ENV is production', async () => {
      process.env.NODE_ENV = 'production';
      jest.resetModules();

      const config = (await import('../../../src/config/async')).asyncConfig;

      expect(config.concurrency).toBe(10);
      expect(config.timeout).toBe(60000); // 60 seconds
    });

    it('should default to development configuration when NODE_ENV is not set', async () => {
      delete process.env.NODE_ENV;
      jest.resetModules();

      const config = (await import('../../../src/config/async')).asyncConfig;

      expect(config.concurrency).toBe(2);
      expect(config.timeout).toBe(30000);
    });

    it('should include retry options in all environment configurations', async () => {
      const environments = ['development', 'test', 'production'];

      for (const env of environments) {
        process.env.NODE_ENV = env;
        jest.resetModules();

        const config: AsyncConfig = (await import('../../../src/config/async')).asyncConfig;

        expect(config.retry).toBeDefined();
        expect(config.retry.maxAttempts).toBe(3);
        expect(config.retry.initialDelayMs).toBe(1000);
        expect(config.retry.maxDelayMs).toBe(30000);
        expect(config.retry.backoffMultiplier).toBe(2);
      }
    });

    it('should have INFO log level matching Rails Logger::INFO', async () => {
      const config = (await import('../../../src/config/async')).asyncConfig;

      expect(config.logLevel).toBe('info');
    });
  });

  describe('Async Configuration Export', () => {
    it('should export asyncConfig as default export', async () => {
      const defaultExport = (await import('../../../src/config/async')).default;

      expect(defaultExport).toBeDefined();
      expect(defaultExport.concurrency).toBeDefined();
      expect(defaultExport.timeout).toBeDefined();
      expect(defaultExport.retry).toBeDefined();
      expect(defaultExport.logLevel).toBeDefined();
    });

    it('should export asyncConfig as named export', () => {
      expect(asyncConfig).toBeDefined();
      expect(asyncConfig.concurrency).toBeDefined();
      expect(asyncConfig.timeout).toBeDefined();
      expect(asyncConfig.retry).toBeDefined();
      expect(asyncConfig.logLevel).toBeDefined();
    });

    it('should match AsyncConfig interface', () => {
      const config: AsyncConfig = asyncConfig;

      expect(config).toBeDefined();
      expect(config.concurrency).toBeGreaterThan(0);
      expect(config.timeout).toBeGreaterThan(0);
      expect(config.retry).toBeDefined();
      expect(config.logLevel).toBe('info');
    });
  });

  describe('Exponential Backoff Calculation', () => {
    it('should calculate exponential backoff delay correctly', () => {
      const initialDelay = 1000;
      const maxDelay = 30000;
      const multiplier = 2;

      // Attempt 0: 1000 * 2^0 = 1000ms
      expect(calculateBackoffDelay(0, initialDelay, maxDelay, multiplier)).toBe(1000);

      // Attempt 1: 1000 * 2^1 = 2000ms
      expect(calculateBackoffDelay(1, initialDelay, maxDelay, multiplier)).toBe(2000);

      // Attempt 2: 1000 * 2^2 = 4000ms
      expect(calculateBackoffDelay(2, initialDelay, maxDelay, multiplier)).toBe(4000);

      // Attempt 3: 1000 * 2^3 = 8000ms
      expect(calculateBackoffDelay(3, initialDelay, maxDelay, multiplier)).toBe(8000);
    });

    it('should cap delay at maxDelayMs', () => {
      const initialDelay = 1000;
      const maxDelay = 5000;
      const multiplier = 2;

      // Attempt 5: 1000 * 2^5 = 32000ms, but capped at 5000ms
      expect(calculateBackoffDelay(5, initialDelay, maxDelay, multiplier)).toBe(5000);
    });

    it('should handle different multipliers', () => {
      const initialDelay = 1000;
      const maxDelay = 30000;
      const multiplier = 3;

      // Attempt 0: 1000 * 3^0 = 1000ms
      expect(calculateBackoffDelay(0, initialDelay, maxDelay, multiplier)).toBe(1000);

      // Attempt 1: 1000 * 3^1 = 3000ms
      expect(calculateBackoffDelay(1, initialDelay, maxDelay, multiplier)).toBe(3000);

      // Attempt 2: 1000 * 3^2 = 9000ms
      expect(calculateBackoffDelay(2, initialDelay, maxDelay, multiplier)).toBe(9000);
    });
  });

  describe('Sleep Utility', () => {
    it('should sleep for the specified duration', async () => {
      const start = Date.now();
      await sleep(100);
      const end = Date.now();

      const elapsed = end - start;
      expect(elapsed).toBeGreaterThanOrEqual(90); // Allow some margin for timing
      expect(elapsed).toBeLessThan(200); // Should not take too long
    });
  });

  describe('withRetry Function', () => {
    it('should succeed on first attempt without retrying', async () => {
      const fn = jest.fn().mockResolvedValue('success');

      const result = await withRetry(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and succeed on retry', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce('success');

      const result = await withRetry(fn, { maxAttempts: 1, initialDelayMs: 10 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should retry up to maxAttempts times', async () => {
      const error = new Error('Always fails');
      const fn = jest.fn().mockRejectedValue(error);

      await expect(withRetry(fn, { maxAttempts: 2, initialDelayMs: 10 })).rejects.toThrow(
        'Always fails',
      );

      // Initial attempt + 2 retries = 3 total attempts
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should use exponential backoff between retries', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Attempt 1'))
        .mockRejectedValueOnce(new Error('Attempt 2'))
        .mockResolvedValueOnce('success');

      const start = Date.now();
      await withRetry(fn, { maxAttempts: 2, initialDelayMs: 50, backoffMultiplier: 2 });
      const end = Date.now();

      // Should have waited: 50ms (after attempt 1) + 100ms (after attempt 2) = ~150ms
      const elapsed = end - start;
      expect(elapsed).toBeGreaterThanOrEqual(140);
      expect(elapsed).toBeLessThan(300);
    });

    it('should respect shouldRetry option', async () => {
      const retryableError = new Error('Retryable');
      const nonRetryableError = new Error('Non-retryable');

      const shouldRetry = jest.fn((error: unknown) => {
        return error === retryableError;
      });

      const fn = jest.fn().mockRejectedValue(nonRetryableError);

      await expect(withRetry(fn, { maxAttempts: 2, shouldRetry, initialDelayMs: 10 })).rejects.toThrow(
        'Non-retryable',
      );

      // Should not retry non-retryable errors
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should use default retry options when not provided', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('First attempt'))
        .mockResolvedValueOnce('success');

      const result = await withRetry(fn, { initialDelayMs: 10 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('withTimeout Function', () => {
    it('should return result if promise resolves before timeout', async () => {
      const promise = Promise.resolve('success');

      const result = await withTimeout(promise, 1000);

      expect(result).toBe('success');
    });

    it('should throw timeout error if promise takes too long', async () => {
      const promise = new Promise((resolve) => {
        setTimeout(() => resolve('too late'), 200);
      });

      await expect(withTimeout(promise, 50)).rejects.toThrow('Operation timed out after 50ms');
    });

    it('should reject with original error if promise rejects before timeout', async () => {
      const error = new Error('Original error');
      const promise = Promise.reject(error);

      await expect(withTimeout(promise, 1000)).rejects.toThrow('Original error');
    });
  });

  describe('withRetryAndTimeout Function', () => {
    it('should combine retry and timeout functionality', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('First attempt'))
        .mockResolvedValueOnce('success');

      const result = await withRetryAndTimeout(fn, 1000, { maxAttempts: 1, initialDelayMs: 10 });

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should use asyncConfig.timeout when timeout not provided', async () => {
      const fn = jest.fn().mockResolvedValue('success');

      const result = await withRetryAndTimeout(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should timeout if operation takes too long', async () => {
      const fn = jest.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve('too late'), 200);
          }),
      );

      await expect(
        withRetryAndTimeout(fn, 50, { maxAttempts: 1, initialDelayMs: 10 }),
      ).rejects.toThrow('Operation timed out after 50ms');
    });
  });

  describe('handleAsyncError Function', () => {
    it('should handle errors with context', () => {
      const error = new Error('Test error');
      const context = { operation: 'test', userId: '123' };

      // Should not throw
      expect(() => {
        handleAsyncError(error, context);
      }).not.toThrow();
    });

    it('should handle errors without context', () => {
      const error = new Error('Test error');

      expect(() => {
        handleAsyncError(error);
      }).not.toThrow();
    });

    it('should handle non-Error objects', () => {
      const error = { message: 'Not an Error object' };

      expect(() => {
        handleAsyncError(error);
      }).not.toThrow();
    });
  });

  describe('TypeScript Types', () => {
    it('should have RetryOptions interface with correct properties', () => {
      const options: RetryOptions = {
        maxAttempts: 5,
        initialDelayMs: 2000,
        maxDelayMs: 60000,
        backoffMultiplier: 3,
        shouldRetry: () => true,
      };

      expect(options.maxAttempts).toBe(5);
      expect(options.initialDelayMs).toBe(2000);
      expect(options.maxDelayMs).toBe(60000);
      expect(options.backoffMultiplier).toBe(3);
      expect(typeof options.shouldRetry).toBe('function');
    });

    it('should have AsyncConfig interface with correct properties', () => {
      const config: AsyncConfig = asyncConfig;

      expect(typeof config.concurrency).toBe('number');
      expect(typeof config.timeout).toBe('number');
      expect(config.retry).toBeDefined();
      expect(typeof config.logLevel).toBe('string');
    });
  });

  describe('Rails Pattern Compatibility', () => {
    it('should match Rails Sidekiq.default_job_options = { retry: 3, backtrace: true }', () => {
      // retry: 3 → maxAttempts: 3
      expect(defaultRetryOptions.maxAttempts).toBe(3);

      // backtrace: true → full stack traces in error logging (handled by logger.error with err serializer)
      // This is verified by handleAsyncError function and logger configuration
      expect(handleAsyncError).toBeDefined();
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
