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
 *   - Note: Rails relies on Ruby `redis` gem's automatic reconnection without explicit handling
 *
 * **Singleton Pattern:**
 * The utility implements a singleton pattern to ensure a single Redis connection instance
 * across the application, preventing multiple connections and resource waste.
 *
 * **Dependency Injection:**
 * Supports dependency injection for testing by allowing a custom Redis client to be passed.
 * This matches the Rails pattern where `redis_client` parameter takes precedence over `redis_url`.
 *
 * **Error Handling and Reconnection:**
 * Unlike Rails which relies on the gem's automatic reconnection, this implementation provides:
 * - Explicit error handling with event listeners
 * - Connection status monitoring
 * - Comprehensive logging for all connection events
 * - Configurable reconnection options
 * - Graceful handling of connection failures
 *
 * **Connection Status:**
 * The utility tracks connection status with the following states:
 * - `connecting`: Initial connection attempt in progress
 * - `connected`: Successfully connected and ready
 * - `disconnected`: Connection closed or ended
 * - `reconnecting`: Reconnection attempt in progress
 * - `error`: Connection error occurred
 *
 * Use `getConnectionStatus()` to monitor the current connection state.
 *
 * **Event Listeners:**
 * The utility registers event listeners for the following ioredis events:
 * - `error`: Logs errors and updates status to `error`
 * - `connect`: Logs connection established, updates status to `connected`
 * - `ready`: Logs Redis ready, updates status to `connected`
 * - `close`: Logs connection closed, updates status to `disconnected`
 * - `reconnecting`: Logs reconnection attempts, updates status to `reconnecting`
 * - `end`: Logs connection ended, updates status to `disconnected`
 *
 * Event listeners are registered once when the client is first created and cleaned up
 * if the client is replaced (dependency injection scenario).
 *
 * **Reconnection Configuration:**
 * The utility configures ioredis with production-ready reconnection options:
 * - `maxRetriesPerRequest`: Set to `null` for pub/sub operations (allows unlimited retries)
 * - `retryStrategy`: Custom function that implements exponential backoff with max delay
 * - `enableReadyCheck`: `true` to verify Redis is ready before accepting commands
 * - `enableOfflineQueue`: `true` to queue commands when offline for later execution
 *
 * @example
 * ```typescript
 * import getRedisClient, { getConnectionStatus } from '@/utils/redis';
 *
 * // Get the singleton Redis client instance
 * const redis = getRedisClient();
 *
 * // Use the client
 * await redis.set('key', 'value');
 * const value = await redis.get('key');
 *
 * // Monitor connection status
 * const status = getConnectionStatus();
 * console.log(`Redis connection status: ${status}`);
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
 * Connection status enum
 * Represents the current state of the Redis connection
 */
export enum ConnectionStatus {
  /** Initial connection attempt in progress */
  CONNECTING = 'connecting',
  /** Successfully connected and ready */
  CONNECTED = 'connected',
  /** Connection closed or ended */
  DISCONNECTED = 'disconnected',
  /** Reconnection attempt in progress */
  RECONNECTING = 'reconnecting',
  /** Connection error occurred */
  ERROR = 'error',
}

/**
 * Private variable to store the singleton Redis client instance
 * Initially null, will be initialized on first access
 */
let redisClient: Redis | null = null;

/**
 * Private variable to track connection status
 * Initially disconnected until connection is established
 */
let connectionStatus: ConnectionStatus = ConnectionStatus.DISCONNECTED;

/**
 * Private flag to track if event listeners have been registered
 * Prevents multiple registrations if client is replaced
 */
let eventListenersRegistered = false;

/**
 * Mask Redis URL credentials for logging
 * Replaces password in URL with '***' for security
 *
 * @param url - Redis connection URL
 * @returns Masked URL with credentials hidden
 */
function maskRedisUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    if (urlObj.password) {
      urlObj.password = '***';
    }
    return urlObj.toString();
  } catch {
    // If URL parsing fails, return as-is (might be invalid URL format)
    return url;
  }
}

/**
 * Get current Redis connection status
 *
 * Returns the current connection status of the Redis client.
 * Useful for health checks and monitoring connection state.
 *
 * @returns Current connection status
 *
 * @example
 * ```typescript
 * import { getConnectionStatus } from '@/utils/redis';
 *
 * const status = getConnectionStatus();
 * if (status === ConnectionStatus.CONNECTED) {
 *   console.log('Redis is connected');
 * }
 * ```
 */
export function getConnectionStatus(): ConnectionStatus {
  return connectionStatus;
}

/**
 * Register event listeners on Redis client
 * Registers all connection event listeners for monitoring and logging
 * Prevents multiple registrations by checking eventListenersRegistered flag
 *
 * @param client - Redis client instance to register listeners on
 */
function registerEventListeners(client: Redis): void {
  // Prevent multiple registrations
  if (eventListenersRegistered) {
    logger.debug('Event listeners already registered, skipping');
    return;
  }

  const maskedUrl = maskRedisUrl(redisConfig.url);

  // Error event: Log errors and update status
  client.on('error', (error: Error) => {
    connectionStatus = ConnectionStatus.ERROR;
    logger.error(`Redis connection error (${maskedUrl}):`, error);
  });

  // Connect event: Connection established (but not yet ready)
  client.on('connect', () => {
    connectionStatus = ConnectionStatus.CONNECTING;
    logger.info(`Redis connection established (${maskedUrl})`);
  });

  // Ready event: Redis is ready to accept commands
  client.on('ready', () => {
    connectionStatus = ConnectionStatus.CONNECTED;
    logger.info(`Redis connection ready (${maskedUrl})`);
  });

  // Close event: Connection closed
  client.on('close', () => {
    connectionStatus = ConnectionStatus.DISCONNECTED;
    logger.info(`Redis connection closed (${maskedUrl})`);
  });

  // Reconnecting event: Reconnection attempt in progress
  client.on('reconnecting', (delay: number) => {
    connectionStatus = ConnectionStatus.RECONNECTING;
    logger.warn(`Redis reconnecting (${maskedUrl}) - delay: ${delay}ms`);
  });

  // End event: Connection ended (no more reconnection attempts)
  client.on('end', () => {
    connectionStatus = ConnectionStatus.DISCONNECTED;
    logger.info(`Redis connection ended (${maskedUrl})`);
  });

  eventListenersRegistered = true;
  logger.debug('Redis event listeners registered');
}

/**
 * Clean up event listeners from Redis client
 * Removes all registered event listeners
 * Used when client is replaced (dependency injection scenario)
 *
 * @param client - Redis client instance to remove listeners from
 */
function cleanupEventListeners(client: Redis): void {
  client.removeAllListeners('error');
  client.removeAllListeners('connect');
  client.removeAllListeners('ready');
  client.removeAllListeners('close');
  client.removeAllListeners('reconnecting');
  client.removeAllListeners('end');
  eventListenersRegistered = false;
  logger.debug('Redis event listeners cleaned up');
}

/**
 * Create Redis client with reconnection configuration
 * Configures ioredis with production-ready reconnection options
 *
 * @param url - Redis connection URL
 * @returns Configured Redis client instance
 */
function createRedisClient(url: string): Redis {
  // Configure reconnection options
  const options: RedisOptions = {
    // maxRetriesPerRequest: null allows unlimited retries for pub/sub operations
    // For regular commands, ioredis defaults to 3 retries
    // Setting to null is recommended for pub/sub scenarios
    maxRetriesPerRequest: null,

    // Retry strategy: exponential backoff with max delay
    retryStrategy: (times: number): number | null => {
      // Exponential backoff: 50ms, 100ms, 200ms, 400ms, 800ms, 1600ms, 3000ms (max)
      const delay = Math.min(50 * Math.pow(2, times - 1), 3000);
      logger.debug(`Redis retry strategy: attempt ${times}, delay ${delay}ms`);
      return delay;
    },

    // Enable ready check: verify Redis is ready before accepting commands
    enableReadyCheck: true,

    // Enable offline queue: queue commands when offline for later execution
    enableOfflineQueue: true,

    // Connection timeout (30 seconds)
    connectTimeout: 30000,

    // Command timeout (5 seconds)
    commandTimeout: 5000,
  };

  // Create Redis client with URL and options
  // ioredis merges URL parameters with options
  return new Redis(url, options);
}

/**
 * Get Redis client instance (singleton pattern)
 *
 * Returns a singleton Redis client instance. On first call, initializes the client
 * using the Redis configuration from `src/config/redis.ts` with comprehensive error
 * handling and reconnection logic. Subsequent calls return the same instance.
 *
 * **Dependency Injection Support:**
 * If a custom Redis client is provided, it will be used instead of creating a new instance.
 * This is useful for testing with mock Redis clients. The custom client will be stored
 * as the singleton instance for subsequent calls.
 *
 * **Event Listeners:**
 * Event listeners are automatically registered on the client for connection monitoring.
 * If a custom client is provided, listeners are registered on it as well.
 *
 * **Error Handling:**
 * If client initialization fails, an error is logged and thrown with a meaningful message.
 * Connection errors after initialization are handled by event listeners.
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
    // Clean up listeners from previous client if it exists
    if (redisClient && redisClient !== customClient) {
      cleanupEventListeners(redisClient);
    }
    
    redisClient = customClient;
    connectionStatus = ConnectionStatus.DISCONNECTED;
    eventListenersRegistered = false;
    
    // Register event listeners on custom client
    registerEventListeners(customClient);
    
    logger.debug('Using custom Redis client (dependency injection)');
    return redisClient;
  }

  // If singleton instance already exists, return it
  if (redisClient) {
    return redisClient;
  }

  // Initialize new Redis client instance
  try {
    const maskedUrl = maskRedisUrl(redisConfig.url);
    logger.debug(`Initializing Redis client with URL: ${maskedUrl}`);
    
    connectionStatus = ConnectionStatus.CONNECTING;
    
    // Create Redis client with reconnection configuration
    redisClient = createRedisClient(redisConfig.url);

    // Register event listeners for connection monitoring
    registerEventListeners(redisClient);

    logger.info('Redis client initialized successfully');
    return redisClient;
  } catch (error) {
    connectionStatus = ConnectionStatus.ERROR;
    const errorMessage = 'Failed to initialize Redis client';
    logger.error(errorMessage, error as Error);
    
    // Throw meaningful error for caller to handle
    throw new Error(`${errorMessage}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export default getRedisClient;
