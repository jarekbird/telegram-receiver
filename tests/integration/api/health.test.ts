import request from 'supertest';
import app from '../../../src/app';

interface HealthResponse {
  status: string;
  service: string;
  version: string;
}

describe('Health Endpoint', () => {
  // PHASE1-015: Health routes are now registered in app.ts
  describe('GET /health', () => {
    it('should return 200 status code', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
    });

    it('should return JSON response with status, service, and version', async () => {
      const response = await request(app).get('/health');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('service');
      expect(response.body).toHaveProperty('version');
    });

    it('should return status as "healthy"', async () => {
      const response = await request(app).get('/health');
      const body = response.body as HealthResponse;
      expect(body.status).toBe('healthy');
    });

    it('should return service name from environment or package.json', async () => {
      const originalAppName = process.env.APP_NAME;
      delete process.env.APP_NAME;

      const response = await request(app).get('/health');
      const body = response.body as HealthResponse;
      // Service name should be read from package.json (telegram-receiver)
      expect(body.service).toBe('telegram-receiver');

      if (originalAppName) {
        process.env.APP_NAME = originalAppName;
      }
    });

    it('should return version from environment or default', async () => {
      const originalAppVersion = process.env.APP_VERSION;
      delete process.env.APP_VERSION;

      const response = await request(app).get('/health');
      const body = response.body as HealthResponse;
      expect(body.version).toBe('1.0.0');

      if (originalAppVersion) {
        process.env.APP_VERSION = originalAppVersion;
      }
    });

    it('should use environment variables when set', async () => {
      const originalAppName = process.env.APP_NAME;
      const originalAppVersion = process.env.APP_VERSION;

      process.env.APP_NAME = 'Test Service';
      process.env.APP_VERSION = '2.0.0';

      const response = await request(app).get('/health');
      const body = response.body as HealthResponse;
      expect(body.service).toBe('Test Service');
      expect(body.version).toBe('2.0.0');

      if (originalAppName) {
        process.env.APP_NAME = originalAppName;
      } else {
        delete process.env.APP_NAME;
      }

      if (originalAppVersion) {
        process.env.APP_VERSION = originalAppVersion;
      } else {
        delete process.env.APP_VERSION;
      }
    });
  });

  // PHASE1-015: Root route is now registered in app.ts
  describe('GET /', () => {
    it('should return 200 status code', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
    });

    it('should return same health response as /health', async () => {
      const rootResponse = await request(app).get('/');
      const healthResponse = await request(app).get('/health');

      expect(rootResponse.status).toBe(200);
      expect(healthResponse.status).toBe(200);
      expect(rootResponse.body).toEqual(healthResponse.body);
    });

    it('should return JSON response with status, service, and version', async () => {
      const response = await request(app).get('/');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('service');
      expect(response.body).toHaveProperty('version');
    });

    it('should return status as "healthy"', async () => {
      const response = await request(app).get('/');
      const body = response.body as HealthResponse;
      expect(body.status).toBe('healthy');
    });
  });
});
