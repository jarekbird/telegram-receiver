import axios, { AxiosInstance } from 'axios';
import { randomBytes } from 'crypto';

/**
 * Base error class for CursorRunnerService
 * All service-specific errors extend this class
 */
export class CursorRunnerServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CursorRunnerServiceError';
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CursorRunnerServiceError);
    }
  }
}

/**
 * Error thrown when connection to cursor-runner fails
 */
export class ConnectionError extends CursorRunnerServiceError {
  constructor(message: string) {
    super(message);
    this.name = 'ConnectionError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ConnectionError);
    }
  }
}

/**
 * Error thrown when request to cursor-runner times out
 */
export class TimeoutError extends CursorRunnerServiceError {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TimeoutError);
    }
  }
}

/**
 * Error thrown when response from cursor-runner cannot be parsed
 */
export class InvalidResponseError extends CursorRunnerServiceError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidResponseError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvalidResponseError);
    }
  }
}

/**
 * Service for communicating with cursor-runner API
 * Handles HTTP requests to cursor-runner for cursor execution and git operations
 * 
 * This service provides methods to interact with the cursor-runner service,
 * including executing cursor commands, managing repositories, and handling git operations.
 * 
 * Reference: jarek-va/app/services/cursor_runner_service.rb
 */
class CursorRunnerService {
  private baseUrl: string;
  private timeout: number;
  // Will be used in method implementations (PHASE2-029 and subsequent tasks)
  private axiosInstance: AxiosInstance;

  /**
   * Creates a new CursorRunnerService instance
   * @param baseUrl - Base URL for cursor-runner API. If not provided, reads from CURSOR_RUNNER_URL environment variable
   * @param timeout - Request timeout in milliseconds. If not provided, reads from CURSOR_RUNNER_TIMEOUT environment variable (converted from seconds to milliseconds)
   */
  constructor(baseUrl?: string, timeout?: number) {
    // Default baseUrl from environment variable
    this.baseUrl = baseUrl || process.env.CURSOR_RUNNER_URL || 'http://localhost:3001';
    
    // Default timeout from environment variable (convert seconds to milliseconds)
    // CURSOR_RUNNER_TIMEOUT is in seconds, but axios timeout is in milliseconds
    if (timeout !== undefined) {
      this.timeout = timeout;
    } else {
      const timeoutSeconds = parseInt(process.env.CURSOR_RUNNER_TIMEOUT || '300', 10);
      this.timeout = timeoutSeconds * 1000; // Convert seconds to milliseconds
    }

    // Initialize axios instance for cursor-runner API requests
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  }

  /**
   * Generates a unique request ID for tracking requests
   * Format: "req-{timestamp}-{randomHex}"
   * Similar to Rails SecureRandom.hex(4) pattern
   * Will be used in method implementations (PHASE2-029 and subsequent tasks)
   * @returns Unique request ID string
   */
  private generateRequestId(): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const randomHex = randomBytes(4).toString('hex');
    return `req-${timestamp}-${randomHex}`;
  }
}

export default CursorRunnerService;
