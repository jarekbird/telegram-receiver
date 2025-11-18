/**
 * Unit tests for environment validation module (src/config/validateEnv.ts)
 *
 * These tests verify that the environment validation module correctly:
 * - Validates config.env is one of: "development", "test", "production"
 * - Validates config.port is a valid positive integer
 * - Throws descriptive errors with invalid variable names when validation fails
 * - Does not throw when validation passes
 */

import validateEnv, { EnvironmentValidationError } from '../../../src/config/validateEnv';
import type { EnvironmentConfig } from '../../../src/config/environment';

describe('Environment Validation Module', () => {
  describe('validateEnv function', () => {
    describe('Valid Configurations', () => {
      it('should not throw for valid development environment', () => {
        const config: EnvironmentConfig = {
          env: 'development',
          port: 3000,
        };
        expect(() => validateEnv(config)).not.toThrow();
      });

      it('should not throw for valid test environment', () => {
        const config: EnvironmentConfig = {
          env: 'test',
          port: 3000,
        };
        expect(() => validateEnv(config)).not.toThrow();
      });

      it('should not throw for valid production environment', () => {
        const config: EnvironmentConfig = {
          env: 'production',
          port: 3000,
        };
        expect(() => validateEnv(config)).not.toThrow();
      });

      it('should not throw for valid port numbers', () => {
        const validPorts = [1, 80, 3000, 8080, 65535];
        for (const port of validPorts) {
          const config: EnvironmentConfig = {
            env: 'development',
            port,
          };
          expect(() => validateEnv(config)).not.toThrow();
        }
      });
    });

    describe('NODE_ENV Validation', () => {
      it('should throw error for invalid environment value', () => {
        const config: EnvironmentConfig = {
          env: 'invalid',
          port: 3000,
        };
        expect(() => validateEnv(config)).toThrow(EnvironmentValidationError);
      });

      it('should throw error with NODE_ENV in invalidVariables array', () => {
        const config: EnvironmentConfig = {
          env: 'staging',
          port: 3000,
        };
        try {
          validateEnv(config);
          fail('Expected validateEnv to throw');
        } catch (error) {
          expect(error).toBeInstanceOf(EnvironmentValidationError);
          if (error instanceof EnvironmentValidationError) {
            expect(error.invalidVariables).toContain('NODE_ENV');
          }
        }
      });

      it('should include descriptive error message for invalid environment', () => {
        const config: EnvironmentConfig = {
          env: 'production-test',
          port: 3000,
        };
        expect(() => validateEnv(config)).toThrow(/NODE_ENV must be one of/);
        expect(() => validateEnv(config)).toThrow(/development, test, production/);
      });

      it('should reject empty string environment', () => {
        const config: EnvironmentConfig = {
          env: '',
          port: 3000,
        };
        expect(() => validateEnv(config)).toThrow(EnvironmentValidationError);
      });

      it('should accept all valid environment values', () => {
        const validEnvironments = ['development', 'test', 'production'];
        for (const env of validEnvironments) {
          const config: EnvironmentConfig = {
            env,
            port: 3000,
          };
          expect(() => validateEnv(config)).not.toThrow();
        }
      });
    });

    describe('PORT Validation', () => {
      it('should throw error for non-integer port', () => {
        const config = {
          env: 'development',
          port: 3000.5,
        } as EnvironmentConfig;
        expect(() => validateEnv(config)).toThrow(EnvironmentValidationError);
      });

      it('should throw error for zero port', () => {
        const config: EnvironmentConfig = {
          env: 'development',
          port: 0,
        };
        expect(() => validateEnv(config)).toThrow(EnvironmentValidationError);
      });

      it('should throw error for negative port', () => {
        const config: EnvironmentConfig = {
          env: 'development',
          port: -1,
        };
        expect(() => validateEnv(config)).toThrow(EnvironmentValidationError);
      });

      it('should throw error for port greater than 65535', () => {
        const config: EnvironmentConfig = {
          env: 'development',
          port: 65536,
        };
        expect(() => validateEnv(config)).toThrow(EnvironmentValidationError);
      });

      it('should throw error with PORT in invalidVariables array', () => {
        const config: EnvironmentConfig = {
          env: 'development',
          port: -1,
        };
        try {
          validateEnv(config);
          fail('Expected validateEnv to throw');
        } catch (error) {
          expect(error).toBeInstanceOf(EnvironmentValidationError);
          if (error instanceof EnvironmentValidationError) {
            expect(error.invalidVariables).toContain('PORT');
          }
        }
      });

      it('should include descriptive error message for invalid port', () => {
        const config: EnvironmentConfig = {
          env: 'development',
          port: -1,
        };
        expect(() => validateEnv(config)).toThrow(/PORT must be a positive integer/);
      });

      it('should include descriptive error message for port out of range', () => {
        const config: EnvironmentConfig = {
          env: 'development',
          port: 70000,
        };
        expect(() => validateEnv(config)).toThrow(/PORT must be a valid port number/);
      });

      it('should accept valid port range (1-65535)', () => {
        const validPorts = [1, 80, 443, 3000, 8080, 65535];
        for (const port of validPorts) {
          const config: EnvironmentConfig = {
            env: 'development',
            port,
          };
          expect(() => validateEnv(config)).not.toThrow();
        }
      });

      it('should throw error for non-number port type', () => {
        const config = {
          env: 'development',
          port: '3000' as unknown as number,
        } as EnvironmentConfig;
        expect(() => validateEnv(config)).toThrow(EnvironmentValidationError);
      });

      it('should include type information in error message for non-number port', () => {
        const config = {
          env: 'development',
          port: '3000' as unknown as number,
        } as EnvironmentConfig;
        expect(() => validateEnv(config)).toThrow(/type: string/);
      });
    });

    describe('Multiple Validation Errors', () => {
      it('should report all validation errors in a single error', () => {
        const config: EnvironmentConfig = {
          env: 'invalid',
          port: -1,
        };
        try {
          validateEnv(config);
          fail('Expected validateEnv to throw');
        } catch (error) {
          expect(error).toBeInstanceOf(EnvironmentValidationError);
          if (error instanceof EnvironmentValidationError) {
            expect(error.invalidVariables).toContain('NODE_ENV');
            expect(error.invalidVariables).toContain('PORT');
            expect(error.message).toContain('NODE_ENV');
            expect(error.message).toContain('PORT');
          }
        }
      });

      it('should include all error messages in the error message', () => {
        const config: EnvironmentConfig = {
          env: 'staging',
          port: 0,
        };
        expect(() => validateEnv(config)).toThrow(/NODE_ENV/);
        expect(() => validateEnv(config)).toThrow(/PORT/);
      });
    });

    describe('EnvironmentValidationError class', () => {
      it('should be an instance of Error', () => {
        const error = new EnvironmentValidationError('Test error', ['NODE_ENV']);
        expect(error).toBeInstanceOf(Error);
      });

      it('should have correct name property', () => {
        const error = new EnvironmentValidationError('Test error', ['NODE_ENV']);
        expect(error.name).toBe('EnvironmentValidationError');
      });

      it('should store invalidVariables array', () => {
        const invalidVars = ['NODE_ENV', 'PORT'];
        const error = new EnvironmentValidationError('Test error', invalidVars);
        expect(error.invalidVariables).toEqual(invalidVars);
      });

      it('should have error message', () => {
        const error = new EnvironmentValidationError('Test error message', []);
        expect(error.message).toBe('Test error message');
      });
    });

    describe('Edge Cases', () => {
      it('should handle minimum valid port (1)', () => {
        const config: EnvironmentConfig = {
          env: 'development',
          port: 1,
        };
        expect(() => validateEnv(config)).not.toThrow();
      });

      it('should handle maximum valid port (65535)', () => {
        const config: EnvironmentConfig = {
          env: 'development',
          port: 65535,
        };
        expect(() => validateEnv(config)).not.toThrow();
      });

      it('should reject port exactly at 65536', () => {
        const config: EnvironmentConfig = {
          env: 'development',
          port: 65536,
        };
        expect(() => validateEnv(config)).toThrow(EnvironmentValidationError);
      });
    });
  });
});
