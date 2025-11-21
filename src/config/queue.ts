/**
 * BullMQ queue configuration
 *
 * This module provides centralized BullMQ queue configuration,
 * converting Sidekiq configuration from Rails to BullMQ in TypeScript/Node.js.
 *
 * Rails Implementation Reference:
 * - `jarek-va/config/initializers/sidekiq.rb` - Sidekiq initialization
 * - `jarek-va/config/sidekiq.yml` - Environment-specific queue configuration
 *
 * @example
 * ```typescript
 * import { createQueue, queueConfig } from './config/queue';
 * const queue = createQueue('default');
 * ```
 */

import { Queue, QueueOptions } from 'bullmq';
import IORedis from 'ioredis';
import config from './environment';
import { redisConfig } from './redis';
import logger from './logger';

/**
 * Default job options matching Sidekiq's configuration
 * - retry: 3 in Sidekiq = attempts: 4 in BullMQ (3 retries + 1 initial attempt)
 * - backtrace: true in Sidekiq is a logging feature (full stack traces in error logs)
 * - removeOnComplete: true (clean up completed jobs)
 * - removeOnFail: false (keep failed jobs for debugging)
 */
export const defaultJobOptions = {
  attempts: 4, // 3 retries + 1 initial attempt = 4 total attempts (matches Sidekiq's retry: 3)
  removeOnComplete: true, // Clean up completed jobs
  removeOnFail: false, // Keep failed jobs for debugging (matches Sidekiq's behavior)
} as const;

/**
 * Environment-specific queue configuration
 * Matches settings from `jarek-va/config/sidekiq.yml`
 */
export interface QueueEnvironmentConfig {
  /** Number of concurrent jobs to process */
  concurrency: number;
  /** Array of queue names to process */
  queues: string[];
}

/**
 * Get environment-specific queue configuration
 * Loads settings based on NODE_ENV, matching Sidekiq's environment-specific configuration
 *
 * @returns Queue configuration for the current environment
 */
export function getQueueEnvironmentConfig(): QueueEnvironmentConfig {
  switch (config.env) {
    case 'production':
      return {
        concurrency: 10,
        queues: ['critical', 'default', 'high_priority', 'low_priority'],
      };
    case 'development':
      return {
        concurrency: 2,
        queues: ['default'],
      };
    case 'test':
      return {
        concurrency: 1,
        queues: ['default'],
      };
    default:
      // Fallback to development settings
      return {
        concurrency: 2,
        queues: ['default'],
      };
  }
}

/**
 * Redis connection instance for BullMQ
 * Reuses Redis connection configuration from redis.ts
 * Supports both server and client configurations (similar to Sidekiq's configure_server and configure_client)
 * BullMQ can use IORedis instances directly as connections
 */
export const redisConnection = new IORedis(redisConfig.url, {
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false, // Required for BullMQ
});

/**
 * Redis connection for BullMQ queues and workers
 * BullMQ accepts IORedis instances directly as connections
 */
export const connection = redisConnection;

/**
 * Queue configuration object
 * Exports configuration for use by workers and job processors
 */
export const queueConfig = {
  /** Redis connection instance */
  connection,
  /** Default job options */
  defaultJobOptions,
  /** Environment-specific configuration */
  environmentConfig: getQueueEnvironmentConfig(),
  /** Redis connection URL */
  redisUrl: redisConfig.url,
};

/**
 * Create a BullMQ queue with default configuration
 * Applies default job options and uses the shared Redis connection
 *
 * @param name - Queue name
 * @param options - Optional queue options (will be merged with default options)
 * @returns BullMQ Queue instance
 *
 * @example
 * ```typescript
 * import { createQueue } from './config/queue';
 * const defaultQueue = createQueue('default');
 * const highPriorityQueue = createQueue('high_priority', { defaultJobOptions: { priority: 10 } });
 * ```
 */
export function createQueue(name: string, options?: Partial<QueueOptions>): Queue {
  const queueOptions: QueueOptions = {
    connection,
    defaultJobOptions: {
      ...defaultJobOptions,
      ...(options?.defaultJobOptions || {}),
    },
    ...options,
  };

  logger.info({ queueName: name }, 'Creating BullMQ queue');
  return new Queue(name, queueOptions);
}

/**
 * Log queue operations
 * Ensures queue operations are logged appropriately (matching Sidekiq's Logger::INFO level)
 */
export function logQueueOperation(operation: string, details?: Record<string, unknown>): void {
  logger.info({ operation, ...details }, 'Queue operation');
}
