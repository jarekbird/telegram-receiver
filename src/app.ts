// PHASE1-010: Create Express application instance
import express from 'express';
import healthRoutes from './routes/health.routes';
import { getHealth } from './controllers/health.controller';
import { corsMiddleware } from './middleware/cors';
import { requestLoggerMiddleware } from './middleware/request-logger.middleware';

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

// PHASE1-015: Register health routes
// Register health routes with app.use('/', healthRoutes) for /health endpoint
// (route file already defines /health path)
app.use('/', healthRoutes);

// Register root route with app.get('/', getHealth) for root / endpoint
// (to match Rails root 'health#show')
app.get('/', getHealth);

export default app;
