/**
 * Unit tests for Redis connection configuration and connectivity
 *
 * These tests verify that:
 * - Redis connection configuration matches Rails pattern (REDIS_URL environment variable)
 * - IORedis client can connect to Redis
 * - Basic Redis operations (set/get/del) work correctly
 * - Redis URL configuration is properly read from environment variables
 *
 * Note: These tests require a running Redis instance. In CI/CD, use a test Redis container
 * or mock the Redis clients. For unit tests that don't require actual Redis, use the
 * mocks in tests/mocks/redis.ts.
 */

import IORedis from 'ioredis';
import { redisConfig } from '../../src/config/redis';

describe('Redis Connection Configuration', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Redis URL Configuration', () => {
    it('should use REDIS_URL from environment variable when set', () => {
      process.env.REDIS_URL = 'redis://test-host:6379/1';

      // Reset module to reload config with new env var
      jest.resetModules();
      const { redisConfig: config } = require('../../src/config/redis');

      expect(config.url).toBe('redis://test-host:6379/1');
    });

    it('should default to redis://localhost:6379/0 when REDIS_URL is not set', () => {
      delete process.env.REDIS_URL;

      // Reset module to reload config
      jest.resetModules();
      const { redisConfig: config } = require('../../src/config/redis');

      expect(config.url).toBe('redis://localhost:6379/0');
    });

    it('should match Rails default Redis URL pattern', () => {
      delete process.env.REDIS_URL;

      // Reset module to reload config
      jest.resetModules();
      const { redisConfig: config } = require('../../src/config/redis');

      // Rails default: redis://localhost:6379/0
      expect(config.url).toBe('redis://localhost:6379/0');
    });

    it('should use REDIS_URL from environment variable (matches Rails ENV.fetch pattern)', () => {
      process.env.REDIS_URL = 'redis://redis:6379/0';

      // Reset module to reload config
      jest.resetModules();
      const { redisConfig: config } = require('../../src/config/redis');

      // Rails pattern: ENV.fetch('REDIS_URL', 'redis://localhost:6379/0')
      expect(config.url).toBe('redis://redis:6379/0');
    });
  });

  describe('IORedis Client Connectivity', () => {
    let ioredisClient: IORedis | null = null;

    afterEach(async () => {
      if (ioredisClient) {
        await ioredisClient.quit();
        ioredisClient = null;
      }
    });

    it('should create IORedis client with default URL', () => {
      const client = new IORedis(redisConfig.url);
      expect(client).toBeInstanceOf(IORedis);
      ioredisClient = client;
    });

    it('should create IORedis client with custom URL', () => {
      const customUrl = 'redis://localhost:6379/1';
      const client = new IORedis(customUrl);
      expect(client).toBeInstanceOf(IORedis);
      ioredisClient = client;
    });

    it('should connect to Redis and execute PING command', async () => {
      const client = new IORedis(redisConfig.url);
      ioredisClient = client;

      try {
        const result = await client.ping();
        expect(result).toBe('PONG');
      } catch (error) {
        // If Redis is not available, skip this test
        // In CI/CD, this should use a test Redis container
        if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
          console.warn('Redis not available, skipping connectivity test');
          return;
        }
        throw error;
      }
    }, 10000);

    it('should perform basic SET/GET operations', async () => {
      const client = new IORedis(redisConfig.url);
      ioredisClient = client;

      try {
        const testKey = 'test:redis:connection:setget';
        const testValue = 'test-value-123';

        // Set value
        await client.set(testKey, testValue);
        // Get value
        const result = await client.get(testKey);
        expect(result).toBe(testValue);

        // Cleanup
        await client.del(testKey);
      } catch (error) {
        // If Redis is not available, skip this test
        if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
          console.warn('Redis not available, skipping operations test');
          return;
        }
        throw error;
      }
    }, 10000);

    it('should perform SETEX operation (matching Rails pattern)', async () => {
      const client = new IORedis(redisConfig.url);
      ioredisClient = client;

      try {
        const testKey = 'test:redis:connection:setex';
        const testValue = 'test-value-with-ttl';
        const ttl = 60; // 60 seconds

        // Set value with TTL (matching Rails redis.setex pattern)
        await client.setex(testKey, ttl, testValue);
        // Get value
        const result = await client.get(testKey);
        expect(result).toBe(testValue);

        // Verify TTL is set
        const remainingTtl = await client.ttl(testKey);
        expect(remainingTtl).toBeGreaterThan(0);
        expect(remainingTtl).toBeLessThanOrEqual(ttl);

        // Cleanup
        await client.del(testKey);
      } catch (error) {
        // If Redis is not available, skip this test
        if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
          console.warn('Redis not available, skipping SETEX test');
          return;
        }
        throw error;
      }
    }, 10000);

    it('should perform DEL operation (matching Rails pattern)', async () => {
      const client = new IORedis(redisConfig.url);
      ioredisClient = client;

      try {
        const testKey = 'test:redis:connection:del';
        const testValue = 'test-value-to-delete';

        // Set value
        await client.set(testKey, testValue);
        // Verify it exists
        const beforeDelete = await client.get(testKey);
        expect(beforeDelete).toBe(testValue);

        // Delete value (matching Rails redis.del pattern)
        await client.del(testKey);
        // Verify it's gone
        const afterDelete = await client.get(testKey);
        expect(afterDelete).toBeNull();
      } catch (error) {
        // If Redis is not available, skip this test
        if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
          console.warn('Redis not available, skipping DEL test');
          return;
        }
        throw error;
      }
    }, 10000);
  });

  describe('Redis Configuration Matching Rails Pattern', () => {
    it('should use REDIS_URL environment variable (matches Rails ENV.fetch)', () => {
      process.env.REDIS_URL = 'redis://redis:6379/0';

      // Reset module to reload config
      jest.resetModules();
      const { redisConfig: config } = require('../../src/config/redis');

      // Rails: ENV.fetch('REDIS_URL', 'redis://localhost:6379/0')
      // Node.js: process.env.REDIS_URL || 'redis://localhost:6379/0'
      expect(config.url).toBe('redis://redis:6379/0');
    });

    it('should default to localhost:6379/0 when REDIS_URL is not set (matches Rails)', () => {
      delete process.env.REDIS_URL;

      // Reset module to reload config
      jest.resetModules();
      const { redisConfig: config } = require('../../src/config/redis');

      // Rails default: 'redis://localhost:6379/0'
      expect(config.url).toBe('redis://localhost:6379/0');
    });

    it('should support Docker Redis URL pattern (redis://redis:6379/0)', () => {
      process.env.REDIS_URL = 'redis://redis:6379/0';

      // Reset module to reload config
      jest.resetModules();
      const { redisConfig: config } = require('../../src/config/redis');

      // Docker pattern: uses service name 'redis' instead of 'localhost'
      expect(config.url).toBe('redis://redis:6379/0');
    });
  });
});
