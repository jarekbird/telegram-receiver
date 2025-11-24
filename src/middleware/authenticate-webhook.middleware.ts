/**
 * Webhook authentication middleware for Telegram webhook requests
 *
 * This middleware authenticates incoming Telegram webhook requests by validating
 * the `X-Telegram-Bot-Api-Secret-Token` header against a configured secret.
 *
 * **Features:**
 * - Validates `X-Telegram-Bot-Api-Secret-Token` header
 * - Allows requests when secret is not configured (development mode)
 * - Allows requests when header token matches configured secret
 * - Returns 401 Unauthorized when secret is configured but doesn't match
 * - Logs warning message when authentication fails
 *
 * **Configuration:**
 * - The webhook secret is configured via `TELEGRAM_WEBHOOK_SECRET` environment variable
 * - If secret is not set (undefined), blank, or whitespace-only, authentication is bypassed (development mode)
 * - If secret is set to a value, the header token must match exactly
 *
 * **Rails Reference:**
 * - `jarek-va/app/controllers/telegram_controller.rb` (lines 134-143)
 * - Used as `before_action :authenticate_webhook, only: [:webhook]`
 * - Rails implementation allows request if expected secret is blank or matches
 *
 * **Usage:**
 * Apply this middleware only to the Telegram webhook route (not admin routes):
 *
 * @example
 * ```typescript
 * import { authenticateWebhook } from './middleware/authenticate-webhook.middleware';
 * import TelegramController from './controllers/telegram-controller';
 *
 * const telegramController = new TelegramController(...);
 *
 * // Apply middleware only to webhook route
 * router.post('/telegram/webhook', authenticateWebhook, telegramController.webhook.bind(telegramController));
 * ```
 */

import type { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Webhook authentication middleware function
 * Authenticates Telegram webhook requests by validating the secret token header
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function to continue request processing
 */
export function authenticateWebhook(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Extract secret token from X-Telegram-Bot-Api-Secret-Token header
  // Express automatically normalizes header names, so we can use lowercase
  const secretToken = req.headers['x-telegram-bot-api-secret-token'] as string | undefined;

  // Get expected secret from environment variable
  // If not set (undefined), treat as blank/not configured (development mode)
  // If set to empty string or whitespace, also treat as blank
  // If set to a value (including 'changeme'), require matching
  // Rails defaults to 'changeme' in config, but if env var is not set, we allow all (dev mode)
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

  // Allow request if expected secret is blank/not configured (development mode)
  // Rails uses .blank? which returns true for nil, empty string, or whitespace-only strings
  // In TypeScript, we check for undefined, empty string, or whitespace-only strings
  const isSecretBlank =
    expectedSecret === undefined || !expectedSecret || expectedSecret.trim() === '';

  // Allow request if secret is blank OR if provided token matches expected secret
  if (isSecretBlank || secretToken === expectedSecret) {
    // Authentication succeeded - continue to next middleware/route handler
    next();
    return;
  }

  // Authentication failed - log warning and return 401 Unauthorized
  // This matches Rails behavior: Rails.logger.warn('Unauthorized Telegram webhook request - invalid secret token')
  logger.warn('Unauthorized Telegram webhook request - invalid secret token');

  // Check if response has already been sent (defensive check)
  if (res.headersSent) {
    next();
    return;
  }

  // Return 401 Unauthorized (matching Rails head :unauthorized)
  res.status(401).send('Unauthorized');
}

export default authenticateWebhook;
