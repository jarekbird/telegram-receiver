import express from 'express';
import healthRoutes from './routes/health.routes';
import { getHealth } from './controllers/health.controller';
import { corsMiddleware } from './middleware/cors';
import { requestLoggerMiddleware } from './middleware/request-logger.middleware';

const app = express();

// JSON body parser middleware - must be applied before routes
// This enables Express to parse JSON request bodies (similar to Rails ActionController::API)
// Parsed data will be available in req.body for routes
app.use(express.json());

// URL-encoded body parser middleware - must be applied after JSON parser but before routes
// This enables Express to parse URL-encoded form data (application/x-www-form-urlencoded)
// Similar to Rails ActionController::API which automatically parses URL-encoded form data
// Parsed data will be available in req.body for routes
// extended: true uses qs library which supports nested objects (matches Rails behavior)
app.use(express.urlencoded({ extended: true }));

// CORS middleware - must be applied after body parsers but before routes
// Handles Cross-Origin Resource Sharing (CORS) headers to allow cross-origin AJAX requests
// Disabled by default (matching Rails behavior where CORS is commented out)
// Enable via CORS_ENABLED environment variable
// See src/middleware/cors.ts for configuration details
app.use(corsMiddleware);

// Request logger middleware - must be applied after CORS but before routes
// Logs incoming HTTP requests and their responses with comprehensive information
// Provides request/response logging similar to Rails' built-in request logging with request_id tagging
// See src/middleware/request-logger.middleware.ts for details
app.use(requestLoggerMiddleware);

// Register health routes
// Route file has router.get('/health', getHealth), so register at root to get /health
app.use('/', healthRoutes); // Creates /health endpoint

// Register root route to match Rails root 'health#show'
app.get('/', getHealth); // Creates / endpoint

export default app;
