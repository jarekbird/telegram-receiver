/**
 * Unit tests for Redis connection utility (src/utils/redis.ts)
 *
 * These tests verify that the Redis utility correctly:
 * - Implements singleton pattern (returns same instance on multiple calls)
 * - Supports dependency injection (allows passing custom Redis client for testing)
 * - Handles initialization errors gracefully
 * - Uses Redis configuration from src/config/redis.ts
 * - Matches Rails pattern (dependency injection support, environment variable with default)
 */

// Mock the logger utility first (before any imports)
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

jest.mock('../../../src/utils/logger', () => {
  return {
    __esModule: true,
    default: mockLogger,
  };
});

// Mock the Redis config
jest.mock('../../../src/config/redis', () => ({
  redisConfig: {
    url: 'redis://localhost:6379/0',
    options: {},
  },
}));

// Mock ioredis module - create a mock class that can be used with instanceof
class MockRedis {
  constructor(url?: string) {
    // Store URL for verification
    this._url = url;
  }
  _url?: string;
  ping = jest.fn().mockResolvedValue('PONG');
  get = jest.fn();
  set = jest.fn();
  quit = jest.fn().mockResolvedValue('OK');
  disconnect = jest.fn();
}

jest.mock('ioredis', () => {
  return {
    Redis: jest.fn().mockImplementation((url?: string) => {
      return new MockRedis(url);
    }),
  };
});

describe('Redis Connection Utility', () => {
  // Clear module cache before each test to reset singleton state
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any Redis clients created during tests
    jest.resetModules();
  });

  describe('Singleton Pattern', () => {
    it('should return the same Redis client instance on multiple calls', async () => {
      const { default: getClient } = await import('../../../src/utils/redis');

      const client1 = getClient();
      const client2 = getClient();

      expect(client1).toBe(client2);
      expect(client1).toBeInstanceOf(MockRedis);
      expect(client1).toBeDefined();
    });

    it('should initialize client only once', async () => {
      const { Redis } = await import('ioredis');
      const { redisConfig } = await import('../../../src/config/redis');
      const { default: getClient } = await import('../../../src/utils/redis');

      // Clear any previous calls
      (Redis as jest.Mock).mockClear();

      // First call should initialize
      const client1 = getClient();
      expect(Redis).toHaveBeenCalledTimes(1);
      expect(Redis).toHaveBeenCalledWith(redisConfig.url);

      // Second call should return existing instance
      const client2 = getClient();
      expect(Redis).toHaveBeenCalledTimes(1); // Still only called once
      expect(client1).toBe(client2);
    });

    it('should use Redis configuration URL for initialization', async () => {
      const { Redis } = await import('ioredis');
      const { redisConfig } = await import('../../../src/config/redis');
      const { default: getClient } = await import('../../../src/utils/redis');

      (Redis as jest.Mock).mockClear();

      getClient();

      expect(Redis).toHaveBeenCalledWith(redisConfig.url);
    });
  });

  describe('Dependency Injection', () => {
    it('should accept custom Redis client for dependency injection', async () => {
      const { default: getClient } = await import('../../../src/utils/redis');
      const { Redis } = await import('ioredis');

      const mockClient = new MockRedis();

      (Redis as jest.Mock).mockClear();

      const client = getClient(mockClient as any);

      expect(client).toBe(mockClient);
      // Should not create a new instance when custom client is provided
      expect(Redis).not.toHaveBeenCalled();
    });

    it('should store custom client as singleton instance', async () => {
      const { default: getClient } = await import('../../../src/utils/redis');

      const mockClient = new MockRedis();

      // First call with custom client
      const client1 = getClient(mockClient as any);
      // Second call should return the same custom client
      const client2 = getClient();

      expect(client1).toBe(mockClient);
      expect(client2).toBe(mockClient);
      expect(client1).toBe(client2);
    });

    it('should log debug message when using custom client', async () => {
      const { default: getClient } = await import('../../../src/utils/redis');
      const logger = await import('../../../src/utils/logger');

      const mockClient = new MockRedis();

      getClient(mockClient as any);

      expect(logger.default.debug).toHaveBeenCalledWith('Using custom Redis client (dependency injection)');
    });

    it('should match Rails pattern where redis_client takes precedence', async () => {
      // Rails pattern: if redis_client provided, use it; otherwise use redis_url
      const { default: getClient } = await import('../../../src/utils/redis');
      const { Redis } = await import('ioredis');

      const mockClient = new MockRedis();

      (Redis as jest.Mock).mockClear();

      // Custom client should take precedence (like Rails redis_client parameter)
      const client = getClient(mockClient as any);

      expect(client).toBe(mockClient);
      expect(Redis).not.toHaveBeenCalled(); // Should not create new instance
    });
  });

  describe('Error Handling', () => {
    it('should handle Redis client initialization errors', async () => {
      const { Redis } = await import('ioredis');
      const { default: getClient } = await import('../../../src/utils/redis');

      const initError = new Error('Failed to connect to Redis');
      (Redis as jest.Mock).mockImplementation(() => {
        throw initError;
      });

      expect(() => getClient()).toThrow('Failed to initialize Redis client: Failed to connect to Redis');
    });

    it('should log initialization errors', async () => {
      const { Redis } = await import('ioredis');
      const { default: getClient } = await import('../../../src/utils/redis');
      const logger = await import('../../../src/utils/logger');

      const initError = new Error('Connection refused');
      (Redis as jest.Mock).mockImplementation(() => {
        throw initError;
      });

      try {
        getClient();
      } catch (error) {
        // Expected to throw
      }

      expect(logger.default.error).toHaveBeenCalledWith('Failed to initialize Redis client', initError);
    });

    it('should throw meaningful error message on initialization failure', async () => {
      const { Redis } = await import('ioredis');
      const { default: getClient } = await import('../../../src/utils/redis');

      const initError = new Error('ECONNREFUSED');
      (Redis as jest.Mock).mockImplementation(() => {
        throw initError;
      });

      expect(() => getClient()).toThrow('Failed to initialize Redis client: ECONNREFUSED');
    });

    it('should handle non-Error exceptions during initialization', async () => {
      const { Redis } = await import('ioredis');
      const { default: getClient } = await import('../../../src/utils/redis');

      (Redis as jest.Mock).mockImplementation(() => {
        throw 'String error'; // Non-Error exception
      });

      expect(() => getClient()).toThrow('Failed to initialize Redis client: String error');
    });
  });

  describe('Logging', () => {
    it('should log debug message with Redis URL during initialization', async () => {
      const { default: getClient } = await import('../../../src/utils/redis');
      const { redisConfig } = await import('../../../src/config/redis');
      const logger = await import('../../../src/utils/logger');

      getClient();

      expect(logger.default.debug).toHaveBeenCalledWith(`Initializing Redis client with URL: ${redisConfig.url}`);
    });

    it('should log info message on successful initialization', async () => {
      const { default: getClient } = await import('../../../src/utils/redis');
      const logger = await import('../../../src/utils/logger');

      getClient();

      expect(logger.default.info).toHaveBeenCalledWith('Redis client initialized successfully');
    });

    it('should not log initialization messages when using custom client', async () => {
      const { default: getClient } = await import('../../../src/utils/redis');
      const logger = await import('../../../src/utils/logger');

      const mockClient = new MockRedis();

      jest.clearAllMocks();

      getClient(mockClient as any);

      // Should only log dependency injection message, not initialization messages
      expect(logger.default.debug).toHaveBeenCalledWith('Using custom Redis client (dependency injection)');
      expect(logger.default.debug).not.toHaveBeenCalledWith(expect.stringContaining('Initializing Redis client'));
      expect(logger.default.info).not.toHaveBeenCalledWith('Redis client initialized successfully');
    });
  });

  describe('Type Safety', () => {
    it('should return Redis type from ioredis', async () => {
      const { default: getClient } = await import('../../../src/utils/redis');

      const client = getClient();

      // Type check: client should be instance of MockRedis (our mock)
      expect(client).toBeInstanceOf(MockRedis);
      expect(client).toBeDefined();
    });

    it('should accept Redis type for dependency injection', async () => {
      const { default: getClient } = await import('../../../src/utils/redis');

      const mockClient = new MockRedis();

      const client = getClient(mockClient as any);

      expect(client).toBe(mockClient);
    });
  });

  describe('Rails Pattern Compatibility', () => {
    it('should match Rails initialization pattern (environment variable with default)', async () => {
      // Rails: ENV.fetch('REDIS_URL', 'redis://localhost:6379/0')
      // Node.js: Uses redisConfig.url which reads from process.env.REDIS_URL || 'redis://localhost:6379/0'
      const { Redis } = await import('ioredis');
      const { redisConfig } = await import('../../../src/config/redis');
      const { default: getClient } = await import('../../../src/utils/redis');

      (Redis as jest.Mock).mockClear();

      getClient();

      // Should use redisConfig.url (which matches Rails pattern)
      expect(Redis).toHaveBeenCalledWith(redisConfig.url);
    });

    it('should support dependency injection like Rails (redis_client parameter)', async () => {
      // Rails: def initialize(redis_client: nil, redis_url: nil)
      //        if redis_client
      //          @redis = redis_client
      //        else
      //          redis_url ||= ENV.fetch('REDIS_URL', 'redis://localhost:6379/0')
      //          @redis = Redis.new(url: redis_url)
      //        end
      const { default: getClient } = await import('../../../src/utils/redis');
      const { Redis } = await import('ioredis');

      const mockClient = new MockRedis();

      (Redis as jest.Mock).mockClear();

      // Custom client should take precedence (like Rails redis_client parameter)
      const client = getClient(mockClient as any);

      expect(client).toBe(mockClient);
      expect(Redis).not.toHaveBeenCalled(); // Should not create new instance
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple calls with custom client', async () => {
      const { default: getClient } = await import('../../../src/utils/redis');

      const mockClient = new MockRedis();

      const client1 = getClient(mockClient as any);
      const client2 = getClient();
      const client3 = getClient();

      expect(client1).toBe(mockClient);
      expect(client2).toBe(mockClient);
      expect(client3).toBe(mockClient);
      expect(client1).toBe(client2);
      expect(client2).toBe(client3);
    });

    it('should handle switching from custom client to default initialization', async () => {
      // This tests the behavior when a custom client is used first,
      // then the module is reset and a new call is made without custom client
      const { default: getClient } = await import('../../../src/utils/redis');

      const mockClient = new MockRedis();

      // First call with custom client
      const client1 = getClient(mockClient as any);
      expect(client1).toBe(mockClient);

      // Reset modules to clear singleton
      jest.resetModules();

      // After reset, new call should create new instance
      const { default: getClient2 } = await import('../../../src/utils/redis');
      const client2 = getClient2();

      expect(client2).not.toBe(mockClient);
      expect(client2).toBeInstanceOf(MockRedis);
    });
  });
});
