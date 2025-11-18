import type { EnvironmentConfig } from './environment';

/**
 * Validation error class for environment configuration errors
 * Provides detailed error messages about which environment variables are invalid
 */
export class EnvironmentValidationError extends Error {
  public readonly invalidVariables: string[];

  constructor(message: string, invalidVariables: string[] = []) {
    super(message);
    this.name = 'EnvironmentValidationError';
    this.invalidVariables = invalidVariables;
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, EnvironmentValidationError);
    }
  }
}

/**
 * Validates environment configuration values
 *
 * This function validates that the environment configuration object contains
 * valid values for required environment variables. It ensures the application
 * fails fast with clear error messages if critical configuration is missing
 * or invalid, preventing runtime errors later.
 *
 * @param config - The environment configuration object to validate
 * @throws {EnvironmentValidationError} If validation fails, throws an error
 *   with details about which variables are invalid
 *
 * @example
 * ```typescript
 * import config from './config/environment';
 * import validateEnv from './config/validateEnv';
 *
 * try {
 *   validateEnv(config);
 *   // Configuration is valid, proceed with application startup
 * } catch (error) {
 *   console.error('Environment validation failed:', error.message);
 *   process.exit(1);
 * }
 * ```
 *
 * @remarks
 * - Validates `config.env` is one of: "development", "test", "production"
 * - Validates `config.port` is a valid positive integer
 * - Defaulting of values is handled by environment.ts, this function only
 *   validates that provided values are valid
 * - This is a Node.js best practice that improves developer experience and
 *   prevents configuration-related runtime errors
 */
function validateEnv(config: EnvironmentConfig): void {
  const errors: string[] = [];
  const invalidVariables: string[] = [];

  // Validate NODE_ENV (config.env)
  const validEnvironments = ['development', 'test', 'production'];
  if (!validEnvironments.includes(config.env)) {
    errors.push(`NODE_ENV must be one of: ${validEnvironments.join(', ')}. Got: "${config.env}"`);
    invalidVariables.push('NODE_ENV');
  }

  // Validate PORT (config.port)
  if (typeof config.port !== 'number' || !Number.isInteger(config.port)) {
    errors.push(`PORT must be a valid integer. Got: ${config.port} (type: ${typeof config.port})`);
    invalidVariables.push('PORT');
  } else if (config.port <= 0) {
    errors.push(`PORT must be a positive integer. Got: ${config.port}`);
    invalidVariables.push('PORT');
  } else if (config.port > 65535) {
    errors.push(`PORT must be a valid port number (1-65535). Got: ${config.port}`);
    invalidVariables.push('PORT');
  }

  // If there are validation errors, throw with descriptive message
  if (errors.length > 0) {
    const errorMessage = `Environment validation failed:\n${errors.join('\n')}`;
    throw new EnvironmentValidationError(errorMessage, invalidVariables);
  }
}

export default validateEnv;
