/**
 * Request logging middleware
 *
 * This middleware logs incoming HTTP requests and their responses with comprehensive
 * request/response information, similar to Rails' built-in request logging with
 * request_id tagging.
 *
 * **Features:**
 * - Logs request method, URL, client IP, timestamp, and unique request ID
 * - Logs response status code, response time/duration, and request ID
 * - Generates or extracts unique request ID for request tracing
 * - Attaches request ID to `req` object for use in other middleware/handlers
 * - Uses structured JSON format for easier parsing and analysis
 *
 * **Request ID:**
 * - Uses `req.id` if available from request-id middleware
 * - Otherwise generates a UUID using `crypto.randomUUID()`
 * - Attached to `req.requestId` for use in other middleware/handlers
 *
 * **Logging Format:**
 * - Request log: `{ "timestamp": "...", "requestId": "...", "method": "GET", "url": "/health", "ip": "127.0.0.1", "type": "request" }`
 * - Response log: `{ "timestamp": "...", "requestId": "...", "method": "GET", "url": "/health", "statusCode": 200, "duration": 15, "type": "response" }`
 *
 * **Middleware Ordering:**
 * - Should be placed after CORS middleware but before route handlers
 * - This ensures all requests are logged, including those that fail CORS checks
 *
 * @example
 * ```typescript
 * import { requestLoggerMiddleware } from './middleware/request-logger.middleware';
 * app.use(requestLoggerMiddleware);
 * ```
 */

import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

/**
 * Extend Express Request type to include requestId
 * Using interface augmentation instead of namespace
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

/**
 * Get client IP address from request
 * Handles proxied requests by checking x-forwarded-for header
 *
 * @param req - Express request object
 * @returns Client IP address
 */
function getClientIp(req: Request): string {
  // Check x-forwarded-for header for proxied requests (may contain comma-separated list)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    // Take the first IP in the chain (original client)
    return ips.split(',')[0].trim();
  }

  // Use req.ip if Express trust proxy is configured
  if (req.ip) {
    return req.ip;
  }

  // Fallback to connection remote address
  return req.socket.remoteAddress || 'unknown';
}

/**
 * Generate or extract unique request ID
 * Uses req.id if available (from request-id middleware), otherwise generates UUID
 *
 * @param req - Express request object
 * @returns Unique request ID
 */
function getRequestId(req: Request): string {
  // Use req.id if available from request-id middleware
  // @ts-expect-error - req.id may be set by other middleware
  if (req.id && typeof req.id === 'string') {
    // @ts-expect-error - req.id may be set by other middleware
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return
    return req.id;
  }

  // Generate UUID using crypto.randomUUID() (Node.js 14.17.0+)
  return randomUUID();
}

/**
 * Request logger middleware function
 * Logs incoming requests and their responses with comprehensive information
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    // Generate or extract unique request ID
    const requestId = getRequestId(req);

    // Attach request ID to req object for use in other middleware/handlers
    req.requestId = requestId;

    // Store request start time using process.hrtime() for high precision
    const startTime = process.hrtime();

    // Get client IP address
    const clientIp = getClientIp(req);

    // Get request URL (full URL including query string)
    const url = req.originalUrl || req.url;

    // Log incoming request with structured JSON format
    const requestLog = {
      timestamp: new Date().toISOString(),
      requestId,
      method: req.method,
      url,
      ip: clientIp,
      type: 'request' as const,
    };

    // eslint-disable-next-line no-console
    console.log(JSON.stringify(requestLog));

    // Log response when request completes
    res.on('finish', () => {
      try {
        // Calculate response duration in milliseconds
        const hrtime = process.hrtime(startTime);
        const duration = Math.round(hrtime[0] * 1000 + hrtime[1] / 1000000); // Convert to milliseconds

        // Log response with structured JSON format
        const responseLog = {
          timestamp: new Date().toISOString(),
          requestId,
          method: req.method,
          url,
          statusCode: res.statusCode,
          duration,
          type: 'response' as const,
        };

        // eslint-disable-next-line no-console
        console.log(JSON.stringify(responseLog));
      } catch (error) {
        // Log error but don't throw - we don't want to break the response
        // eslint-disable-next-line no-console
        console.error('Error logging response:', error);
      }
    });

    // Continue to next middleware
    next();
  } catch (error) {
    // Log error but ensure next() is always called
    // eslint-disable-next-line no-console
    console.error('Error in request logger middleware:', error);
    next();
  }
}

export default requestLoggerMiddleware;
