/**
 * Base async handler pattern for TypeScript/Node.js
 *
 * This module provides a base class pattern for async operations with retry logic, error handling,
 * and logging that matches the Rails `ApplicationJob` behavior. Since we're not using a queue system,
 * this provides a common pattern for async operations that can be called directly.
 *
 * **Rails Implementation Reference:**
 * - `jarek-va/app/jobs/application_job.rb` - Base job class using ActiveJob with Sidekiq adapter
 *   - Queue configuration: `queue_as :default` (line 11)
 *   - Retry configuration: `retry_on StandardError, wait: :exponentially_longer, attempts: 3` (line 14)
 *   - Discard configuration: `discard_on ActiveJob::DeserializationError` (line 17)
 *   - All jobs extend this base class (e.g., `TelegramMessageJob < ApplicationJob`)
 *
 * **Node.js Implementation:**
 * - Abstract base class `BaseAsyncHandler<T, R>` for async handlers
 * - Default handler name matching Rails queue concept (`queue_as :default`)
 * - Retry configuration with exponential backoff (3 attempts) matching Rails behavior
 * - Error handling for deserialization/parsing errors (discard, don't retry)
 * - Logging infrastructure for async operations
 * - Helper function to wrap handlers with retry and error handling
 *
 * **Usage:**
 * ```typescript
 * class TelegramMessageHandler extends BaseAsyncHandler<TelegramUpdate, void> {
 *   getHandlerName(): string {
 *     return 'telegram-message'; // Optional: override default handler name
 *   }
 *
 *   async handle(data: TelegramUpdate): Promise<void> {
 *     // Implementation here
 *   }
 * }
 *
 * // Use the handler
 * const handler = new TelegramMessageHandler();
 * await handler.execute(data); // Automatically applies retry and error handling
 * ```
 *
 * @module handlers/base-async-handler
 */

import logger from '@/utils/logger';
import { withRetry, type RetryOptions } from '@/utils/async';

/**
 * Deserialization error class
 * Thrown when data cannot be parsed or deserialized (equivalent to ActiveJob::DeserializationError)
 */
export class DeserializationError extends Error {
  constructor(message: string, public readonly originalError?: unknown) {
    super(message);
    this.name = 'DeserializationError';
  }
}

/**
 * Handler options interface
 * Configures handler behavior including retry and error handling
 */
export interface HandlerOptions {
  /** Handler name/identifier (matching Rails queue name concept) */
  handlerName?: string;
  /** Retry configuration options */
  retryOptions?: RetryOptions;
  /** Whether to log handler start/complete events (default: true) */
  enableLogging?: boolean;
}

/**
 * Default handler options matching Rails ApplicationJob behavior
 * - Handler name: "default" (matching Rails `queue_as :default`)
 * - Retry attempts: 3 (matching Rails `attempts: 3`)
 * - Exponential backoff (matching Rails `wait: :exponentially_longer`)
 * - Retry on StandardError/Error (matching Rails `retry_on StandardError`)
 */
const DEFAULT_HANDLER_OPTIONS: Required<Omit<HandlerOptions, 'retryOptions'>> & {
  retryOptions: RetryOptions;
} = {
  handlerName: 'default',
  retryOptions: {
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
  },
  enableLogging: true,
};

/**
 * Check if an error is a deserialization/parsing error
 * Matches Rails `discard_on ActiveJob::DeserializationError` behavior
 *
 * @param error - Error to check
 * @returns True if error is a deserialization error
 */
function isDeserializationError(error: unknown): boolean {
  // Check for JSON parsing errors
  if (error instanceof SyntaxError) {
    const message = error.message.toLowerCase();
    return (
      message.includes('json') ||
      message.includes('parse') ||
      message.includes('unexpected token') ||
      message.includes('invalid')
    );
  }

  // Check for DeserializationError instances
  if (error instanceof DeserializationError) {
    return true;
  }

  // Check for other common parsing errors
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('deserialization') ||
      message.includes('invalid json') ||
      message.includes('parse error')
    );
  }

  return false;
}

/**
 * Base async handler abstract class
 * Provides common retry/error handling logic, default handler configuration, and logging infrastructure
 *
 * @template T - Input data type
 * @template R - Return type
 *
 * @example
 * ```typescript
 * class MyHandler extends BaseAsyncHandler<MyData, void> {
 *   async handle(data: MyData): Promise<void> {
 *     // Implementation
 *   }
 * }
 * ```
 */
export abstract class BaseAsyncHandler<T, R = void> {
  /**
   * Handler name/identifier (matching Rails queue name concept)
   * Child classes can override this to provide a custom handler name
   *
   * @returns Handler name (default: "default")
   */
  protected getHandlerName(): string {
    return DEFAULT_HANDLER_OPTIONS.handlerName;
  }

  /**
   * Handler options
   * Child classes can override this to provide custom options
   *
   * @returns Handler options
   */
  protected getHandlerOptions(): HandlerOptions {
    return {
      handlerName: this.getHandlerName(),
      retryOptions: DEFAULT_HANDLER_OPTIONS.retryOptions,
      enableLogging: DEFAULT_HANDLER_OPTIONS.enableLogging,
    };
  }

  /**
   * Abstract handle method that child classes must implement
   * This is the main processing logic for the handler
   *
   * @param data - Input data to process
   * @returns Promise that resolves with the result
   */
  abstract handle(data: T): Promise<R>;

  /**
   * Execute the handler with retry logic and error handling
   * Wraps the handle method with retry configuration and error handling
   *
   * @param data - Input data to process
   * @param options - Optional handler options (overrides class defaults)
   * @returns Promise that resolves with the result
   * @throws DeserializationError if data cannot be parsed (discarded, not retried)
   * @throws Error if all retry attempts are exhausted
   *
   * @example
   * ```typescript
   * const handler = new MyHandler();
   * try {
   *   await handler.execute(data);
   * } catch (error) {
   *   if (error instanceof DeserializationError) {
   *     // Handle deserialization error (not retried)
   *   } else {
   *     // Handle other errors (retries exhausted)
   *   }
   * }
   * ```
   */
  async execute(data: T, options?: HandlerOptions): Promise<R> {
    const opts = {
      ...this.getHandlerOptions(),
      ...options,
    };

    const handlerName = opts.handlerName || this.getHandlerName();
    const operationId = this.generateOperationId();

    // Log handler start
    if (opts.enableLogging) {
      logger.info(
        {
          handlerName,
          operationId,
        },
        `Starting async handler: ${handlerName}`,
      );
    }

    try {
      // Wrap handle method with retry logic
      const result = await withRetry(
        async () => {
          try {
            return await this.handle(data);
          } catch (error) {
            // Check for deserialization errors (discard, don't retry)
            if (isDeserializationError(error)) {
              const deserializationError = new DeserializationError(
                `Deserialization error in handler ${handlerName}: ${error instanceof Error ? error.message : String(error)}`,
                error,
              );

              if (opts.enableLogging) {
                logger.error(
                  {
                    handlerName,
                    operationId,
                    err: deserializationError,
                  },
                  `Deserialization error in handler ${handlerName} (discarded, not retried)`,
                );
              }

              throw deserializationError;
            }

            // Re-throw other errors for retry logic
            throw error;
          }
        },
        opts.retryOptions,
      );

      // Log handler completion
      if (opts.enableLogging) {
        logger.info(
          {
            handlerName,
            operationId,
          },
          `Completed async handler: ${handlerName}`,
        );
      }

      return result;
    } catch (error) {
      // Log handler failure
      if (opts.enableLogging) {
        logger.error(
          {
            handlerName,
            operationId,
            err: error instanceof Error ? error : new Error(String(error)),
          },
          `Failed async handler: ${handlerName}`,
        );
      }

      // Re-throw error
      throw error;
    }
  }

  /**
   * Generate a unique operation identifier for logging
   * Used to track individual handler executions
   *
   * @returns Operation identifier
   */
  protected generateOperationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

/**
 * Helper function to wrap a handler function with retry and error handling
 * Provides a functional alternative to extending BaseAsyncHandler
 *
 * @param handlerFn - Handler function to wrap
 * @param handlerName - Handler name for logging
 * @param options - Optional handler options
 * @returns Wrapped handler function
 *
 * @example
 * ```typescript
 * const wrappedHandler = wrapHandler(
 *   async (data: MyData) => {
 *     // Handler logic
 *   },
 *   'my-handler',
 *   {
 *     retryOptions: { attempts: 5 },
 *   }
 * );
 *
 * await wrappedHandler(data);
 * ```
 */
export function wrapHandler<T, R = void>(
  handlerFn: (data: T) => Promise<R>,
  handlerName: string = DEFAULT_HANDLER_OPTIONS.handlerName,
  options?: HandlerOptions,
): (data: T) => Promise<R> {
  const opts = {
    ...DEFAULT_HANDLER_OPTIONS,
    handlerName,
    ...options,
  };

  return async (data: T): Promise<R> => {
    const operationId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Log handler start
    if (opts.enableLogging) {
      logger.info(
        {
          handlerName: opts.handlerName,
          operationId,
        },
        `Starting async handler: ${opts.handlerName}`,
      );
    }

    try {
      // Wrap handler function with retry logic
      const result = await withRetry(
        async () => {
          try {
            return await handlerFn(data);
          } catch (error) {
            // Check for deserialization errors (discard, don't retry)
            if (isDeserializationError(error)) {
              const deserializationError = new DeserializationError(
                `Deserialization error in handler ${opts.handlerName}: ${error instanceof Error ? error.message : String(error)}`,
                error,
              );

              if (opts.enableLogging) {
                logger.error(
                  {
                    handlerName: opts.handlerName,
                    operationId,
                    err: deserializationError,
                  },
                  `Deserialization error in handler ${opts.handlerName} (discarded, not retried)`,
                );
              }

              throw deserializationError;
            }

            // Re-throw other errors for retry logic
            throw error;
          }
        },
        opts.retryOptions,
      );

      // Log handler completion
      if (opts.enableLogging) {
        logger.info(
          {
            handlerName: opts.handlerName,
            operationId,
          },
          `Completed async handler: ${opts.handlerName}`,
        );
      }

      return result;
    } catch (error) {
      // Log handler failure
      if (opts.enableLogging) {
        logger.error(
          {
            handlerName: opts.handlerName,
            operationId,
            err: error instanceof Error ? error : new Error(String(error)),
          },
          `Failed async handler: ${opts.handlerName}`,
        );
      }

      // Re-throw error
      throw error;
    }
  };
}

/**
 * Get default handler options
 * Returns the default handler options matching Rails ApplicationJob behavior
 *
 * @returns Default handler options
 */
export function getDefaultHandlerOptions(): Required<Omit<HandlerOptions, 'retryOptions'>> & {
  retryOptions: RetryOptions;
} {
  return {
    ...DEFAULT_HANDLER_OPTIONS,
  };
}

/**
 * Export all types and utilities
 */
export type { HandlerOptions };
