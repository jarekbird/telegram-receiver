import { Redis } from 'ioredis';
import logger from '@/utils/logger';

/**
 * Interface for pending request data stored in Redis
 * Matches the data structure used in Rails implementation
 */
export interface PendingRequestData {
  chat_id?: number;
  message_id?: number;
  prompt?: string;
  original_was_audio?: boolean;
  created_at?: string; // ISO8601 format
  [key: string]: unknown; // Allow additional fields
}

/**
 * Service for managing cursor-runner callback state
 * Stores pending requests in Redis and handles webhook callbacks
 * 
 * This service provides methods to store, retrieve, and remove pending request
 * information with TTL support. It manages cursor-runner callback state by
 * storing pending requests in Redis.
 * 
 * Reference: jarek-va/app/services/cursor_runner_callback_service.rb
 */
class CursorRunnerCallbackService {
  private static readonly REDIS_KEY_PREFIX = 'cursor_runner_callback:';
  private static readonly DEFAULT_TTL = 3600; // 1 hour in seconds

  private redis: Redis;

  /**
   * Creates a new CursorRunnerCallbackService instance
   * @param options - Configuration options
   * @param options.redisClient - Optional Redis client instance (for dependency injection/testing)
   * @param options.redisUrl - Optional Redis URL to create a new client from
   * 
   * If redisClient is provided, it will be used directly.
   * If redisUrl is provided, a new Redis client will be created from the URL.
   * If neither is provided, REDIS_URL environment variable will be used (default: 'redis://localhost:6379/0')
   * 
   * Note: This service creates its own Redis client instance (matching Rails pattern),
   * rather than using the getRedisClient() utility.
   */
  constructor(options?: { redisClient?: Redis; redisUrl?: string }) {
    if (options?.redisClient) {
      this.redis = options.redisClient;
    } else {
      const redisUrl = options?.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379/0';
      this.redis = new Redis(redisUrl);
    }
  }

  /**
   * Generates Redis key for a request ID
   * @param requestId - Request ID
   * @returns Redis key string
   */
  private redisKey(requestId: string): string {
    return `${CursorRunnerCallbackService.REDIS_KEY_PREFIX}${requestId}`;
  }

  /**
   * Stores pending request information in Redis with TTL
   * @param requestId - Unique request ID
   * @param data - Data to store (chat_id, message_id, etc.)
   * @param ttl - Time to live in seconds (default: 1 hour)
   */
  async storePendingRequest(
    requestId: string,
    data: PendingRequestData,
    ttl: number = CursorRunnerCallbackService.DEFAULT_TTL
  ): Promise<void> {
    try {
      const key = this.redisKey(requestId);
      const jsonString = JSON.stringify(data);
      
      await this.redis.setex(key, ttl, jsonString);
      console.log(`Stored pending cursor-runner request: ${requestId}, TTL: ${ttl}s`);
    } catch (error) {
      console.error(`Failed to store pending cursor-runner request: ${requestId}`, error);
      throw error;
    }
  }

  /**
   * Retrieves pending request information from Redis
   * @param requestId - Request ID
   * @returns Stored data or null if not found
   */
  async getPendingRequest(requestId: string): Promise<PendingRequestData | null> {
    try {
      const key = this.redisKey(requestId);
      const data = await this.redis.get(key);
      
      if (data === null) {
        return null;
      }

      try {
        return JSON.parse(data) as PendingRequestData;
      } catch (error) {
        // Handle JSON parsing errors gracefully
        if (error instanceof SyntaxError) {
          console.error('Failed to parse pending request data', {
            request_id: requestId,
            error: error.message,
          });
          return null;
        }
        // Re-throw non-parsing errors
        throw error;
      }
    } catch (error) {
      // Handle Redis connection and operation errors gracefully
      console.error('Failed to retrieve pending request from Redis', {
        request_id: requestId,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Removes pending request from Redis (called after processing callback)
   * @param requestId - Request ID
   */
  async removePendingRequest(requestId: string): Promise<void> {
    const key = this.redisKey(requestId);
    await this.redis.del(key);
    logger.info(`Removed pending cursor-runner request: ${requestId}`);
  }
}

export default CursorRunnerCallbackService;
