/**
 * Unit tests for admin authentication middleware
 * Verifies that admin requests are authenticated correctly
 * based on the X-Admin-Secret header or admin_secret query parameter
 */

import express from 'express';
import request from 'supertest';
import { authenticateAdmin } from '../../../src/middleware/authenticate-admin.middleware';

// Mock logger utility to verify warning logging
const mockLoggerWarn = jest.fn();
jest.mock('../../../src/utils/logger', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    info: jest.fn(),
    warn: (...args: unknown[]) => mockLoggerWarn(...args),
    debug: jest.fn(),
  },
}));

describe('Authenticate Admin Middleware', () => {
  let app: express.Application;
  let originalWebhookSecret: string | undefined;
  let originalNodeEnv: string | undefined;

  beforeEach(() => {
    // Save original environment variables
    originalWebhookSecret = process.env.WEBHOOK_SECRET;
    originalNodeEnv = process.env.NODE_ENV;

    // Create a test Express app
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original environment variables
    if (originalWebhookSecret !== undefined) {
      process.env.WEBHOOK_SECRET = originalWebhookSecret;
    } else {
      delete process.env.WEBHOOK_SECRET;
    }

    if (originalNodeEnv !== undefined) {
      process.env.NODE_ENV = originalNodeEnv;
    } else {
      delete process.env.NODE_ENV;
    }
  });

  describe('Authentication with header', () => {
    beforeEach(() => {
      process.env.WEBHOOK_SECRET = 'test-secret';
    });

    it('should allow request when header secret matches configured secret', async () => {
      app.post('/admin', authenticateAdmin, (_req, res) => {
        res.status(200).json({ ok: true });
      });

      const response = await request(app)
        .post('/admin')
        .set('X-Admin-Secret', 'test-secret');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: true });
      expect(mockLoggerWarn).not.toHaveBeenCalled();
    });

    it('should reject request (401) when header secret does not match', async () => {
      app.post('/admin', authenticateAdmin, (_req, res) => {
        res.status(200).json({ ok: true });
      });

      const response = await request(app)
        .post('/admin')
        .set('X-Admin-Secret', 'wrong-secret');

      expect(response.status).toBe(401);
      expect(response.text).toBe('Unauthorized');
    });

    it('should reject request (401) when header is missing', async () => {
      app.post('/admin', authenticateAdmin, (_req, res) => {
        res.status(200).json({ ok: true });
      });

      const response = await request(app).post('/admin');

      expect(response.status).toBe(401);
      expect(response.text).toBe('Unauthorized');
    });

    it('should be case-sensitive when comparing secrets', async () => {
      app.post('/admin', authenticateAdmin, (_req, res) => {
        res.status(200).json({ ok: true });
      });

      // Test with different case
      const response = await request(app)
        .post('/admin')
        .set('X-Admin-Secret', 'TEST-SECRET');

      expect(response.status).toBe(401);
      expect(response.text).toBe('Unauthorized');
    });

    it('should accept header with different case (Express normalizes headers)', async () => {
      app.post('/admin', authenticateAdmin, (_req, res) => {
        res.status(200).json({ ok: true });
      });

      // Express normalizes header names to lowercase, so all these should work
      const response1 = await request(app)
        .post('/admin')
        .set('X-Admin-Secret', 'test-secret');

      const response2 = await request(app)
        .post('/admin')
        .set('x-admin-secret', 'test-secret');

      const response3 = await request(app)
        .post('/admin')
        .set('X-ADMIN-SECRET', 'test-secret');

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response3.status).toBe(200);
    });
  });

  describe('Authentication with query parameter', () => {
    beforeEach(() => {
      process.env.WEBHOOK_SECRET = 'test-secret';
    });

    it('should allow request when query parameter secret matches configured secret', async () => {
      app.post('/admin', authenticateAdmin, (_req, res) => {
        res.status(200).json({ ok: true });
      });

      const response = await request(app)
        .post('/admin')
        .query({ admin_secret: 'test-secret' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: true });
      expect(mockLoggerWarn).not.toHaveBeenCalled();
    });

    it('should reject request (401) when query parameter secret does not match', async () => {
      app.post('/admin', authenticateAdmin, (_req, res) => {
        res.status(200).json({ ok: true });
      });

      const response = await request(app)
        .post('/admin')
        .query({ admin_secret: 'wrong-secret' });

      expect(response.status).toBe(401);
      expect(response.text).toBe('Unauthorized');
    });

    it('should prioritize header over query parameter', async () => {
      app.post('/admin', authenticateAdmin, (_req, res) => {
        res.status(200).json({ ok: true });
      });

      // Header has correct secret, query has wrong secret - should succeed
      const response1 = await request(app)
        .post('/admin')
        .set('X-Admin-Secret', 'test-secret')
        .query({ admin_secret: 'wrong-secret' });

      expect(response1.status).toBe(200);

      // Header has wrong secret, query has correct secret - should fail (header takes priority)
      const response2 = await request(app)
        .post('/admin')
        .set('X-Admin-Secret', 'wrong-secret')
        .query({ admin_secret: 'test-secret' });

      expect(response2.status).toBe(401);
    });
  });

  describe('Default secret value', () => {
    it('should default to "changeme" when WEBHOOK_SECRET is not set', async () => {
      delete process.env.WEBHOOK_SECRET;

      app.post('/admin', authenticateAdmin, (_req, res) => {
        res.status(200).json({ ok: true });
      });

      // Request with "changeme" should be allowed
      const response1 = await request(app)
        .post('/admin')
        .set('X-Admin-Secret', 'changeme');

      // Request with wrong secret should be rejected
      const response2 = await request(app)
        .post('/admin')
        .set('X-Admin-Secret', 'wrong-secret');

      expect(response1.status).toBe(200);
      expect(response1.body).toEqual({ ok: true });
      expect(response2.status).toBe(401);
      expect(response2.text).toBe('Unauthorized');
    });

    it('should use "changeme" as default when WEBHOOK_SECRET is explicitly set to "changeme"', async () => {
      process.env.WEBHOOK_SECRET = 'changeme';

      app.post('/admin', authenticateAdmin, (_req, res) => {
        res.status(200).json({ ok: true });
      });

      // Request with matching secret should be allowed
      const response1 = await request(app)
        .post('/admin')
        .set('X-Admin-Secret', 'changeme');

      // Request with wrong secret should be rejected
      const response2 = await request(app)
        .post('/admin')
        .set('X-Admin-Secret', 'wrong-secret');

      expect(response1.status).toBe(200);
      expect(response1.body).toEqual({ ok: true });
      expect(response2.status).toBe(401);
      expect(response2.text).toBe('Unauthorized');
    });
  });

  describe('Debug logging', () => {
    beforeEach(() => {
      process.env.WEBHOOK_SECRET = 'test-secret';
    });

    it('should log debug information in test environment when authentication fails', async () => {
      process.env.NODE_ENV = 'test';

      app.post('/admin', authenticateAdmin, (_req, res) => {
        res.status(200).json({ ok: true });
      });

      await request(app)
        .post('/admin')
        .set('X-Admin-Secret', 'wrong-secret');

      expect(mockLoggerWarn).toHaveBeenCalled();
      const warnCall = mockLoggerWarn.mock.calls[0];
      expect(warnCall[0]).toBe('Admin authentication failed');
      expect(warnCall[1]).toMatchObject({
        adminSecret: '***',
        expectedSecret: '***',
        secretFound: true,
      });
    });

    it('should log debug information in development environment when authentication fails', async () => {
      process.env.NODE_ENV = 'development';

      app.post('/admin', authenticateAdmin, (_req, res) => {
        res.status(200).json({ ok: true });
      });

      await request(app)
        .post('/admin')
        .set('X-Admin-Secret', 'wrong-secret');

      expect(mockLoggerWarn).toHaveBeenCalled();
      const warnCall = mockLoggerWarn.mock.calls[0];
      expect(warnCall[0]).toBe('Admin authentication failed');
    });

    it('should not log debug information in production environment', async () => {
      process.env.NODE_ENV = 'production';

      app.post('/admin', authenticateAdmin, (_req, res) => {
        res.status(200).json({ ok: true });
      });

      await request(app)
        .post('/admin')
        .set('X-Admin-Secret', 'wrong-secret');

      expect(mockLoggerWarn).not.toHaveBeenCalled();
    });

    it('should not log debug information when authentication succeeds', async () => {
      process.env.NODE_ENV = 'test';

      app.post('/admin', authenticateAdmin, (_req, res) => {
        res.status(200).json({ ok: true });
      });

      await request(app)
        .post('/admin')
        .set('X-Admin-Secret', 'test-secret');

      expect(mockLoggerWarn).not.toHaveBeenCalled();
    });

    it('should log when secret is not found', async () => {
      process.env.NODE_ENV = 'test';

      app.post('/admin', authenticateAdmin, (_req, res) => {
        res.status(200).json({ ok: true });
      });

      await request(app).post('/admin');

      expect(mockLoggerWarn).toHaveBeenCalled();
      const warnCall = mockLoggerWarn.mock.calls[0];
      expect(warnCall[1]).toMatchObject({
        secretFound: false,
      });
    });
  });

  describe('Middleware behavior', () => {
    beforeEach(() => {
      process.env.WEBHOOK_SECRET = 'test-secret';
    });

    it('should call next() when authentication succeeds', () => {
      const nextMock = jest.fn();
      const req = {
        headers: {
          'x-admin-secret': 'test-secret',
        },
        query: {},
      } as unknown as express.Request;
      const res = {
        headersSent: false,
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as unknown as express.Response;

      authenticateAdmin(req, res, nextMock);

      expect(nextMock).toHaveBeenCalled();
      expect(nextMock).toHaveBeenCalledTimes(1);
      expect((res as { status: jest.Mock }).status).not.toHaveBeenCalled();
    });

    it('should not call next() when authentication fails', () => {
      const nextMock = jest.fn();
      const req = {
        headers: {
          'x-admin-secret': 'wrong-secret',
        },
        query: {},
      } as unknown as express.Request;
      const res = {
        headersSent: false,
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as unknown as express.Response;

      authenticateAdmin(req, res, nextMock);

      expect(nextMock).not.toHaveBeenCalled();
      expect((res as { status: jest.Mock }).status).toHaveBeenCalledWith(401);
      expect((res as { send: jest.Mock }).send).toHaveBeenCalledWith('Unauthorized');
    });

    it('should handle case where response headers are already sent', () => {
      const nextMock = jest.fn();
      const req = {
        headers: {
          'x-admin-secret': 'wrong-secret',
        },
        query: {},
      } as unknown as express.Request;
      const res = {
        headersSent: true,
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as unknown as express.Response;

      authenticateAdmin(req, res, nextMock);

      // Should call next() if headers already sent (defensive check)
      expect(nextMock).toHaveBeenCalled();
      expect((res as { status: jest.Mock }).status).not.toHaveBeenCalled();
    });

    it('should use query parameter when header is not present', () => {
      const nextMock = jest.fn();
      const req = {
        headers: {},
        query: {
          admin_secret: 'test-secret',
        },
      } as unknown as express.Request;
      const res = {
        headersSent: false,
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as unknown as express.Response;

      authenticateAdmin(req, res, nextMock);

      expect(nextMock).toHaveBeenCalled();
      expect((res as { status: jest.Mock }).status).not.toHaveBeenCalled();
    });
  });

  describe('GET request with query parameter', () => {
    beforeEach(() => {
      process.env.WEBHOOK_SECRET = 'test-secret';
    });

    it('should allow GET request with admin_secret query parameter', async () => {
      app.get('/admin', authenticateAdmin, (_req, res) => {
        res.status(200).json({ ok: true });
      });

      const response = await request(app)
        .get('/admin')
        .query({ admin_secret: 'test-secret' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: true });
    });

    it('should reject GET request with wrong admin_secret query parameter', async () => {
      app.get('/admin', authenticateAdmin, (_req, res) => {
        res.status(200).json({ ok: true });
      });

      const response = await request(app)
        .get('/admin')
        .query({ admin_secret: 'wrong-secret' });

      expect(response.status).toBe(401);
      expect(response.text).toBe('Unauthorized');
    });
  });

  describe('DELETE request', () => {
    beforeEach(() => {
      process.env.WEBHOOK_SECRET = 'test-secret';
    });

    it('should allow DELETE request with admin_secret query parameter', async () => {
      app.delete('/admin', authenticateAdmin, (_req, res) => {
        res.status(200).json({ ok: true });
      });

      const response = await request(app)
        .delete('/admin')
        .query({ admin_secret: 'test-secret' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: true });
    });

    it('should allow DELETE request with X-Admin-Secret header', async () => {
      app.delete('/admin', authenticateAdmin, (_req, res) => {
        res.status(200).json({ ok: true });
      });

      const response = await request(app)
        .delete('/admin')
        .set('X-Admin-Secret', 'test-secret');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: true });
    });
  });
});
