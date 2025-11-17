# API Documentation

## Overview

The telegram-receiver API is a Virtual Assistant orchestration layer that provides endpoints for Telegram Bot API integration, cursor-runner service integration, and agent tools execution. This API serves as a conversion from the jarek-va Ruby on Rails application to Node.js/TypeScript, maintaining feature parity with the original Rails implementation.

### Main Functionality Areas

1. **Telegram Integration**: Receives and processes Telegram webhook updates, manages webhook configuration
2. **Cursor Runner Integration**: Proxies requests to cursor-runner service for code generation and Git operations
3. **Agent Tools**: Provides webhook endpoint for tool execution requests from external agents

## Base URL and Versioning

- **Base URL**: Configured via environment variables (default: `http://localhost:3000`)
- **API Versioning**: Currently no versioning strategy implemented. All endpoints are at the root level.

## Endpoint Groups

### Health Endpoints

Health check endpoints for monitoring and service status:

- **`GET /health`** - Health check endpoint
  - Returns service status, name, and version
  - Response format: `{ status: 'healthy', service: '...', version: '...' }`
  - No authentication required

- **`GET /`** - Root endpoint (also serves health check)
  - Same response as `/health` endpoint
  - No authentication required

**Detailed Documentation**: See [docs/api/HEALTH.md](api/HEALTH.md) for detailed health endpoint documentation.

### Agent Tools Endpoints

Tool execution webhook endpoint for external agent integrations:

- **`POST /agent-tools`** - Tool execution webhook endpoint
  - Executes tools requested by external agents
  - **Authentication**: Required via `X-EL-Secret` header or `Authorization: Bearer <token>`
  - Request body: `{ tool: string, args: object, conversation_id?: string }`
  - Response format: `{ ok: boolean, say: string, result: object }`

### Cursor Runner Endpoints

Endpoints for interacting with the cursor-runner service:

#### Cursor Execution Endpoints

- **`POST /cursor-runner/cursor/execute`** - Execute cursor command
  - Executes a single cursor command in a repository
  - Request body: `{ repository: string, branch_name?: string, prompt: string, id?: string }`
  - Response format: `{ success: boolean, ... }`

- **`POST /cursor-runner/cursor/iterate`** - Execute cursor command iteratively
  - Executes cursor command with iterative refinement until completion
  - Request body: `{ repository: string, branch_name?: string, prompt: string, max_iterations?: number, id?: string }`
  - Response format: `{ success: boolean, ... }`

#### Callback Endpoint

- **`POST /cursor-runner/callback`** - Callback endpoint for cursor-runner results
  - Receives asynchronous callbacks from cursor-runner when operations complete
  - **Authentication**: Required via `X-Webhook-Secret` or `X-Cursor-Runner-Secret` header
  - Request body: `{ success: boolean, requestId: string, repository: string, ... }`
  - Response format: `{ received: true, request_id: string }`

#### Git Operation Endpoints

- **`POST /cursor-runner/git/clone`** - Clone a repository
  - Clones a Git repository for cursor-runner operations
  - Request body: `{ repository_url: string, repository_name?: string }`
  - Response format: `{ success: boolean, ... }`

- **`GET /cursor-runner/git/repositories`** - List cloned repositories
  - Returns list of locally cloned repositories
  - Response format: `{ success: boolean, repositories: [...] }`

- **`POST /cursor-runner/git/checkout`** - Checkout a branch
  - Checks out a specific branch in a repository
  - Request body: `{ repository: string, branch: string }`
  - Response format: `{ success: boolean, ... }`

- **`POST /cursor-runner/git/push`** - Push branch to origin
  - Pushes a branch to the remote repository
  - Request body: `{ repository: string, branch: string }`
  - Response format: `{ success: boolean, ... }`

- **`POST /cursor-runner/git/pull`** - Pull branch from origin
  - Pulls latest changes from remote repository
  - Request body: `{ repository: string, branch: string }`
  - Response format: `{ success: boolean, ... }`

### Telegram Endpoints

Endpoints for Telegram Bot API webhook integration:

- **`POST /telegram/webhook`** - Telegram webhook endpoint (receives updates)
  - Receives Telegram Bot API updates (messages, callback queries, etc.)
  - **Authentication**: Required via `X-Telegram-Bot-Api-Secret-Token` header
  - Processes updates asynchronously and returns 200 OK immediately
  - Request body: Telegram Update object (JSON)

- **`POST /telegram/set_webhook`** - Set Telegram webhook (admin only)
  - Configures the Telegram Bot API webhook URL
  - **Authentication**: Required via `X-Admin-Secret` header
  - Request body: `{ url?: string, secret_token?: string }`
  - Response format: `{ ok: true, message: string, webhook_info: object }`

- **`GET /telegram/webhook_info`** - Get webhook information (admin only)
  - Retrieves current webhook configuration from Telegram
  - **Authentication**: Required via `X-Admin-Secret` header
  - Response format: `{ ok: true, webhook_info: object }`

- **`DELETE /telegram/webhook`** - Delete Telegram webhook (admin only)
  - Removes the configured Telegram webhook
  - **Authentication**: Required via `X-Admin-Secret` header
  - Response format: `{ ok: true, message: string }`

## Authentication

Authentication is performed via HTTP headers. Different endpoint groups use different authentication headers:

### Authentication Header Patterns

1. **Admin Endpoints** (Telegram admin endpoints)
   - Header: `X-Admin-Secret`
   - Expected value: Matches `WEBHOOK_SECRET` environment variable
   - Used by: `POST /telegram/set_webhook`, `GET /telegram/webhook_info`, `DELETE /telegram/webhook`

2. **Telegram Webhook** (`POST /telegram/webhook`)
   - Header: `X-Telegram-Bot-Api-Secret-Token`
   - Expected value: Matches `TELEGRAM_WEBHOOK_SECRET` environment variable
   - Used by: Telegram webhook endpoint

3. **Cursor Runner Callback** (`POST /cursor-runner/callback`)
   - Headers: `X-Webhook-Secret` or `X-Cursor-Runner-Secret`
   - Expected value: Matches `WEBHOOK_SECRET` environment variable
   - Used by: Cursor runner callback endpoint

4. **Agent Tools** (`POST /agent-tools`)
   - Headers: `X-EL-Secret` or `Authorization: Bearer <token>`
   - Expected value: Matches `WEBHOOK_SECRET` environment variable
   - Used by: Agent tools webhook endpoint

### Authentication Details

- Authentication secrets are configured via environment variables
- If the expected secret is not configured (development mode), authentication may be bypassed for some endpoints
- Invalid or missing authentication results in `401 Unauthorized` response
- See [docs/API_CONVENTIONS.md](API_CONVENTIONS.md) for detailed authentication patterns and middleware usage

## Rate Limiting

The API does not implement rate limiting at the application level. Rate limiting may be handled at the infrastructure level (e.g., reverse proxy, load balancer), but this is not part of the application code itself.

## Response Formats

The API uses different response formats depending on the endpoint type:

### Success Response Formats

1. **Standard Success Format** (`{ ok: true, ... }`)
   - Used by: Telegram endpoints, Agent Tools endpoints
   - Example: `{ ok: true, message: 'Webhook set successfully', webhook_info: {...} }`

2. **Service Response Format** (`{ success: true, ... }`)
   - Used by: Cursor Runner endpoints (proxies service responses)
   - Example: `{ success: true, repository: '...', branch: '...' }`

3. **Health Check Format** (`{ status: 'healthy', ... }`)
   - Used by: Health endpoints
   - Example: `{ status: 'healthy', service: 'Virtual Assistant API', version: '1.0.0' }`

4. **Callback Acknowledgment Format** (`{ received: true, ... }`)
   - Used by: Callback endpoints
   - Example: `{ received: true, request_id: '...' }`

### Error Response Formats

1. **Global Error Handler Format**
   ```json
   {
     "ok": false,
     "say": "Sorry, I encountered an error processing your request.",
     "result": {
       "error": "Error message here"
     }
   }
   ```

2. **Controller-Level Error Format**
   ```json
   {
     "ok": false,
     "error": "Error message here"
   }
   ```

3. **Service-Level Error Format**
   ```json
   {
     "success": false,
     "error": "Error message here"
   }
   ```

4. **Simple Error Format** (authentication/validation)
   ```json
   {
     "error": "Unauthorized"
   }
   ```

### HTTP Status Codes

- **200 OK**: Successful operations
- **400 Bad Request**: Validation errors, missing required parameters
- **401 Unauthorized**: Authentication failures
- **422 Unprocessable Entity**: Service-level validation failures
- **500 Internal Server Error**: Unhandled exceptions
- **502 Bad Gateway**: External service errors (e.g., cursor-runner connection failures)

Some endpoints return empty body with HTTP status codes only (e.g., `POST /telegram/webhook` returns `200 OK` with no body).

## API Conventions

The API follows RESTful conventions where applicable, but also includes webhook endpoints and callback endpoints. For detailed information about API conventions, patterns, and best practices, see:

- **[API Conventions](API_CONVENTIONS.md)**: Detailed documentation on route naming, controller patterns, error handling, authentication, and request/response conventions

## Detailed Endpoint Documentation

- **[Health Endpoints](api/HEALTH.md)**: Detailed documentation for health check endpoints
- Additional endpoint documentation will be added as tasks are completed

## Reference Implementation

This API is based on the jarek-va Ruby on Rails application. For reference:

- **Routes**: `jarek-va/config/routes.rb` - Defines all API endpoints and their HTTP methods
- **Controllers**: `jarek-va/app/controllers/*.rb` - Implement endpoint logic and authentication
- **Application Controller**: `jarek-va/app/controllers/application_controller.rb` - Base controller with global error handling

The Node.js/Express implementation maintains feature parity with the Rails API structure and behavior.

## Notes

- The API follows RESTful conventions where applicable, but also includes webhook endpoints and callback endpoints
- Response formats vary by endpoint type (see Response Formats section above)
- All endpoints accept JSON request bodies where applicable
- Parameter names support both camelCase and snake_case for compatibility
- The API is designed to be stateless and horizontally scalable
