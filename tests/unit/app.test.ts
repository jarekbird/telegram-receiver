import { type Express } from 'express';
import app from '../../src/app';

describe('Express Application Instance', () => {
  describe('app.ts', () => {
    it('should export an Express application instance', () => {
      expect(app).toBeDefined();
      expect(app).not.toBeNull();
    });

    it('should be an instance of Express application', () => {
      // Express app is created by calling express(), so we check for Express methods
      expect(typeof app.get).toBe('function');
      expect(typeof app.post).toBe('function');
      expect(typeof app.use).toBe('function');
      expect(typeof app.listen).toBe('function');
    });

    it('should have Express application type', () => {
      // Type check: app should be of type Express
      const appType: Express = app;
      expect(appType).toBeDefined();
    });

    it('should have Express application methods', () => {
      expect(typeof app.get).toBe('function');
      expect(typeof app.post).toBe('function');
      expect(typeof app.put).toBe('function');
      expect(typeof app.patch).toBe('function');
      expect(typeof app.delete).toBe('function');
      expect(typeof app.use).toBe('function');
      expect(typeof app.listen).toBe('function');
    });

    it('should be a default export', async () => {
      const appModule = await import('../../src/app');
      expect(appModule.default).toBeDefined();
      expect(appModule.default).not.toBeNull();
      expect(typeof appModule.default.get).toBe('function');
    });
  });
});
