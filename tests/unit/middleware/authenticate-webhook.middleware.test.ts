/**
 * Unit tests for webhook authentication middleware
 * Verifies that Telegram webhook requests are authenticated correctly
 * based on the X-Telegram-Bot-Api-Secret-Token header
 */

import express from 'express';
import request from 'supertest';
import { authenticateWebhook } from '../../../src/middleware/authenticate-webhook.middleware';

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

describe('Authenticate Webhook Middleware', () => {
  let app: express.Application;
  let originalTelegramWebhookSecret: string | undefined;

  beforeEach(() => {
    // Save original environment variable
    originalTelegramWebhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

    // Create a test Express app
    app = express();
    app.use(express.json());

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original environment variable
    if (originalTelegramWebhookSecret !== undefined) {
      process.env.TELEGRAM_WEBHOOK_SECRET = originalTelegramWebhookSecret;
    } else {
      delete process.env.TELEGRAM_WEBHOOK_SECRET;
    }
  });

  describe('Authentication when secret is not configured', () => {
    beforeEach(() => {
      // Unset the secret to simulate development mode
      delete process.env.TELEGRAM_WEBHOOK_SECRET;
    });

    it('should allow request when secret is not configured (blank)', async () => {
      app.post('/webhook', authenticateWebhook, (_req, res) => {
        res.status(200).json({ ok: true });
      });

      const response = await request(app)
        .post('/webhook')
        .set('X-Telegram-Bot-Api-Secret-Token', 'any-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: true });
      expect(mockLoggerWarn).not.toHaveBeenCalled();
    });

    it('should allow request when secret is not configured and header is missing', async () => {
      app.post('/webhook', authenticateWebhook, (_req, res) => {
        res.status(200).json({ ok: true });
      });

      const response = await request(app).post('/webhook');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: true });
      expect(mockLoggerWarn).not.toHaveBeenCalled();
    });

    it('should allow request when secret is set to empty string', async () => {
      process.env.TELEGRAM_WEBHOOK_SECRET = '';

      app.post('/webhook', authenticateWebhook, (_req, res) => {
        res.status(200).json({ ok: true });
      });

      const response = await request(app)
        .post('/webhook')
        .set('X-Telegram-Bot-Api-Secret-Token', 'any-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: true });
      expect(mockLoggerWarn).not.toHaveBeenCalled();
    });

    it('should allow request when secret is set to whitespace-only string', async () => {
      process.env.TELEGRAM_WEBHOOK_SECRET = '   ';

      app.post('/webhook', authenticateWebhook, (_req, res) => {
        res.status(200).json({ ok: true });
      });

      const response = await request(app)
        .post('/webhook')
        .set('X-Telegram-Bot-Api-Secret-Token', 'any-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: true });
      expect(mockLoggerWarn).not.toHaveBeenCalled();
    });
  });

  describe('Authentication when secret is configured', () => {
    beforeEach(() => {
      process.env.TELEGRAM_WEBHOOK_SECRET = 'test-secret-token';
    });

    it('should allow request when header token matches configured secret', async () => {
      app.post('/webhook', authenticateWebhook, (_req, res) => {
        res.status(200).json({ ok: true });
      });

      const response = await request(app)
        .post('/webhook')
        .set('X-Telegram-Bot-Api-Secret-Token', 'test-secret-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: true });
      expect(mockLoggerWarn).not.toHaveBeenCalled();
    });

    it('should reject request (401) when secret is configured but header token does not match', async () => {
      app.post('/webhook', authenticateWebhook, (_req, res) => {
        res.status(200).json({ ok: true });
      });

      const response = await request(app)
        .post('/webhook')
        .set('X-Telegram-Bot-Api-Secret-Token', 'wrong-token');

      expect(response.status).toBe(401);
      expect(response.text).toBe('Unauthorized');
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        'Unauthorized Telegram webhook request - invalid secret token'
      );
    });

    it('should reject request (401) when secret is configured but header is missing', async () => {
      app.post('/webhook', authenticateWebhook, (_req, res) => {
        res.status(200).json({ ok: true });
      });

      const response = await request(app).post('/webhook');

      expect(response.status).toBe(401);
      expect(response.text).toBe('Unauthorized');
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        'Unauthorized Telegram webhook request - invalid secret token'
      );
    });

    it('should reject request (401) when header token is empty string', async () => {
      app.post('/webhook', authenticateWebhook, (_req, res) => {
        res.status(200).json({ ok: true });
      });

      const response = await request(app)
        .post('/webhook')
        .set('X-Telegram-Bot-Api-Secret-Token', '');

      expect(response.status).toBe(401);
      expect(response.text).toBe('Unauthorized');
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        'Unauthorized Telegram webhook request - invalid secret token'
      );
    });

    it('should be case-sensitive when comparing tokens', async () => {
      app.post('/webhook', authenticateWebhook, (_req, res) => {
        res.status(200).json({ ok: true });
      });

      // Test with different case
      const response = await request(app)
        .post('/webhook')
        .set('X-Telegram-Bot-Api-Secret-Token', 'TEST-SECRET-TOKEN');

      expect(response.status).toBe(401);
      expect(response.text).toBe('Unauthorized');
      expect(mockLoggerWarn).toHaveBeenCalledWith(
        'Unauthorized Telegram webhook request - invalid secret token'
      );
    });
  });

  describe('Default secret value', () => {
    it('should allow all requests when TELEGRAM_WEBHOOK_SECRET is not set (development mode)', async () => {
      delete process.env.TELEGRAM_WEBHOOK_SECRET;

      // Re-import middleware to get fresh config
      jest.resetModules();
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { authenticateWebhook: freshMiddleware } = require('../../../src/middleware/authenticate-webhook.middleware');

      const freshApp = express();
      freshApp.use(express.json());
      freshApp.post('/webhook', freshMiddleware, (_req, res) => {
        res.status(200).json({ ok: true });
      });

      // When env var is not set, all requests should be allowed (development mode)
      const response1 = await request(freshApp)
        .post('/webhook')
        .set('X-Telegram-Bot-Api-Secret-Token', 'any-token');

      const response2 = await request(freshApp).post('/webhook');

      expect(response1.status).toBe(200);
      expect(response1.body).toEqual({ ok: true });
      expect(response2.status).toBe(200);
      expect(response2.body).toEqual({ ok: true });
    });

    it('should require matching secret when TELEGRAM_WEBHOOK_SECRET is set to "changeme"', async () => {
      process.env.TELEGRAM_WEBHOOK_SECRET = 'changeme';

      app.post('/webhook', authenticateWebhook, (_req, res) => {
        res.status(200).json({ ok: true });
      });

      // Request with matching secret should be allowed
      const response1 = await request(app)
        .post('/webhook')
        .set('X-Telegram-Bot-Api-Secret-Token', 'changeme');

      // Request with wrong secret should be rejected
      const response2 = await request(app)
        .post('/webhook')
        .set('X-Telegram-Bot-Api-Secret-Token', 'wrong-secret');

      expect(response1.status).toBe(200);
      expect(response1.body).toEqual({ ok: true });
      expect(response2.status).toBe(401);
      expect(response2.text).toBe('Unauthorized');
    });
  });

  describe('Middleware behavior', () => {
    beforeEach(() => {
      process.env.TELEGRAM_WEBHOOK_SECRET = 'test-secret';
    });

    it('should call next() when authentication succeeds', async () => {
      const nextMock = jest.fn();
      const req = {
        headers: {
          'x-telegram-bot-api-secret-token': 'test-secret',
        },
      } as unknown as express.Request;
      const res = {
        headersSent: false,
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as unknown as express.Response;

      authenticateWebhook(req, res, nextMock);

      expect(nextMock).toHaveBeenCalled();
      expect(nextMock).toHaveBeenCalledTimes(1);
      expect((res as { status: jest.Mock }).status).not.toHaveBeenCalled();
    });

    it('should not call next() when authentication fails', async () => {
      const nextMock = jest.fn();
      const req = {
        headers: {
          'x-telegram-bot-api-secret-token': 'wrong-secret',
        },
      } as unknown as express.Request;
      const res = {
        headersSent: false,
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as unknown as express.Response;

      authenticateWebhook(req, res, nextMock);

      expect(nextMock).not.toHaveBeenCalled();
      expect((res as { status: jest.Mock }).status).toHaveBeenCalledWith(401);
      expect((res as { send: jest.Mock }).send).toHaveBeenCalledWith('Unauthorized');
    });

    it('should handle case where response headers are already sent', async () => {
      const nextMock = jest.fn();
      const req = {
        headers: {
          'x-telegram-bot-api-secret-token': 'wrong-secret',
        },
      } as unknown as express.Request;
      const res = {
        headersSent: true,
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as unknown as express.Response;

      authenticateWebhook(req, res, nextMock);

      // Should call next() if headers already sent (defensive check)
      expect(nextMock).toHaveBeenCalled();
      expect((res as { status: jest.Mock }).status).not.toHaveBeenCalled();
    });
  });

  describe('Header name case insensitivity', () => {
    beforeEach(() => {
      process.env.TELEGRAM_WEBHOOK_SECRET = 'test-secret';
    });

    it('should accept header with different case (Express normalizes headers)', async () => {
      app.post('/webhook', authenticateWebhook, (_req, res) => {
        res.status(200).json({ ok: true });
      });

      // Express normalizes header names to lowercase, so all these should work
      const response1 = await request(app)
        .post('/webhook')
        .set('X-Telegram-Bot-Api-Secret-Token', 'test-secret');

      const response2 = await request(app)
        .post('/webhook')
        .set('x-telegram-bot-api-secret-token', 'test-secret');

      const response3 = await request(app)
        .post('/webhook')
        .set('X-TELEGRAM-BOT-API-SECRET-TOKEN', 'test-secret');

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response3.status).toBe(200);
    });
  });
});
