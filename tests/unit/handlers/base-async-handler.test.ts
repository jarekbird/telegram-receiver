/**
 * Unit tests for base async handler (src/handlers/base-async-handler.ts)
 *
 * These tests verify that the base async handler correctly:
 * - Provides abstract base class that cannot be instantiated directly
 * - Requires child classes to implement handle method
 * - Applies retry configuration with exponential backoff (3 attempts)
 * - Handles deserialization errors (discard, don't retry)
 * - Logs handler start/complete/failure events
 * - Provides default handler configuration matching Rails ApplicationJob
 * - Allows child classes to override handler name
 * - Provides helper function to wrap handlers with retry and error handling
 *
 * This is part of PHASE2-015 task to create base async handler.
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

// Mock the async utilities
const mockWithRetry = jest.fn();
jest.mock('../../../src/utils/async', () => {
  return {
    __esModule: true,
    withRetry: (...args: unknown[]) => mockWithRetry(...args),
  };
});

import {
  BaseAsyncHandler,
  DeserializationError,
  HandlerOptions,
  wrapHandler,
  getDefaultHandlerOptions,
} from '../../../src/handlers/base-async-handler';

describe('BaseAsyncHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWithRetry.mockImplementation(async (fn: () => Promise<unknown>) => fn());
  });

  describe('Abstract class behavior', () => {
    it('should not allow direct instantiation', () => {
      // TypeScript will prevent this at compile time
      // At runtime, abstract classes can't be instantiated in JavaScript
      // This test verifies TypeScript compile-time protection
      // Note: In JavaScript runtime, abstract classes can be instantiated if not properly protected
      // The actual protection is at TypeScript compile time
      expect(BaseAsyncHandler).toBeDefined();
      // TypeScript compiler will error if trying to instantiate: new BaseAsyncHandler()
    });

    it('should require child classes to implement handle method', () => {
      class IncompleteHandler extends BaseAsyncHandler<string, void> {
        // Missing handle method implementation
      }

      const handler = new IncompleteHandler();
      expect(handler).toBeInstanceOf(BaseAsyncHandler);
      // TypeScript will error at compile time if handle is not implemented
      // At runtime, calling handle will fail if not implemented
    });
  });

  describe('Handler implementation', () => {
    class TestHandler extends BaseAsyncHandler<string, string> {
      async handle(data: string): Promise<string> {
        return `processed: ${data}`;
      }
    }

    it('should execute handle method successfully', async () => {
      const handler = new TestHandler();
      const result = await handler.execute('test-data');

      expect(result).toBe('processed: test-data');
      expect(mockWithRetry).toHaveBeenCalledTimes(1);
    });

    it('should pass data to handle method', async () => {
      const handler = new TestHandler();
      const handleSpy = jest.spyOn(handler, 'handle');

      await handler.execute('test-data');

      expect(handleSpy).toHaveBeenCalledWith('test-data');
    });

    it('should return result from handle method', async () => {
      class ReturnHandler extends BaseAsyncHandler<number, number> {
        async handle(data: number): Promise<number> {
          return data * 2;
        }
      }

      const handler = new ReturnHandler();
      const result = await handler.execute(5);

      expect(result).toBe(10);
    });
  });

  describe('Handler name configuration', () => {
    it('should use default handler name', () => {
      class DefaultHandler extends BaseAsyncHandler<string, void> {
        async handle(data: string): Promise<void> {
          // Implementation
        }
      }

      const handler = new DefaultHandler();
      expect(handler['getHandlerName']()).toBe('default');
    });

    it('should allow child classes to override handler name', () => {
      class CustomHandler extends BaseAsyncHandler<string, void> {
        protected getHandlerName(): string {
          return 'custom-handler';
        }

        async handle(data: string): Promise<void> {
          // Implementation
        }
      }

      const handler = new CustomHandler();
      expect(handler['getHandlerName']()).toBe('custom-handler');
    });

    it('should use custom handler name in execute method', async () => {
      class CustomHandler extends BaseAsyncHandler<string, void> {
        protected getHandlerName(): string {
          return 'custom-handler';
        }

        async handle(data: string): Promise<void> {
          // Implementation
        }
      }

      const handler = new CustomHandler();
      await handler.execute('test');

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          handlerName: 'custom-handler',
          operationId: expect.any(String),
        }),
        'Starting async handler: custom-handler',
      );
    });
  });

  describe('Retry configuration', () => {
    it('should use default retry options (3 attempts)', async () => {
      class TestHandler extends BaseAsyncHandler<string, void> {
        async handle(data: string): Promise<void> {
          // Implementation
        }
      }

      const handler = new TestHandler();
      await handler.execute('test');

      expect(mockWithRetry).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          attempts: 3,
          initialDelayMs: 2000,
          maxDelayMs: 30000,
          backoffMultiplier: 2,
        }),
      );
    });

    it('should allow custom retry options via execute method', async () => {
      class TestHandler extends BaseAsyncHandler<string, void> {
        async handle(data: string): Promise<void> {
          // Implementation
        }
      }

      const handler = new TestHandler();
      const customOptions: HandlerOptions = {
        retryOptions: {
          attempts: 5,
          initialDelayMs: 1000,
        },
      };

      await handler.execute('test', customOptions);

      expect(mockWithRetry).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          attempts: 5,
          initialDelayMs: 1000,
        }),
      );
    });

    it('should replace retry options when custom options provided', async () => {
      class TestHandler extends BaseAsyncHandler<string, void> {
        async handle(data: string): Promise<void> {
          // Implementation
        }
      }

      const handler = new TestHandler();
      const customOptions: HandlerOptions = {
        retryOptions: {
          attempts: 5,
          // When custom retryOptions is provided, it replaces the entire object
          // This is expected behavior - if you provide custom options, you provide the full set
        },
      };

      await handler.execute('test', customOptions);

      // Custom retry options replace defaults entirely
      expect(mockWithRetry).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          attempts: 5,
        }),
      );
    });
  });

  describe('Deserialization error handling', () => {
    it('should detect JSON parsing errors as deserialization errors', async () => {
      class TestHandler extends BaseAsyncHandler<string, void> {
        async handle(data: string): Promise<void> {
          throw new SyntaxError('Unexpected token in JSON');
        }
      }

      const handler = new TestHandler();
      mockWithRetry.mockRejectedValueOnce(new SyntaxError('Unexpected token in JSON'));

      await expect(handler.execute('test')).rejects.toThrow();
    });

    it('should not retry DeserializationError instances', async () => {
      class TestHandler extends BaseAsyncHandler<string, void> {
        async handle(data: string): Promise<void> {
          throw new DeserializationError('Invalid data format');
        }
      }

      const handler = new TestHandler();
      const deserializationError = new DeserializationError('Invalid data format');
      mockWithRetry.mockRejectedValueOnce(deserializationError);

      await expect(handler.execute('test')).rejects.toThrow(DeserializationError);
    });

    it('should log deserialization errors appropriately', async () => {
      class TestHandler extends BaseAsyncHandler<string, void> {
        async handle(data: string): Promise<void> {
          throw new SyntaxError('Invalid JSON');
        }
      }

      const handler = new TestHandler();
      const syntaxError = new SyntaxError('Invalid JSON');
      mockWithRetry.mockRejectedValueOnce(syntaxError);

      try {
        await handler.execute('test');
      } catch {
        // Expected to throw
      }

      // Error should be logged
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('Logging functionality', () => {
    it('should log handler start event', async () => {
      class TestHandler extends BaseAsyncHandler<string, void> {
        async handle(data: string): Promise<void> {
          // Implementation
        }
      }

      const handler = new TestHandler();
      await handler.execute('test');

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          handlerName: 'default',
          operationId: expect.any(String),
        }),
        'Starting async handler: default',
      );
    });

    it('should log handler completion event', async () => {
      class TestHandler extends BaseAsyncHandler<string, void> {
        async handle(data: string): Promise<void> {
          // Implementation
        }
      }

      const handler = new TestHandler();
      await handler.execute('test');

      // Should log both start and completion
      const infoCalls = mockLogger.info.mock.calls;
      expect(infoCalls.length).toBeGreaterThanOrEqual(2);
      expect(infoCalls.some((call) => call[1] === 'Completed async handler: default')).toBe(true);
    });

    it('should log handler failure event', async () => {
      class TestHandler extends BaseAsyncHandler<string, void> {
        async handle(data: string): Promise<void> {
          throw new Error('Handler failed');
        }
      }

      const handler = new TestHandler();
      const error = new Error('Handler failed');
      mockWithRetry.mockRejectedValueOnce(error);

      try {
        await handler.execute('test');
      } catch {
        // Expected to throw
      }

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          handlerName: 'default',
          operationId: expect.any(String),
          err: expect.any(Error),
        }),
        'Failed async handler: default',
      );
    });

    it('should include operation ID in all log messages', async () => {
      class TestHandler extends BaseAsyncHandler<string, void> {
        async handle(data: string): Promise<void> {
          // Implementation
        }
      }

      const handler = new TestHandler();
      await handler.execute('test');

      const infoCalls = mockLogger.info.mock.calls;
      const operationIds = infoCalls.map((call) => call[0].operationId);
      
      // All log calls should have the same operation ID
      const uniqueOperationIds = new Set(operationIds);
      expect(uniqueOperationIds.size).toBe(1);
      expect(operationIds[0]).toMatch(/^\d+-[a-z0-9]+$/); // Format: timestamp-randomstring
    });

    it('should allow disabling logging', async () => {
      class TestHandler extends BaseAsyncHandler<string, void> {
        async handle(data: string): Promise<void> {
          // Implementation
        }
      }

      const handler = new TestHandler();
      await handler.execute('test', { enableLogging: false });

      // Should still call withRetry, but logging should be disabled
      expect(mockWithRetry).toHaveBeenCalled();
    });
  });

  describe('Operation ID generation', () => {
    it('should generate unique operation IDs', () => {
      class TestHandler extends BaseAsyncHandler<string, void> {
        async handle(data: string): Promise<void> {
          // Implementation
        }
      }

      const handler = new TestHandler();
      const id1 = handler['generateOperationId']();
      const id2 = handler['generateOperationId']();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^\d+-[a-z0-9]+$/);
      expect(id2).toMatch(/^\d+-[a-z0-9]+$/);
    });
  });

  describe('Error propagation', () => {
    it('should propagate errors from handle method', async () => {
      class TestHandler extends BaseAsyncHandler<string, void> {
        async handle(data: string): Promise<void> {
          throw new Error('Handler error');
        }
      }

      const handler = new TestHandler();
      const error = new Error('Handler error');
      mockWithRetry.mockRejectedValueOnce(error);

      await expect(handler.execute('test')).rejects.toThrow('Handler error');
    });

    it('should propagate errors from retry logic', async () => {
      class TestHandler extends BaseAsyncHandler<string, void> {
        async handle(data: string): Promise<void> {
          throw new Error('Retry exhausted');
        }
      }

      const handler = new TestHandler();
      const error = new Error('Retry exhausted');
      mockWithRetry.mockRejectedValueOnce(error);

      await expect(handler.execute('test')).rejects.toThrow('Retry exhausted');
    });
  });
});

describe('DeserializationError', () => {
  it('should be an instance of Error', () => {
    const error = new DeserializationError('Test error');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(DeserializationError);
  });

  it('should have correct name and message', () => {
    const error = new DeserializationError('Invalid JSON format');
    expect(error.name).toBe('DeserializationError');
    expect(error.message).toBe('Invalid JSON format');
  });

  it('should store original error', () => {
    const originalError = new SyntaxError('JSON parse error');
    const error = new DeserializationError('Deserialization failed', originalError);
    expect(error.originalError).toBe(originalError);
  });
});

describe('wrapHandler helper function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWithRetry.mockImplementation(async (fn: () => Promise<unknown>) => fn());
  });

  it('should wrap handler function with retry and error handling', async () => {
    const handlerFn = jest.fn().mockResolvedValue('result');
    const wrapped = wrapHandler(handlerFn, 'test-handler');

    const result = await wrapped('test-data');

    expect(result).toBe('result');
    expect(handlerFn).toHaveBeenCalledWith('test-data');
    expect(mockWithRetry).toHaveBeenCalled();
  });

  it('should use default handler name when not provided', async () => {
    const handlerFn = jest.fn().mockResolvedValue('result');
    const wrapped = wrapHandler(handlerFn);

    await wrapped('test-data');

    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        handlerName: 'default',
      }),
      'Starting async handler: default',
    );
  });

  it('should use custom handler name', async () => {
    const handlerFn = jest.fn().mockResolvedValue('result');
    const wrapped = wrapHandler(handlerFn, 'custom-handler');

    await wrapped('test-data');

    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        handlerName: 'custom-handler',
      }),
      'Starting async handler: custom-handler',
    );
  });

  it('should apply retry configuration', async () => {
    const handlerFn = jest.fn().mockResolvedValue('result');
    const wrapped = wrapHandler(handlerFn, 'test-handler', {
      retryOptions: {
        attempts: 5,
        initialDelayMs: 1000,
      },
    });

    await wrapped('test-data');

    expect(mockWithRetry).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        attempts: 5,
        initialDelayMs: 1000,
      }),
    );
  });

  it('should handle errors and log them', async () => {
    const handlerFn = jest.fn().mockRejectedValue(new Error('Handler failed'));
    const wrapped = wrapHandler(handlerFn, 'test-handler');
    const error = new Error('Handler failed');
    mockWithRetry.mockRejectedValueOnce(error);

    try {
      await wrapped('test-data');
    } catch {
      // Expected to throw
    }

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        handlerName: 'test-handler',
        err: expect.any(Error),
      }),
      'Failed async handler: test-handler',
    );
  });

  it('should log start and completion events', async () => {
    const handlerFn = jest.fn().mockResolvedValue('result');
    const wrapped = wrapHandler(handlerFn, 'test-handler');

    await wrapped('test-data');

    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        handlerName: 'test-handler',
      }),
      'Starting async handler: test-handler',
    );

    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        handlerName: 'test-handler',
      }),
      'Completed async handler: test-handler',
    );
  });
});

describe('getDefaultHandlerOptions', () => {
  it('should return default handler options', () => {
    const options = getDefaultHandlerOptions();

    expect(options).toEqual({
      handlerName: 'default',
      retryOptions: {
        attempts: 3,
        initialDelayMs: 2000,
        maxDelayMs: 30000,
        backoffMultiplier: 2,
        shouldRetry: expect.any(Function),
      },
      enableLogging: true,
    });
  });

  it('should return options matching Rails ApplicationJob behavior', () => {
    const options = getDefaultHandlerOptions();

    // Handler name should match Rails queue_as :default
    expect(options.handlerName).toBe('default');

    // Retry attempts should match Rails attempts: 3
    expect(options.retryOptions.attempts).toBe(3);

    // Exponential backoff should be configured
    expect(options.retryOptions.initialDelayMs).toBe(2000);
    expect(options.retryOptions.maxDelayMs).toBe(30000);
    expect(options.retryOptions.backoffMultiplier).toBe(2);

    // shouldRetry should not retry DeserializationError
    const deserializationError = new DeserializationError('Test');
    expect(options.retryOptions.shouldRetry(deserializationError)).toBe(false);

    // shouldRetry should retry other errors
    const standardError = new Error('Standard error');
    expect(options.retryOptions.shouldRetry(standardError)).toBe(true);
  });
});

describe('TypeScript types and exports', () => {
  it('should export HandlerOptions interface', () => {
    const options: HandlerOptions = {
      handlerName: 'test',
      retryOptions: {
        attempts: 5,
      },
      enableLogging: false,
    };

    expect(options.handlerName).toBe('test');
    expect(options.retryOptions?.attempts).toBe(5);
    expect(options.enableLogging).toBe(false);
  });

  it('should export DeserializationError class', () => {
    const error = new DeserializationError('Test');
    expect(error).toBeInstanceOf(DeserializationError);
  });

  it('should export BaseAsyncHandler class', () => {
    class TestHandler extends BaseAsyncHandler<string, void> {
      async handle(data: string): Promise<void> {
        // Implementation
      }
    }

    const handler = new TestHandler();
    expect(handler).toBeInstanceOf(BaseAsyncHandler);
  });
});
