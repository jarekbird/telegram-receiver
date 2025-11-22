/**
 * Logger configuration using Pino
 *
 * This module provides a centralized logger instance for the application.
 * Uses Pino for high-performance structured logging that replicates Rails logging patterns.
 *
 * **Features:**
 * - Environment-based log levels (configurable via LOG_LEVEL env var, defaults to 'info' in production, 'debug' in development)
 * - Structured JSON logging for production (Docker-friendly, stdout)
 * - Pretty printing for development (via pino-pretty)
 * - Request ID support via child loggers (similar to Rails TaggedLogging)
 * - Full error stack traces (automatic error serialization)
 * - Timestamp and PID in log output (matching Rails Logger::Formatter)
 *
 * **Rails Patterns Replicated:**
 * - `Rails.logger.info()` → `logger.info()`
 * - `Rails.logger.error()` → `logger.error({ err }, 'message')` (includes full backtrace)
 * - `Rails.logger.warn()` → `logger.warn()`
 * - `Rails.logger.debug()` → `logger.debug()`
 * - `config.log_tags = [:request_id]` → `logger.child({ requestId })`
 * - `ENV['LOG_LEVEL']` → `process.env.LOG_LEVEL`
 *
 * @example
 * ```typescript
 * import logger from './config/logger';
 *
 * // Basic logging
 * logger.info({ key: 'value' }, 'Log message');
 * logger.error({ err }, 'Error occurred'); // Automatically includes stack trace
 *
 * // Request ID tagging (similar to Rails TaggedLogging)
 * const requestLogger = logger.child({ requestId: 'uuid-here' });
 * requestLogger.info('Request started'); // All logs include requestId
 * ```
 */

import pino from 'pino';

/**
 * Get log level from environment
 * Matches Rails behavior: ENV['LOG_LEVEL'] defaults to 'info' in production, 'debug' in development
 */
function getLogLevel(): string {
  // Check LOG_LEVEL env var first (matches Rails ENV['LOG_LEVEL'])
  if (process.env.LOG_LEVEL) {
    return process.env.LOG_LEVEL.toLowerCase();
  }

  // Default based on NODE_ENV (matches Rails: production = :info, development = :debug)
  if (process.env.NODE_ENV === 'production') {
    return 'info';
  }

  if (process.env.NODE_ENV === 'test') {
    return 'error'; // Reduce test output noise
  }

  return 'debug'; // Development default
}

/**
 * Logger instance configured with environment-based log level and formatters
 *
 * **Configuration:**
 * - Log level: Configurable via LOG_LEVEL env var (defaults to 'info' in production, 'debug' in development)
 * - Format: JSON for production (stdout-friendly, Docker-friendly)
 * - Pretty printing: Use `pino-pretty` in development (via NODE_ENV or pino-pretty CLI)
 * - Timestamp: Included by default in Pino output
 * - PID: Added via base object (matching Rails Logger::Formatter behavior)
 * - Error serialization: Automatic (includes full stack traces)
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
const logger = pino({
  level: getLogLevel(),
  // Base object includes PID in all logs (matching Rails Logger::Formatter)
  base: {
    pid: process.pid,
  },
  // Timestamp is included by default in Pino (matching Rails Logger::Formatter)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
  timestamp: pino.stdTimeFunctions.isoTime,
  // JSON format is default in Pino (good for production/Docker, matches Rails stdout logging)
  // In development, pretty printing can be enabled by:
  //   1. Using pino-pretty CLI: node dist/index.js | pino-pretty
  //   2. Using require hook: node -r pino-pretty/register dist/index.js
  //   3. Setting PINO_PRETTY=true and using transport (requires pino-pretty installed)
  // For production, always use JSON format (stdout-friendly, Docker-friendly)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  ...(process.env.NODE_ENV === 'development' && process.env.PINO_PRETTY === 'true'
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
      }
    : {}),
  // Error serialization: Pino automatically includes full stack traces when logging error objects
  // Usage: logger.error({ err }, 'Error message') - err.stack is automatically included
  serializers: {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    err: pino.stdSerializers.err, // Full error serialization with stack trace
  },
});

export default logger;
