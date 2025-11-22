/**
 * Logger configuration using Pino
 *
 * This module provides a centralized logger instance for the application.
 * Uses Pino for high-performance structured logging.
 *
 * @example
 * ```typescript
 * import logger from './config/logger';
 * logger.info({ key: 'value' }, 'Log message');
 * logger.error({ err }, 'Error occurred');
 * ```
 */

import pino from 'pino';

/**
 * Logger instance configured with environment-based log level
 * - Development: debug level for detailed logs
 * - Test: error level to reduce test output noise
 * - Production: info level for production logging
 */
const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  // JSON format is default in Pino (good for production/Docker)
  // In development, can use pino-pretty for readable output
});

export default logger;
