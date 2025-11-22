/**
 * Unit tests for environment configuration module (src/config/environment.ts)
 *
 * These tests verify that the environment configuration module correctly:
 * - Loads environment variables from .env files
 * - Provides default values when environment variables are not set
 * - Converts PORT to a number type
 * - Exports the config object with proper typing
 */

import type { EnvironmentConfig } from '../../../src/config/environment';

// Mock dotenv before importing the module
jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

describe('Environment Configuration Module', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let dotenv: jest.Mocked<typeof import('dotenv')>;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };

    // Clear all environment variables
    process.env = {};

    // Reset dotenv mock
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
    dotenv = require('dotenv') as jest.Mocked<typeof import('dotenv')>;
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  describe('Module Initialization', () => {
    it('should call dotenv.config() to load .env file', async () => {
      // Import the module to trigger initialization
      await import('../../../src/config/environment');

      // Verify dotenv.config() was called
      expect(dotenv.config).toHaveBeenCalled();
    });

    it('should load environment-specific .env file when NODE_ENV is set', async () => {
      process.env.NODE_ENV = 'test';

      // Import the module to trigger initialization
      await import('../../../src/config/environment');

      // Verify dotenv.config() was called twice (base .env and .env.test)
      expect(dotenv.config).toHaveBeenCalledTimes(2);
    });
  });

  describe('Environment Variable Loading', () => {
    it('should use NODE_ENV from process.env when set', async () => {
      process.env.NODE_ENV = 'production';

      const config = (await import('../../../src/config/environment')).default;

      expect(config.env).toBe('production');
    });

    it('should default to "development" when NODE_ENV is not set', async () => {
      delete process.env.NODE_ENV;

      const config = (await import('../../../src/config/environment')).default;

      expect(config.env).toBe('development');
    });

    it('should use PORT from process.env when set', async () => {
      process.env.PORT = '8080';

      const config = (await import('../../../src/config/environment')).default;

      expect(config.port).toBe(8080);
      expect(typeof config.port).toBe('number');
    });

    it('should default to 3000 when PORT is not set', async () => {
      delete process.env.PORT;

      const config = (await import('../../../src/config/environment')).default;

      expect(config.port).toBe(3000);
      expect(typeof config.port).toBe('number');
    });

    it('should convert PORT string to number', async () => {
      process.env.PORT = '5000';

      const config = (await import('../../../src/config/environment')).default;

      expect(config.port).toBe(5000);
      expect(typeof config.port).toBe('number');
    });

    it('should handle PORT as string and convert to number', async () => {
      process.env.PORT = '9000';

      const config = (await import('../../../src/config/environment')).default;

      expect(config.port).toBe(9000);
      expect(typeof config.port).toBe('number');
    });
  });

  describe('Config Object Structure', () => {
    it('should export config object with correct structure', async () => {
      const config = (await import('../../../src/config/environment')).default;

      expect(config).toHaveProperty('env');
      expect(config).toHaveProperty('port');
      expect(typeof config.env).toBe('string');
      expect(typeof config.port).toBe('number');
    });

    it('should match EnvironmentConfig interface', async () => {
      const config: EnvironmentConfig = (await import('../../../src/config/environment')).default;

      expect(config).toBeDefined();
      expect(config.env).toBeDefined();
      expect(config.port).toBeDefined();
    });

    it('should export config as default export', async () => {
      const module = await import('../../../src/config/environment');

      expect(module.default).toBeDefined();
      expect(module.default.env).toBeDefined();
      expect(module.default.port).toBeDefined();
    });
  });

  describe('Default Values', () => {
    it('should use default values when no environment variables are set', async () => {
      delete process.env.NODE_ENV;
      delete process.env.PORT;

      const config = (await import('../../../src/config/environment')).default;

      expect(config.env).toBe('development');
      expect(config.port).toBe(3000);
    });

    it('should use provided environment variables over defaults', async () => {
      process.env.NODE_ENV = 'production';
      process.env.PORT = '4000';

      const config = (await import('../../../src/config/environment')).default;

      expect(config.env).toBe('production');
      expect(config.port).toBe(4000);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty PORT string by defaulting to 3000', async () => {
      process.env.PORT = '';

      const config = (await import('../../../src/config/environment')).default;

      // parseInt('', 10) returns NaN, but the code uses || '3000', so empty string becomes '3000'
      // Actually, process.env.PORT = '' means PORT is set but empty, so parseInt('', 10) = NaN
      // But the code does: parseInt(process.env.PORT || '3000', 10)
      // So if PORT is '', it's falsy, so it uses '3000'
      expect(config.port).toBe(3000);
    });

    it('should handle various valid port numbers', async () => {
      const validPorts = ['1', '80', '443', '3000', '8080', '65535'];

      for (const port of validPorts) {
        process.env.PORT = port;
        jest.resetModules();

        const config = (await import('../../../src/config/environment')).default;

        expect(config.port).toBe(parseInt(port, 10));
        expect(typeof config.port).toBe('number');
      }
    });

    it('should handle various environment values', async () => {
      const environments = ['development', 'test', 'production'];

      for (const env of environments) {
        process.env.NODE_ENV = env;
        jest.resetModules();

        const config = (await import('../../../src/config/environment')).default;

        expect(config.env).toBe(env);
      }
    });
  });

  describe('Type Safety', () => {
    it('should ensure port is always a number', async () => {
      process.env.PORT = '3000';

      const config = (await import('../../../src/config/environment')).default;

      // Type assertion to verify TypeScript type
      const port: number = config.port;
      expect(typeof port).toBe('number');
      expect(port).toBe(3000);
    });

    it('should ensure config matches EnvironmentConfig type', async () => {
      const config: EnvironmentConfig = (await import('../../../src/config/environment')).default;

      // TypeScript will catch type errors at compile time
      // This test verifies the config object matches the interface structure
      expect(config).toHaveProperty('env');
      expect(config).toHaveProperty('port');
      expect(typeof config.env).toBe('string');
      expect(typeof config.port).toBe('number');
    });
  });
});
