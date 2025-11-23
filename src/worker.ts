/**
 * BullMQ worker entry point
 *
 * This is a minimal worker implementation for docker-compose testing.
 * It sets up a basic BullMQ worker that can start successfully even if no jobs are queued.
 *
 * In a full implementation, this would process jobs from the queue.
 * For now, it just connects to Redis and waits for jobs.
 */

import { Worker } from 'bullmq';
import config from './config/environment';
import { connection, queueConfig } from './config/queue';
import logger from './utils/logger';

// Read app name and version from package.json for logging
import fs from 'fs';
import path from 'path';

interface PackageJson {
  name?: string;
  version?: string;
}

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf-8');
const packageJson: PackageJson = JSON.parse(packageJsonContent) as PackageJson;
const APP_NAME = packageJson.name || 'telegram-receiver-worker';
const APP_VERSION = packageJson.version || '1.0.0';

/**
 * Worker processor function
 * This will be called when jobs are available in the queue
 */
async function processJob(job: { id?: string; name?: string; data?: unknown }): Promise<void> {
  logger.info(
    { jobId: job.id, jobName: job.name, jobData: job.data },
    'Processing job'
  );
  // Job processing logic will be implemented in future tasks
  // For now, this is a placeholder that allows the worker to start
}

/**
 * Gracefully shutdown the worker
 */
function gracefulShutdown(signal: string, worker: Worker): void {
  logger.info(`\n${signal} received. Starting graceful shutdown...`);

  worker
    .close()
    .then(() => {
      logger.info('Worker closed successfully.');
      process.exit(0);
    })
    .catch((error: unknown) => {
      if (error instanceof Error) {
        logger.error('Error closing worker:', error);
      } else {
        logger.error('Error closing worker:', String(error));
      }
      process.exit(1);
    });

  // Force shutdown after 10 seconds if graceful shutdown doesn't complete
  setTimeout(() => {
    logger.error('Graceful shutdown timeout exceeded. Forcing exit...');
    process.exit(1);
  }, 10000);
}

/**
 * Start the worker
 */
function startWorker(): void {
  try {
    const envConfig = queueConfig.environmentConfig;
    const queueName = envConfig.queues[0] || 'default';

    logger.info(
      {
        appName: APP_NAME,
        version: APP_VERSION,
        environment: config.env,
        queueName,
        concurrency: envConfig.concurrency,
      },
      'Starting BullMQ worker'
    );

    // Create worker for the default queue
    const worker = new Worker(queueName, processJob, {
      connection,
      concurrency: envConfig.concurrency,
    });

    // Worker event listeners
    worker.on('completed', (job) => {
      logger.info({ jobId: job.id }, 'Job completed');
    });

    worker.on('failed', (job, err) => {
      logger.error({ jobId: job?.id, error: err }, 'Job failed');
    });

    worker.on('error', (err) => {
      logger.error({ error: err }, 'Worker error');
    });

    worker.on('ready', () => {
      logger.info('Worker ready and waiting for jobs');
    });

    // Handle shutdown signals
    process.on('SIGTERM', () => {
      gracefulShutdown('SIGTERM', worker);
    });

    process.on('SIGINT', () => {
      gracefulShutdown('SIGINT', worker);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown('uncaughtException', worker);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: unknown) => {
      if (reason instanceof Error) {
        logger.error('Unhandled Rejection:', reason);
      } else {
        logger.error('Unhandled Rejection:', String(reason));
      }
      gracefulShutdown('unhandledRejection', worker);
    });
  } catch (error) {
    if (error instanceof Error) {
      logger.error('Failed to start worker:', error);
    } else {
      logger.error('Failed to start worker:', String(error));
    }
    process.exit(1);
  }
}

// Start the worker
startWorker();
