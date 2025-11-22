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

// Load environment variables from .env file based on NODE_ENV
// Defaults to .env.development if NODE_ENV is not set
const nodeEnv = process.env.NODE_ENV || 'development';
dotenv.config({ path: `.env.${nodeEnv}` });

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
