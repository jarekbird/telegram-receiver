import express from 'express';
import { getHealth } from '../controllers/health.controller';

const router = express.Router();

// GET /health - Health check endpoint
router.get('/health', getHealth);

// GET / - Root endpoint (maps to health check)
router.get('/', getHealth);

export default router;
