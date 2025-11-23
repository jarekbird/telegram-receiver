import http from 'http';
import fs from 'fs';
import path from 'path';
import config from './config/environment';
import validateEnv from './config/validateEnv';
import { initializeSystemSettings } from './config/initializers/system-settings';
import { initializeTasks } from './config/initializers/tasks';
import logger from './utils/logger';

// Read app name and version from package.json for logging
interface PackageJson {
  name?: string;
  version?: string;
}

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf-8');
const packageJson: PackageJson = JSON.parse(packageJsonContent) as PackageJson;
const APP_NAME = packageJson.name || 'telegram-receiver';
const APP_VERSION = packageJson.version || '1.0.0';

// Validate environment configuration before starting the application
// This ensures the application fails fast with clear error messages if critical configuration is missing
try {
  validateEnv(config);
} catch (error) {
  if (error instanceof Error) {
    logger.error('Environment validation failed:', error);
  } else {
    logger.error('Environment validation failed:', String(error));
  }
  process.exit(1);
}

// Define port constant (default: process.env.PORT || 3000, matching Rails default)
// Note: config.port also reads from process.env.PORT || 3000, but we define it here for clarity
const PORT = parseInt(process.env.PORT || '3000', 10);

// Define host constant (default: process.env.HOST || '0.0.0.0', matching Rails Puma default)
const HOST = process.env.HOST || '0.0.0.0';

let server: http.Server | null = null;

/**
 * Starts the HTTP server and handles startup errors
 */
async function startServer(): Promise<void> {
  try {
    // Initialize system settings before starting the server
    // This ensures system settings are set up in the shared database
    initializeSystemSettings();

    // Initialize tasks to ready status
    // This ensures all tasks are set to ready status in the shared database
    initializeTasks();

    // Import app module after validation to ensure config is valid before app initialization
    const { default: app } = await import('./app');
    // PHASE1-011: Start the Express server using the port and host constants
    // Start the Express server using the port from the environment configuration module
    server = app.listen(PORT, HOST, () => {
      logger.info(
        `${APP_NAME} v${APP_VERSION} running in ${config.env} mode on ${HOST}:${PORT}`
      );
    });

    // Server is guaranteed to be non-null after app.listen() call
    if (!server) {
      throw new Error('Failed to create server instance');
    }

    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(
          `Error: Port ${PORT} is already in use. Please choose a different port or stop the process using that port.`,
          error
        );
      } else if (error.code === 'EACCES') {
        logger.error(
          `Error: Permission denied. Cannot bind to port ${PORT}. Try running with elevated privileges or use a port above 1024.`,
          error
        );
      } else {
        logger.error('Server startup error:', error);
      }
      process.exit(1);
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error('Failed to start server:', error);
    } else {
      logger.error('Failed to start server:', String(error));
    }
    process.exit(1);
  }
}

/**
 * Gracefully shuts down the server
 */
function gracefulShutdown(signal: string): void {
  logger.info(`\n${signal} received. Starting graceful shutdown...`);

  if (!server) {
    logger.info('No server instance found. Exiting immediately.');
    process.exit(0);
  }

  // Stop accepting new connections
  server.close(() => {
    logger.info('HTTP server closed. All connections have been closed.');
    process.exit(0);
  });

  // Force shutdown after 10 seconds if graceful shutdown doesn't complete
  setTimeout(() => {
    logger.error('Graceful shutdown timeout exceeded. Forcing exit...');
    process.exit(1);
  }, 10000);
}

/**
 * Handles uncaught exceptions
 */
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

/**
 * Handles unhandled promise rejections
 */
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  if (reason instanceof Error) {
    logger.error('Unhandled Rejection:', reason);
  } else {
    logger.error('Unhandled Rejection:', String(reason));
  }
  gracefulShutdown('unhandledRejection');
});

/**
 * Handle SIGTERM signal (used by process managers like PM2, Docker, etc.)
 */
process.on('SIGTERM', () => {
  gracefulShutdown('SIGTERM');
});

/**
 * Handle SIGINT signal (Ctrl+C)
 */
process.on('SIGINT', () => {
  gracefulShutdown('SIGINT');
});

// Start the server
startServer().catch((error) => {
  if (error instanceof Error) {
    logger.error('Failed to start server:', error);
  } else {
    logger.error('Failed to start server:', String(error));
  }
  process.exit(1);
});
