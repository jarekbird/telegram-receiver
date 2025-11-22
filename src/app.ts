// PHASE1-010: Create Express application instance
import express from 'express';
import healthRoutes from './routes/health.routes';
import { getHealth } from './controllers/health.controller';

const app = express();

// PHASE1-015: Register health routes
// Register health routes with app.use('/', healthRoutes) for /health endpoint
// (route file already defines /health path)
app.use('/', healthRoutes);

// Register root route with app.get('/', getHealth) for root / endpoint
// (to match Rails root 'health#show')
app.get('/', getHealth);

export default app;
