/**
 * Unit tests for 404 Not Found handler middleware
 * Verifies that unmatched routes return standardized 404 responses matching Rails format
 */

import express from 'express';
import request from 'supertest';
import { notFoundMiddleware } from '../../../src/middleware/not-found.middleware';

interface NotFoundResponse {
  ok: boolean;
  say: string;
  result: {
    error: string;
  };
}

describe('404 Not Found Middleware', () => {
  let app: express.Application;

  beforeEach(() => {
    // Create a test Express app
    app = express();
    app.use(express.json());

    // Register a test route
    app.get('/test', (_req, res) => {
      res.json({ message: 'test' });
    });

    // Register 404 handler middleware after routes
    app.use(notFoundMiddleware);
  });

  describe('404 response format', () => {
    it('should return 404 status code for unmatched routes', async () => {
      const response = await request(app).get('/nonexistent');

      expect(response.status).toBe(404);
    });

    it('should return JSON error response matching Rails format', async () => {
      const response = await request(app).get('/nonexistent');

      expect(response.body).toEqual({
        ok: false,
        say: "Sorry, I couldn't find that resource.",
        result: {
          error: 'Not Found',
        },
      });
    });

    it('should return correct response format with all required fields', async () => {
      const response = await request(app).get('/nonexistent');

      expect(response.body).toHaveProperty('ok');
      expect(response.body).toHaveProperty('say');
      expect(response.body).toHaveProperty('result');
      expect((response.body as { result: { error: string } }).result).toHaveProperty('error');

      expect((response.body as { ok: boolean }).ok).toBe(false);
      expect((response.body as { say: string }).say).toBe("Sorry, I couldn't find that resource.");
      expect((response.body as { result: { error: string } }).result.error).toBe('Not Found');
    });

    it('should return 404 for different HTTP methods on unmatched routes', async () => {
      const getResponse = await request(app).get('/nonexistent');
      const postResponse = await request(app).post('/nonexistent');
      const putResponse = await request(app).put('/nonexistent');
      const deleteResponse = await request(app).delete('/nonexistent');
      const patchResponse = await request(app).patch('/nonexistent');

      expect(getResponse.status).toBe(404);
      expect(postResponse.status).toBe(404);
      expect(putResponse.status).toBe(404);
      expect(deleteResponse.status).toBe(404);
      expect(patchResponse.status).toBe(404);
    });

    it('should return 404 for routes with query parameters', async () => {
      const response = await request(app).get('/nonexistent?foo=bar&baz=qux');

      expect(response.status).toBe(404);
      const body = response.body as NotFoundResponse;
      expect(body.ok).toBe(false);
      expect(body.result.error).toBe('Not Found');
    });

    it('should return 404 for nested unmatched routes', async () => {
      const response = await request(app).get('/api/v1/nonexistent');

      expect(response.status).toBe(404);
      const body = response.body as NotFoundResponse;
      expect(body.ok).toBe(false);
      expect(body.result.error).toBe('Not Found');
    });
  });

  describe('Route matching', () => {
    it('should not interfere with existing routes', async () => {
      const response = await request(app).get('/test');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'test' });
    });

    it('should catch unmatched routes after all registered routes', async () => {
      // Create a new app with all routes registered before 404 middleware
      const testApp = express();
      testApp.use(express.json());

      testApp.get('/test', (_req, res) => {
        res.json({ message: 'test' });
      });

      testApp.get('/another', (_req, res) => {
        res.json({ message: 'another' });
      });

      // Register 404 middleware after all routes
      testApp.use(notFoundMiddleware);

      // Existing route should still work
      const testResponse = await request(testApp).get('/test');
      expect(testResponse.status).toBe(200);

      // New route should work
      const anotherResponse = await request(testApp).get('/another');
      expect(anotherResponse.status).toBe(200);

      // Unmatched route should return 404
      const unmatchedResponse = await request(testApp).get('/unmatched');
      expect(unmatchedResponse.status).toBe(404);
    });
  });

  describe('Response already sent handling', () => {
    it('should not send response if headers have already been sent', async () => {
      // Create app with middleware that sends response before 404 handler
      const testApp = express();
      testApp.use(express.json());

      // Middleware that sends response
      testApp.use((_req, res, _next) => {
        res.status(200).json({ message: 'already sent' });
        // Don't call next() - response is already sent
      });

      // 404 handler should check res.headersSent and not try to send response
      testApp.use(notFoundMiddleware);

      const response = await request(testApp).get('/test');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'already sent' });
    });

    it('should handle case where response is sent in route handler', async () => {
      const testApp = express();
      testApp.use(express.json());

      testApp.get('/test', (_req, res) => {
        res.status(200).json({ message: 'test' });
        // Response is sent, 404 handler should not interfere
      });

      testApp.use(notFoundMiddleware);

      const response = await request(testApp).get('/test');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'test' });
    });
  });

  describe('Content-Type header', () => {
    it('should set Content-Type to application/json', async () => {
      const response = await request(app).get('/nonexistent');

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('Middleware ordering', () => {
    it('should be called only when no route matches', async () => {
      // Create app with multiple routes
      const testApp = express();
      testApp.use(express.json());

      testApp.get('/route1', (_req, res) => {
        res.json({ route: 'route1' });
      });

      testApp.get('/route2', (_req, res) => {
        res.json({ route: 'route2' });
      });

      testApp.use(notFoundMiddleware);

      // Matched routes should work
      const route1Response = await request(testApp).get('/route1');
      expect(route1Response.status).toBe(200);
      expect(route1Response.body).toEqual({ route: 'route1' });

      const route2Response = await request(testApp).get('/route2');
      expect(route2Response.status).toBe(200);
      expect(route2Response.body).toEqual({ route: 'route2' });

      // Unmatched route should return 404
      const unmatchedResponse = await request(testApp).get('/unmatched');
      expect(unmatchedResponse.status).toBe(404);
      const unmatchedBody = unmatchedResponse.body as NotFoundResponse;
      expect(unmatchedBody.ok).toBe(false);
    });
  });
});
