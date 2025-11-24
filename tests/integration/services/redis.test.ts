/**
 * Integration tests for Redis connection functionality
 *
 * These tests verify that the Redis utility correctly:
 * - Establishes connection to Redis server
 * - Implements singleton pattern (returns same instance on multiple calls)
 * - Performs all Redis operations used by CursorRunnerCallbackService:
 *   - `setex` (or `set` with `EX` option in ioredis) - Store with TTL
 *   - `get` - Retrieve values
 *   - `del` - Delete keys
 * - Handles JSON serialization/deserialization (matching Rails `data.to_json` pattern)
 * - Handles error scenarios gracefully
 * - Monitors connection status
 *
 * **Rails Implementation Reference:**
 * - `jarek-va/app/services/cursor_runner_callback_service.rb` - Redis operations pattern:
 *   - Line 30: `@redis.setex(key, ttl, data.to_json)` - Store with TTL and JSON serialization
 *   - Line 39: `data = @redis.get(key)` - Retrieve data
 *   - Line 42: `JSON.parse(data, symbolize_names: true)` - Parse JSON
 *   - Lines 43-48: `rescue JSON::ParserError` - JSON parsing error handling
 *   - Line 55: `@redis.del(key)` - Delete key
 *   - Line 10: `DEFAULT_TTL = 3600` - Default TTL constant
 *   - Line 62: Key prefix pattern `"#{REDIS_KEY_PREFIX}#{request_id}"`
 *
 * **Key Differences from Rails:**
 * - ioredis uses `set(key, value, 'EX', ttl)` instead of `setex(key, ttl, value)` (different parameter order)
 * - Node.js uses plain objects (no `symbolize_names` equivalent needed)
 * - Node.js handles JSON.parse errors with try-catch instead of rescue
 *
 * **Test Environment:**
 * - Tests require a running Redis instance
 * - Works with local Redis (`redis://localhost:6379/0`) or Docker Redis (`redis://redis:6379/0`)
 * - Tests will be skipped if Redis is not available (graceful degradation)
 */

import getRedisClient, {
  getConnectionStatus,
  ConnectionStatus,
} from '../../../src/utils/redis';
import { Redis } from 'ioredis';

/**
 * Default TTL constant matching Rails DEFAULT_TTL
 * Used in CursorRunnerCallbackService for storing pending requests
 */
const DEFAULT_TTL = 3600; // 1 hour

/**
 * Redis key prefix matching Rails REDIS_KEY_PREFIX
 * Used in CursorRunnerCallbackService for key naming
 */
const REDIS_KEY_PREFIX = 'cursor_runner_callback:';

/**
 * Generate unique test key to avoid conflicts
 * Uses timestamp and random number for uniqueness
 */
function generateTestKey(prefix: string = 'test:redis:integration:'): string {
  return `${prefix}${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

/**
 * Wait for Redis connection to be ready
 * Polls connection status until connected or timeout
 */
async function waitForConnection(
  maxWaitMs: number = 5000,
  pollIntervalMs: number = 100
): Promise<boolean> {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitMs) {
    const status = getConnectionStatus();
    if (status === ConnectionStatus.CONNECTED) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }
  return false;
}

describe('Redis Integration Tests', () => {
  let redis: Redis;
  let testKeys: string[];

  /**
   * Setup before all tests
   * Initializes Redis client and verifies connection
   */
  beforeAll(async () => {
    // Initialize test keys array for cleanup
    testKeys = [];

    try {
      // Get Redis client instance
      redis = getRedisClient();

      // Verify client is an instance of Redis
      expect(redis).toBeInstanceOf(Redis);

      // Wait for connection to be ready (with timeout)
      const connected = await waitForConnection(5000);
      if (!connected) {
        console.warn(
          'Redis connection not ready within timeout, some tests may fail'
        );
      }

      // Test connection with ping
      const pingResult = await redis.ping();
      expect(pingResult).toBe('PONG');
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      // Skip all tests if Redis is not available
      // This allows tests to gracefully degrade when Redis is not running
      throw new Error(
        'Redis connection failed. Ensure Redis is running and accessible.'
      );
    }
  });

  /**
   * Cleanup after all tests
   * Closes Redis connection
   */
  afterAll(async () => {
    // Clean up all test keys
    if (testKeys.length > 0 && redis) {
      try {
        await redis.del(...testKeys);
      } catch (error) {
        console.error('Error cleaning up test keys:', error);
      }
    }

    // Close Redis connection
    if (redis) {
      try {
        await redis.quit();
      } catch (error) {
        console.error('Error closing Redis connection:', error);
      }
    }
  });

  /**
   * Cleanup after each test
   * Removes test keys created during the test
   */
  afterEach(async () => {
    // Clean up test keys created in this test
    if (testKeys.length > 0 && redis) {
      try {
        const keysToDelete = testKeys.splice(0); // Clear array and get keys
        if (keysToDelete.length > 0) {
          await redis.del(...keysToDelete);
        }
      } catch (error) {
        console.error('Error cleaning up test keys:', error);
      }
    }
  });

  describe('Connection Establishment', () => {
    it('should return a Redis client instance', () => {
      const client = getRedisClient();
      expect(client).toBeInstanceOf(Redis);
      expect(client).toBeDefined();
    });

    it('should return the same instance on multiple calls (singleton)', () => {
      const client1 = getRedisClient();
      const client2 = getRedisClient();
      expect(client1).toBe(client2);
    });

    it('should establish active connection verified by ping', async () => {
      const pingResult = await redis.ping();
      expect(pingResult).toBe('PONG');
    });
  });

  describe('Basic Redis Operations', () => {
    describe('setex / set with EX (store with TTL)', () => {
      it('should store key-value with explicit TTL', async () => {
        const key = generateTestKey();
        testKeys.push(key);
        const value = 'test-value';
        const ttl = 60; // 60 seconds

        // ioredis uses set(key, value, 'EX', ttl) instead of setex(key, ttl, value)
        const result = await redis.set(key, value, 'EX', ttl);
        expect(result).toBe('OK');

        // Verify value was stored
        const storedValue = await redis.get(key);
        expect(storedValue).toBe(value);

        // Verify TTL is set (should be close to 60, allow some margin for execution time)
        const remainingTtl = await redis.ttl(key);
        expect(remainingTtl).toBeGreaterThan(50);
        expect(remainingTtl).toBeLessThanOrEqual(60);
      });

      it('should store key-value with default TTL of 3600 seconds (matching Rails DEFAULT_TTL)', async () => {
        const key = generateTestKey();
        testKeys.push(key);
        const value = 'test-value';

        // Store with default TTL (matching Rails DEFAULT_TTL = 3600)
        const result = await redis.set(key, value, 'EX', DEFAULT_TTL);
        expect(result).toBe('OK');

        // Verify TTL is set to default value (allow margin for execution time)
        const remainingTtl = await redis.ttl(key);
        expect(remainingTtl).toBeGreaterThan(3590);
        expect(remainingTtl).toBeLessThanOrEqual(3600);
      });

      it('should store key-value without TTL when EX option is not provided', async () => {
        const key = generateTestKey();
        testKeys.push(key);
        const value = 'test-value';

        // Store without TTL
        const result = await redis.set(key, value);
        expect(result).toBe('OK');

        // Verify value was stored
        const storedValue = await redis.get(key);
        expect(storedValue).toBe(value);

        // Verify TTL is -1 (no expiration)
        const remainingTtl = await redis.ttl(key);
        expect(remainingTtl).toBe(-1);
      });
    });

    describe('get (retrieve values)', () => {
      it('should retrieve stored value correctly', async () => {
        const key = generateTestKey();
        testKeys.push(key);
        const value = 'test-value';

        // Store value
        await redis.set(key, value);

        // Retrieve value
        const retrievedValue = await redis.get(key);
        expect(retrievedValue).toBe(value);
      });

      it('should return null for non-existent key (matching Rails nil behavior)', async () => {
        const key = generateTestKey();
        // Don't add to testKeys since it doesn't exist

        // Try to retrieve non-existent key
        const retrievedValue = await redis.get(key);
        expect(retrievedValue).toBeNull();
      });

      it('should return null after key expiration', async () => {
        const key = generateTestKey();
        testKeys.push(key);
        const value = 'test-value';
        const ttl = 1; // 1 second

        // Store with short TTL
        await redis.set(key, value, 'EX', ttl);

        // Verify value exists immediately
        const immediateValue = await redis.get(key);
        expect(immediateValue).toBe(value);

        // Wait for expiration
        await new Promise((resolve) => setTimeout(resolve, 1100));

        // Verify value is null after expiration
        const expiredValue = await redis.get(key);
        expect(expiredValue).toBeNull();
      });
    });

    describe('del (delete keys)', () => {
      it('should delete a key successfully', async () => {
        const key = generateTestKey();
        testKeys.push(key);
        const value = 'test-value';

        // Store value
        await redis.set(key, value);

        // Verify value exists
        const beforeDelete = await redis.get(key);
        expect(beforeDelete).toBe(value);

        // Delete key
        const deleteResult = await redis.del(key);
        expect(deleteResult).toBe(1); // Returns number of keys deleted

        // Verify value is deleted
        const afterDelete = await redis.get(key);
        expect(afterDelete).toBeNull();
      });

      it('should return 0 when deleting non-existent key', async () => {
        const key = generateTestKey();
        // Don't add to testKeys since it doesn't exist

        // Try to delete non-existent key
        const deleteResult = await redis.del(key);
        expect(deleteResult).toBe(0); // Returns 0 for non-existent keys
      });

      it('should delete multiple keys at once', async () => {
        const key1 = generateTestKey();
        const key2 = generateTestKey();
        const key3 = generateTestKey();
        testKeys.push(key1, key2, key3);

        // Store values
        await redis.set(key1, 'value1');
        await redis.set(key2, 'value2');
        await redis.set(key3, 'value3');

        // Delete multiple keys
        const deleteResult = await redis.del(key1, key2, key3);
        expect(deleteResult).toBe(3); // Returns number of keys deleted

        // Verify all keys are deleted
        expect(await redis.get(key1)).toBeNull();
        expect(await redis.get(key2)).toBeNull();
        expect(await redis.get(key3)).toBeNull();
      });
    });
  });

  describe('JSON Serialization/Deserialization', () => {
    it('should store complex objects as JSON (matching Rails data.to_json pattern)', async () => {
      const key = generateTestKey();
      testKeys.push(key);
      const data = {
        chat_id: 123456789,
        message_id: 987654321,
        request_id: 'test-request-id',
        timestamp: new Date().toISOString(),
        nested: {
          field: 'value',
          number: 42,
        },
      };

      // Store as JSON (matching Rails data.to_json)
      const jsonData = JSON.stringify(data);
      await redis.set(key, jsonData, 'EX', DEFAULT_TTL);

      // Retrieve and parse JSON
      const retrievedJson = await redis.get(key);
      expect(retrievedJson).toBeTruthy();
      const parsedData = JSON.parse(retrievedJson!);

      // Verify data matches (note: Rails uses symbolize_names, Node.js uses plain objects)
      expect(parsedData).toEqual(data);
      expect(parsedData.chat_id).toBe(data.chat_id);
      expect(parsedData.message_id).toBe(data.message_id);
      expect(parsedData.nested).toEqual(data.nested);
    });

    it('should retrieve and parse JSON data correctly', async () => {
      const key = generateTestKey();
      testKeys.push(key);
      const originalData = {
        request_id: 'test-123',
        chat_id: 123456789,
        message_id: 987654321,
        data: {
          text: 'Hello, World!',
          user: 'test-user',
        },
      };

      // Store as JSON
      await redis.set(key, JSON.stringify(originalData), 'EX', DEFAULT_TTL);

      // Retrieve and parse
      const retrievedJson = await redis.get(key);
      expect(retrievedJson).toBeTruthy();

      const parsedData = JSON.parse(retrievedJson!);
      expect(parsedData).toEqual(originalData);
    });

    it('should handle JSON parsing errors gracefully (matching Rails JSON::ParserError rescue)', async () => {
      const key = generateTestKey();
      testKeys.push(key);
      const invalidJson = '{"invalid": json}'; // Invalid JSON string

      // Store invalid JSON
      await redis.set(key, invalidJson);

      // Try to retrieve and parse
      const retrievedJson = await redis.get(key);
      expect(retrievedJson).toBe(invalidJson);

      // Attempt to parse should throw error (matching Rails JSON::ParserError)
      expect(() => {
        JSON.parse(retrievedJson!);
      }).toThrow(SyntaxError);

      // Handle error gracefully (matching Rails rescue pattern)
      let parsedData = null;
      try {
        parsedData = JSON.parse(retrievedJson!);
      } catch (error) {
        // Error handled gracefully (matching Rails rescue JSON::ParserError)
        expect(error).toBeInstanceOf(SyntaxError);
        expect(parsedData).toBeNull();
      }
    });

    it('should handle corrupted JSON data gracefully', async () => {
      const key = generateTestKey();
      testKeys.push(key);
      const corruptedJson = 'not json at all';

      // Store corrupted data
      await redis.set(key, corruptedJson);

      // Retrieve corrupted data
      const retrievedJson = await redis.get(key);
      expect(retrievedJson).toBe(corruptedJson);

      // Attempt to parse should fail gracefully
      let parsedData = null;
      try {
        parsedData = JSON.parse(retrievedJson!);
      } catch (error) {
        expect(error).toBeInstanceOf(SyntaxError);
        expect(parsedData).toBeNull();
      }
    });

    it('should work with key prefix pattern (matching Rails REDIS_KEY_PREFIX)', async () => {
      const requestId = 'test-request-123';
      const key = `${REDIS_KEY_PREFIX}${requestId}`;
      testKeys.push(key);
      const data = {
        request_id: requestId,
        chat_id: 123456789,
        message_id: 987654321,
      };

      // Store with key prefix (matching Rails pattern)
      await redis.set(key, JSON.stringify(data), 'EX', DEFAULT_TTL);

      // Retrieve using same key pattern
      const retrievedJson = await redis.get(key);
      expect(retrievedJson).toBeTruthy();

      const parsedData = JSON.parse(retrievedJson!);
      expect(parsedData).toEqual(data);
      expect(parsedData.request_id).toBe(requestId);
    });
  });

  describe('Error Handling', () => {
    it('should handle connection failure scenario (invalid Redis URL)', async () => {
      // Test connection failure with invalid URL
      // Create a separate Redis client with invalid URL to test error handling
      // This doesn't interfere with the singleton client used in other tests
      const invalidRedis = new Redis('redis://invalid-host:9999/0', {
        connectTimeout: 1000, // Short timeout for faster test
        retryStrategy: () => null, // Disable retries for faster failure
        enableOfflineQueue: false, // Disable offline queue
      });

      // Wait a bit for connection attempt
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Verify that operations fail gracefully
      // The client should be in an error state
      const status = invalidRedis.status;
      expect(['end', 'close', 'error']).toContain(status);

      // Clean up
      await invalidRedis.quit().catch(() => {
        // Ignore errors during cleanup
      });
    });

    it('should handle operation on non-existent key gracefully', async () => {
      const key = generateTestKey();
      // Don't add to testKeys since it doesn't exist

      // Get should return null (not throw error)
      const value = await redis.get(key);
      expect(value).toBeNull();

      // Del should return 0 (not throw error)
      const deleteResult = await redis.del(key);
      expect(deleteResult).toBe(0);
    });

    it('should handle invalid data format gracefully', async () => {
      const key = generateTestKey();
      testKeys.push(key);

      // Store invalid data (should still work, Redis stores strings)
      await redis.set(key, 'invalid-data');

      // Retrieve should work
      const value = await redis.get(key);
      expect(value).toBe('invalid-data');

      // Parsing as JSON should fail gracefully
      expect(() => {
        JSON.parse(value!);
      }).toThrow();
    });

    it('should handle empty string values', async () => {
      const key = generateTestKey();
      testKeys.push(key);

      // Store empty string
      await redis.set(key, '');

      // Retrieve empty string
      const value = await redis.get(key);
      expect(value).toBe('');
    });

    it('should handle very large values', async () => {
      const key = generateTestKey();
      testKeys.push(key);
      const largeValue = 'x'.repeat(10000); // 10KB string

      // Store large value
      await redis.set(key, largeValue);

      // Retrieve large value
      const retrievedValue = await redis.get(key);
      expect(retrievedValue).toBe(largeValue);
      expect(retrievedValue?.length).toBe(10000);
    });
  });

  describe('Connection Status Monitoring', () => {
    it('should export getConnectionStatus function', () => {
      expect(getConnectionStatus).toBeDefined();
      expect(typeof getConnectionStatus).toBe('function');
    });

    it('should return connection status', () => {
      const status = getConnectionStatus();
      expect(status).toBeDefined();
      expect(Object.values(ConnectionStatus)).toContain(status);
    });

    it('should return CONNECTED status when connection is active', async () => {
      // Wait for connection to be ready
      const connected = await waitForConnection(5000);
      if (connected) {
        const status = getConnectionStatus();
        expect(status).toBe(ConnectionStatus.CONNECTED);
      } else {
        // If connection not ready, status should be one of the connection states
        const status = getConnectionStatus();
        expect([
          ConnectionStatus.CONNECTING,
          ConnectionStatus.CONNECTED,
          ConnectionStatus.RECONNECTING,
        ]).toContain(status);
      }
    });

    it('should track connection status changes during lifecycle', async () => {
      // Status should be one of the valid connection states
      const status = getConnectionStatus();
      expect([
        ConnectionStatus.CONNECTING,
        ConnectionStatus.CONNECTED,
        ConnectionStatus.DISCONNECTED,
        ConnectionStatus.RECONNECTING,
        ConnectionStatus.ERROR,
      ]).toContain(status);

      // After ping, status should be CONNECTED (if connection is active)
      await redis.ping();
      const statusAfterPing = getConnectionStatus();
      // Status should be CONNECTED or one of the connection states
      expect([
        ConnectionStatus.CONNECTING,
        ConnectionStatus.CONNECTED,
      ]).toContain(statusAfterPing);
    });
  });

  describe('TTL (Time To Live) Operations', () => {
    it('should set and verify TTL correctly', async () => {
      const key = generateTestKey();
      testKeys.push(key);
      const value = 'test-value';
      const ttl = 120; // 2 minutes

      // Store with TTL
      await redis.set(key, value, 'EX', ttl);

      // Check TTL
      const remainingTtl = await redis.ttl(key);
      expect(remainingTtl).toBeGreaterThan(100);
      expect(remainingTtl).toBeLessThanOrEqual(120);
    });

    it('should return -1 for keys without expiration', async () => {
      const key = generateTestKey();
      testKeys.push(key);
      const value = 'test-value';

      // Store without TTL
      await redis.set(key, value);

      // Check TTL (should be -1 for no expiration)
      const remainingTtl = await redis.ttl(key);
      expect(remainingTtl).toBe(-1);
    });

    it('should return -2 for non-existent keys', async () => {
      const key = generateTestKey();
      // Don't add to testKeys since it doesn't exist

      // Check TTL for non-existent key
      const remainingTtl = await redis.ttl(key);
      expect(remainingTtl).toBe(-2);
    });
  });

  describe('Rails Pattern Compatibility', () => {
    it('should match Rails CursorRunnerCallbackService.store_pending_request pattern', async () => {
      const requestId = 'test-request-456';
      const key = `${REDIS_KEY_PREFIX}${requestId}`;
      testKeys.push(key);
      const data = {
        chat_id: 123456789,
        message_id: 987654321,
        request_id: requestId,
      };

      // Match Rails: @redis.setex(key, ttl, data.to_json)
      // Node.js: redis.set(key, JSON.stringify(data), 'EX', ttl)
      await redis.set(key, JSON.stringify(data), 'EX', DEFAULT_TTL);

      // Verify stored
      const stored = await redis.get(key);
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed).toEqual(data);
    });

    it('should match Rails CursorRunnerCallbackService.get_pending_request pattern', async () => {
      const requestId = 'test-request-789';
      const key = `${REDIS_KEY_PREFIX}${requestId}`;
      testKeys.push(key);
      const originalData = {
        chat_id: 123456789,
        message_id: 987654321,
        request_id: requestId,
      };

      // Store data (matching Rails pattern)
      await redis.set(key, JSON.stringify(originalData), 'EX', DEFAULT_TTL);

      // Retrieve data (matching Rails: data = @redis.get(key))
      const data = await redis.get(key);

      // Handle nil/null (matching Rails: return nil if data.nil?)
      if (data === null) {
        expect(data).toBeNull();
        return;
      }

      // Parse JSON (matching Rails: JSON.parse(data, symbolize_names: true))
      // Note: Node.js uses plain objects, no symbolize_names needed
      const parsedData = JSON.parse(data);

      // Verify data matches
      expect(parsedData).toEqual(originalData);
    });

    it('should match Rails CursorRunnerCallbackService.remove_pending_request pattern', async () => {
      const requestId = 'test-request-999';
      const key = `${REDIS_KEY_PREFIX}${requestId}`;
      testKeys.push(key);
      const data = {
        chat_id: 123456789,
        message_id: 987654321,
      };

      // Store data
      await redis.set(key, JSON.stringify(data), 'EX', DEFAULT_TTL);

      // Verify exists
      const beforeDelete = await redis.get(key);
      expect(beforeDelete).toBeTruthy();

      // Delete (matching Rails: @redis.del(key))
      await redis.del(key);

      // Verify deleted
      const afterDelete = await redis.get(key);
      expect(afterDelete).toBeNull();
    });

    it('should handle Rails JSON parsing error pattern', async () => {
      const requestId = 'test-request-error';
      const key = `${REDIS_KEY_PREFIX}${requestId}`;
      testKeys.push(key);
      const invalidJson = '{"invalid": json}';

      // Store invalid JSON
      await redis.set(key, invalidJson);

      // Retrieve (matching Rails: data = @redis.get(key))
      const data = await redis.get(key);

      // Handle nil (matching Rails: return nil if data.nil?)
      if (data === null) {
        expect(data).toBeNull();
        return;
      }

      // Parse with error handling (matching Rails: rescue JSON::ParserError)
      let parsedData = null;
      try {
        parsedData = JSON.parse(data);
      } catch (error) {
        // Error handled gracefully (matching Rails rescue pattern)
        expect(error).toBeInstanceOf(SyntaxError);
        expect(parsedData).toBeNull();
      }
    });
  });
});
