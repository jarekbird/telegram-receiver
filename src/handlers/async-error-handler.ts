/**
 * Async error handling utilities for TypeScript/Node.js
 *
 * This module provides centralized error handling for async operations, converting the error handling
 * patterns from Rails Sidekiq to TypeScript/Node.js. It includes error handling utilities, retry logic
 * configuration, operation failure handling, and comprehensive logging of async events.
 *
 * **Rails Implementation Reference:**
 * - `jarek-va/config/initializers/sidekiq.rb` - Sidekiq error handling configuration:
 *   - Line 34-37: `Sidekiq.default_job_options = { retry: 3, backtrace: true }` - Default retry 3 times with backtraces
 *   - Line 31: `Sidekiq.logger.level = Logger::INFO` - Logging level configuration
 * - `jarek-va/app/jobs/application_job.rb` - Base job retry configuration:
 *   - Line 14: `retry_on StandardError, wait: :exponentially_longer, attempts: 3` - Retry with exponential backoff
 *   - Line 17: `discard_on ActiveJob::DeserializationError` - Discard deserialization errors
 * - `jarek-va/app/jobs/telegram_message_job.rb` - Job-level error handling:
 *   - Lines 32-50: Comprehensive error handling with logging and user notifications
 *   - Line 33-34: Error logging with backtraces
 *   - Line 50: Re-raising errors to mark job as failed
 *
 * **Node.js Implementation:**
 * - Centralized error handling utilities for async operations
 * - Retry logic configuration matching Rails behavior (3 attempts, exponential backoff)
 * - Operation failure handling for operations that exhaust all retries
 * - Comprehensive logging for all async events (errors, failures, retries, completions)
 * - Error classification (retryable vs non-retryable errors)
 * - Timeout error handling
 *
 * **Usage:**
 * ```typescript
 * import { withErrorHandling, defaultRetryOptions } from '@/handlers/async-error-handler';
 *
 * // Wrap async operation with error handling
 * await withErrorHandling(() => someAsyncOperation(), {
 *   operationId: 'unique-operation-id',
 *   retries: 3,
 * });
 *
 * // Use default retry options
 * await withErrorHandling(() => handler.handle(data), defaultRetryOptions);
 * ```
 *
 * @module handlers/async-error-handler
 */

import logger from '@/utils/logger';
import { withRetry, type RetryOptions, TimeoutError } from '@/utils/async';
import { DeserializationError } from './base-async-handler';

/**
 * Error handler configuration options
 * Configures error handling behavior including retry, logging, and failure handling
 */
export interface ErrorHandlerOptions {
  /** Unique identifier for the operation (for logging and tracking) */
  operationId?: string;
  /** Maximum number of retry attempts (default: 3, matching Rails `retry: 3`) */
  retries?: number;
  /** Whether to log operation completions (default: false) */
  logCompletion?: boolean;
  /** Custom retry options (overrides default retry configuration) */
  retryOptions?: RetryOptions;
  /** Additional context data for logging */
  context?: Record<string, unknown>;
}

/**
 * Default retry options matching Rails Sidekiq behavior
 * - 3 retry attempts (matching Rails `retry: 3`)
 * - Exponential backoff (matching Rails `wait: :exponentially_longer`)
 * - Initial delay: 2000ms
 * - Maximum delay: 30000ms
 * - Backoff multiplier: 2
 */
export const defaultRetryOptions: RetryOptions = {
  attempts: 3,
  initialDelayMs: 2000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  shouldRetry: (error: unknown) => {
    // Don't retry deserialization errors (matching Rails `discard_on ActiveJob::DeserializationError`)
    if (error instanceof DeserializationError) {
      return false;
    }
    // Retry all other errors (matching Rails `retry_on StandardError`)
    return true;
  },
};

/**
 * Operation failure information
 * Stores details about operations that failed after exhausting all retries
 */
export interface OperationFailure {
  /** Operation identifier */
  operationId: string;
  /** Error that caused the failure */
  error: Error;
  /** Number of attempts made */
  attempts: number;
  /** Timestamp of failure */
  timestamp: Date;
  /** Additional context data */
  context?: Record<string, unknown>;
}

/**
 * In-memory storage for failed operations (for debugging/monitoring)
 * In a production system, this could be replaced with a database or monitoring service
 */
const failedOperations: OperationFailure[] = [];

/**
 * Maximum number of failed operations to store in memory
 * Older failures are automatically removed when limit is reached
 */
const MAX_FAILED_OPERATIONS = 100;

/**
 * Check if an error is retryable
 * Classifies errors as retryable (should retry) or non-retryable (should not retry)
 *
 * @param error - Error to classify
 * @returns True if error should be retried, false otherwise
 */
export function isRetryableError(error: unknown): boolean {
  // Deserialization errors should not be retried (matching Rails `discard_on ActiveJob::DeserializationError`)
  if (error instanceof DeserializationError) {
    return false;
  }

  // Timeout errors are retryable (may be transient network issues)
  if (error instanceof TimeoutError) {
    return true;
  }

  // All other errors are retryable by default (matching Rails `retry_on StandardError`)
  return true;
}

/**
 * Check if an error is a timeout error
 *
 * @param error - Error to check
 * @returns True if error is a timeout error
 */
export function isTimeoutError(error: unknown): boolean {
  return error instanceof TimeoutError;
}

/**
 * Log error with full stack trace (matching Rails `backtrace: true`)
 * Logs error class name, message, and full stack trace
 *
 * @param operationId - Operation identifier
 * @param error - Error to log
 * @param context - Additional context data
 */
function logErrorWithBacktrace(
  operationId: string | undefined,
  error: Error,
  context?: Record<string, unknown>,
): void {
  const errorClassName = error.constructor.name || 'Error';
  const errorMessage = error.message || 'Unknown error';
  const logContext = {
    operationId,
    errorClassName,
    errorMessage,
    ...context,
  };

  // Log error class name and message (matching Rails.logger.error("#{exception.class}: #{exception.message}"))
  logger.error(
    logContext,
    `Error in async operation${operationId ? ` (${operationId})` : ''}: ${errorClassName}: ${errorMessage}`,
  );

  // Log full stack trace (matching Rails.logger.error(exception.backtrace.join("\n")) and Sidekiq `backtrace: true`)
  if (error.stack) {
    logger.error(
      {
        operationId,
        stackTrace: error.stack,
        ...context,
      },
      `Stack trace for operation${operationId ? ` (${operationId})` : ''}`,
    );
  } else {
    logger.error(
      {
        operationId,
        ...context,
      },
      `No stack trace available for operation${operationId ? ` (${operationId})` : ''}`,
    );
  }
}

/**
 * Handle operation failure after all retries are exhausted
 * Logs the failure, stores failure information, and optionally sends notifications
 * Never throws errors to prevent cascading failures
 *
 * @param operationId - Operation identifier
 * @param error - Error that caused the failure
 * @param attempts - Number of attempts made
 * @param context - Additional context data
 */
function handleOperationFailure(
  operationId: string | undefined,
  error: Error,
  attempts: number,
  context?: Record<string, unknown>,
): void {
  try {
    const failure: OperationFailure = {
      operationId: operationId || 'unknown',
      error,
      attempts,
      timestamp: new Date(),
      context,
    };

    // Store failure information (for debugging/monitoring)
    failedOperations.push(failure);

    // Remove oldest failures if limit is reached
    if (failedOperations.length > MAX_FAILED_OPERATIONS) {
      failedOperations.shift();
    }

    // Log operation failure with full context (matching Rails error logging pattern)
    logger.error(
      {
        operationId,
        attempts,
        errorClassName: error.constructor.name || 'Error',
        errorMessage: error.message || 'Unknown error',
        timestamp: failure.timestamp.toISOString(),
        ...context,
      },
      `Operation failed after ${attempts} attempts${operationId ? ` (${operationId})` : ''}`,
    );

    // Log full stack trace (matching Rails `backtrace: true`)
    if (error.stack) {
      logger.error(
        {
          operationId,
          attempts,
          stackTrace: error.stack,
          ...context,
        },
        `Stack trace for failed operation${operationId ? ` (${operationId})` : ''}`,
      );
    }

    // TODO: Optionally send notifications for critical failures (e.g., to monitoring service, Slack, etc.)
    // This can be implemented based on specific requirements
  } catch (handlerError) {
    // Never throw errors from error handlers (prevent cascading failures)
    // Log the handler error but don't throw
    logger.error(
      {
        originalOperationId: operationId,
        handlerError: handlerError instanceof Error ? handlerError.message : String(handlerError),
      },
      'Error in operation failure handler (prevented cascading failure)',
    );
  }
}

/**
 * Wrap an async operation with error handling, retry logic, and comprehensive logging
 * Matches Rails Sidekiq error handling behavior with retries, exponential backoff, and full stack traces
 *
 * @param operation - Async operation to wrap
 * @param options - Error handler configuration options
 * @returns Promise that resolves with the operation result or rejects with the last error
 *
 * @example
 * ```typescript
 * // Basic usage with default retry options
 * await withErrorHandling(() => someAsyncOperation(), {
 *   operationId: 'unique-id',
 * });
 *
 * // Custom retry configuration
 * await withErrorHandling(() => someAsyncOperation(), {
 *   operationId: 'unique-id',
 *   retries: 5,
 *   logCompletion: true,
 *   context: { userId: 123 },
 * });
 * ```
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  options?: ErrorHandlerOptions,
): Promise<T> {
  const opts: Required<Omit<ErrorHandlerOptions, 'retryOptions' | 'context'>> & {
    retryOptions?: RetryOptions;
    context?: Record<string, unknown>;
  } = {
    operationId: options?.operationId || `op-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    retries: options?.retries ?? defaultRetryOptions.attempts ?? 3,
    logCompletion: options?.logCompletion ?? false,
    retryOptions: options?.retryOptions,
    context: options?.context,
  };

  const retryOptions: RetryOptions = {
    ...defaultRetryOptions,
    attempts: opts.retries,
    ...opts.retryOptions,
    shouldRetry: (error: unknown) => {
      // Use custom shouldRetry if provided, otherwise use default
      if (opts.retryOptions?.shouldRetry) {
        return opts.retryOptions.shouldRetry(error);
      }
      return isRetryableError(error);
    },
  };

  // Log operation start
  logger.info(
    {
      operationId: opts.operationId,
      retries: opts.retries,
      ...opts.context,
    },
    `Starting async operation: ${opts.operationId}`,
  );

  let errorLogged = false;

  try {
    // Wrap operation with retry logic
    const result = await withRetry(
      async () => {
        try {
          return await operation();
        } catch (error) {
          // Log error with full stack trace (matching Rails `backtrace: true`)
          const errorObj = error instanceof Error ? error : new Error(String(error));
          errorLogged = true;
          logErrorWithBacktrace(opts.operationId, errorObj, opts.context);

          // Check for timeout errors
          if (isTimeoutError(error)) {
            logger.warn(
              {
                operationId: opts.operationId,
                ...opts.context,
              },
              `Timeout error in operation: ${opts.operationId}`,
            );
          }

          // Re-throw error for retry logic
          throw error;
        }
      },
      retryOptions,
    );

    // Log operation completion (if enabled)
    if (opts.logCompletion) {
      logger.info(
        {
          operationId: opts.operationId,
          ...opts.context,
        },
        `Completed async operation: ${opts.operationId}`,
      );
    }

    return result;
  } catch (error) {
    // Operation failed after all retries
    const errorObj = error instanceof Error ? error : new Error(String(error));
    const attempts = opts.retries + 1; // +1 for initial attempt

    // If error wasn't logged during retries (e.g., withRetry was mocked or error occurred outside retry wrapper),
    // log it now with full stack trace
    if (!errorLogged) {
      try {
        logErrorWithBacktrace(opts.operationId, errorObj, opts.context);

        // Check for timeout errors
        if (isTimeoutError(error)) {
          logger.warn(
            {
              operationId: opts.operationId,
              ...opts.context,
            },
            `Timeout error in operation: ${opts.operationId}`,
          );
        }
      } catch (logError) {
        // Never throw errors from error logging (prevent cascading failures)
        logger.error(
          {
            originalOperationId: opts.operationId,
            logError: logError instanceof Error ? logError.message : String(logError),
          },
          'Error in error logging (prevented cascading failure)',
        );
      }
    }

    // Handle operation failure (log, store, notify)
    handleOperationFailure(opts.operationId, errorObj, attempts, opts.context);

    // Re-throw error
    throw error;
  }
}

/**
 * Wrap an async handler with error handling and retry logic
 * Convenience function for wrapping handler functions (similar to BaseAsyncHandler pattern)
 *
 * @param handlerFn - Handler function to wrap
 * @param handlerName - Handler name for logging
 * @param options - Error handler configuration options
 * @returns Wrapped handler function
 *
 * @example
 * ```typescript
 * const wrappedHandler = wrapHandlerWithErrorHandling(
 *   async (data: MyData) => {
 *     // Handler logic
 *   },
 *   'my-handler',
 *   {
 *     retries: 5,
 *     logCompletion: true,
 *   }
 * );
 *
 * await wrappedHandler(data);
 * ```
 */
export function wrapHandlerWithErrorHandling<T, R = void>(
  handlerFn: (data: T) => Promise<R>,
  handlerName: string,
  options?: ErrorHandlerOptions,
): (data: T) => Promise<R> {
  return async (data: T): Promise<R> => {
    const operationId = options?.operationId || `${handlerName}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    return withErrorHandling(
      () => handlerFn(data),
      {
        ...options,
        operationId,
        context: {
          handlerName,
          ...options?.context,
        },
      },
    );
  };
}

/**
 * Get failed operations (for debugging/monitoring)
 * Returns a copy of the failed operations array
 *
 * @returns Array of failed operations
 */
export function getFailedOperations(): OperationFailure[] {
  return [...failedOperations];
}

/**
 * Clear failed operations (for testing or cleanup)
 */
export function clearFailedOperations(): void {
  failedOperations.length = 0;
}

/**
 * Export all types and utilities
 */
export type { ErrorHandlerOptions, OperationFailure };
