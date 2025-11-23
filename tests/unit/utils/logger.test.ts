/**
 * Unit tests for logger utility wrapper (src/utils/logger.ts)
 *
 * These tests verify that the logger wrapper correctly:
 * - Provides Rails.logger-like interface (info, error, warn, debug)
 * - Handles Error objects with automatic stack trace logging (Rails pattern)
 * - Forwards all arguments to underlying Pino logger
 * - Matches Rails error logging pattern (class name + message, then stack trace)
 */

import logger from '../../../src/utils/logger';
import pinoLogger from '../../../src/config/logger';

// Mock the underlying Pino logger
jest.mock('../../../src/config/logger', () => {
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    child: jest.fn(),
  };
  return {
    __esModule: true,
    default: mockLogger,
  };
});

describe('Logger Utility Wrapper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Logger Interface', () => {
    it('should export a logger instance with Rails.logger-like methods', () => {
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });
  });

  describe('info() method', () => {
    it('should log simple string messages', () => {
      logger.info('Test info message');

      expect(pinoLogger.info).toHaveBeenCalledTimes(1);
      expect(pinoLogger.info).toHaveBeenCalledWith('Test info message');
    });

    it('should support structured logging with object', () => {
      const context = { userId: '123', action: 'login' };
      logger.info('User action', context);

      expect(pinoLogger.info).toHaveBeenCalledTimes(1);
      expect(pinoLogger.info).toHaveBeenCalledWith(context, 'User action');
    });

    it('should combine multiple string arguments', () => {
      logger.info('Processing', 'message', 'with', 'multiple', 'args');

      expect(pinoLogger.info).toHaveBeenCalledTimes(1);
      expect(pinoLogger.info).toHaveBeenCalledWith('Processing message with multiple args');
    });

    it('should handle mixed arguments (strings and non-objects)', () => {
      logger.info('Processing', 123, true);

      expect(pinoLogger.info).toHaveBeenCalledTimes(1);
      expect(pinoLogger.info).toHaveBeenCalledWith('Processing 123 true');
    });
  });

  describe('warn() method', () => {
    it('should log simple string messages', () => {
      logger.warn('Test warning message');

      expect(pinoLogger.warn).toHaveBeenCalledTimes(1);
      expect(pinoLogger.warn).toHaveBeenCalledWith('Test warning message');
    });

    it('should support structured logging with object', () => {
      const context = { resource: 'file', action: 'access' };
      logger.warn('Access warning', context);

      expect(pinoLogger.warn).toHaveBeenCalledTimes(1);
      expect(pinoLogger.warn).toHaveBeenCalledWith(context, 'Access warning');
    });

    it('should combine multiple string arguments', () => {
      logger.warn('Warning:', 'multiple', 'arguments');

      expect(pinoLogger.warn).toHaveBeenCalledTimes(1);
      expect(pinoLogger.warn).toHaveBeenCalledWith('Warning: multiple arguments');
    });
  });

  describe('debug() method', () => {
    it('should log simple string messages', () => {
      logger.debug('Test debug message');

      expect(pinoLogger.debug).toHaveBeenCalledTimes(1);
      expect(pinoLogger.debug).toHaveBeenCalledWith('Test debug message');
    });

    it('should support structured logging with object', () => {
      const context = { step: 'validation', data: { key: 'value' } };
      logger.debug('Debug info', context);

      expect(pinoLogger.debug).toHaveBeenCalledTimes(1);
      expect(pinoLogger.debug).toHaveBeenCalledWith(context, 'Debug info');
    });

    it('should combine multiple string arguments', () => {
      logger.debug('Debug:', 'step', '1', 'of', '3');

      expect(pinoLogger.debug).toHaveBeenCalledTimes(1);
      expect(pinoLogger.debug).toHaveBeenCalledWith('Debug: step 1 of 3');
    });
  });

  describe('error() method - Rails error logging pattern', () => {
    it('should log simple string messages without Error objects', () => {
      logger.error('Test error message');

      expect(pinoLogger.error).toHaveBeenCalledTimes(1);
      expect(pinoLogger.error).toHaveBeenCalledWith('Test error message');
    });

    it('should support structured logging with object (no Error)', () => {
      const context = { code: 'E001', severity: 'high' };
      logger.error('Error occurred', context);

      expect(pinoLogger.error).toHaveBeenCalledTimes(1);
      expect(pinoLogger.error).toHaveBeenCalledWith(context, 'Error occurred');
    });

    it('should handle Error objects with Rails pattern - with custom message', () => {
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.js:1:1\n    at test.js:2:2';

      logger.error('Error sending Telegram message', error);

      // Rails pattern: First log error class name and message, then stack trace
      expect(pinoLogger.error).toHaveBeenCalledTimes(2);
      expect(pinoLogger.error).toHaveBeenNthCalledWith(
        1,
        'Error sending Telegram message: Error: Test error'
      );
      expect(pinoLogger.error).toHaveBeenNthCalledWith(2, error.stack);
    });

    it('should handle Error objects with Rails pattern - without custom message', () => {
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.js:1:1';

      logger.error('', error);

      // Rails pattern: First log error class name and message, then stack trace
      expect(pinoLogger.error).toHaveBeenCalledTimes(2);
      expect(pinoLogger.error).toHaveBeenNthCalledWith(1, 'Error: Test error');
      expect(pinoLogger.error).toHaveBeenNthCalledWith(2, error.stack);
    });

    it('should handle Error objects with empty message string', () => {
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.js:1:1';

      logger.error('', error);

      expect(pinoLogger.error).toHaveBeenCalledTimes(2);
      expect(pinoLogger.error).toHaveBeenNthCalledWith(1, 'Error: Test error');
      expect(pinoLogger.error).toHaveBeenNthCalledWith(2, error.stack);
    });

    it('should handle Error objects without stack trace', () => {
      const error = new Error('Test error');
      delete (error as { stack?: string }).stack;

      logger.error('Error occurred', error);

      expect(pinoLogger.error).toHaveBeenCalledTimes(2);
      expect(pinoLogger.error).toHaveBeenNthCalledWith(
        1,
        'Error occurred: Error: Test error'
      );
      expect(pinoLogger.error).toHaveBeenNthCalledWith(2, 'No stack trace available');
    });

    it('should handle custom Error classes', () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'CustomError';
        }
      }

      const error = new CustomError('Custom error message');
      error.stack = 'CustomError: Custom error message\n    at test.js:1:1';

      logger.error('Custom error occurred', error);

      expect(pinoLogger.error).toHaveBeenCalledTimes(2);
      expect(pinoLogger.error).toHaveBeenNthCalledWith(
        1,
        'Custom error occurred: CustomError: Custom error message'
      );
      expect(pinoLogger.error).toHaveBeenNthCalledWith(2, error.stack);
    });

    it('should handle Error objects with additional context', () => {
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.js:1:1';
      const context = { userId: '123', action: 'process' };

      logger.error('Error occurred', error, context);

      // Should log error in Rails pattern, then additional context
      expect(pinoLogger.error).toHaveBeenCalledTimes(3);
      expect(pinoLogger.error).toHaveBeenNthCalledWith(
        1,
        'Error occurred: Error: Test error'
      );
      expect(pinoLogger.error).toHaveBeenNthCalledWith(2, error.stack);
      expect(pinoLogger.error).toHaveBeenNthCalledWith(3, context, 'Additional context: Error occurred');
    });

    it('should handle Error objects with additional string arguments', () => {
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.js:1:1';

      logger.error('Error occurred', error, 'additional', 'context');

      expect(pinoLogger.error).toHaveBeenCalledTimes(3);
      expect(pinoLogger.error).toHaveBeenNthCalledWith(
        1,
        'Error occurred: Error: Test error'
      );
      expect(pinoLogger.error).toHaveBeenNthCalledWith(2, error.stack);
      expect(pinoLogger.error).toHaveBeenNthCalledWith(
        3,
        'Additional context: Error occurred - additional context'
      );
    });

    it('should match Rails error logging pattern from application_controller.rb', () => {
      // Simulating: Rails.logger.error("#{exception.class}: #{exception.message}")
      //           Rails.logger.error(exception.backtrace.join("\n"))
      const error = new Error('Internal server error');
      error.stack = 'Error: Internal server error\n    at ApplicationController.handle_error\n    at app.rb:10:11';

      logger.error('', error);

      expect(pinoLogger.error).toHaveBeenCalledTimes(2);
      expect(pinoLogger.error).toHaveBeenNthCalledWith(1, 'Error: Internal server error');
      expect(pinoLogger.error).toHaveBeenNthCalledWith(2, error.stack);
    });

    it('should match Rails error logging pattern from telegram_service.rb', () => {
      // Simulating: Rails.logger.error("Error sending Telegram message: #{e.message}")
      //           Rails.logger.error(e.backtrace.join("\n"))
      const error = new Error('Connection timeout');
      error.stack = 'Error: Connection timeout\n    at TelegramService.send_message\n    at service.rb:33:34';

      logger.error('Error sending Telegram message', error);

      expect(pinoLogger.error).toHaveBeenCalledTimes(2);
      expect(pinoLogger.error).toHaveBeenNthCalledWith(
        1,
        'Error sending Telegram message: Error: Connection timeout'
      );
      expect(pinoLogger.error).toHaveBeenNthCalledWith(2, error.stack);
    });

    it('should handle multiple Error objects (uses first one)', () => {
      const error1 = new Error('First error');
      error1.stack = 'Error: First error\n    at test.js:1:1';
      const error2 = new Error('Second error');
      error2.stack = 'Error: Second error\n    at test.js:2:2';

      logger.error('Multiple errors', error1, error2);

      // Should only log the first error in Rails pattern
      expect(pinoLogger.error).toHaveBeenCalledTimes(2);
      expect(pinoLogger.error).toHaveBeenNthCalledWith(
        1,
        'Multiple errors: Error: First error'
      );
      expect(pinoLogger.error).toHaveBeenNthCalledWith(2, error1.stack);
    });

    it('should combine multiple non-Error arguments when no Error present', () => {
      logger.error('Error occurred', 'additional', 'context', 123);

      expect(pinoLogger.error).toHaveBeenCalledTimes(1);
      expect(pinoLogger.error).toHaveBeenCalledWith('Error occurred additional context 123');
    });
  });

  describe('Rails.logger pattern compatibility', () => {
    it('should support Rails.logger.info() pattern', () => {
      logger.info('Processing message');

      expect(pinoLogger.info).toHaveBeenCalledWith('Processing message');
    });

    it('should support Rails.logger.error() pattern with Error', () => {
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.js:1:1';

      logger.error('Error occurred', error);

      expect(pinoLogger.error).toHaveBeenCalledTimes(2);
    });

    it('should support Rails.logger.warn() pattern', () => {
      logger.warn('Warning message');

      expect(pinoLogger.warn).toHaveBeenCalledWith('Warning message');
    });

    it('should support Rails.logger.debug() pattern', () => {
      logger.debug('Debug information');

      expect(pinoLogger.debug).toHaveBeenCalledWith('Debug information');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string message', () => {
      logger.info('');

      expect(pinoLogger.info).toHaveBeenCalledWith('');
    });

    it('should handle null and undefined in arguments (converts to string)', () => {
      logger.info('Message', null, undefined);

      expect(pinoLogger.info).toHaveBeenCalledWith('Message null undefined');
    });

    it('should handle Error with empty message', () => {
      const error = new Error('');
      error.stack = 'Error\n    at test.js:1:1';
      // Note: JavaScript Error constructor may set a default message even when passed empty string
      // The actual message might be empty or a default like "Unknown error"

      logger.error('Error occurred', error);

      expect(pinoLogger.error).toHaveBeenCalledTimes(2);
      // Error message will be whatever JavaScript assigns (could be empty or default)
      expect(pinoLogger.error).toHaveBeenNthCalledWith(1, expect.stringContaining('Error occurred: Error:'));
      expect(pinoLogger.error).toHaveBeenNthCalledWith(2, error.stack);
    });

    it('should handle Error with unknown class name', () => {
      const error = Object.create(null);
      error.message = 'Unknown error';
      error.stack = 'Unknown error\n    at test.js:1:1';
      Object.setPrototypeOf(error, Error.prototype);

      logger.error('Error occurred', error);

      expect(pinoLogger.error).toHaveBeenCalledTimes(2);
      // Should handle gracefully even if constructor.name is not available
      expect(pinoLogger.error).toHaveBeenNthCalledWith(1, 'Error occurred: Error: Unknown error');
    });
  });
});
