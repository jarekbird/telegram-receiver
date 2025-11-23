/**
 * TypeScript type definitions for Cursor Runner API
 * These types are used when communicating with the cursor-runner service
 * for executing cursor commands and handling responses.
 *
 * Based on the structure used in jarek-va/app/services/cursor_runner_service.rb
 * and jarek-va/app/controllers/cursor_runner_callback_controller.rb
 */

/**
 * Request interface for execute endpoint
 * POST /cursor/execute
 */
export interface CursorExecuteRequest {
  repository: string;
  branchName: string;
  prompt: string;
  id: string;
}

/**
 * Request interface for iterate endpoint
 * POST /cursor/iterate/async
 */
export interface CursorIterateRequest {
  repository: string;
  branchName: string;
  prompt: string;
  maxIterations?: number; // Default: 25
  id: string;
  callbackUrl?: string; // Optional callback URL for async completion notification
}

/**
 * Response interface for execute endpoint
 * Contains the result of a cursor command execution
 */
export interface CursorExecuteResponse {
  success: boolean;
  requestId: string;
  repository: string;
  branchName: string;
  output: string;
  error?: string;
  exitCode: number;
  // Additional fields may be present as returned by cursor-runner
  [key: string]: unknown;
}

/**
 * Response interface for iterate endpoint
 * Contains the result of an iterative cursor command execution
 * Note: If callbackUrl is provided, response may be immediate acknowledgment with minimal fields
 */
export interface CursorIterateResponse {
  success: boolean;
  requestId: string;
  repository: string;
  branchName: string;
  output: string;
  iterations: number;
  maxIterations: number;
  error?: string;
  exitCode: number;
  duration?: string;
  // Additional fields may be present as returned by cursor-runner
  [key: string]: unknown;
}

/**
 * Callback payload interface for webhook callbacks
 * Sent to callbackUrl when iterate operation completes
 * Note: Callback payload may use either camelCase or snake_case keys (normalize in implementation)
 */
export interface CursorCallbackPayload {
  success: boolean;
  requestId?: string; // May be requestId (camelCase) or request_id (snake_case)
  request_id?: string; // snake_case variant
  repository: string;
  branchName?: string; // May be branchName (camelCase) or branch_name (snake_case)
  branch_name?: string; // snake_case variant
  iterations: number;
  maxIterations?: number; // May be maxIterations (camelCase) or max_iterations (snake_case)
  max_iterations?: number; // snake_case variant
  output: string;
  error?: string;
  exitCode?: number; // May be exitCode (camelCase) or exit_code (snake_case)
  exit_code?: number; // snake_case variant
  duration?: string;
  timestamp?: string;
}

/**
 * Request interface for repository cloning
 * POST /git/clone
 */
export interface GitCloneRequest {
  repositoryUrl: string;
  repositoryName?: string; // Optional repository name (defaults to URL-based name)
}

/**
 * Response interface for clone operation
 * Contains the result of cloning a repository
 */
export interface GitCloneResponse {
  success: boolean;
  repository: string;
  message?: string;
  // Additional fields may be present as returned by cursor-runner
  [key: string]: unknown;
}

/**
 * Response interface for list repositories endpoint
 * GET /git/repositories
 * Note: repositories is an array of repository name strings, not objects
 */
export interface GitListRepositoriesResponse {
  success: boolean;
  repositories: string[];
  count: number;
}

/**
 * Request interface for branch checkout
 * POST /git/checkout
 */
export interface GitCheckoutRequest {
  repository: string;
  branch: string;
}

/**
 * Response interface for checkout operation
 * Contains the result of checking out a branch
 */
export interface GitCheckoutResponse {
  success: boolean;
  message?: string;
  // Additional fields may be present as returned by cursor-runner
  [key: string]: unknown;
}

/**
 * Request interface for pushing branches
 * POST /git/push
 */
export interface GitPushRequest {
  repository: string;
  branch: string;
}

/**
 * Response interface for push operation
 * Contains the result of pushing a branch
 */
export interface GitPushResponse {
  success: boolean;
  message?: string;
  // Additional fields may be present as returned by cursor-runner
  [key: string]: unknown;
}

/**
 * Request interface for pulling branches
 * POST /git/pull
 * Note: Named GitPullBranchRequest to avoid conflict with TypeScript's common PullRequest type
 */
export interface GitPullBranchRequest {
  repository: string;
  branch: string;
}

/**
 * Response interface for pull operation
 * Contains the result of pulling a branch
 */
export interface GitPullBranchResponse {
  success: boolean;
  message?: string;
  // Additional fields may be present as returned by cursor-runner
  [key: string]: unknown;
}

/**
 * Error response interface for cursor-runner API
 * HTTP errors (non-2xx) may include error details in response body
 * Note: HTTP 422 (Unprocessable Entity) is treated as a valid response with error details in body
 */
export interface CursorRunnerError {
  error: string;
  // Additional error details may be present
  [key: string]: unknown;
}
