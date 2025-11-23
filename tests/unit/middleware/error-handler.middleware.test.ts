/**
 * Unit tests for error handling middleware
 * Verifies that unhandled errors are caught and return standardized 500 responses matching Rails format
 */

import express from 'express';
import request from 'supertest';
import { errorHandlerMiddleware } from '../../../src/middleware/error-handler.middleware';

interface ErrorResponse {
  ok: boolean;
  say: string;
  result: {
    error: string;
  };
}

describe('Error Handler Middleware', () => {
  let app: express.Application;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Create a test Express app
    app = express();
    app.use(express.json());

    // Spy on console.error to verify error logging
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {
      // Mock implementation - don't actually log to console during tests
    });
  });

  afterEach(() => {
    // Restore console.error after each test
    consoleErrorSpy.mockRestore();
  });

  describe('Error response format', () => {
    it('should return 500 status code for unhandled errors', async () => {
      // Create route that throws an error
      app.get('/error', () => {
        throw new Error('Test error');
      });

      // Register error handler middleware after routes
      app.use(errorHandlerMiddleware);

      const response = await request(app).get('/error');

      expect(response.status).toBe(500);
    });

    it('should return JSON error response matching Rails format', async () => {
      app.get('/error', () => {
        throw new Error('Test error message');
      });

      app.use(errorHandlerMiddleware);

      const response = await request(app).get('/error');

      expect(response.body).toEqual({
        ok: false,
        say: 'Sorry, I encountered an error processing your request.',
        result: {
          error: 'Test error message',
        },
      });
    });

    it('should return correct response format with all required fields', async () => {
      app.get('/error', () => {
        throw new Error('Test error');
      });

      app.use(errorHandlerMiddleware);

      const response = await request(app).get('/error');

      expect(response.body).toHaveProperty('ok');
      expect(response.body).toHaveProperty('say');
      expect(response.body).toHaveProperty('result');
      expect((response.body as { result: { error: string } }).result).toHaveProperty('error');

      expect((response.body as { ok: boolean }).ok).toBe(false);
      expect((response.body as { say: string }).say).toBe(
        'Sorry, I encountered an error processing your request.',
      );
      expect((response.body as { result: { error: string } }).result.error).toBe('Test error');
    });

    it('should include error message in response result.error field', async () => {
      const errorMessage = 'Custom error message';
      app.get('/error', () => {
        throw new Error(errorMessage);
      });

      app.use(errorHandlerMiddleware);

      const response = await request(app).get('/error');
      const body = response.body as ErrorResponse;

      expect(body.result.error).toBe(errorMessage);
    });
  });

  describe('Error logging', () => {
    it('should log error name/class when error is thrown', async () => {
      app.get('/error', () => {
        throw new Error('Test error');
      });

      app.use(errorHandlerMiddleware);

      await request(app).get('/error');

      // Verify console.error was called
      expect(consoleErrorSpy).toHaveBeenCalled();
      // Verify error name/class is logged
      const errorLogCall = consoleErrorSpy.mock.calls.find((call) =>
        call[0]?.includes('Error:'),
      );
      expect(errorLogCall).toBeDefined();
    });

    it('should log error message when error is thrown', async () => {
      const errorMessage = 'Test error message';
      app.get('/error', () => {
        throw new Error(errorMessage);
      });

      app.use(errorHandlerMiddleware);

      await request(app).get('/error');

      // Verify error message is logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining(errorMessage),
      );
    });

    it('should log stack trace when error is thrown', async () => {
      app.get('/error', () => {
        throw new Error('Test error');
      });

      app.use(errorHandlerMiddleware);

      await request(app).get('/error');

      // Verify console.error was called multiple times (error message + stack trace)
      expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
      // Second call should be the stack trace
      expect(consoleErrorSpy.mock.calls[1][0]).toContain('at');
    });

    it('should handle errors without stack trace', async () => {
      const error = new Error('Test error');
      delete (error as { stack?: string }).stack;

      app.get('/error', () => {
        throw error;
      });

      app.use(errorHandlerMiddleware);

      const response = await request(app).get('/error');

      expect(response.status).toBe(500);
      // Should only log error message, not stack trace
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Different error types', () => {
    it('should handle standard Error objects', async () => {
      app.get('/error', () => {
        throw new Error('Standard error');
      });

      app.use(errorHandlerMiddleware);

      const response = await request(app).get('/error');

      expect(response.status).toBe(500);
      expect((response.body as ErrorResponse).result.error).toBe('Standard error');
    });

    it('should handle TypeError', async () => {
      app.get('/error', () => {
        throw new TypeError('Type error');
      });

      app.use(errorHandlerMiddleware);

      const response = await request(app).get('/error');

      expect(response.status).toBe(500);
      expect((response.body as ErrorResponse).result.error).toBe('Type error');
      // Verify error name/class is logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('TypeError:'));
    });

    it('should handle ReferenceError', async () => {
      app.get('/error', () => {
        throw new ReferenceError('Reference error');
      });

      app.use(errorHandlerMiddleware);

      const response = await request(app).get('/error');

      expect(response.status).toBe(500);
      expect((response.body as ErrorResponse).result.error).toBe('Reference error');
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('ReferenceError:'));
    });

    it('should handle custom error classes', async () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'CustomError';
        }
      }

      app.get('/error', () => {
        throw new CustomError('Custom error message');
      });

      app.use(errorHandlerMiddleware);

      const response = await request(app).get('/error');

      expect(response.status).toBe(500);
      expect((response.body as ErrorResponse).result.error).toBe('Custom error message');
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('CustomError:'));
    });

    it('should handle errors without name property', async () => {
      const error = { message: 'Error without name' } as Error;

      app.get('/error', () => {
        throw error;
      });

      app.use(errorHandlerMiddleware);

      const response = await request(app).get('/error');

      expect(response.status).toBe(500);
      expect((response.body as ErrorResponse).result.error).toBe('Error without name');
    });
  });

  describe('Response already sent handling', () => {
    it('should not send response if headers have already been sent', async () => {
      // Create app with middleware that sends response before error handler
      const testApp = express();
      testApp.use(express.json());

      // Middleware that sends response and then throws error
      testApp.use((_req, res, next) => {
        res.status(200).json({ message: 'already sent' });
        // Response is sent, then throw error
        next(new Error('Error after response sent'));
      });

      // Error handler should check res.headersSent and not try to send response
      testApp.use(errorHandlerMiddleware);

      const response = await request(testApp).get('/test');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'already sent' });
    });

    it('should handle case where response is sent in route handler before error', async () => {
      const testApp = express();
      testApp.use(express.json());

      testApp.get('/test', (_req, res) => {
        res.status(200).json({ message: 'test' });
        // Response is sent, then throw error (shouldn't happen in practice, but test the guard)
        throw new Error('Error after response');
      });

      testApp.use(errorHandlerMiddleware);

      const response = await request(testApp).get('/test');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'test' });
    });
  });

  describe('Middleware ordering', () => {
    it('should catch errors from route handlers', async () => {
      app.get('/error', () => {
        throw new Error('Route error');
      });

      app.use(errorHandlerMiddleware);

      const response = await request(app).get('/error');

      expect(response.status).toBe(500);
      expect((response.body as ErrorResponse).result.error).toBe('Route error');
    });

    it('should catch errors from async route handlers', async () => {
      app.get('/error', async () => {
        throw new Error('Async route error');
      });

      app.use(errorHandlerMiddleware);

      const response = await request(app).get('/error');

      expect(response.status).toBe(500);
      expect((response.body as ErrorResponse).result.error).toBe('Async route error');
    });

    it('should catch errors from middleware', async () => {
      app.use((_req, _res, next) => {
        next(new Error('Middleware error'));
      });

      app.use(errorHandlerMiddleware);

      const response = await request(app).get('/test');

      expect(response.status).toBe(500);
      expect((response.body as ErrorResponse).result.error).toBe('Middleware error');
    });

    it('should not interfere with routes that do not throw errors', async () => {
      app.get('/success', (_req, res) => {
        res.json({ message: 'success' });
      });

      app.get('/error', () => {
        throw new Error('Test error');
      });

      app.use(errorHandlerMiddleware);

      // Successful route should work
      const successResponse = await request(app).get('/success');
      expect(successResponse.status).toBe(200);
      expect(successResponse.body).toEqual({ message: 'success' });

      // Error route should be handled by error handler
      const errorResponse = await request(app).get('/error');
      expect(errorResponse.status).toBe(500);
      expect((errorResponse.body as ErrorResponse).result.error).toBe('Test error');
    });
  });

  describe('Content-Type header', () => {
    it('should set Content-Type to application/json', async () => {
      app.get('/error', () => {
        throw new Error('Test error');
      });

      app.use(errorHandlerMiddleware);

      const response = await request(app).get('/error');

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('Error handler signature', () => {
    it('should have exactly 4 parameters (err, req, res, next) for Express to recognize it as error handler', () => {
      // This is a compile-time check - TypeScript will error if signature is wrong
      // Express requires error handlers to have exactly 4 parameters
      expect(errorHandlerMiddleware.length).toBe(4);
    });
  });
});
