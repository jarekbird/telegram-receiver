/**
 * CORS (Cross-Origin Resource Sharing) middleware configuration
 *
 * This middleware handles Cross-Origin Resource Sharing headers to allow
 * cross-origin AJAX requests from web frontends or other clients.
 *
 * **Configuration:**
 * - CORS is disabled by default (matching Rails behavior where CORS is commented out)
 * - Enable CORS by setting `CORS_ENABLED=true` environment variable
 * - Configure allowed origins via `CORS_ORIGIN` environment variable
 *   - Single origin: `CORS_ORIGIN=https://example.com`
 *   - Multiple origins: `CORS_ORIGIN=https://example.com,https://app.example.com`
 *   - All origins (development only): `CORS_ORIGIN=*` (not recommended for production)
 *
 * **When CORS is Needed:**
 * - The API will be called from web browsers (frontend applications)
 * - The API needs to support cross-origin requests
 * - Future frontend integrations are planned
 *
 * **When CORS May Not Be Needed:**
 * - If the API is only called from server-to-server (like Telegram webhooks, cursor-runner callbacks)
 * - If all clients are same-origin
 * - If the API is only used internally within Docker networks
 *
 * @example
 * ```typescript
 * import cors from 'cors';
 * import { corsOptions } from './middleware/cors';
 *
 * app.use(cors(corsOptions));
 * ```
 */

import cors from 'cors';
import type { CorsOptions } from 'cors';

/**
 * CORS configuration options
 * Configures CORS middleware based on environment variables
 */
export const corsOptions: CorsOptions = (() => {
  // CORS is disabled by default (matching Rails behavior)
  const corsEnabled = process.env.CORS_ENABLED === 'true';

  if (!corsEnabled) {
    // Return a no-op function that doesn't set CORS headers
    // This effectively disables CORS without requiring conditional middleware
    return {
      origin: false,
    };
  }

  // Parse allowed origins from environment variable
  const corsOrigin = process.env.CORS_ORIGIN || '*';
  const allowedOrigins = corsOrigin
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  // If only one origin and it's '*', use it directly
  // Otherwise, use a function to check against the list
  const originConfig =
    allowedOrigins.length === 1 && allowedOrigins[0] === '*'
      ? '*'
      : (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
          // Allow requests with no origin (e.g., mobile apps, Postman, curl)
          if (!origin) {
            callback(null, true);
            return;
          }

          // Check if origin is in allowed list
          if (allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
          }

          // Reject origin not in allowed list
          callback(new Error('Not allowed by CORS'));
        };

  return {
    origin: originConfig,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Webhook-Secret',
      'X-Cursor-Runner-Secret',
      'X-Telegram-Bot-Api-Secret-Token',
      'X-Admin-Secret',
      'X-EL-Secret',
    ],
    exposedHeaders: [],
    credentials: false, // Set to true if cookies/auth headers need to be sent cross-origin
    maxAge: 86400, // 24 hours - cache preflight requests
  };
})();

/**
 * CORS middleware function
 * Applies CORS configuration to Express app
 *
 * @example
 * ```typescript
 * import { corsMiddleware } from './middleware/cors';
 * app.use(corsMiddleware);
 * ```
 */
export const corsMiddleware = cors(corsOptions);

export default corsMiddleware;
