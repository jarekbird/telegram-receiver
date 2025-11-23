/**
 * Redis connection utility
 *
 * This module provides a singleton Redis client instance for use throughout the application.
 * It centralizes Redis client creation and provides a consistent interface for Redis connectivity.
 *
 * **Rails Implementation Reference:**
 * - `jarek-va/app/services/cursor_runner_callback_service.rb` - Shows Redis client initialization pattern:
 *   - Uses `Redis.new(url: redis_url)` to create client
 *   - Supports dependency injection (can pass `redis_client` or `redis_url`)
 *   - Falls back to `ENV.fetch('REDIS_URL', 'redis://localhost:6379/0')`
 *   - In Docker: `REDIS_URL=redis://redis:6379/0` (shared Redis instance)
 *   - Local development: Falls back to `redis://localhost:6379/0`
 *
 * **Singleton Pattern:**
 * The utility implements a singleton pattern to ensure a single Redis connection instance
 * across the application, preventing multiple connections and resource waste.
 *
 * **Dependency Injection:**
 * Supports dependency injection for testing by allowing a custom Redis client to be passed.
 * This matches the Rails pattern where `redis_client` parameter takes precedence over `redis_url`.
 *
 * **Error Handling:**
 * Basic error handling covers initialization failures. Advanced error handling (reconnection
 * logic, event listeners) will be added in PHASE2-010.
 *
 * @example
 * ```typescript
 * import getRedisClient from '@/utils/redis';
 *
 * // Get the singleton Redis client instance
 * const redis = getRedisClient();
 *
 * // Use the client
 * await redis.set('key', 'value');
 * const value = await redis.get('key');
 * ```
 *
 * @example
 * ```typescript
 * // For testing: inject a mock Redis client
 * import getRedisClient from '@/utils/redis';
 * import { Redis } from 'ioredis';
 *
 * const mockRedis = new Redis({ /* mock config *\/ });
 * const redis = getRedisClient(mockRedis);
 * ```
 */

import { Redis, type RedisOptions } from 'ioredis';
import { redisConfig } from '../config/redis';
import logger from './logger';

/**
 * Private variable to store the singleton Redis client instance
 * Initially null, will be initialized on first access
 */
let redisClient: Redis | null = null;

/**
 * Get Redis client instance (singleton pattern)
 *
 * Returns a singleton Redis client instance. On first call, initializes the client
 * using the Redis configuration from `src/config/redis.ts`. Subsequent calls return
 * the same instance.
 *
 * **Dependency Injection Support:**
 * If a custom Redis client is provided, it will be used instead of creating a new instance.
 * This is useful for testing with mock Redis clients. The custom client will be stored
 * as the singleton instance for subsequent calls.
 *
 * **Error Handling:**
 * If client initialization fails, an error is logged and thrown with a meaningful message.
 *
 * @param customClient - Optional custom Redis client instance (for testing/dependency injection)
 * @returns Redis client instance
 * @throws {Error} If Redis client initialization fails
 *
 * @example
 * ```typescript
 * // Get singleton instance (initializes on first call)
 * const redis = getRedisClient();
 *
 * // Use dependency injection for testing
 * const mockRedis = new Redis({ /* mock config *\/ });
 * const redis = getRedisClient(mockRedis);
 * ```
 */
function getRedisClient(customClient?: Redis): Redis {
  // If custom client provided, use it (dependency injection for testing)
  // This matches Rails pattern where redis_client parameter takes precedence
  if (customClient) {
    redisClient = customClient;
    logger.debug('Using custom Redis client (dependency injection)');
    return redisClient;
  }

  // If singleton instance already exists, return it
  if (redisClient) {
    return redisClient;
  }

  // Initialize new Redis client instance
  try {
    logger.debug(`Initializing Redis client with URL: ${redisConfig.url}`);
    
    // Create Redis client using configuration from redisConfig
    // ioredis accepts connection URL directly
    redisClient = new Redis(redisConfig.url);

    logger.info('Redis client initialized successfully');
    return redisClient;
  } catch (error) {
    const errorMessage = 'Failed to initialize Redis client';
    logger.error(errorMessage, error as Error);
    
    // Throw meaningful error for caller to handle
    throw new Error(`${errorMessage}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export default getRedisClient;
