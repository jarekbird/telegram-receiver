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
  constructor(url?: string, options?: unknown) {
    // Store URL and options for verification
    this._url = url;
    this._options = options;
    // Initialize event listeners storage
    this._listeners = new Map<string, Array<(...args: unknown[]) => void>>();
  }
  _url?: string;
  _options?: unknown;
  _listeners: Map<string, Array<(...args: unknown[]) => void>>;
  ping = jest.fn().mockResolvedValue('PONG');
  get = jest.fn();
  set = jest.fn();
  quit = jest.fn().mockResolvedValue('OK');
  disconnect = jest.fn();
  // Event listener methods
  on = jest.fn((event: string, handler: (...args: unknown[]) => void) => {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, []);
    }
    this._listeners.get(event)!.push(handler);
    return this;
  });
  removeAllListeners = jest.fn((event?: string) => {
    if (event) {
      this._listeners.delete(event);
    } else {
      this._listeners.clear();
    }
    return this;
  });
}

jest.mock('ioredis', () => {
  return {
    Redis: jest.fn().mockImplementation((url?: string, options?: unknown) => {
      return new MockRedis(url, options);
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
      expect(Redis).toHaveBeenCalledWith(redisConfig.url, expect.any(Object));

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

      expect(Redis).toHaveBeenCalledWith(redisConfig.url, expect.any(Object));
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
      expect(Redis).toHaveBeenCalledWith(redisConfig.url, expect.any(Object));
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

  describe('Connection Status', () => {
    it('should export getConnectionStatus function', async () => {
      const { getConnectionStatus, ConnectionStatus } = await import('../../../src/utils/redis');
      
      expect(getConnectionStatus).toBeDefined();
      expect(typeof getConnectionStatus).toBe('function');
      expect(ConnectionStatus).toBeDefined();
    });

    it('should return initial connection status as DISCONNECTED', async () => {
      const { getConnectionStatus, ConnectionStatus } = await import('../../../src/utils/redis');
      
      // Before any client is created, status should be DISCONNECTED
      const status = getConnectionStatus();
      expect(status).toBe(ConnectionStatus.DISCONNECTED);
    });

    it('should track connection status when client is created', async () => {
      const { default: getClient, getConnectionStatus, ConnectionStatus } = await import('../../../src/utils/redis');
      
      getClient();
      
      // After client creation, status should be CONNECTING initially
      // (Note: In real scenario, status would change to CONNECTED when 'ready' event fires)
      const status = getConnectionStatus();
      expect([ConnectionStatus.CONNECTING, ConnectionStatus.CONNECTED]).toContain(status);
    });
  });

  describe('Event Listeners', () => {
    it('should register event listeners when client is created', async () => {
      const { default: getClient } = await import('../../../src/utils/redis');
      
      const client = getClient() as MockRedis;
      
      // Should register listeners for all events
      expect(client.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(client.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(client.on).toHaveBeenCalledWith('ready', expect.any(Function));
      expect(client.on).toHaveBeenCalledWith('close', expect.any(Function));
      expect(client.on).toHaveBeenCalledWith('reconnecting', expect.any(Function));
      expect(client.on).toHaveBeenCalledWith('end', expect.any(Function));
    });

    it('should not register event listeners multiple times', async () => {
      const { default: getClient } = await import('../../../src/utils/redis');
      
      const client1 = getClient() as MockRedis;
      const initialCallCount = (client1.on as jest.Mock).mock.calls.length;
      
      // Second call should return same instance
      const client2 = getClient() as MockRedis;
      expect(client1).toBe(client2);
      
      // Should not register listeners again
      expect((client2.on as jest.Mock).mock.calls.length).toBe(initialCallCount);
    });

    it('should register event listeners on custom client', async () => {
      const { default: getClient } = await import('../../../src/utils/redis');
      
      const mockClient = new MockRedis();
      const client = getClient(mockClient as any) as MockRedis;
      
      expect(client).toBe(mockClient);
      expect(mockClient.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockClient.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockClient.on).toHaveBeenCalledWith('ready', expect.any(Function));
      expect(mockClient.on).toHaveBeenCalledWith('close', expect.any(Function));
      expect(mockClient.on).toHaveBeenCalledWith('reconnecting', expect.any(Function));
      expect(mockClient.on).toHaveBeenCalledWith('end', expect.any(Function));
    });

    it('should clean up event listeners when custom client replaces existing client', async () => {
      const { default: getClient } = await import('../../../src/utils/redis');
      
      // Create initial client
      const client1 = getClient() as MockRedis;
      const initialRemoveCallCount = (client1.removeAllListeners as jest.Mock).mock.calls.length;
      
      // Replace with custom client
      const mockClient = new MockRedis();
      const client2 = getClient(mockClient as any) as MockRedis;
      
      // Should clean up listeners from previous client
      expect(client1.removeAllListeners).toHaveBeenCalledTimes(initialRemoveCallCount + 6); // 6 events
    });
  });

  describe('Reconnection Configuration', () => {
    it('should create Redis client with reconnection options', async () => {
      const { Redis } = await import('ioredis');
      const { default: getClient } = await import('../../../src/utils/redis');
      
      (Redis as jest.Mock).mockClear();
      
      getClient();
      
      expect(Redis).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          maxRetriesPerRequest: null,
          enableReadyCheck: true,
          enableOfflineQueue: true,
          retryStrategy: expect.any(Function),
        })
      );
    });

    it('should configure retry strategy with exponential backoff', async () => {
      const { Redis } = await import('ioredis');
      const { default: getClient } = await import('../../../src/utils/redis');
      
      getClient();
      
      const callArgs = (Redis as jest.Mock).mock.calls[0];
      const options = callArgs[1];
      const retryStrategy = options.retryStrategy;
      
      expect(retryStrategy).toBeDefined();
      expect(typeof retryStrategy).toBe('function');
      
      // Test retry strategy with different attempt numbers
      expect(retryStrategy(1)).toBe(50); // 50 * 2^0 = 50
      expect(retryStrategy(2)).toBe(100); // 50 * 2^1 = 100
      expect(retryStrategy(3)).toBe(200); // 50 * 2^2 = 200
      expect(retryStrategy(4)).toBe(400); // 50 * 2^3 = 400
      expect(retryStrategy(10)).toBe(3000); // Max delay
    });
  });

  describe('Logging', () => {
    it('should log masked URL during initialization', async () => {
      const { default: getClient } = await import('../../../src/utils/redis');
      const logger = await import('../../../src/utils/logger');
      
      getClient();
      
      // Should log with masked URL (if URL contains credentials)
      expect(logger.default.debug).toHaveBeenCalledWith(expect.stringContaining('Initializing Redis client with URL:'));
    });

    it('should log event listener registration', async () => {
      const { default: getClient } = await import('../../../src/utils/redis');
      const logger = await import('../../../src/utils/logger');
      
      jest.clearAllMocks();
      
      getClient();
      
      expect(logger.default.debug).toHaveBeenCalledWith('Redis event listeners registered');
    });
  });
});
