/**
 * Handler execution utilities
 *
 * This module provides execution functions for async handlers, wrapping them with
 * retry logic, timeout handling, and comprehensive error handling. This matches
 * the Rails pattern where jobs are enqueued via `TelegramMessageJob.perform_later(update.to_json)`
 * but uses direct async execution instead of a queue system.
 *
 * **Rails Implementation Reference:**
 * - `jarek-va/app/controllers/telegram_controller.rb` line 22: `TelegramMessageJob.perform_later(update.to_json)`
 * - `jarek-va/config/initializers/sidekiq.rb` lines 34-37: Default job options with retry: 3, backtrace: true
 * - `jarek-va/config/initializers/sidekiq.rb` line 31: `Sidekiq.logger.level = Logger::INFO`
 *
 * **TypeScript/Node.js Implementation:**
 * - Direct async execution instead of queue-based processing
 * - Handler execution function wraps handler with retry, timeout, and error handling
 * - Uses BaseAsyncHandler's built-in retry logic and error handling
 * - Logging configured to INFO level (matching Rails Sidekiq.logger.level = Logger::INFO)
 *
 * **Usage:**
 * ```typescript
 * import { executeTelegramMessageHandler } from '@/handlers';
 * import { TelegramUpdate } from '@/types/telegram';
 *
 * // Execute handler for a Telegram update
 * await executeTelegramMessageHandler(update);
 * ```
 *
 * @module handlers/index
 */

import TelegramMessageHandler from '../jobs/telegram-message-job';
import { TelegramUpdate } from '../types/telegram';
import { withTimeout, TimeoutError } from '../utils/async';
import { withErrorHandling, defaultRetryOptions } from './async-error-handler';
import logger from '../utils/logger';

/**
 * Default timeout for handler execution (30 seconds)
 * Prevents handlers from running indefinitely
 */
const DEFAULT_HANDLER_TIMEOUT_MS = 30000;

/**
 * Execute TelegramMessageHandler for a given update
 *
 * This function wraps the handler execution with:
 * - Retry logic (3 attempts with exponential backoff, matching Rails `retry: 3`)
 * - Timeout handling (30 seconds default)
 * - Comprehensive error handling with full stack traces (matching Rails `backtrace: true`)
 * - INFO level logging (matching Rails `Sidekiq.logger.level = Logger::INFO`)
 *
 * This is equivalent to Rails `TelegramMessageJob.perform_later(update.to_json)` but uses
 * direct async execution instead of queue-based processing.
 *
 * **Rails Implementation Reference:**
 * - `jarek-va/app/controllers/telegram_controller.rb` line 22: `TelegramMessageJob.perform_later(update.to_json)`
 * - `jarek-va/config/initializers/sidekiq.rb` lines 34-37: Default job options
 * - `jarek-va/app/jobs/telegram_message_job.rb` lines 16-18: Update parsing (JSON string or object)
 *
 * @param update - Telegram update object (can be JSON string or object, matching Rails line 16-18)
 * @returns Promise that resolves when handler completes
 * @throws Error if handler execution fails after all retries
 *
 * @example
 * ```typescript
 * import { executeTelegramMessageHandler } from '@/handlers';
 *
 * // Execute handler for a Telegram update
 * await executeTelegramMessageHandler(update);
 *
 * // Handler execution is async and non-blocking
 * // Errors are logged and handled automatically
 * ```
 */
export async function executeTelegramMessageHandler(
  update: TelegramUpdate | string,
): Promise<void> {
  // Parse JSON string if needed (matching Rails line 17-18: `update = JSON.parse(update) if update.is_a?(String)`)
  let parsedUpdate: TelegramUpdate;
  if (typeof update === 'string') {
    try {
      parsedUpdate = JSON.parse(update) as TelegramUpdate;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error(
        {
          err: errorObj,
          updateString: update.substring(0, 100), // Log first 100 chars for debugging
        },
        'Error parsing Telegram update JSON string',
      );
      throw new Error(`Failed to parse Telegram update JSON: ${errorObj.message}`);
    }
  } else {
    parsedUpdate = update;
  }

  // Generate operation ID for logging and tracking
  const operationId = `telegram-message-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  // Log handler execution start (INFO level, matching Rails Sidekiq.logger.level = Logger::INFO)
  logger.info(
    {
      operationId,
      updateType: parsedUpdate.message ? 'message' : parsedUpdate.edited_message ? 'edited_message' : parsedUpdate.callback_query ? 'callback_query' : 'unknown',
    },
    'Executing TelegramMessageHandler',
  );

  try {
    // Create handler instance
    const handler = new TelegramMessageHandler();

    // Wrap handler execution with error handling and retry logic
    // This uses BaseAsyncHandler's built-in retry logic (3 attempts, exponential backoff)
    // and comprehensive error handling with full stack traces (matching Rails backtrace: true)
    await withErrorHandling(
      async () => {
        // Apply timeout to handler execution (prevents handlers from running indefinitely)
        try {
          await withTimeout(
            handler.execute(parsedUpdate),
            DEFAULT_HANDLER_TIMEOUT_MS,
          );
        } catch (error) {
          // Handle timeout errors specifically
          if (error instanceof TimeoutError) {
            logger.error(
              {
                operationId,
                timeoutMs: DEFAULT_HANDLER_TIMEOUT_MS,
              },
              'TelegramMessageHandler execution timed out',
            );
            throw new Error(
              `Handler execution timed out after ${DEFAULT_HANDLER_TIMEOUT_MS}ms`,
            );
          }
          // Re-throw other errors
          throw error;
        }
      },
      {
        operationId,
        retries: defaultRetryOptions.attempts ?? 3, // 3 retry attempts (matching Rails retry: 3)
        logCompletion: true, // Log completion events
        retryOptions: defaultRetryOptions, // Use default retry options (3 attempts, exponential backoff)
        context: {
          handlerName: 'telegram-message',
          updateType: parsedUpdate.message ? 'message' : parsedUpdate.edited_message ? 'edited_message' : parsedUpdate.callback_query ? 'callback_query' : 'unknown',
        },
      },
    );

    // Log handler execution completion (INFO level)
    logger.info(
      {
        operationId,
      },
      'TelegramMessageHandler execution completed',
    );
  } catch (error) {
    // Log handler execution failure (errors are already logged by withErrorHandling)
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logger.error(
      {
        operationId,
        err: errorObj,
      },
      'TelegramMessageHandler execution failed',
    );

    // Re-throw error to allow caller to handle if needed
    throw error;
  }
}

/**
 * Export handler execution function
 */
export { executeTelegramMessageHandler as default };
