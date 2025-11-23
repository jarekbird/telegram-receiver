/**
 * Logger utility wrapper providing Rails.logger-like interface
 *
 * This wrapper provides a consistent logging interface that matches Rails.logger patterns
 * from jarek-va, making it easier to migrate Rails code to TypeScript.
 *
 * **Rails Patterns Replicated:**
 * - `Rails.logger.info()` → `logger.info()`
 * - `Rails.logger.error()` → `logger.error()` (automatically handles Error objects with stack traces)
 * - `Rails.logger.warn()` → `logger.warn()`
 * - `Rails.logger.debug()` → `logger.debug()`
 *
 * **Error Handling:**
 * When logging errors, the wrapper automatically detects Error objects and replicates
 * the Rails error logging pattern:
 * 1. First log: `ErrorClassName: error message`
 * 2. Second log: Full stack trace (as separate log entry)
 *
 * This matches the Rails pattern where errors are logged in two separate calls:
 * - `Rails.logger.error("#{exception.class}: #{exception.message}")`
 * - `Rails.logger.error(exception.backtrace.join("\n"))`
 *
 * @example
 * ```typescript
 * import logger from '@/utils/logger';
 *
 * // Basic logging
 * logger.info('Processing message');
 * logger.warn('Warning message');
 * logger.debug('Debug information');
 *
 * // Error logging (automatically handles Error objects)
 * try {
 *   // some code
 * } catch (error) {
 *   logger.error('Error occurred', error); // Automatically logs class name, message, and stack trace
 * }
 *
 * // Error logging with custom message
 * logger.error('Failed to process request', error);
 * ```
 */

import pinoLogger from '../config/logger';
import type { Logger } from 'pino';

/**
 * Logger wrapper interface matching Rails.logger patterns
 */
interface LoggerWrapper {
  /**
   * Log informational messages
   * @param message - Log message
   * @param args - Additional arguments (objects, strings, etc.)
   */
  info(message: string, ...args: unknown[]): void;

  /**
   * Log error messages
   * Automatically handles Error objects by logging:
   * 1. Error class name and message
   * 2. Full stack trace (as separate log entry)
   *
   * @param message - Log message
   * @param args - Additional arguments (Error objects, objects, strings, etc.)
   */
  error(message: string, ...args: unknown[]): void;

  /**
   * Log warning messages
   * @param message - Log message
   * @param args - Additional arguments (objects, strings, etc.)
   */
  warn(message: string, ...args: unknown[]): void;

  /**
   * Log debug messages
   * @param message - Log message
   * @param args - Additional arguments (objects, strings, etc.)
   */
  debug(message: string, ...args: unknown[]): void;
}

/**
 * Check if a value is an Error object
 */
function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Extract Error objects from arguments array
 * Returns the first Error found, or null if none
 */
function findError(args: unknown[]): Error | null {
  for (const arg of args) {
    if (isError(arg)) {
      return arg;
    }
  }
  return null;
}

/**
 * Log error following Rails pattern:
 * 1. First: Error class name and message (with optional custom message prefix)
 * 2. Second: Full stack trace
 */
function logErrorRailsStyle(logger: Logger, message: string, error: Error): void {
  // First log: Error class name and message (matching Rails.logger.error("#{exception.class}: #{exception.message}"))
  // If a custom message is provided, include it as a prefix (matching Rails patterns like "Error sending Telegram message: #{e.message}")
  const errorClassName = error.constructor.name || 'Error';
  const errorMessage = error.message || 'Unknown error';
  
  if (message && message.trim()) {
    // Custom message provided - log: "Custom message: ErrorClassName: error message"
    logger.error(`${message}: ${errorClassName}: ${errorMessage}`);
  } else {
    // No custom message - log: "ErrorClassName: error message"
    logger.error(`${errorClassName}: ${errorMessage}`);
  }

  // Second log: Full stack trace (matching Rails.logger.error(exception.backtrace.join("\n")))
  if (error.stack) {
    logger.error(error.stack);
  } else {
    logger.error('No stack trace available');
  }
}

/**
 * Create logger wrapper with Rails.logger-like interface
 */
function createLoggerWrapper(): LoggerWrapper {
  return {
    info(message: string, ...args: unknown[]): void {
      if (args.length === 0) {
        // Simple string message
        pinoLogger.info(message);
      } else if (args.length === 1 && typeof args[0] === 'object' && !isError(args[0])) {
        // Structured logging with object (Pino pattern)
        pinoLogger.info(args[0] as Record<string, unknown>, message);
      } else {
        // Multiple arguments - combine into message
        const combinedMessage = [message, ...args.map((arg) => String(arg))].join(' ');
        pinoLogger.info(combinedMessage);
      }
    },

    error(message: string, ...args: unknown[]): void {
      const error = findError(args);

      if (error) {
        // Rails pattern: log error class name, message, and stack trace
        logErrorRailsStyle(pinoLogger, message, error);

        // If there are additional non-error arguments, log them as additional context
        const otherArgs = args.filter((arg) => !isError(arg));
        if (otherArgs.length > 0) {
          if (otherArgs.length === 1 && typeof otherArgs[0] === 'object') {
            // Structured logging for additional context
            pinoLogger.error(otherArgs[0] as Record<string, unknown>, `Additional context: ${message}`);
          } else {
            // Combine additional arguments into message
            pinoLogger.error(`Additional context: ${message} - ${otherArgs.map((arg) => String(arg)).join(' ')}`);
          }
        }
      } else if (args.length === 0) {
        // Simple string message (no Error object, no additional args)
        pinoLogger.error(message);
      } else if (args.length === 1 && typeof args[0] === 'object') {
        // Structured logging with object (Pino pattern)
        pinoLogger.error(args[0] as Record<string, unknown>, message);
      } else {
        // Multiple arguments - combine into message
        const combinedMessage = [message, ...args.map((arg) => String(arg))].join(' ');
        pinoLogger.error(combinedMessage);
      }
    },

    warn(message: string, ...args: unknown[]): void {
      if (args.length === 0) {
        // Simple string message
        pinoLogger.warn(message);
      } else if (args.length === 1 && typeof args[0] === 'object' && !isError(args[0])) {
        // Structured logging with object (Pino pattern)
        pinoLogger.warn(args[0] as Record<string, unknown>, message);
      } else {
        // Multiple arguments - combine into message
        const combinedMessage = [message, ...args.map((arg) => String(arg))].join(' ');
        pinoLogger.warn(combinedMessage);
      }
    },

    debug(message: string, ...args: unknown[]): void {
      if (args.length === 0) {
        // Simple string message
        pinoLogger.debug(message);
      } else if (args.length === 1 && typeof args[0] === 'object' && !isError(args[0])) {
        // Structured logging with object (Pino pattern)
        pinoLogger.debug(args[0] as Record<string, unknown>, message);
      } else {
        // Multiple arguments - combine into message
        const combinedMessage = [message, ...args.map((arg) => String(arg))].join(' ');
        pinoLogger.debug(combinedMessage);
      }
    },
  };
}

// Export singleton logger wrapper instance
const logger = createLoggerWrapper();

export default logger;
