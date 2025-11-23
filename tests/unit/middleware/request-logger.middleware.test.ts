/**
 * Unit tests for request logger middleware
 * Verifies request/response logging functionality with request ID tracking
 */

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
// Mock calls from jest are typed as any, but we know the structure in tests

import express from 'express';
import request from 'supertest';
import { requestLoggerMiddleware } from '../../../src/middleware/request-logger.middleware';

// Mock the logger utility
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

/**
 * Type definitions for log objects
 */
interface RequestLog {
  timestamp: string;
  requestId: string;
  method: string;
  url: string;
  ip: string;
  type: 'request';
}

interface ResponseLog {
  timestamp: string;
  requestId: string;
  method: string;
  url: string;
  statusCode: number;
  duration: number;
  type: 'response';
}

type LogData = RequestLog | ResponseLog;

describe('Request Logger Middleware', () => {
  let app: express.Application;
  let logger: {
    info: jest.Mock;
    error: jest.Mock;
    warn: jest.Mock;
    debug: jest.Mock;
  };

  beforeEach(() => {
    // Get the mocked logger
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    logger = require('../../../src/utils/logger').default;
    
    // Reset all mocks
    logger.info.mockClear();
    logger.error.mockClear();
    logger.warn.mockClear();
    logger.debug.mockClear();

    // Create a test Express app
    app = express();
    app.use(express.json());
    app.use(requestLoggerMiddleware);
    app.get('/test', (_req, res) => {
      res.json({ message: 'test' });
    });
    app.post('/test', (_req, res) => {
      res.status(201).json({ message: 'created' });
    });
    app.get('/error', (_req, res) => {
      res.status(500).json({ error: 'server error' });
    });
  });

  afterEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('Request logging', () => {
    it('should log incoming request with method, URL, IP, request ID, and timestamp', async () => {
      await request(app).get('/test');

      // Verify logger.info was called at least once (for request log)
      expect(logger.info).toHaveBeenCalled();

      // Get the first call (request log) - logger.info is called with (object, message)
      const requestLogCall = logger.info.mock.calls.find((call) => {
        const logData = call[0] as LogData;
        return logData.type === 'request';
      });

      expect(requestLogCall).toBeDefined();

      const requestLog = requestLogCall[0] as RequestLog;

      expect(requestLog).toMatchObject({
        method: 'GET',
        url: '/test',
        type: 'request',
      });
      expect(requestLog.requestId).toBeDefined();
      expect(requestLog.requestId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
      expect(requestLog.timestamp).toBeDefined();
      expect(requestLog.ip).toBeDefined();
    });

    it('should log POST requests correctly', async () => {
      await request(app).post('/test');

      const requestLogCall = logger.info.mock.calls.find((call) => {
        const logData = call[0] as LogData;
        return logData.type === 'request' && logData.method === 'POST';
      });

      expect(requestLogCall).toBeDefined();

      const requestLog = requestLogCall[0] as RequestLog;
      expect(requestLog.method).toBe('POST');
      expect(requestLog.url).toBe('/test');
    });

    it('should include query string in URL when present', async () => {
      await request(app).get('/test?foo=bar&baz=qux');

      const requestLogCall = logger.info.mock.calls.find((call) => {
        const logData = call[0] as LogData;
        return logData.type === 'request';
      });

      expect(requestLogCall).toBeDefined();

      const requestLog = requestLogCall[0] as RequestLog;
      expect(requestLog.url).toBe('/test?foo=bar&baz=qux');
    });
  });

  describe('Response logging', () => {
    it('should log response with status code, duration, and request ID', async () => {
      await request(app).get('/test');

      // Wait a bit to ensure response finish event fires
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Find response log
      const responseLogCall = logger.info.mock.calls.find((call) => {
        const logData = call[0] as LogData;
        return logData.type === 'response';
      });

      expect(responseLogCall).toBeDefined();

      const responseLog = responseLogCall[0] as ResponseLog;

      expect(responseLog).toMatchObject({
        method: 'GET',
        url: '/test',
        statusCode: 200,
        type: 'response',
      });
      expect(responseLog.requestId).toBeDefined();
      expect(responseLog.duration).toBeDefined();
      expect(typeof responseLog.duration).toBe('number');
      expect(responseLog.duration).toBeGreaterThanOrEqual(0);
      expect(responseLog.timestamp).toBeDefined();
    });

    it('should log response with correct status code for different responses', async () => {
      await request(app).post('/test');
      await new Promise((resolve) => setTimeout(resolve, 10));

      const responseLogCall = logger.info.mock.calls.find((call) => {
        const logData = call[0] as LogData;
        return logData.type === 'response' && logData.statusCode === 201;
      });

      expect(responseLogCall).toBeDefined();

      const responseLog = responseLogCall[0] as ResponseLog;
      expect(responseLog.statusCode).toBe(201);
    });

    it('should log error responses correctly', async () => {
      await request(app).get('/error');
      await new Promise((resolve) => setTimeout(resolve, 10));

      const responseLogCall = logger.info.mock.calls.find((call) => {
        const logData = call[0] as LogData;
        return logData.type === 'response' && logData.statusCode === 500;
      });

      expect(responseLogCall).toBeDefined();

      const responseLog = responseLogCall[0] as ResponseLog;
      expect(responseLog.statusCode).toBe(500);
    });

    it('should calculate response duration correctly', async () => {
      // Add a small delay to the route handler
      app.get('/slow', (_req, res) => {
        setTimeout(() => {
          res.json({ message: 'slow' });
        }, 50);
      });

      await request(app).get('/slow');
      await new Promise((resolve) => setTimeout(resolve, 100));

      const responseLogCall = logger.info.mock.calls.find((call) => {
        const logData = call[0] as LogData;
        return logData.type === 'response' && logData.url === '/slow';
      });

      expect(responseLogCall).toBeDefined();

      const responseLog = responseLogCall[0] as ResponseLog;
      expect(responseLog.duration).toBeGreaterThanOrEqual(50);
    });
  });

  describe('Request ID handling', () => {
    it('should generate UUID request ID when req.id is not available', async () => {
      await request(app).get('/test');

      const requestLogCall = logger.info.mock.calls.find((call) => {
        const logData = call[0] as LogData;
        return logData.type === 'request';
      });

      expect(requestLogCall).toBeDefined();

      const requestLog = requestLogCall[0] as RequestLog;
      expect(requestLog.requestId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });

    it('should use req.id if available from request-id middleware', async () => {
      // Create a fresh app with request-id middleware before request logger
      const testApp = express();
      testApp.use(express.json());
      // Simulate request-id middleware by setting req.id BEFORE request logger
      testApp.use((req, _res, next) => {
        // @ts-expect-error - req.id may be set by other middleware
        req.id = 'custom-request-id-123';
        next();
      });
      testApp.use(requestLoggerMiddleware);
      testApp.get('/test', (_req, res) => {
        res.json({ message: 'test' });
      });

      await request(testApp).get('/test');

      const requestLogCall = logger.info.mock.calls.find((call) => {
        const logData = call[0] as LogData;
        return logData.type === 'request';
      });

      expect(requestLogCall).toBeDefined();

      const requestLog = requestLogCall[0] as RequestLog;
      expect(requestLog.requestId).toBe('custom-request-id-123');
    });

    it('should attach request ID to req.requestId for use in other middleware/handlers', async () => {
      let capturedRequestId: string | undefined;

      app.get('/capture-id', (req, res) => {
        capturedRequestId = req.requestId;
        res.json({ requestId: req.requestId });
      });

      await request(app).get('/capture-id');

      expect(capturedRequestId).toBeDefined();
      expect(capturedRequestId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });

    it('should use same request ID for both request and response logs', async () => {
      await request(app).get('/test');
      await new Promise((resolve) => setTimeout(resolve, 10));

      const requestLogCall = logger.info.mock.calls.find((call) => {
        const logData = call[0] as LogData;
        return logData.type === 'request';
      });

      const responseLogCall = logger.info.mock.calls.find((call) => {
        const logData = call[0] as LogData;
        return logData.type === 'response';
      });

      expect(requestLogCall).toBeDefined();
      expect(responseLogCall).toBeDefined();

      const requestLog = requestLogCall[0] as RequestLog;
      const responseLog = responseLogCall[0] as ResponseLog;

      expect(requestLog.requestId).toBe(responseLog.requestId);
    });
  });

  describe('IP address extraction', () => {
    it('should extract IP from req.ip when available', async () => {
      // Set trust proxy to enable req.ip
      app.set('trust proxy', true);

      await request(app).get('/test');

      const requestLogCall = logger.info.mock.calls.find((call) => {
        const logData = call[0] as LogData;
        return logData.type === 'request';
      });

      expect(requestLogCall).toBeDefined();

      const requestLog = requestLogCall[0] as RequestLog;
      expect(requestLog.ip).toBeDefined();
      expect(requestLog.ip).not.toBe('unknown');
    });

    it('should extract IP from x-forwarded-for header when present', async () => {
      await request(app).get('/test').set('x-forwarded-for', '192.168.1.1,10.0.0.1');

      const requestLogCall = logger.info.mock.calls.find((call) => {
        const logData = call[0] as LogData;
        return logData.type === 'request';
      });

      expect(requestLogCall).toBeDefined();

      const requestLog = requestLogCall[0] as RequestLog;
      // Should use first IP in x-forwarded-for chain (original client)
      expect(requestLog.ip).toBe('192.168.1.1');
    });

    it('should fallback to connection remote address when IP cannot be determined', async () => {
      // Create app without trust proxy
      const testApp = express();
      testApp.use(express.json());
      testApp.use(requestLoggerMiddleware);
      testApp.get('/test', (_req, res) => {
        res.json({ message: 'test' });
      });

      await request(testApp).get('/test');

      const requestLogCall = logger.info.mock.calls.find((call) => {
        const logData = call[0] as LogData;
        return logData.type === 'request';
      });

      expect(requestLogCall).toBeDefined();

      const requestLog = requestLogCall[0] as RequestLog;
      expect(requestLog.ip).toBeDefined();
      // IP should be defined (either from socket or 'unknown')
    });
  });

  describe('Error handling', () => {
    it('should call next() even if logging fails', async () => {
      // Mock logger.info to throw an error
      logger.info.mockImplementation(() => {
        throw new Error('Logging failed');
      });

      // Should not throw, should call next() and continue
      const response = await request(app).get('/test');

      expect(response.status).toBe(200);
      expect(logger.error).toHaveBeenCalledWith(
        'Error in request logger middleware',
        expect.any(Error)
      );
    });

    it('should handle errors in response logging gracefully', async () => {
      // Mock logger.info to throw an error only on response log
      logger.info.mockImplementation((logData: LogData) => {
        if (logData.type === 'response') {
          throw new Error('Response logging failed');
        }
      });

      // Should not throw, should handle error gracefully
      const response = await request(app).get('/test');
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(response.status).toBe(200);
      expect(logger.error).toHaveBeenCalledWith('Error logging response', expect.any(Error));
    });
  });

  describe('Structured logging format', () => {
    it('should log in structured format', async () => {
      await request(app).get('/test');

      const requestLogCall = logger.info.mock.calls.find((call) => {
        const logData = call[0] as LogData;
        return logData.type === 'request';
      });

      expect(requestLogCall).toBeDefined();

      // Verify it's a structured object (not a string)
      expect(typeof requestLogCall[0]).toBe('object');
    });

    it('should include all required fields in request log', async () => {
      await request(app).get('/test');

      const requestLogCall = logger.info.mock.calls.find((call) => {
        const logData = call[0] as LogData;
        return logData.type === 'request';
      });

      expect(requestLogCall).toBeDefined();

      const requestLog = requestLogCall[0] as RequestLog;

      expect(requestLog).toHaveProperty('timestamp');
      expect(requestLog).toHaveProperty('requestId');
      expect(requestLog).toHaveProperty('method');
      expect(requestLog).toHaveProperty('url');
      expect(requestLog).toHaveProperty('ip');
      expect(requestLog).toHaveProperty('type');
    });

    it('should include all required fields in response log', async () => {
      await request(app).get('/test');
      await new Promise((resolve) => setTimeout(resolve, 10));

      const responseLogCall = logger.info.mock.calls.find((call) => {
        const logData = call[0] as LogData;
        return logData.type === 'response';
      });

      expect(responseLogCall).toBeDefined();

      const responseLog = responseLogCall[0] as ResponseLog;

      expect(responseLog).toHaveProperty('timestamp');
      expect(responseLog).toHaveProperty('requestId');
      expect(responseLog).toHaveProperty('method');
      expect(responseLog).toHaveProperty('url');
      expect(responseLog).toHaveProperty('statusCode');
      expect(responseLog).toHaveProperty('duration');
      expect(responseLog).toHaveProperty('type');
    });
  });
});
