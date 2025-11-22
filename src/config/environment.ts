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

// Load environment variables from .env file from project root
// dotenv automatically looks for .env in current working directory
dotenv.config();

// Get NODE_ENV or default to "development" (matching Rails Rails.env behavior)
const nodeEnv = process.env.NODE_ENV || 'development';

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
