/**
 * Unit tests for CursorRunnerCallbackService
 * Tests Redis operations for storing, retrieving, and removing pending cursor-runner requests
 * 
 * Reference: jarek-va/spec/services/cursor_runner_callback_service_spec.rb
 */

import CursorRunnerCallbackService, {
  PendingRequestData,
} from '../../../src/services/cursor-runner-callback-service';
import { Redis } from 'ioredis';

// Mock logger
jest.mock('../../../src/utils/logger', () => {
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };
  return {
    __esModule: true,
    default: mockLogger,
  };
});

// Mock pino
jest.mock('../../../src/config/logger', () => {
  return {
    __esModule: true,
    default: {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    },
  };
});

// Mock ioredis
jest.mock('ioredis', () => {
  const MockRedis = jest.fn().mockImplementation(() => {
    return {
      setex: jest.fn().mockResolvedValue('OK'),
      get: jest.fn().mockResolvedValue(null),
      del: jest.fn().mockResolvedValue(1),
    };
  });
  return {
    Redis: MockRedis,
  };
});

// Import logger after mocking
import logger from '../../../src/utils/logger';
const getMockLogger = () => logger as {
  info: jest.Mock;
  error: jest.Mock;
  warn: jest.Mock;
  debug: jest.Mock;
};

describe('CursorRunnerCallbackService', () => {
  let mockRedis: jest.Mocked<Redis>;
  let service: CursorRunnerCallbackService;
  const requestId = 'telegram-1234567890-abc123';
  const uuidRequestId = '550e8400-e29b-41d4-a716-446655440000';
  const testData: PendingRequestData = {
    chat_id: 123456,
    message_id: 789,
    prompt: 'Test prompt',
    original_was_audio: false,
    created_at: '2024-01-01T00:00:00Z',
  };

  // Mock console methods
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    getMockLogger().info.mockClear();
    getMockLogger().error.mockClear();

    // Setup console spies
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Create mock Redis instance
    mockRedis = {
      setex: jest.fn().mockResolvedValue('OK'),
      get: jest.fn().mockResolvedValue(null),
      del: jest.fn().mockResolvedValue(1),
    } as unknown as jest.Mocked<Redis>;
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('Constructor', () => {
    it('should use provided redisClient when given', () => {
      const { Redis } = require('ioredis');
      jest.clearAllMocks();
      
      service = new CursorRunnerCallbackService({ redisClient: mockRedis });
      expect(Redis).not.toHaveBeenCalled();
    });

    it('should create Redis client from redisUrl when provided', () => {
      const { Redis } = require('ioredis');
      jest.clearAllMocks();
      
      const redisUrl = 'redis://localhost:6379/1';
      service = new CursorRunnerCallbackService({ redisUrl });
      expect(Redis).toHaveBeenCalledWith(redisUrl);
    });

    it('should create Redis client from REDIS_URL environment variable when no options provided', () => {
      const { Redis } = require('ioredis');
      jest.clearAllMocks();
      
      const originalEnv = process.env.REDIS_URL;
      process.env.REDIS_URL = 'redis://localhost:6379/2';
      
      service = new CursorRunnerCallbackService();
      expect(Redis).toHaveBeenCalledWith('redis://localhost:6379/2');
      
      process.env.REDIS_URL = originalEnv;
    });

    it('should default to localhost Redis URL when REDIS_URL is not set', () => {
      const { Redis } = require('ioredis');
      jest.clearAllMocks();
      
      const originalEnv = process.env.REDIS_URL;
      delete process.env.REDIS_URL;
      
      service = new CursorRunnerCallbackService();
      expect(Redis).toHaveBeenCalledWith('redis://localhost:6379/0');
      
      if (originalEnv) {
        process.env.REDIS_URL = originalEnv;
      }
    });
  });

  describe('storePendingRequest', () => {
    beforeEach(() => {
      service = new CursorRunnerCallbackService({ redisClient: mockRedis });
    });

    it('should store data in Redis with correct key and default TTL', async () => {
      const key = `cursor_runner_callback:${requestId}`;
      const jsonString = JSON.stringify(testData);

      await service.storePendingRequest(requestId, testData);

      expect(mockRedis.setex).toHaveBeenCalledWith(key, 3600, jsonString);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `Stored pending cursor-runner request: ${requestId}, TTL: 3600s`
      );
    });

    it('should accept UUID format request_id', async () => {
      const key = `cursor_runner_callback:${uuidRequestId}`;
      const jsonString = JSON.stringify(testData);

      await service.storePendingRequest(uuidRequestId, testData);

      expect(mockRedis.setex).toHaveBeenCalledWith(key, 3600, jsonString);
    });

    it('should accept custom TTL', async () => {
      const key = `cursor_runner_callback:${requestId}`;
      const jsonString = JSON.stringify(testData);
      const customTtl = 7200;

      await service.storePendingRequest(requestId, testData, customTtl);

      expect(mockRedis.setex).toHaveBeenCalledWith(key, customTtl, jsonString);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `Stored pending cursor-runner request: ${requestId}, TTL: ${customTtl}s`
      );
    });

    it('should handle partial data objects', async () => {
      const partialData: PendingRequestData = {
        chat_id: 123456,
        message_id: 789,
      };
      const key = `cursor_runner_callback:${requestId}`;
      const jsonString = JSON.stringify(partialData);

      await service.storePendingRequest(requestId, partialData);

      expect(mockRedis.setex).toHaveBeenCalledWith(key, 3600, jsonString);
    });

    it('should handle Redis connection errors', async () => {
      const redisError = new Error('Redis connection failed');
      mockRedis.setex.mockRejectedValue(redisError);

      await expect(
        service.storePendingRequest(requestId, testData)
      ).rejects.toThrow('Redis connection failed');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `Failed to store pending cursor-runner request: ${requestId}`,
        redisError
      );
    });

    it('should handle Redis operation errors', async () => {
      const redisError = new Error('SETEX operation failed');
      mockRedis.setex.mockRejectedValue(redisError);

      await expect(
        service.storePendingRequest(requestId, testData, 1800)
      ).rejects.toThrow('SETEX operation failed');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `Failed to store pending cursor-runner request: ${requestId}`,
        redisError
      );
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('getPendingRequest', () => {
    beforeEach(() => {
      service = new CursorRunnerCallbackService({ redisClient: mockRedis });
    });

    it('should retrieve and parse data from Redis', async () => {
      const key = `cursor_runner_callback:${requestId}`;
      const jsonString = JSON.stringify(testData);
      mockRedis.get.mockResolvedValue(jsonString);

      const result = await service.getPendingRequest(requestId);

      expect(mockRedis.get).toHaveBeenCalledWith(key);
      expect(result).toEqual(testData);
    });

    it('should return null when request not found', async () => {
      const key = `cursor_runner_callback:${requestId}`;
      mockRedis.get.mockResolvedValue(null);

      const result = await service.getPendingRequest(requestId);

      expect(mockRedis.get).toHaveBeenCalledWith(key);
      expect(result).toBeNull();
    });

    it('should handle JSON parsing errors gracefully', async () => {
      const key = `cursor_runner_callback:${requestId}`;
      const invalidJson = '{ invalid json }';
      mockRedis.get.mockResolvedValue(invalidJson);

      const result = await service.getPendingRequest(requestId);

      expect(mockRedis.get).toHaveBeenCalledWith(key);
      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to parse pending request data',
        {
          request_id: requestId,
          error: expect.any(String),
        }
      );
    });

    it('should handle partial data objects', async () => {
      const partialData: PendingRequestData = {
        chat_id: 123456,
      };
      const key = `cursor_runner_callback:${requestId}`;
      const jsonString = JSON.stringify(partialData);
      mockRedis.get.mockResolvedValue(jsonString);

      const result = await service.getPendingRequest(requestId);

      expect(result).toEqual(partialData);
    });

    it('should handle UUID format request_id', async () => {
      const key = `cursor_runner_callback:${uuidRequestId}`;
      const jsonString = JSON.stringify(testData);
      mockRedis.get.mockResolvedValue(jsonString);

      const result = await service.getPendingRequest(uuidRequestId);

      expect(mockRedis.get).toHaveBeenCalledWith(key);
      expect(result).toEqual(testData);
    });

    it('should handle Redis connection errors gracefully', async () => {
      const key = `cursor_runner_callback:${requestId}`;
      const redisError = new Error('Redis connection failed');
      mockRedis.get.mockRejectedValue(redisError);

      const result = await service.getPendingRequest(requestId);

      expect(mockRedis.get).toHaveBeenCalledWith(key);
      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to retrieve pending request from Redis',
        {
          request_id: requestId,
          error: 'Redis connection failed',
        }
      );
    });

    it('should handle Redis operation errors gracefully', async () => {
      const key = `cursor_runner_callback:${requestId}`;
      const redisError = new Error('GET operation failed');
      mockRedis.get.mockRejectedValue(redisError);

      const result = await service.getPendingRequest(requestId);

      expect(mockRedis.get).toHaveBeenCalledWith(key);
      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to retrieve pending request from Redis',
        {
          request_id: requestId,
          error: 'GET operation failed',
        }
      );
    });
  });

  describe('removePendingRequest', () => {
    beforeEach(() => {
      service = new CursorRunnerCallbackService({ redisClient: mockRedis });
    });

    it('should delete key from Redis', async () => {
      const key = `cursor_runner_callback:${requestId}`;

      await service.removePendingRequest(requestId);

      expect(mockRedis.del).toHaveBeenCalledWith(key);
      expect(getMockLogger().info).toHaveBeenCalledWith(
        `Removed pending cursor-runner request: ${requestId}`
      );
    });

    it('should handle UUID format request_id', async () => {
      const key = `cursor_runner_callback:${uuidRequestId}`;

      await service.removePendingRequest(uuidRequestId);

      expect(mockRedis.del).toHaveBeenCalledWith(key);
      expect(getMockLogger().info).toHaveBeenCalledWith(
        `Removed pending cursor-runner request: ${uuidRequestId}`
      );
    });
  });

  describe('Integration scenarios', () => {
    beforeEach(() => {
      service = new CursorRunnerCallbackService({ redisClient: mockRedis });
    });

    it('should store, retrieve, and remove request in sequence', async () => {
      const key = `cursor_runner_callback:${requestId}`;
      const jsonString = JSON.stringify(testData);

      // Store
      await service.storePendingRequest(requestId, testData);
      expect(mockRedis.setex).toHaveBeenCalledWith(key, 3600, jsonString);

      // Retrieve
      mockRedis.get.mockResolvedValue(jsonString);
      const retrieved = await service.getPendingRequest(requestId);
      expect(retrieved).toEqual(testData);

      // Remove
      await service.removePendingRequest(requestId);
      expect(mockRedis.del).toHaveBeenCalledWith(key);
    });

    it('should handle data with all fields', async () => {
      const fullData: PendingRequestData = {
        chat_id: 123456,
        message_id: 789,
        prompt: 'Test prompt',
        original_was_audio: true,
        created_at: '2024-01-01T00:00:00Z',
      };
      const key = `cursor_runner_callback:${requestId}`;
      const jsonString = JSON.stringify(fullData);

      await service.storePendingRequest(requestId, fullData);
      expect(mockRedis.setex).toHaveBeenCalledWith(key, 3600, jsonString);

      mockRedis.get.mockResolvedValue(jsonString);
      const result = await service.getPendingRequest(requestId);
      expect(result).toEqual(fullData);
    });
  });
});
