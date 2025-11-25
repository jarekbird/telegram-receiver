import { Express } from 'express';
import healthRoutes from './health.routes';
import agentToolsRoutes from './agent-tools.routes';
import cursorRunnerRoutes from './cursor-runner.routes';
import telegramRoutes from './telegram.routes';

/**
 * Routes Index (PHASE2-089)
 * 
 * Main route aggregator that imports and mounts all route modules.
 * This file centralizes route registration and provides a single entry point
 * for setting up all application routes.
 * 
 * Matches Rails routes structure from jarek-va/config/routes.rb:
 * - Health routes at root level (GET /health, GET /)
 * - Agent tools routes at /agent-tools (POST /agent-tools)
 * - Cursor runner routes at /cursor-runner (POST /cursor-runner/*)
 * - Telegram routes at /telegram (POST /telegram/*, etc.)
 * 
 * Note: Background job monitoring UI routes (/sidekiq/*) are not included
 * as Sidekiq is Ruby-specific. A Node.js equivalent (e.g., BullMQ dashboard)
 * should be implemented in a separate task.
 */

/**
 * Sets up all routes on the Express application instance
 * 
 * @param app - Express application instance
 */
export function setupRoutes(app: Express): void {
  // Health routes at root level
  // GET /health and GET / are handled by healthRoutes
  app.use('/', healthRoutes);

  // Agent tools routes
  // POST /agent-tools is handled by agentToolsRoutes
  app.use('/agent-tools', agentToolsRoutes);

  // Cursor runner routes
  // POST /cursor-runner/cursor/execute
  // POST /cursor-runner/cursor/iterate
  // POST /cursor-runner/callback
  // POST /cursor-runner/git/clone
  // GET /cursor-runner/git/repositories
  // POST /cursor-runner/git/checkout
  // POST /cursor-runner/git/push
  // POST /cursor-runner/git/pull
  app.use('/cursor-runner', cursorRunnerRoutes);

  // Telegram routes
  // POST /telegram/webhook
  // POST /telegram/set_webhook
  // GET /telegram/webhook_info
  // DELETE /telegram/webhook
  app.use('/telegram', telegramRoutes);
}

/**
 * Export individual route routers for testing purposes
 */
export {
  healthRoutes,
  agentToolsRoutes,
  cursorRunnerRoutes,
  telegramRoutes,
};
