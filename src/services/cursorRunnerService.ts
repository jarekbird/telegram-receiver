import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { randomBytes } from 'crypto';
import logger from '@/utils/logger';
import { CursorExecuteResponse, CursorIterateResponse, GitCloneResponse, GitListRepositoriesResponse, GitCheckoutResponse, GitPushResponse } from '@/types/cursor-runner';

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

  /**
   * Performs a GET request to the cursor-runner API
   * @param path - API path (will be appended to baseUrl)
   * @returns Axios response object
   * @throws {ConnectionError} When connection fails
   * @throws {TimeoutError} When request times out
   * @throws {CursorRunnerServiceError} When HTTP status is not success (except 422)
   */
  private async get(path: string): Promise<AxiosResponse> {
    const uri = `${this.baseUrl}${path}`;
    const http = this.buildHttp(uri);
    return this.executeRequest(http, 'GET', path, uri);
  }

  /**
   * Performs a POST request to the cursor-runner API
   * @param path - API path (will be appended to baseUrl)
   * @param body - Request body object (will be converted to JSON)
   * @returns Axios response object
   * @throws {ConnectionError} When connection fails
   * @throws {TimeoutError} When request times out
   * @throws {CursorRunnerServiceError} When HTTP status is not success (except 422)
   */
  private async post(path: string, body: Record<string, unknown>): Promise<AxiosResponse> {
    const uri = `${this.baseUrl}${path}`;
    const http = this.buildHttp(uri);
    const jsonBody = JSON.stringify(body);
    return this.executeRequest(http, 'POST', path, uri, jsonBody);
  }

  /**
   * Builds and configures an HTTP client (axios instance) for making requests
   * Configures SSL/TLS based on URI scheme, sets timeouts, and handles connection errors
   * @param uri - Full URI string (used to determine http vs https)
   * @returns Configured axios instance
   * @throws {ConnectionError} When connection configuration fails
   * @throws {TimeoutError} When timeout configuration fails
   */
  private buildHttp(uri: string): AxiosInstance {
    try {
      // Parse URI to determine protocol and configure accordingly
      const url = new URL(uri);
      
      // Create a new axios instance for this request with proper configuration
      // Don't set baseURL since we'll use full URIs in requests
      const http = axios.create({
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        // Axios automatically handles SSL/TLS based on protocol in the URI
        // https://axios-http.com/docs/config_defaults
      });

      return http;
    } catch (error) {
      // Handle connection errors during HTTP client setup
      if (error instanceof Error) {
        const errorCode = (error as NodeJS.ErrnoException).code;
        if (errorCode === 'ECONNREFUSED' || errorCode === 'EHOSTUNREACH') {
          throw new ConnectionError(`Failed to connect to cursor-runner: ${error.message}`);
        }
        // Re-throw as ConnectionError for other socket errors
        if (error.message.includes('socket') || error.message.includes('connect')) {
          throw new ConnectionError(`Failed to connect to cursor-runner: ${error.message}`);
        }
      }
      // For timeout errors during setup (unlikely but possible)
      if (error instanceof Error && (error.message.includes('timeout') || error.message.includes('ETIMEDOUT'))) {
        throw new TimeoutError(`Request to cursor-runner timed out: ${error.message}`);
      }
      // Re-throw unknown errors
      throw error;
    }
  }

  /**
   * Executes an HTTP request using the configured axios instance
   * Logs request method and path, executes request, logs response, and handles errors
   * @param http - Configured axios instance
   * @param method - HTTP method ('GET' or 'POST')
   * @param path - API path (for logging)
   * @param uri - Full URI (for request)
   * @param body - Optional request body (for POST requests)
   * @returns Axios response object
   * @throws {ConnectionError} When connection fails
   * @throws {TimeoutError} When request times out
   * @throws {CursorRunnerServiceError} When HTTP status is not success (except 422)
   */
  private async executeRequest(
    http: AxiosInstance,
    method: 'GET' | 'POST',
    path: string,
    uri: string,
    body?: string
  ): Promise<AxiosResponse> {
    // Log request method and path
    logger.info(`CursorRunnerService: ${method} ${path}`);

    try {
      let response: AxiosResponse;

      if (method === 'GET') {
        response = await http.get(uri);
      } else {
        response = await http.post(uri, body);
      }

      // Log response status code and message
      logger.info(`CursorRunnerService: Response ${response.status} ${response.statusText}`);

      // Handle 422 Unprocessable Entity as a valid response (allows caller to receive error details)
      if (response.status === 422) {
        return response;
      }

      // Raise error for non-success HTTP status codes (non-2xx, except 422)
      if (response.status < 200 || response.status >= 300) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

        // Attempt to extract error message from response body JSON if available
        try {
          const errorBody = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
          if (errorBody && typeof errorBody === 'object' && 'error' in errorBody) {
            errorMessage = errorBody.error as string;
          }
        } catch {
          // Use default error message if JSON parsing fails
        }

        throw new CursorRunnerServiceError(errorMessage);
      }

      return response;
    } catch (error) {
      // Handle timeout errors
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.code === 'ECONNABORTED' || axiosError.message.includes('timeout')) {
          throw new TimeoutError(`Request to cursor-runner timed out: ${axiosError.message}`);
        }
        // Handle connection errors
        if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'EHOSTUNREACH') {
          throw new ConnectionError(`Failed to connect to cursor-runner: ${axiosError.message}`);
        }
        // Handle other axios errors (network errors, etc.)
        if (axiosError.code === 'ENOTFOUND' || axiosError.code === 'ECONNRESET') {
          throw new ConnectionError(`Failed to connect to cursor-runner: ${axiosError.message}`);
        }
        // If axios error has a response, handle HTTP status errors
        if (axiosError.response) {
          const response = axiosError.response;
          // Handle 422 as valid (shouldn't reach here since we handle it above, but just in case)
          if (response.status === 422) {
            return response;
          }
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          // Try to extract error from response body
          try {
            const errorBody = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
            if (errorBody && typeof errorBody === 'object' && 'error' in errorBody) {
              errorMessage = errorBody.error as string;
            }
          } catch {
            // Use default error message
          }
          throw new CursorRunnerServiceError(errorMessage);
        }
      }

      // Handle Node.js system errors
      if (error instanceof Error) {
        const nodeError = error as NodeJS.ErrnoException;
        if (nodeError.code === 'ECONNREFUSED' || nodeError.code === 'EHOSTUNREACH') {
          throw new ConnectionError(`Failed to connect to cursor-runner: ${error.message}`);
        }
        if (nodeError.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
          throw new TimeoutError(`Request to cursor-runner timed out: ${error.message}`);
        }
        // Generic socket errors
        if (error.message.includes('socket') || error.message.includes('connect')) {
          throw new ConnectionError(`Failed to connect to cursor-runner: ${error.message}`);
        }
      }

      // Re-throw unknown errors
      throw error;
    }
  }

  /**
   * Parses JSON response body from HTTP response
   * @param response - Axios response object
   * @returns Parsed object (plain JavaScript/TypeScript object, equivalent to Rails symbolize_names: true)
   * @throws {InvalidResponseError} When JSON parsing fails
   */
  private parseResponse(response: AxiosResponse): Record<string, unknown> {
    try {
      // Axios automatically parses JSON responses, but we'll handle it explicitly
      // to match Rails behavior and handle edge cases
      let data = response.data;

      // If data is already an object, return it
      if (typeof data === 'object' && data !== null) {
        return data as Record<string, unknown>;
      }

      // If data is a string, try to parse it
      if (typeof data === 'string') {
        return JSON.parse(data) as Record<string, unknown>;
      }

      // If data is undefined or null, return empty object
      return {};
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
      throw new InvalidResponseError(`Failed to parse response: ${errorMessage}`);
    }
  }

  /**
   * Executes a cursor command synchronously by calling the cursor-runner API's /cursor/execute endpoint
   * @param params - Execution parameters
   * @param params.repository - Repository name (must be locally cloned)
   * @param params.branchName - Branch name to checkout (camelCase)
   * @param params.prompt - Prompt text for cursor to execute
   * @param params.requestId - Optional request ID for tracking. If not provided, will be auto-generated
   * @returns Promise resolving to CursorExecuteResponse with success, output, error, exitCode, requestId, etc.
   * @throws {ConnectionError} When connection to cursor-runner fails
   * @throws {TimeoutError} When request times out
   * @throws {InvalidResponseError} When response cannot be parsed
   * @throws {CursorRunnerServiceError} When HTTP error occurs (non-2xx, except 422)
   */
  async execute(params: {
    repository: string;
    branchName: string;
    prompt: string;
    requestId?: string;
  }): Promise<CursorExecuteResponse> {
    // Generate requestId if not provided
    const requestId = params.requestId || this.generateRequestId();

    // Build request body with correct structure
    const requestBody = {
      repository: params.repository,
      branchName: params.branchName,
      prompt: params.prompt,
      id: requestId,
    };

    // POST to /cursor/execute endpoint using helper method
    const response = await this.post('/cursor/execute', requestBody);

    // Parse JSON response body using helper method
    const parsedResponse = this.parseResponse(response);

    // Return parsed response as CursorExecuteResponse
    return parsedResponse as CursorExecuteResponse;
  }

  /**
   * Executes a cursor command iteratively until completion by calling the cursor-runner API's /cursor/iterate endpoint
   * @param params - Iteration parameters
   * @param params.repository - Repository name (must be locally cloned)
   * @param params.branchName - Branch name to checkout (camelCase)
   * @param params.prompt - Prompt text for cursor to execute
   * @param params.maxIterations - Optional maximum number of iterations (default: 25)
   * @param params.requestId - Optional request ID for tracking. If not provided, will be auto-generated
   * @param params.callbackUrl - Optional callback URL for async completion notification. If provided, the response will be immediate and the actual result will be sent to the callback URL when complete
   * @returns Promise resolving to CursorIterateResponse with success, output, iterations, maxIterations, error, exitCode, duration, etc.
   * @throws {ConnectionError} When connection to cursor-runner fails
   * @throws {TimeoutError} When request times out
   * @throws {InvalidResponseError} When response cannot be parsed
   * @throws {CursorRunnerServiceError} When HTTP error occurs (non-2xx, except 422)
   */
  async iterate(params: {
    repository: string;
    branchName: string;
    prompt: string;
    maxIterations?: number;
    requestId?: string;
    callbackUrl?: string;
  }): Promise<CursorIterateResponse> {
    // Generate requestId if not provided
    const requestId = params.requestId || this.generateRequestId();

    // Build request body with correct structure
    const requestBody: Record<string, unknown> = {
      repository: params.repository,
      branchName: params.branchName,
      prompt: params.prompt,
      maxIterations: params.maxIterations ?? 25,
      id: requestId,
    };

    // Conditionally add callbackUrl to request body only if provided
    if (params.callbackUrl) {
      requestBody.callbackUrl = params.callbackUrl;
    }

    // POST to /cursor/iterate endpoint (NOT /cursor/iterate/async)
    const response = await this.post('/cursor/iterate', requestBody);

    // Parse JSON response body using helper method
    const parsedResponse = this.parseResponse(response);

    // Return parsed response as CursorIterateResponse
    return parsedResponse as CursorIterateResponse;
  }

  /**
   * Clones a Git repository by calling the cursor-runner API's /git/clone endpoint
   * @param params - Clone parameters
   * @param params.repositoryUrl - Git repository URL to clone
   * @param params.repositoryName - Optional repository name (defaults to URL-based name if not provided)
   * @returns Promise resolving to GitCloneResponse with success, repository, message, etc.
   * @throws {ConnectionError} When connection to cursor-runner fails
   * @throws {TimeoutError} When request times out
   * @throws {InvalidResponseError} When response cannot be parsed
   * @throws {CursorRunnerServiceError} When HTTP error occurs (non-2xx, except 422)
   */
  async cloneRepository(params: {
    repositoryUrl: string;
    repositoryName?: string;
  }): Promise<GitCloneResponse> {
    // Build request body with repositoryUrl (camelCase)
    const requestBody: Record<string, unknown> = {
      repositoryUrl: params.repositoryUrl,
    };

    // Conditionally add repositoryName to request body only if provided
    if (params.repositoryName) {
      requestBody.repositoryName = params.repositoryName;
    }

    // POST to /git/clone endpoint using helper method
    const response = await this.post('/git/clone', requestBody);

    // Parse JSON response body using helper method
    const parsedResponse = this.parseResponse(response);

    // Return parsed response as GitCloneResponse
    return parsedResponse as GitCloneResponse;
  }

  /**
   * Lists all locally cloned Git repositories by calling the cursor-runner API's /git/repositories endpoint
   * @returns Promise resolving to GitListRepositoriesResponse with success, repositories (string array), and count
   * @throws {ConnectionError} When connection to cursor-runner fails
   * @throws {TimeoutError} When request times out
   * @throws {InvalidResponseError} When response cannot be parsed
   * @throws {CursorRunnerServiceError} When HTTP error occurs (non-2xx, except 422)
   */
  async listRepositories(): Promise<GitListRepositoriesResponse> {
    // GET to /git/repositories endpoint using helper method
    const response = await this.get('/git/repositories');

    // Parse JSON response body using helper method
    const parsedResponse = this.parseResponse(response);

    // Return parsed response as GitListRepositoriesResponse
    return parsedResponse as GitListRepositoriesResponse;
  }

  /**
   * Checks out a Git branch in a repository by calling the cursor-runner API's /git/checkout endpoint
   * @param params - Checkout parameters
   * @param params.repository - Repository name
   * @param params.branch - Branch name to checkout
   * @returns Promise resolving to GitCheckoutResponse with success, message, etc.
   * @throws {ConnectionError} When connection to cursor-runner fails
   * @throws {TimeoutError} When request times out
   * @throws {InvalidResponseError} When response cannot be parsed
   * @throws {CursorRunnerServiceError} When HTTP error occurs (non-2xx, except 422)
   */
  async checkoutBranch(params: {
    repository: string;
    branch: string;
  }): Promise<GitCheckoutResponse> {
    // Build request body with repository and branch (both lowercase strings)
    const requestBody = {
      repository: params.repository,
      branch: params.branch,
    };

    // POST to /git/checkout endpoint using helper method
    const response = await this.post('/git/checkout', requestBody);

    // Parse JSON response body using helper method
    const parsedResponse = this.parseResponse(response);

    // Return parsed response as GitCheckoutResponse
    return parsedResponse as GitCheckoutResponse;
  }

  /**
   * Pushes a Git branch to origin by calling the cursor-runner API's /git/push endpoint
   * @param params - Push parameters
   * @param params.repository - Repository name
   * @param params.branch - Branch name to push
   * @returns Promise resolving to GitPushResponse with success, message, etc.
   * @throws {ConnectionError} When connection to cursor-runner fails
   * @throws {TimeoutError} When request times out
   * @throws {InvalidResponseError} When response cannot be parsed
   * @throws {CursorRunnerServiceError} When HTTP error occurs (non-2xx, except 422)
   */
  async pushBranch(params: {
    repository: string;
    branch: string;
  }): Promise<GitPushResponse> {
    // Build request body with repository and branch (both lowercase strings)
    const requestBody = {
      repository: params.repository,
      branch: params.branch,
    };

    // POST to /git/push endpoint using helper method
    const response = await this.post('/git/push', requestBody);

    // Parse JSON response body using helper method
    const parsedResponse = this.parseResponse(response);

    // Return parsed response as GitPushResponse
    return parsedResponse as GitPushResponse;
  }
}

export default CursorRunnerService;
