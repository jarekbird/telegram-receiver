import express from 'express';
import healthRoutes from './routes/health.routes';
import { getHealth } from './controllers/health.controller';

const app = express();

// Register health routes
// Route file has router.get('/health', getHealth), so register at root to get /health
app.use('/', healthRoutes); // Creates /health endpoint

// Register root route to match Rails root 'health#show'
app.get('/', getHealth); // Creates / endpoint

export default app;
