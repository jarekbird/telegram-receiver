import http from 'http';
import fs from 'fs';
import path from 'path';
import config from './config/environment';
import validateEnv from './config/validateEnv';
import { initializeSystemSettings } from './config/initializers/system-settings';
import { initializeTasks } from './config/initializers/tasks';

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
  console.error('Environment validation failed:');
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }
  process.exit(1);
}

// Read host from environment variable (defaulting to Rails defaults)
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
    server = app.listen(config.port, HOST, () => {
      // eslint-disable-next-line no-console
      console.log(
        `${APP_NAME} v${APP_VERSION} running in ${config.env} mode on ${HOST}:${config.port}`
      );
    });

    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        console.error(
          `Error: Port ${config.port} is already in use. Please choose a different port or stop the process using that port.`
        );
      } else if (error.code === 'EACCES') {
        console.error(
          `Error: Permission denied. Cannot bind to port ${config.port}. Try running with elevated privileges or use a port above 1024.`
        );
      } else {
        console.error('Server startup error:', error);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

/**
 * Gracefully shuts down the server
 */
function gracefulShutdown(signal: string): void {
  // eslint-disable-next-line no-console
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  if (!server) {
    // eslint-disable-next-line no-console
    console.log('No server instance found. Exiting immediately.');
    process.exit(0);
  }

  // Stop accepting new connections
  server.close(() => {
    // eslint-disable-next-line no-console
    console.log('HTTP server closed. All connections have been closed.');
    process.exit(0);
  });

  // Force shutdown after 10 seconds if graceful shutdown doesn't complete
  setTimeout(() => {
    console.error('Graceful shutdown timeout exceeded. Forcing exit...');
    process.exit(1);
  }, 10000);
}

/**
 * Handles uncaught exceptions
 */
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  gracefulShutdown('uncaughtException');
});

/**
 * Handles unhandled promise rejections
 */
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  console.error('Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
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
  console.error('Failed to start server:', error);
  process.exit(1);
});
