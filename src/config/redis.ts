/**
 * Redis configuration
 *
 * This module provides Redis connection configuration for the application.
 * It reads the Redis URL from environment variables.
 *
 * @example
 * ```typescript
 * import { redisConfig } from './config/redis';
 * console.log(redisConfig.url); // 'redis://localhost:6379/0'
 * ```
 */

/**
 * Redis configuration object
 * Contains the Redis connection URL from environment variables
 */
export const redisConfig = {
  /** Redis connection URL (default: redis://localhost:6379/0) */
  url: process.env.REDIS_URL || 'redis://localhost:6379/0',
};
