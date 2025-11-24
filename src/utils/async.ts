/**
 * Async processing utilities
 *
 * This module provides helper functions for asynchronous operations with proper error handling,
 * retry logic, timeout management, and concurrency control. Since this application doesn't use
 * a queue system, we leverage Node.js's native async capabilities with these utilities.
 *
 * **Rails Implementation Reference:**
 * - `jarek-va/config/initializers/sidekiq.rb` - Sidekiq Redis connection configuration
 *   - Both server and client configurations use the same Redis URL from `REDIS_URL` environment variable
 *   - Defaults to `redis://localhost:6379/0` if `REDIS_URL` is not set
 *   - In Docker: `REDIS_URL` is set to `redis://redis:6379/0` (shared Redis instance)
 *
 * **Features:**
 * - Retry logic with exponential backoff (matching Sidekiq's `wait: :exponentially_longer`)
 * - Timeout handling for async operations
 * - Concurrency control using semaphore pattern
 * - Comprehensive error handling with full stack traces
 * - Configurable retry attempts and delays
 *
 * **Usage:**
 * ```typescript
 * import { withRetry, withTimeout, withConcurrencyLimit } from '@/utils/async';
 *
 * // Retry with exponential backoff
 * const result = await withRetry(() => someAsyncOperation(), { attempts: 3 });
 *
 * // Timeout handling
 * const result = await withTimeout(someAsyncOperation(), 5000);
 *
 * // Concurrency control
 * const results = await withConcurrencyLimit(tasks, 5);
 * ```
 *
 * @module utils/async
 */

import logger from './logger';

/**
 * Retry options for async operations
 * Configures retry behavior including attempts, delays, and error filtering
 */
export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  attempts?: number;
  /** Initial delay in milliseconds before first retry (default: 2000) */
  initialDelayMs?: number;
  /** Maximum delay in milliseconds (default: 30000) */
  maxDelayMs?: number;
  /** Multiplier for exponential backoff (default: 2) */
  backoffMultiplier?: number;
  /** Function to determine if an error should be retried (default: retry all errors) */
  shouldRetry?: (error: unknown) => boolean;
}

/**
 * Result type for async operations
 * Can represent success or failure
 */
export type AsyncResult<T> =
  | { success: true; value: T }
  | { success: false; error: Error };

/**
 * Default retry options matching Rails Sidekiq behavior
 * - 3 retry attempts (matching Sidekiq's `retry: 3`)
 * - Exponential backoff starting at 2000ms (matching Sidekiq's `wait: :exponentially_longer`)
 * - Maximum delay of 30000ms
 */
const DEFAULT_RETRY_OPTIONS: Required<Omit<RetryOptions, 'shouldRetry'>> & {
  shouldRetry: (error: unknown) => boolean;
} = {
  attempts: 3,
  initialDelayMs: 2000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  shouldRetry: () => true, // Retry all errors by default
};

/**
 * Calculate exponential backoff delay
 * Formula: delay = initialDelayMs * (backoffMultiplier ^ attemptNumber)
 * Capped at maxDelayMs
 *
 * @param attemptNumber - Zero-based attempt number (0 = first retry)
 * @param initialDelayMs - Initial delay in milliseconds
 * @param maxDelayMs - Maximum delay in milliseconds
 * @param backoffMultiplier - Multiplier for exponential backoff
 * @returns Calculated delay in milliseconds
 *
 * @example
 * ```typescript
 * // First retry (attempt 0): 2000 * 2^0 = 2000ms
 * calculateBackoffDelay(0, 2000, 30000, 2); // 2000
 *
 * // Second retry (attempt 1): 2000 * 2^1 = 4000ms
 * calculateBackoffDelay(1, 2000, 30000, 2); // 4000
 *
 * // Third retry (attempt 2): 2000 * 2^2 = 8000ms
 * calculateBackoffDelay(2, 2000, 30000, 2); // 8000
 * ```
 */
export function calculateBackoffDelay(
  attemptNumber: number,
  initialDelayMs: number,
  maxDelayMs: number,
  backoffMultiplier: number,
): number {
  const delay = initialDelayMs * Math.pow(backoffMultiplier, attemptNumber);
  return Math.min(delay, maxDelayMs);
}

/**
 * Sleep for specified duration
 * Utility function for implementing delays in async operations
 *
 * @param ms - Duration in milliseconds
 * @returns Promise that resolves after the specified duration
 *
 * @example
 * ```typescript
 * await sleep(1000); // Sleep for 1 second
 * ```
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry an async operation with exponential backoff
 * Implements retry logic matching Rails Sidekiq behavior with exponential backoff
 *
 * @param fn - Async function to retry
 * @param options - Retry configuration options
 * @returns Promise that resolves with the function result or rejects with the last error
 *
 * @example
 * ```typescript
 * // Retry with default options (3 attempts, exponential backoff)
 * const result = await withRetry(() => fetchData());
 *
 * // Retry with custom options
 * const result = await withRetry(() => fetchData(), {
 *   attempts: 5,
 *   initialDelayMs: 1000,
 *   shouldRetry: (error) => error instanceof NetworkError,
 * });
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions,
): Promise<T> {
  const opts = {
    ...DEFAULT_RETRY_OPTIONS,
    ...options,
  };

  let lastError: unknown;
  const maxAttempts = opts.attempts + 1; // +1 for initial attempt

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const result = await fn();
      
      // Log success if this was a retry
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

      // Check if error should be retried
      if (!opts.shouldRetry(error)) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        logger.error(
          {
            err: errorObj,
            attempt: attempt + 1,
            maxAttempts,
          },
          'Async operation failed with non-retryable error',
        );
        throw error;
      }

      // If this was the last attempt, don't wait before throwing
      if (attempt === maxAttempts - 1) {
        logger.error(
          {
            err: error instanceof Error ? error : new Error(String(error)),
            attempt: attempt + 1,
            maxAttempts,
          },
          'Async operation failed after all retry attempts',
        );
        throw error;
      }

      // Calculate delay for next retry
      const delay = calculateBackoffDelay(
        attempt,
        opts.initialDelayMs,
        opts.maxDelayMs,
        opts.backoffMultiplier,
      );

      logger.warn(
        {
          err: error instanceof Error ? error : new Error(String(error)),
          attempt: attempt + 1,
          maxAttempts,
          delayMs: delay,
        },
        'Async operation failed, retrying with exponential backoff',
      );

      // Wait before retrying
      await sleep(delay);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError;
}

/**
 * Timeout error class
 * Thrown when an operation exceeds the specified timeout
 */
export class TimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Operation timed out after ${timeoutMs}ms`);
    this.name = 'TimeoutError';
  }
}

/**
 * Apply timeout to an async operation
 * Wraps a promise with a timeout, throwing TimeoutError if the operation exceeds the timeout
 *
 * @param promise - Promise to apply timeout to
 * @param timeoutMs - Timeout duration in milliseconds
 * @returns Promise that resolves with the original promise result or rejects with TimeoutError
 *
 * @example
 * ```typescript
 * // Apply 5 second timeout
 * const result = await withTimeout(fetchData(), 5000);
 *
 * // Handle timeout error
 * try {
 *   const result = await withTimeout(slowOperation(), 1000);
 * } catch (error) {
 *   if (error instanceof TimeoutError) {
 *     console.log('Operation timed out');
 *   }
 * }
 * ```
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  let timeoutId: NodeJS.Timeout | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new TimeoutError(timeoutMs));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    return result;
  } finally {
    // Clean up timeout if promise resolved/rejected before timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

/**
 * Semaphore implementation for concurrency control
 * Limits the number of concurrent operations
 */
class Semaphore {
  private count: number;
  private waiting: Array<() => void> = [];

  constructor(private limit: number) {
    this.count = limit;
  }

  async acquire(): Promise<void> {
    if (this.count > 0) {
      this.count--;
      return;
    }

    return new Promise<void>((resolve) => {
      this.waiting.push(resolve);
    });
  }

  release(): void {
    if (this.waiting.length > 0) {
      const next = this.waiting.shift();
      if (next) {
        next();
      }
    } else {
      this.count++;
    }
  }
}

/**
 * Process tasks with concurrency limit
 * Executes tasks in parallel while respecting the concurrency limit using a semaphore pattern
 *
 * @param tasks - Array of async functions to execute
 * @param limit - Maximum number of concurrent operations (default: 5)
 * @returns Promise that resolves with array of results in the same order as tasks
 *
 * @example
 * ```typescript
 * // Process 10 tasks with max 3 concurrent operations
 * const tasks = Array.from({ length: 10 }, (_, i) => () => processItem(i));
 * const results = await withConcurrencyLimit(tasks, 3);
 *
 * // Process with default concurrency (5)
 * const results = await withConcurrencyLimit(tasks);
 * ```
 */
export async function withConcurrencyLimit<T>(
  tasks: Array<() => Promise<T>>,
  limit: number = 5,
): Promise<T[]> {
  if (tasks.length === 0) {
    return [];
  }

  const semaphore = new Semaphore(limit);
  const results: T[] = new Array(tasks.length);
  const errors: Array<{ index: number; error: unknown }> = [];

  const executeTask = async (task: () => Promise<T>, index: number): Promise<void> => {
    await semaphore.acquire();
    try {
      const result = await task();
      results[index] = result;
    } catch (error) {
      errors.push({ index, error });
      logger.error(
        {
          err: error instanceof Error ? error : new Error(String(error)),
          taskIndex: index,
        },
        'Task failed in concurrency-limited execution',
      );
    } finally {
      semaphore.release();
    }
  };

  // Execute all tasks
  await Promise.all(tasks.map((task, index) => executeTask(task, index)));

  // If any tasks failed, throw an error with details
  if (errors.length > 0) {
    const errorMessage = `Failed to execute ${errors.length} of ${tasks.length} tasks`;
    const error = new Error(errorMessage);
    (error as Error & { errors: Array<{ index: number; error: unknown }> }).errors = errors;
    throw error;
  }

  return results;
}
