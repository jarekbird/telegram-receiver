/**
 * Environment configuration
 *
 * This module loads and exports environment variables for the application.
 * It replaces Rails environment-specific configuration files.
 *
 * @example
 * ```typescript
 * import config from './config/environment';
 * console.log(config.env); // 'development' | 'test' | 'production'
 * console.log(config.port); // 3000
 * ```
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file from project root (base config)
// dotenv automatically looks for .env in current working directory
// This loads base configuration and NODE_ENV if it's defined in .env
dotenv.config();

// Get NODE_ENV or default to "development" (matching Rails Rails.env behavior)
// NODE_ENV may be set as an environment variable or loaded from .env above
const nodeEnv = process.env.NODE_ENV || 'development';

// Load environment-specific .env file (e.g., .env.development, .env.test, .env.production)
// This overrides base .env values with environment-specific values
// Matches Rails environment-specific configuration files behavior
const envFile = `.env.${nodeEnv}`;
dotenv.config({ path: path.resolve(process.cwd(), envFile), override: true });

/**
 * Environment configuration interface
 * Matches the structure expected by validateEnv
 */
export interface EnvironmentConfig {
  /** Node.js environment (development, test, production) */
  env: string;
  /** Server port number */
  port: number;
}

/**
 * Environment configuration object
 * Loads values from environment variables with appropriate defaults
 */
const config: EnvironmentConfig = {
  env: nodeEnv,
  port: parseInt(process.env.PORT || '3000', 10),
};

export default config;
