import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

/**
 * Health check controller (PHASE1-013) - COMPLETE
 * Returns application health status, service name, and version information
 * Matches Rails implementation in jarek-va/app/controllers/health_controller.rb
 *
 * @param req - Express request object
 * @param res - Express response object
 */
export function getHealth(_req: Request, res: Response): void {
  // Read app name and version from package.json (matching index.ts behavior)
  // This ensures the health endpoint returns the correct service name and version
  interface PackageJson {
    name?: string;
    version?: string;
  }

  const packageJsonPath = path.join(__dirname, '..', '..', 'package.json');
  let serviceName = 'telegram-receiver';
  let version = '1.0.0';

  try {
    const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf-8');
    const packageJson: PackageJson = JSON.parse(packageJsonContent) as PackageJson;
    serviceName = packageJson.name || serviceName;
    version = packageJson.version || version;
  } catch (error) {
    // If package.json cannot be read, use defaults
    // This should not happen in normal operation, but provides a fallback
  }

  res.status(200).json({
    status: 'healthy',
    service: process.env.APP_NAME || serviceName,
    version: process.env.APP_VERSION || version,
  });
}
