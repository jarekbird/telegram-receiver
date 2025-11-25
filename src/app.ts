// PHASE1-010: Create Express application instance
import express from 'express';
import { corsMiddleware } from './middleware/cors';
import { requestLoggerMiddleware } from './middleware/request-logger.middleware';
import { notFoundMiddleware } from './middleware/not-found.middleware';
import { errorHandlerMiddleware } from './middleware/error-handler.middleware';
import { setupRoutes } from './routes';

const app = express();

// PHASE1-017: JSON body parser middleware
// Express requires explicit middleware to parse JSON request bodies
// Rails ActionController::API automatically parses JSON when Content-Type: application/json is set
// This middleware populates req.body with parsed JSON data
app.use(express.json());

// PHASE1-018: URL-encoded body parser middleware
// Express requires explicit middleware to parse URL-encoded form data (application/x-www-form-urlencoded)
// Rails ActionController::API automatically parses URL-encoded form data when Content-Type: application/x-www-form-urlencoded is set
// This middleware populates req.body with parsed URL-encoded form data
// extended: true uses qs library which supports nested objects (matches Rails behavior)
app.use(express.urlencoded({ extended: true }));

// PHASE1-019: CORS middleware
// CORS (Cross-Origin Resource Sharing) middleware handles cross-origin AJAX requests from web frontends
// CORS is disabled by default (matching Rails behavior where CORS is commented out)
// Enable CORS by setting CORS_ENABLED=true environment variable
// Configure allowed origins via CORS_ORIGIN environment variable
// This middleware is placed after body parsers but before request logger
// Current API usage is server-to-server (Telegram webhooks, cursor-runner callbacks), so CORS is not needed
// However, middleware is integrated to support future frontend integrations if needed
app.use(corsMiddleware);

// PHASE1-020: Request logger middleware
// Request logging middleware logs incoming HTTP requests and their responses with comprehensive
// request/response information, similar to Rails' built-in request logging with request_id tagging.
// Logs request method, URL, client IP, timestamp, unique request ID, response status code, and response time.
// Middleware order: JSON parser → URL-encoded parser → CORS → Request logger → Routes
// This ensures all requests are logged, including those that fail CORS checks.
app.use(requestLoggerMiddleware);

// PHASE2-089: Register all routes via routes index
// All routes are now registered through the setupRoutes function from routes/index.ts
// This centralizes route registration and makes it easier to manage routes.
// Routes registered:
// - Health routes: GET /health, GET /
// - Agent tools routes: POST /agent-tools
// - Cursor runner routes: POST /cursor-runner/cursor/execute, POST /cursor-runner/cursor/iterate,
//   POST /cursor-runner/callback, POST /cursor-runner/git/clone, GET /cursor-runner/git/repositories,
//   POST /cursor-runner/git/checkout, POST /cursor-runner/git/push, POST /cursor-runner/git/pull
// - Telegram routes: POST /telegram/webhook, POST /telegram/set_webhook, GET /telegram/webhook_info,
//   DELETE /telegram/webhook
setupRoutes(app);

// PHASE1-022: 404 Not Found handler middleware
// Catches all requests that don't match any registered routes and returns
// a standardized 404 Not Found response matching the Rails error format.
// This middleware must be registered after all routes but before error handler middleware.
// Express processes middleware in order, so unmatched requests will fall through
// to this middleware only if no route matches.
app.use(notFoundMiddleware);

// PHASE1-021: Error handling middleware
// Catches all unhandled errors thrown in route handlers and middleware,
// logs error details, and returns a standardized error response matching
// the Rails ApplicationController error handling pattern.
// This middleware must be registered after all routes and other middleware,
// as the last middleware in the chain.
// Express error handling middleware must have exactly 4 parameters
// (err, req, res, next) to be recognized as an error handler.
app.use(errorHandlerMiddleware);

export default app;
