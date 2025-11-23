/**
 * Error handling middleware
 *
 * This middleware catches all unhandled errors thrown in route handlers and
 * middleware, logs error details, and returns a standardized error response
 * matching the Rails ApplicationController error handling pattern.
 *
 * **Features:**
 * - Catches all errors thrown in route handlers and middleware
 * - Logs error details (error name/class, message, and stack trace)
 * - Returns standardized JSON error response matching Rails format
 * - Sets HTTP status code to 500 (internal server error)
 * - Handles case where response has already been sent
 *
 * **Error Response Format:**
 * ```json
 * {
 *   "ok": false,
 *   "say": "Sorry, I encountered an error processing your request.",
 *   "result": {
 *     "error": "<error message>"
 *   }
 * }
 * ```
 *
 * **Middleware Ordering:**
 * - Must be registered after all routes and other middleware
 * - Express error handling middleware must have exactly 4 parameters
 *   (err, req, res, next) to be recognized as an error handler
 * - This is the last middleware in the chain, catching all unhandled errors
 *
 * **Rails Reference:**
 * The jarek-va Rails application uses `rescue_from StandardError` in
 * ApplicationController (see `jarek-va/app/controllers/application_controller.rb`)
 * which:
 * - Logs error class, message, and backtrace
 * - Returns JSON: `{ ok: false, say: '...', result: { error: ... } }`
 * - Sets status to `:internal_server_error` (500)
 *
 * **Logging:**
 * Uses logger utility from `@/utils/logger` for error logging, matching Rails
 * error logging patterns from ApplicationController.
 *
 * @example
 * ```typescript
 * import { errorHandlerMiddleware } from './middleware/error-handler.middleware';
 * app.use(errorHandlerMiddleware);
 * ```
 */

import type { Request, Response, NextFunction } from 'express';
import logger from '@/utils/logger';

/**
 * Error handler middleware function
 * Catches all unhandled errors and returns a standardized error response
 * matching the Rails ApplicationController error handling pattern
 *
 * @param err - The error object that was thrown
 * @param _req - Express request object (not used, but required for middleware signature)
 * @param res - Express response object
 * @param _next - Express next function (not used, but required for middleware signature)
 */
export function errorHandlerMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Log error details following Rails pattern from ApplicationController
  // Match Rails pattern: Rails.logger.error("#{exception.class}: #{exception.message}")
  const errorName = err.constructor.name || err.name || 'Error';
  logger.error(`${errorName}: ${err.message}`);
  // Match Rails pattern: Rails.logger.error(exception.backtrace.join("\n"))
  if (err.stack) {
    logger.error(err.stack);
  }

  // Check if response has already been sent
  // This prevents "Cannot set headers after they are sent" errors
  if (res.headersSent) {
    _next();
    return;
  }

  // Return standardized JSON error response matching Rails format
  // Set HTTP status code to 500 (internal server error)
  res.status(500).json({
    ok: false,
    say: 'Sorry, I encountered an error processing your request.',
    result: {
      error: err.message,
    },
  });
}

export default errorHandlerMiddleware;
