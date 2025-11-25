import { Router } from 'express';
import { HealthController } from '../controllers/health.controller';

const router = Router();
const healthController = new HealthController();

// GET /health - Health check endpoint
router.get('/health', healthController.show.bind(healthController));

// GET / - Root endpoint (maps to health check)
router.get('/', healthController.show.bind(healthController));

export default router;
