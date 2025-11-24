/**
 * Admin authentication middleware for Telegram admin endpoints
 *
 * This middleware authenticates admin requests by validating the admin secret
 * from headers or query parameters against the configured WEBHOOK_SECRET.
 *
 * **Features:**
 * - Validates admin secret from multiple sources (in order):
 *   1. `X-Admin-Secret` header (Express normalizes to lowercase: `x-admin-secret`)
 *   2. `admin_secret` query parameter
 * - Compares against `WEBHOOK_SECRET` environment variable (defaults to 'changeme')
 * - Returns 401 Unauthorized when authentication fails
 * - Logs debug information in test/development mode when authentication fails
 *
 * **Configuration:**
 * - The admin secret is configured via `WEBHOOK_SECRET` environment variable
 * - Defaults to 'changeme' if not set (matching Rails behavior)
 *
 * **Rails Reference:**
 * - `jarek-va/app/controllers/telegram_controller.rb` (lines 110-130)
 * - `jarek-va/config/application.rb` (lines 22-25)
 * - Used in endpoints: `set_webhook` (line 52), `webhook_info` (line 74), `delete_webhook` (line 92)
 *
 * **Rails Implementation Details:**
 * - Checks for admin secret from multiple sources (in order):
 *   1. `request.headers['X-Admin-Secret']` (header)
 *   2. `request.env['HTTP_X_ADMIN_SECRET']` (Rails-specific: Rails exposes headers via env vars with HTTP_ prefix)
 *   3. `params[:admin_secret]` (query parameter as symbol)
 *   4. `params['admin_secret']` (query parameter as string)
 * - Compares against `Rails.application.config.webhook_secret`
 * - Returns boolean (true/false) - the calling code returns `401 Unauthorized` if false
 * - Has debug logging in test environment when authentication fails
 *
 * **Express/Node.js Implementation:**
 * - Express middleware follows standard pattern: `(req, res, next) => {}`
 * - Express normalizes header names to lowercase, so we check `req.headers['x-admin-secret']`
 * - Express does NOT automatically convert headers to environment variables like Rails does
 * - Query parameters are accessible via `req.query.admin_secret`
 * - On success: call `next()` to proceed to route handler
 * - On failure: send `401 Unauthorized` response
 *
 * **Usage:**
 * Apply this middleware to admin routes (set_webhook, webhook_info, delete_webhook):
 *
 * @example
 * ```typescript
 * import { authenticateAdmin } from './middleware/authenticate-admin.middleware';
 * import TelegramController from './controllers/telegram-controller';
 *
 * const telegramController = new TelegramController(...);
 *
 * // Apply middleware to admin routes
 * router.post('/set_webhook', authenticateAdmin, telegramController.setWebhook.bind(telegramController));
 * router.get('/webhook_info', authenticateAdmin, telegramController.getWebhookInfo.bind(telegramController));
 * router.delete('/webhook', authenticateAdmin, telegramController.deleteWebhook.bind(telegramController));
 * ```
 */

import type { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Admin authentication middleware function
 * Authenticates admin requests by validating the admin secret
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function to continue request processing
 */
export function authenticateAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Get admin secret from multiple sources (matching Rails implementation order)
  // Rails checks: request.headers['X-Admin-Secret'] || request.env['HTTP_X_ADMIN_SECRET'] || params[:admin_secret] || params['admin_secret']
  // Express normalizes header names to lowercase, so we check 'x-admin-secret'
  // Express does NOT automatically convert headers to env vars like Rails does, so we skip HTTP_X_ADMIN_SECRET
  const adminSecret =
    req.headers['x-admin-secret'] ||
    req.query.admin_secret ||
    undefined;

  // Get expected secret from WEBHOOK_SECRET environment variable
  // Rails uses: Rails.application.config.webhook_secret
  // Rails defaults to 'changeme' if not set (from ENV.fetch('WEBHOOK_SECRET', 'changeme'))
  const expectedSecret = process.env.WEBHOOK_SECRET || 'changeme';

  // Compare secrets (matching Rails: admin_secret == expected_secret)
  // Use strict equality comparison (matching Rails behavior)
  const isAuthenticated = adminSecret === expectedSecret;

  // Debug logging in test/development mode when authentication fails (matching Rails behavior)
  // Rails logs in test environment: Rails.env.test? && !result
  // We'll log in both test and development for better debugging
  if ((process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') && !isAuthenticated) {
    logger.warn('Admin authentication failed', {
      // Log secret values for debugging (masked for security)
      adminSecret: adminSecret ? '***' : undefined,
      expectedSecret: expectedSecret ? '***' : undefined,
      // Log headers and query params for debugging
      headers: {
        'x-admin-secret': req.headers['x-admin-secret'] ? '***' : undefined,
      },
      query: {
        admin_secret: req.query.admin_secret ? '***' : undefined,
      },
      // Log whether secret was found
      secretFound: !!adminSecret,
    });
  }

  // If authenticated, proceed to next middleware/route handler
  if (isAuthenticated) {
    next();
    return;
  }

  // Authentication failed - return 401 Unauthorized
  // This matches Rails behavior: head :unauthorized (which returns 401 with no body)
  // Check if response has already been sent (defensive check)
  if (res.headersSent) {
    next();
    return;
  }

  // Return 401 Unauthorized (matching Rails head :unauthorized)
  res.status(401).send('Unauthorized');
}

export default authenticateAdmin;
