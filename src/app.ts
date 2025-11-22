// PHASE1-010: Create Express application instance
import express from 'express';
import healthRoutes from './routes/health.routes';
import { getHealth } from './controllers/health.controller';

const app = express();

// PHASE1-017: JSON body parser middleware
// Express requires explicit middleware to parse JSON request bodies
// Rails ActionController::API automatically parses JSON when Content-Type: application/json is set
// This middleware populates req.body with parsed JSON data
app.use(express.json());

// PHASE1-015: Register health routes
// Register health routes with app.use('/', healthRoutes) for /health endpoint
// (route file already defines /health path)
app.use('/', healthRoutes);

// Register root route with app.get('/', getHealth) for root / endpoint
// (to match Rails root 'health#show')
app.get('/', getHealth);

export default app;
