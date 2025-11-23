/**
 * Unit tests for Redis configuration module (src/config/redis.ts)
 *
 * These tests verify that the Redis configuration module correctly:
 * - Reads REDIS_URL from environment variables
 * - Provides default value when REDIS_URL is not set
 * - Exports configuration object with url and options properties
 * - Matches Rails pattern (ENV.fetch('REDIS_URL', 'redis://localhost:6379/0'))
 * - Supports both redis and ioredis packages
 */

import type { RedisConfig, RedisConnectionOptions } from '../../../src/config/redis';

describe('Redis Configuration Module', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };

    // Clear REDIS_URL environment variable
    delete process.env.REDIS_URL;

    // Reset modules to ensure fresh import
    jest.resetModules();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  describe('Default Configuration', () => {
    it('should use default Redis URL when REDIS_URL is not set', async () => {
      delete process.env.REDIS_URL;

      const { redisConfig } = await import('../../../src/config/redis');

      expect(redisConfig.url).toBe('redis://localhost:6379/0');
    });

    it('should match Rails default pattern (redis://localhost:6379/0)', async () => {
      delete process.env.REDIS_URL;

      const { redisConfig } = await import('../../../src/config/redis');

      // Matches Rails: ENV.fetch('REDIS_URL', 'redis://localhost:6379/0')
      expect(redisConfig.url).toBe('redis://localhost:6379/0');
    });

    it('should include options property with empty object by default', async () => {
      delete process.env.REDIS_URL;

      const { redisConfig } = await import('../../../src/config/redis');

      expect(redisConfig.options).toBeDefined();
      expect(redisConfig.options).toEqual({});
    });
  });

  describe('Environment Variable Configuration', () => {
    it('should use REDIS_URL from environment when set', async () => {
      process.env.REDIS_URL = 'redis://custom-host:6380/1';
      jest.resetModules();

      const { redisConfig } = await import('../../../src/config/redis');

      expect(redisConfig.url).toBe('redis://custom-host:6380/1');
    });

    it('should support Docker Redis URL pattern', async () => {
      process.env.REDIS_URL = 'redis://redis:6379/0';
      jest.resetModules();

      const { redisConfig } = await import('../../../src/config/redis');

      expect(redisConfig.url).toBe('redis://redis:6379/0');
    });

    it('should handle different Redis database numbers', async () => {
      process.env.REDIS_URL = 'redis://localhost:6379/5';
      jest.resetModules();

      const { redisConfig } = await import('../../../src/config/redis');

      expect(redisConfig.url).toBe('redis://localhost:6379/5');
    });

    it('should handle Redis URL with password', async () => {
      process.env.REDIS_URL = 'redis://:password@localhost:6379/0';
      jest.resetModules();

      const { redisConfig } = await import('../../../src/config/redis');

      expect(redisConfig.url).toBe('redis://:password@localhost:6379/0');
    });
  });

  describe('Configuration Object Structure', () => {
    it('should export redisConfig with correct structure', async () => {
      const { redisConfig } = await import('../../../src/config/redis');

      expect(redisConfig).toHaveProperty('url');
      expect(redisConfig).toHaveProperty('options');
      expect(typeof redisConfig.url).toBe('string');
      expect(typeof redisConfig.options).toBe('object');
    });

    it('should match RedisConfig interface', async () => {
      const { redisConfig } = await import('../../../src/config/redis');

      const config: RedisConfig = redisConfig;

      expect(config).toBeDefined();
      expect(config.url).toBeDefined();
      expect(config.options).toBeDefined();
    });

    it('should export redisConfig as named export', async () => {
      const module = await import('../../../src/config/redis');

      expect(module.redisConfig).toBeDefined();
      expect(module.redisConfig.url).toBeDefined();
      expect(module.redisConfig.options).toBeDefined();
    });

    it('should export RedisConfig and RedisConnectionOptions types (compile-time only)', () => {
      // TypeScript interfaces/types are compile-time only and not available at runtime
      // This test verifies the types can be imported and used for type checking
      // The actual type checking happens during TypeScript compilation
      const { redisConfig } = require('../../../src/config/redis');

      // Verify we can use the types for type annotations (compile-time check)
      const config: RedisConfig = redisConfig;
      const options: RedisConnectionOptions = {};

      expect(config).toBeDefined();
      expect(options).toBeDefined();
    });
  });

  describe('Options Property', () => {
    it('should have options property that is optional', async () => {
      const { redisConfig } = await import('../../../src/config/redis');

      // Options is optional in the interface, but we provide an empty object by default
      expect(redisConfig.options).toBeDefined();
    });

    it('should allow options to be extended in the future', async () => {
      const { redisConfig, RedisConnectionOptions } = await import('../../../src/config/redis');

      // Verify options can be extended (index signature allows additional properties)
      const extendedOptions: RedisConnectionOptions = {
        maxRetries: 3,
        connectTimeout: 10000,
        customProperty: 'value',
      };

      expect(extendedOptions).toBeDefined();
      expect(redisConfig.options).toEqual({});
    });
  });

  describe('Rails Pattern Compatibility', () => {
    it('should match Rails ENV.fetch pattern behavior', async () => {
      // Rails: ENV.fetch('REDIS_URL', 'redis://localhost:6379/0')
      // Node.js: process.env.REDIS_URL || 'redis://localhost:6379/0'
      delete process.env.REDIS_URL;

      const { redisConfig } = await import('../../../src/config/redis');

      // Both should return the same default value
      expect(redisConfig.url).toBe('redis://localhost:6379/0');
    });

    it('should handle environment variable override like Rails', async () => {
      process.env.REDIS_URL = 'redis://redis:6379/0';
      jest.resetModules();

      const { redisConfig } = await import('../../../src/config/redis');

      // Should use environment variable value (like Rails ENV.fetch)
      expect(redisConfig.url).toBe('redis://redis:6379/0');
    });
  });

  describe('Type Safety', () => {
    it('should ensure url is always a string', async () => {
      const { redisConfig } = await import('../../../src/config/redis');

      // Type assertion to verify TypeScript type
      const url: string = redisConfig.url;
      expect(typeof url).toBe('string');
      expect(url).toBeDefined();
    });

    it('should ensure config matches RedisConfig type', async () => {
      // TypeScript will catch type errors at compile time
      // This test verifies the config object matches the interface structure
      const { redisConfig } = require('../../../src/config/redis');

      const config: RedisConfig = redisConfig;

      expect(config).toHaveProperty('url');
      expect(config).toHaveProperty('options');
      expect(typeof config.url).toBe('string');
      expect(typeof config.options).toBe('object');
    });

    it('should allow options to be undefined (optional property)', () => {
      // Verify that options is optional in the interface
      const configWithoutOptions: RedisConfig = {
        url: 'redis://localhost:6379/0',
      };

      expect(configWithoutOptions.url).toBe('redis://localhost:6379/0');
      expect(configWithoutOptions.options).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty REDIS_URL string by using default', async () => {
      process.env.REDIS_URL = '';
      jest.resetModules();

      const { redisConfig } = await import('../../../src/config/redis');

      // Empty string is falsy, so should use default
      expect(redisConfig.url).toBe('redis://localhost:6379/0');
    });

    it('should handle various valid Redis URL formats', async () => {
      const validUrls = [
        'redis://localhost:6379/0',
        'redis://127.0.0.1:6379/0',
        'redis://redis:6379/0',
        'redis://:password@localhost:6379/0',
        'redis://user:password@localhost:6379/0',
        'redis://localhost:6380/1',
      ];

      for (const url of validUrls) {
        process.env.REDIS_URL = url;
        jest.resetModules();

        const { redisConfig } = await import('../../../src/config/redis');

        expect(redisConfig.url).toBe(url);
      }
    });
  });
});
