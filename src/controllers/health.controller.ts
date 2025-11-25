import { Request, Response } from 'express';

/**
 * Health check controller (PHASE1-013, PHASE2-090)
 * Returns application health status, service name, and version information
 * Matches Rails implementation in jarek-va/app/controllers/health_controller.rb
 */
export class HealthController {
  /**
   * Show health status
   * Returns JSON response with status, service name, and version
   * Matches Rails HealthController#show method
   *
   * @param _req - Express request object
   * @param res - Express response object
   */
  show(_req: Request, res: Response): void {
    res.status(200).json({
      status: 'healthy',
      service: process.env.APP_NAME || 'Virtual Assistant API',
      version: process.env.APP_VERSION || '1.0.0',
    });
  }
}
