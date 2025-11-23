/**
 * Redis configuration
 *
 * This module provides Redis connection configuration for the application.
 * It reads the Redis URL from environment variables and provides connection settings
 * for the `ioredis` package.
 *
 * Rails Implementation Reference:
 * - `jarek-va/config/initializers/sidekiq.rb` - Sidekiq Redis configuration uses `ENV.fetch('REDIS_URL', 'redis://localhost:6379/0')`
 * - `jarek-va/app/services/cursor_runner_callback_service.rb` - Direct Redis client initialization uses `ENV.fetch('REDIS_URL', 'redis://localhost:6379/0')`
 *
 * @example
 * ```typescript
 * import { redisConfig } from './config/redis';
 * console.log(redisConfig.url); // 'redis://localhost:6379/0'
 * ```
 */

/**
 * Redis connection options
 * Optional configuration for Redis client connection
 * Can be extended in the future for additional connection settings
 */
export interface RedisConnectionOptions {
  /** Additional connection options (can be extended for specific Redis client libraries) */
  [key: string]: unknown;
}

/**
 * Redis configuration interface
 * Defines the structure of the Redis configuration object
 */
export interface RedisConfig {
  /** Redis connection URL (default: redis://localhost:6379/0) */
  url: string;
  /** Optional connection options for future extensibility */
  options?: RedisConnectionOptions;
}

/**
 * Redis connection URL
 * Reads from REDIS_URL environment variable with fallback to default
 * Matches Rails pattern: ENV.fetch('REDIS_URL', 'redis://localhost:6379/0')
 * In Docker: REDIS_URL=redis://redis:6379/0 (shared Redis instance)
 * Local development: Falls back to redis://localhost:6379/0
 */
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379/0';

/**
 * Redis configuration object
 * Contains the Redis connection URL and optional connection options
 * Used with the `ioredis` package
 */
export const redisConfig: RedisConfig = {
  /** Redis connection URL (default: redis://localhost:6379/0) */
  url: REDIS_URL,
  /** Optional connection options for future extensibility */
  options: {},
};
