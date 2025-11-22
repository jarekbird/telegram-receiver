/**
 * 404 Not Found handler middleware
 *
 * This middleware catches all requests that don't match any registered routes
 * and returns a standardized 404 Not Found response matching the Rails error
 * response format.
 *
 * **Features:**
 * - Catches all unmatched routes (requests that don't match any registered route)
 * - Returns standardized JSON error response matching Rails format
 * - Sets HTTP status code to 404 (Not Found)
 * - Handles case where response has already been sent
 *
 * **Error Response Format:**
 * ```json
 * {
 *   "ok": false,
 *   "say": "Sorry, I couldn't find that resource.",
 *   "result": {
 *     "error": "Not Found"
 *   }
 * }
 * ```
 *
 * **Middleware Ordering:**
 * - Must be registered after all route handlers
 * - Must be registered before error handler middleware
 * - Express processes middleware in order, so unmatched requests will fall
 *   through to this middleware only if no route matches
 *
 * **Rails Reference:**
 * Rails automatically handles unmatched routes by returning a 404 response.
 * Express requires explicit middleware registered after all routes to catch
 * unmatched requests. This middleware returns the same error format as the
 * error handler (PHASE1-021) for consistency.
 *
 * @example
 * ```typescript
 * import { notFoundMiddleware } from './middleware/not-found.middleware';
 * app.use(notFoundMiddleware);
 * ```
 */

import type { Request, Response, NextFunction } from 'express';

/**
 * 404 Not Found handler middleware function
 * Catches all requests that don't match any registered routes and returns
 * a standardized 404 Not Found response matching the Rails error format
 *
 * @param _req - Express request object (not used, but required for middleware signature)
 * @param res - Express response object
 * @param _next - Express next function (not used, but required for middleware signature)
 */
export function notFoundMiddleware(_req: Request, res: Response, _next: NextFunction): void {
  // Check if response has already been sent
  // This prevents "Cannot set headers after they are sent" errors
  if (res.headersSent) {
    _next();
    return;
  }

  // Return standardized JSON error response matching Rails format
  res.status(404).json({
    ok: false,
    say: "Sorry, I couldn't find that resource.",
    result: {
      error: 'Not Found',
    },
  });
}

export default notFoundMiddleware;
