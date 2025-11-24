import { Request, Response } from 'express';

/**
 * Health check controller (PHASE1-013)
 * Returns application health status, service name, and version information
 * Matches Rails implementation in jarek-va/app/controllers/health_controller.rb
 *
 * @param req - Express request object
 * @param res - Express response object
 */
export function getHealth(_req: Request, res: Response): void {
  res.status(200).json({
    status: 'healthy',
    service: process.env.APP_NAME || 'telegram-receiver',
    version: process.env.APP_VERSION || '1.0.0',
  });
}
