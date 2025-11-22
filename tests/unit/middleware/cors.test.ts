/**
 * Unit tests for CORS middleware
 * Verifies CORS configuration and behavior based on environment variables
 */

import express from 'express';
import request from 'supertest';
import { corsMiddleware } from '../../../src/middleware/cors';

describe('CORS Middleware', () => {
  let app: express.Application;
  let originalCorsEnabled: string | undefined;
  let originalCorsOrigin: string | undefined;

  beforeEach(() => {
    // Save original environment variables
    originalCorsEnabled = process.env.CORS_ENABLED;
    originalCorsOrigin = process.env.CORS_ORIGIN;

    // Create a test Express app
    app = express();
    app.use(express.json());
    app.use(corsMiddleware);
    app.get('/test', (_req, res) => {
      res.json({ message: 'test' });
    });
  });

  afterEach(() => {
    // Restore original environment variables
    if (originalCorsEnabled !== undefined) {
      process.env.CORS_ENABLED = originalCorsEnabled;
    } else {
      delete process.env.CORS_ENABLED;
    }

    if (originalCorsOrigin !== undefined) {
      process.env.CORS_ORIGIN = originalCorsOrigin;
    } else {
      delete process.env.CORS_ORIGIN;
    }
  });

  describe('CORS disabled by default', () => {
    beforeEach(() => {
      delete process.env.CORS_ENABLED;
      delete process.env.CORS_ORIGIN;
      // Re-import middleware to get fresh config
      jest.resetModules();
    });

    it('should not set CORS headers when CORS is disabled', async () => {
      // Recreate app with fresh middleware
      const freshApp = express();
      freshApp.use(express.json());
      // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
      const { corsMiddleware: freshCorsMiddleware } = require('../../../src/middleware/cors');
      freshApp.use(freshCorsMiddleware);
      freshApp.get('/test', (_req, res) => {
        res.json({ message: 'test' });
      });

      const response = await request(freshApp).get('/test').set('Origin', 'https://example.com');

      // When CORS is disabled, origin: false means no CORS headers are set
      expect(response.headers['access-control-allow-origin']).toBeUndefined();
      expect(response.headers['access-control-allow-methods']).toBeUndefined();
      expect(response.headers['access-control-allow-headers']).toBeUndefined();
    });
  });

  describe('CORS enabled with single origin', () => {
    beforeEach(() => {
      process.env.CORS_ENABLED = 'true';
      process.env.CORS_ORIGIN = 'https://example.com';
      // Re-import middleware to get fresh config
      jest.resetModules();
    });

    it('should set CORS headers for allowed origin', async () => {
      // Recreate app with fresh middleware
      const freshApp = express();
      freshApp.use(express.json());
      // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
      const { corsMiddleware: freshCorsMiddleware } = require('../../../src/middleware/cors');
      freshApp.use(freshCorsMiddleware);
      freshApp.get('/test', (_req, res) => {
        res.json({ message: 'test' });
      });

      const response = await request(freshApp).get('/test').set('Origin', 'https://example.com');

      expect(response.headers['access-control-allow-origin']).toBe('https://example.com');
      expect(response.status).toBe(200);
    });

    it('should reject requests from non-allowed origin', async () => {
      // Recreate app with fresh middleware
      const freshApp = express();
      freshApp.use(express.json());
      // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
      const { corsMiddleware: freshCorsMiddleware } = require('../../../src/middleware/cors');
      freshApp.use(freshCorsMiddleware);
      freshApp.get('/test', (_req, res) => {
        res.json({ message: 'test' });
      });

      const response = await request(freshApp).get('/test').set('Origin', 'https://malicious.com');

      // CORS middleware will reject the request
      expect(response.status).toBe(500);
    });

    it('should handle OPTIONS preflight requests', async () => {
      // Recreate app with fresh middleware
      const freshApp = express();
      freshApp.use(express.json());
      // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
      const { corsMiddleware: freshCorsMiddleware } = require('../../../src/middleware/cors');
      freshApp.use(freshCorsMiddleware);
      freshApp.get('/test', (_req, res) => {
        res.json({ message: 'test' });
      });

      const response = await request(freshApp)
        .options('/test')
        .set('Origin', 'https://example.com')
        .set('Access-Control-Request-Method', 'GET');

      expect(response.headers['access-control-allow-origin']).toBe('https://example.com');
      expect(response.headers['access-control-allow-methods']).toContain('GET');
      expect(response.status).toBe(204);
    });
  });

  describe('CORS enabled with multiple origins', () => {
    beforeEach(() => {
      process.env.CORS_ENABLED = 'true';
      process.env.CORS_ORIGIN = 'https://example.com,https://app.example.com';
      // Re-import middleware to get fresh config
      jest.resetModules();
    });

    it('should allow first origin in list', async () => {
      // Recreate app with fresh middleware
      const freshApp = express();
      freshApp.use(express.json());
      // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
      const { corsMiddleware: freshCorsMiddleware } = require('../../../src/middleware/cors');
      freshApp.use(freshCorsMiddleware);
      freshApp.get('/test', (_req, res) => {
        res.json({ message: 'test' });
      });

      const response = await request(freshApp).get('/test').set('Origin', 'https://example.com');

      expect(response.headers['access-control-allow-origin']).toBe('https://example.com');
      expect(response.status).toBe(200);
    });

    it('should allow second origin in list', async () => {
      // Recreate app with fresh middleware
      const freshApp = express();
      freshApp.use(express.json());
      // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
      const { corsMiddleware: freshCorsMiddleware } = require('../../../src/middleware/cors');
      freshApp.use(freshCorsMiddleware);
      freshApp.get('/test', (_req, res) => {
        res.json({ message: 'test' });
      });

      const response = await request(freshApp)
        .get('/test')
        .set('Origin', 'https://app.example.com');

      expect(response.headers['access-control-allow-origin']).toBe('https://app.example.com');
      expect(response.status).toBe(200);
    });

    it('should reject origin not in list', async () => {
      // Recreate app with fresh middleware
      const freshApp = express();
      freshApp.use(express.json());
      // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
      const { corsMiddleware: freshCorsMiddleware } = require('../../../src/middleware/cors');
      freshApp.use(freshCorsMiddleware);
      freshApp.get('/test', (_req, res) => {
        res.json({ message: 'test' });
      });

      const response = await request(freshApp).get('/test').set('Origin', 'https://malicious.com');

      // CORS middleware will reject the request
      expect(response.status).toBe(500);
    });
  });

  describe('CORS enabled with wildcard origin', () => {
    beforeEach(() => {
      process.env.CORS_ENABLED = 'true';
      process.env.CORS_ORIGIN = '*';
      // Re-import middleware to get fresh config
      jest.resetModules();
    });

    it('should allow any origin when wildcard is configured', async () => {
      // Recreate app with fresh middleware
      const freshApp = express();
      freshApp.use(express.json());
      // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
      const { corsMiddleware: freshCorsMiddleware } = require('../../../src/middleware/cors');
      freshApp.use(freshCorsMiddleware);
      freshApp.get('/test', (_req, res) => {
        res.json({ message: 'test' });
      });

      const response = await request(freshApp).get('/test').set('Origin', 'https://any-origin.com');

      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.status).toBe(200);
    });
  });

  describe('CORS configuration options', () => {
    beforeEach(() => {
      process.env.CORS_ENABLED = 'true';
      process.env.CORS_ORIGIN = 'https://example.com';
      // Re-import middleware to get fresh config
      jest.resetModules();
    });

    it('should include allowed methods in preflight response', async () => {
      // Recreate app with fresh middleware
      const freshApp = express();
      freshApp.use(express.json());
      // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
      const { corsMiddleware: freshCorsMiddleware } = require('../../../src/middleware/cors');
      freshApp.use(freshCorsMiddleware);
      freshApp.get('/test', (_req, res) => {
        res.json({ message: 'test' });
      });

      const response = await request(freshApp)
        .options('/test')
        .set('Origin', 'https://example.com')
        .set('Access-Control-Request-Method', 'POST');

      const allowedMethods = response.headers['access-control-allow-methods'];
      expect(allowedMethods).toContain('GET');
      expect(allowedMethods).toContain('POST');
      expect(allowedMethods).toContain('PUT');
      expect(allowedMethods).toContain('PATCH');
      expect(allowedMethods).toContain('DELETE');
      expect(allowedMethods).toContain('OPTIONS');
      expect(allowedMethods).toContain('HEAD');
    });

    it('should include allowed headers in preflight response', async () => {
      // Recreate app with fresh middleware
      const freshApp = express();
      freshApp.use(express.json());
      // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
      const { corsMiddleware: freshCorsMiddleware } = require('../../../src/middleware/cors');
      freshApp.use(freshCorsMiddleware);
      freshApp.get('/test', (_req, res) => {
        res.json({ message: 'test' });
      });

      const response = await request(freshApp)
        .options('/test')
        .set('Origin', 'https://example.com')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type,Authorization');

      const allowedHeaders = response.headers['access-control-allow-headers'];
      expect(allowedHeaders).toContain('Content-Type');
      expect(allowedHeaders).toContain('Authorization');
      expect(allowedHeaders).toContain('X-Webhook-Secret');
      expect(allowedHeaders).toContain('X-Cursor-Runner-Secret');
      expect(allowedHeaders).toContain('X-Telegram-Bot-Api-Secret-Token');
    });

    it('should set max-age header for preflight caching', async () => {
      // Recreate app with fresh middleware
      const freshApp = express();
      freshApp.use(express.json());
      // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
      const { corsMiddleware: freshCorsMiddleware } = require('../../../src/middleware/cors');
      freshApp.use(freshCorsMiddleware);
      freshApp.get('/test', (_req, res) => {
        res.json({ message: 'test' });
      });

      const response = await request(freshApp)
        .options('/test')
        .set('Origin', 'https://example.com')
        .set('Access-Control-Request-Method', 'GET');

      expect(response.headers['access-control-max-age']).toBe('86400');
    });
  });

  describe('Requests without origin header', () => {
    beforeEach(() => {
      process.env.CORS_ENABLED = 'true';
      process.env.CORS_ORIGIN = 'https://example.com';
      // Re-import middleware to get fresh config
      jest.resetModules();
    });

    it('should allow requests without origin header (e.g., mobile apps, Postman)', async () => {
      // Recreate app with fresh middleware
      const freshApp = express();
      freshApp.use(express.json());
      // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
      const { corsMiddleware: freshCorsMiddleware } = require('../../../src/middleware/cors');
      freshApp.use(freshCorsMiddleware);
      freshApp.get('/test', (_req, res) => {
        res.json({ message: 'test' });
      });

      const response = await request(freshApp).get('/test');

      // Requests without origin should be allowed (not rejected)
      expect(response.status).toBe(200);
    });
  });
});
