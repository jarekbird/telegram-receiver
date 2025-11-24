/**
 * Async processing configuration
 *
 * This module provides configuration and utilities for async processing patterns.
 * It replaces Rails Sidekiq configuration with Node.js native async/await patterns.
 *
 * **Rails Patterns Replicated:**
 * - `Sidekiq.default_job_options = { retry: 3, backtrace: true }` → Default retry options
 * - `Sidekiq.logger.level = Logger::INFO` → INFO level logging
 * - `config/sidekiq.yml` → Environment-specific concurrency and timeout settings
 * - `config.active_job.queue_adapter = :sidekiq` → Async processing patterns (no queue system needed)
 *
 * **Features:**
 * - Default retry attempts: 3 (matching Rails `retry: 3`)
 * - Exponential backoff retry strategy (matching Sidekiq's `wait: :exponentially_longer`)
 * - Full stack traces in error logging (matching Rails `backtrace: true`)
 * - Environment-specific concurrency limits and timeout settings
 * - Helper functions for retry logic and timeout handling
 * - Promise-based async patterns (no external queue dependencies)
 *
 * @example
 * ```typescript
 * import { withRetry, withTimeout, asyncConfig } from './config/async';
 *
 * // Use retry with default options
 * const result = await withRetry(async () => {
 *   return await someAsyncOperation();
 * });
 *
 * // Use timeout
 * const result = await withTimeout(somePromise, asyncConfig.timeout);
 *
 * // Use both
 * const result = await withRetry(async () => {
 *   return await withTimeout(somePromise, asyncConfig.timeout);
 * });
 * ```
 */

import logger from './logger';
import environment from './environment';

/**
 * Retry options interface
 */
export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts?: number;
  /** Initial delay in milliseconds before first retry (default: 1000) */
  initialDelayMs?: number;
  /** Maximum delay in milliseconds between retries (default: 30000) */
  maxDelayMs?: number;
  /** Multiplier for exponential backoff (default: 2) */
  backoffMultiplier?: number;
  /** Function to determine if an error should be retried (default: retries all errors) */
  shouldRetry?: (error: unknown) => boolean;
}

/**
 * Async processing configuration interface
 */
export interface AsyncConfig {
  /** Maximum number of concurrent async operations */
  concurrency: number;
  /** Timeout in milliseconds for async operations */
  timeout: number;
  /** Default retry options */
  retry: Required<RetryOptions>;
  /** Log level for async operations (INFO level, matching Rails Logger::INFO) */
  logLevel: string;
}

/**
 * Default retry options (matching Rails Sidekiq.default_job_options)
 * - retry: 3 (3 retry attempts)
 * - backtrace: true (full stack traces in error logging)
 */
const defaultRetryOptions: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  shouldRetry: () => true, // Retry all errors by default
};

/**
 * Environment-specific async processing configuration
 * Matches Rails config/sidekiq.yml structure
 */
const environmentConfig: Record<string, Omit<AsyncConfig, 'retry' | 'logLevel'>> = {
  development: {
    concurrency: 2,
    timeout: 30000, // 30 seconds
  },
  test: {
    concurrency: 1,
    timeout: 10000, // 10 seconds
  },
  production: {
    concurrency: 10,
    timeout: 60000, // 60 seconds
  },
};

/**
 * Get environment-specific async configuration
 * Loads settings based on NODE_ENV (matching Rails Rails.env behavior)
 */
function getEnvironmentConfig(): Omit<AsyncConfig, 'retry' | 'logLevel'> {
  const env = environment.env;
  const config = environmentConfig[env] || environmentConfig.development;

  return {
    concurrency: config.concurrency,
    timeout: config.timeout,
  };
}

/**
 * Async processing configuration
 * Combines environment-specific settings with default retry options
 */
const asyncConfig: AsyncConfig = {
  ...getEnvironmentConfig(),
  retry: defaultRetryOptions,
  logLevel: 'info', // INFO level, matching Rails Logger::INFO
};

/**
 * Calculate exponential backoff delay
 * Matches Sidekiq's `wait: :exponentially_longer` behavior
 *
 * @param attempt - Current retry attempt (0-indexed)
 * @param initialDelayMs - Initial delay in milliseconds
 * @param maxDelayMs - Maximum delay in milliseconds
 * @param backoffMultiplier - Multiplier for exponential backoff
 * @returns Delay in milliseconds
 */
function calculateBackoffDelay(
  attempt: number,
  initialDelayMs: number,
  maxDelayMs: number,
  backoffMultiplier: number,
): number {
  const delay = initialDelayMs * Math.pow(backoffMultiplier, attempt);
  return Math.min(delay, maxDelayMs);
}

/**
 * Sleep utility for delays
 *
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after the delay
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute a function with retry logic and exponential backoff
 * Matches Rails Sidekiq retry behavior with exponential backoff
 *
 * @param fn - Async function to execute
 * @param options - Retry options (optional, uses defaults if not provided)
 * @returns Promise that resolves with the function result
 * @throws The last error if all retries are exhausted
 *
 * @example
 * ```typescript
 * const result = await withRetry(async () => {
 *   return await fetchData();
 * });
 *
 * // Custom retry options
 * const result = await withRetry(async () => {
 *   return await fetchData();
 * }, {
 *   maxAttempts: 5,
 *   initialDelayMs: 2000,
 * });
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions,
): Promise<T> {
  const retryOptions: Required<RetryOptions> = {
    maxAttempts: options?.maxAttempts ?? defaultRetryOptions.maxAttempts,
    initialDelayMs: options?.initialDelayMs ?? defaultRetryOptions.initialDelayMs,
    maxDelayMs: options?.maxDelayMs ?? defaultRetryOptions.maxDelayMs,
    backoffMultiplier: options?.backoffMultiplier ?? defaultRetryOptions.backoffMultiplier,
    shouldRetry: options?.shouldRetry ?? defaultRetryOptions.shouldRetry,
  };

  let lastError: unknown;
  const maxAttempts = retryOptions.maxAttempts + 1; // +1 for initial attempt

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const result = await fn();
      if (attempt > 0) {
        logger.info(
          {
            attempt: attempt + 1,
            maxAttempts,
          },
          'Async operation succeeded after retry',
        );
      }
      return result;
    } catch (error) {
      lastError = error;

      // Check if we should retry this error
      if (!retryOptions.shouldRetry(error)) {
        logger.error(
          {
            err: error,
            attempt: attempt + 1,
            maxAttempts,
          },
          'Async operation failed with non-retryable error',
        );
        throw error;
      }

      // If this was the last attempt, don't wait
      if (attempt === maxAttempts - 1) {
        logger.error(
          {
            err: error,
            attempt: attempt + 1,
            maxAttempts,
            exhausted: true,
          },
          'Async operation failed after all retry attempts exhausted',
        );
        break;
      }

      // Calculate backoff delay
      const delay = calculateBackoffDelay(
        attempt,
        retryOptions.initialDelayMs,
        retryOptions.maxDelayMs,
        retryOptions.backoffMultiplier,
      );

      logger.warn(
        {
          err: error,
          attempt: attempt + 1,
          maxAttempts,
          delayMs: delay,
          nextAttempt: attempt + 2,
        },
        'Async operation failed, retrying with exponential backoff',
      );

      // Wait before retrying
      await sleep(delay);
    }
  }

  // All retries exhausted, throw the last error
  throw lastError;
}

/**
 * Execute a promise with a timeout
 *
 * @param promise - Promise to execute
 * @param timeoutMs - Timeout in milliseconds
 * @returns Promise that resolves with the result or rejects with timeout error
 *
 * @example
 * ```typescript
 * const result = await withTimeout(fetchData(), 5000);
 * ```
 */
export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    }),
  ]);
}

/**
 * Execute a function with retry and timeout
 * Combines withRetry and withTimeout for convenience
 *
 * @param fn - Async function to execute
 * @param timeoutMs - Timeout in milliseconds (optional, uses asyncConfig.timeout if not provided)
 * @param retryOptions - Retry options (optional, uses defaults if not provided)
 * @returns Promise that resolves with the function result
 *
 * @example
 * ```typescript
 * const result = await withRetryAndTimeout(async () => {
 *   return await fetchData();
 * });
 * ```
 */
export async function withRetryAndTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs?: number,
  retryOptions?: RetryOptions,
): Promise<T> {
  const timeout = timeoutMs ?? asyncConfig.timeout;
  return withRetry(
    async () => {
      return withTimeout(fn(), timeout);
    },
    retryOptions,
  );
}

/**
 * Error handling utility for async operations
 * Logs errors with full stack traces (matching Rails `backtrace: true`)
 *
 * @param error - Error to handle
 * @param context - Additional context for logging
 */
export function handleAsyncError(error: unknown, context?: Record<string, unknown>): void {
  logger.error(
    {
      err: error,
      ...context,
    },
    'Async operation error',
  );
}

/**
 * Default async processing configuration
 * Exported for use by async handlers
 */
export default asyncConfig;

/**
 * Export all configuration and utilities
 */
export { asyncConfig, defaultRetryOptions, calculateBackoffDelay, sleep };
