import http from 'http';
import app from './app';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';
const NODE_ENV = process.env.NODE_ENV || 'development';

let server: http.Server | null = null;

/**
 * Starts the HTTP server and handles startup errors
 */
function startServer(): void {
  try {
    server = http.createServer(app);

    server.listen(PORT, HOST, () => {
      // eslint-disable-next-line no-console
      console.log(`Server started successfully`);
      // eslint-disable-next-line no-console
      console.log(`  Port: ${PORT}`);
      // eslint-disable-next-line no-console
      console.log(`  Host: ${HOST}`);
      // eslint-disable-next-line no-console
      console.log(`  Environment: ${NODE_ENV}`);
      // eslint-disable-next-line no-console
      console.log(`  App: telegram-receiver`);
    });

    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        console.error(
          `Error: Port ${PORT} is already in use. Please choose a different port or stop the process using that port.`
        );
      } else if (error.code === 'EACCES') {
        console.error(
          `Error: Permission denied. Cannot bind to port ${PORT}. Try running with elevated privileges or use a port above 1024.`
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
startServer();
