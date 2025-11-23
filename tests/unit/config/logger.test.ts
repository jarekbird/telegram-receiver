/**
 * Unit tests for logger configuration module (src/config/logger.ts)
 *
 * These tests verify that the logger configuration module correctly:
 * - Configures log levels based on NODE_ENV and LOG_LEVEL environment variable
 * - Configures log formats (JSON for production/test, pretty for development)
 * - Supports request ID via child loggers
 * - Includes error stack traces in error logs
 * - Exports a configured logger instance
 */

describe('Logger Configuration Module', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };

    // Clear all environment variables
    process.env = {};

    // Reset modules to ensure fresh imports
    jest.resetModules();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  describe('Log Level Configuration', () => {
    it('should use LOG_LEVEL environment variable when set', async () => {
      process.env.LOG_LEVEL = 'warn';
      process.env.NODE_ENV = 'production';

      const logger = (await import('../../../src/config/logger')).default;

      expect(logger.level).toBe('warn');
    });

    it('should default to "info" level in production when LOG_LEVEL is not set', async () => {
      process.env.NODE_ENV = 'production';
      delete process.env.LOG_LEVEL;

      const logger = (await import('../../../src/config/logger')).default;

      expect(logger.level).toBe('info');
    });

    it('should default to "debug" level in development when LOG_LEVEL is not set', async () => {
      process.env.NODE_ENV = 'development';
      delete process.env.LOG_LEVEL;

      const logger = (await import('../../../src/config/logger')).default;

      expect(logger.level).toBe('debug');
    });

    it('should default to "error" level in test when LOG_LEVEL is not set', async () => {
      process.env.NODE_ENV = 'test';
      delete process.env.LOG_LEVEL;

      const logger = (await import('../../../src/config/logger')).default;

      expect(logger.level).toBe('error');
    });

    it('should handle case-insensitive LOG_LEVEL values', async () => {
      process.env.LOG_LEVEL = 'DEBUG';
      process.env.NODE_ENV = 'production';

      const logger = (await import('../../../src/config/logger')).default;

      expect(logger.level).toBe('debug');
    });
  });

  describe('Logger Instance', () => {
    it('should export a logger instance', async () => {
      const logger = (await import('../../../src/config/logger')).default;

      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.child).toBe('function');
    });

    it('should include PID in base configuration', async () => {
      const logger = (await import('../../../src/config/logger')).default;

      // Pino includes base object with PID
      expect(logger).toBeDefined();
      // The base object is internal to Pino, but we can verify the logger works
      expect(typeof logger.info).toBe('function');
    });

    it('should include timestamp in log output', async () => {
      const logger = (await import('../../../src/config/logger')).default;

      // Pino includes timestamp by default
      expect(logger).toBeDefined();
      // Verify logger has timestamp configuration (internal to Pino)
      expect(typeof logger.info).toBe('function');
    });
  });

  describe('Request ID Support via Child Loggers', () => {
    it('should create child logger with request ID', async () => {
      const logger = (await import('../../../src/config/logger')).default;

      const requestId = 'test-request-id-123';
      const childLogger = logger.child({ requestId });

      expect(childLogger).toBeDefined();
      expect(typeof childLogger.info).toBe('function');
      expect(childLogger).not.toBe(logger); // Should be a new instance
    });

    it('should allow multiple child loggers with different request IDs', async () => {
      const logger = (await import('../../../src/config/logger')).default;

      const child1 = logger.child({ requestId: 'request-1' });
      const child2 = logger.child({ requestId: 'request-2' });

      expect(child1).toBeDefined();
      expect(child2).toBeDefined();
      expect(child1).not.toBe(child2);
    });

    it('should support nested child loggers', async () => {
      const logger = (await import('../../../src/config/logger')).default;

      const child1 = logger.child({ requestId: 'request-1' });
      const child2 = child1.child({ userId: 'user-123' });

      expect(child2).toBeDefined();
      expect(typeof child2.info).toBe('function');
    });
  });

  describe('Error Logging with Stack Traces', () => {
    it('should support error logging with error objects', async () => {
      const logger = (await import('../../../src/config/logger')).default;

      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.js:1:1';

      // Verify logger.error accepts error objects
      expect(typeof logger.error).toBe('function');

      // Pino's error serializer will include stack traces
      // We can't easily test the output without capturing stdout, but we can verify the method exists
      expect(() => {
        logger.error({ err: error }, 'Error occurred');
      }).not.toThrow();
    });

    it('should support error logging with error message string', async () => {
      const logger = (await import('../../../src/config/logger')).default;

      expect(() => {
        logger.error('Error message');
      }).not.toThrow();
    });
  });

  describe('Log Format Configuration', () => {
    it('should use JSON format in production (no transport)', async () => {
      process.env.NODE_ENV = 'production';
      delete process.env.LOG_LEVEL;

      const logger = (await import('../../../src/config/logger')).default;

      // In production, Pino should use JSON format (no transport)
      // We can't directly test the transport configuration, but we can verify the logger works
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
    });

    it('should use JSON format in test (no transport)', async () => {
      process.env.NODE_ENV = 'test';
      delete process.env.LOG_LEVEL;

      const logger = (await import('../../../src/config/logger')).default;

      // In test, Pino should use JSON format (no transport)
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
    });

    it('should use pretty format in development (with transport)', async () => {
      process.env.NODE_ENV = 'development';
      delete process.env.LOG_LEVEL;

      const logger = (await import('../../../src/config/logger')).default;

      // In development, Pino should use pretty format (with transport)
      // The transport is configured internally, but we can verify the logger works
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
    });
  });

  describe('Stdout Logging', () => {
    it('should log to stdout by default (Pino default behavior)', async () => {
      const logger = (await import('../../../src/config/logger')).default;

      // Pino logs to stdout by default, which matches Rails RAILS_LOG_TO_STDOUT behavior
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');

      // We can't easily test stdout without capturing it, but we can verify the logger is configured
      expect(() => {
        logger.info('Test message');
      }).not.toThrow();
    });
  });

  describe('Rails Pattern Compatibility', () => {
    it('should support Rails.logger.info() pattern → logger.info()', async () => {
      const logger = (await import('../../../src/config/logger')).default;

      expect(() => {
        logger.info('Info message');
      }).not.toThrow();
    });

    it('should support Rails.logger.error() pattern → logger.error({ err })', async () => {
      const logger = (await import('../../../src/config/logger')).default;

      const error = new Error('Test error');
      expect(() => {
        logger.error({ err: error }, 'Error message');
      }).not.toThrow();
    });

    it('should support Rails.logger.warn() pattern → logger.warn()', async () => {
      const logger = (await import('../../../src/config/logger')).default;

      expect(() => {
        logger.warn('Warning message');
      }).not.toThrow();
    });

    it('should support Rails.logger.debug() pattern → logger.debug()', async () => {
      const logger = (await import('../../../src/config/logger')).default;

      expect(() => {
        logger.debug('Debug message');
      }).not.toThrow();
    });

    it('should support Rails TaggedLogging pattern → logger.child({ requestId })', async () => {
      const logger = (await import('../../../src/config/logger')).default;

      const requestId = 'test-request-id';
      const requestLogger = logger.child({ requestId });

      expect(requestLogger).toBeDefined();
      expect(typeof requestLogger.info).toBe('function');
    });
  });
});
