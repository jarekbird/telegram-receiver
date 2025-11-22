# API Conventions

This document defines the API conventions for the telegram-receiver application, based on patterns from the jarek-va Rails application. These conventions ensure consistency across the Node.js/Express API conversion and guide developers in maintaining a uniform codebase.

## Table of Contents

- [Route Naming Conventions](#route-naming-conventions)
- [Controller Naming Conventions](#controller-naming-conventions)
- [Service Naming Conventions](#service-naming-conventions)
- [Middleware Naming Conventions](#middleware-naming-conventions)
- [Error Handling Conventions](#error-handling-conventions)
- [Response Format Conventions](#response-format-conventions)
- [Authentication Conventions](#authentication-conventions)
- [Request Parameter Handling](#request-parameter-handling)

## Route Naming Conventions

### RESTful Route Patterns

Routes follow RESTful conventions using standard HTTP methods:

- **GET**: Retrieve resources (read-only operations)
- **POST**: Create resources or trigger actions
- **DELETE**: Remove resources
- **PUT/PATCH**: Update resources (if needed)

**Rails Example** (`config/routes.rb`):

```ruby
get 'health', to: 'health#show'
post 'agent-tools', to: 'agent_tools#create'
post 'telegram/webhook', to: 'telegram#webhook'
delete 'telegram/webhook', to: 'telegram#delete_webhook'
```

**Node.js/Express Equivalent**:

```typescript
router.get('/health', healthController.show);
router.post('/agent-tools', agentToolsController.create);
router.post('/telegram/webhook', telegramController.webhook);
router.delete('/telegram/webhook', telegramController.deleteWebhook);
```

### Route Scoping and Namespacing

Routes are organized using scopes/namespaces to group related endpoints:

**Rails Pattern**:

```ruby
scope path: 'cursor-runner', as: 'cursor_runner' do
  post 'cursor/execute', to: 'cursor_runner#execute'
  post 'cursor/iterate', to: 'cursor_runner#iterate'
  post 'callback', to: 'cursor_runner_callback#create'
end

scope path: 'telegram', as: 'telegram' do
  post 'webhook', to: 'telegram#webhook'
  post 'set_webhook', to: 'telegram#set_webhook'
  get 'webhook_info', to: 'telegram#webhook_info'
  delete 'webhook', to: 'telegram#delete_webhook'
end
```

**Node.js/Express Equivalent**:

```typescript
// Use Express Router for namespacing
const cursorRunnerRouter = express.Router();
cursorRunnerRouter.post('/cursor/execute', cursorRunnerController.execute);
cursorRunnerRouter.post('/cursor/iterate', cursorRunnerController.iterate);
cursorRunnerRouter.post('/callback', cursorRunnerCallbackController.create);
app.use('/cursor-runner', cursorRunnerRouter);

const telegramRouter = express.Router();
telegramRouter.post('/webhook', telegramController.webhook);
telegramRouter.post('/set_webhook', telegramController.setWebhook);
telegramRouter.get('/webhook_info', telegramController.webhookInfo);
telegramRouter.delete('/webhook', telegramController.deleteWebhook);
app.use('/telegram', telegramRouter);
```

### Route Path Naming

- **Use snake_case** for route paths (e.g., `set_webhook`, `webhook_info`)
- **Use kebab-case** for multi-word route segments (e.g., `/cursor-runner`, `/agent-tools`)
- **Use descriptive names** that clearly indicate the endpoint's purpose
- **Follow RESTful conventions** where applicable (e.g., `/telegram/webhook` for webhook operations)

**Examples**:

- ✅ `POST /telegram/set_webhook`
- ✅ `GET /telegram/webhook_info`
- ✅ `POST /cursor-runner/cursor/execute`
- ❌ `POST /telegram/setWebhook` (camelCase)
- ❌ `POST /telegram/set-webhook` (kebab-case for action names)

### Route Organization Patterns

1. **Group related routes** under a common prefix (e.g., `/telegram/*`, `/cursor-runner/*`)
2. **Place health check routes** at the root level (e.g., `GET /health`)
3. **Use consistent naming** within each namespace
4. **Keep route definitions** in separate router files, organized by feature area

## Controller Naming Conventions

### Controller Suffix Pattern

All controllers use the `*Controller` suffix pattern:

**Rails Examples**:

- `TelegramController`
- `CursorRunnerController`
- `CursorRunnerCallbackController`
- `HealthController`
- `AgentToolsController`

**Node.js/Express Equivalent**:

- `TelegramController`
- `CursorRunnerController`
- `CursorRunnerCallbackController`
- `HealthController`
- `AgentToolsController`

### Controller Inheritance

All controllers inherit from a base controller that provides common functionality:

**Rails Pattern** (`app/controllers/application_controller.rb`):

```ruby
class ApplicationController < ActionController::API
  rescue_from StandardError, with: :handle_error

  private

  def handle_error(exception)
    # Global error handling
  end
end

class TelegramController < ApplicationController
  # Controller-specific logic
end
```

**Node.js/Express Equivalent**:

```typescript
// Base controller class or middleware pattern
class BaseController {
  protected handleError(error: Error, req: Request, res: Response): void {
    // Global error handling
  }
}

class TelegramController extends BaseController {
  // Controller-specific logic
}
```

### Controller Method Naming

Controller methods follow RESTful action naming conventions:

- **show**: Display a single resource (GET)
- **create**: Create a new resource (POST)
- **update**: Update an existing resource (PUT/PATCH)
- **destroy**: Delete a resource (DELETE)
- **Custom actions**: Use descriptive names (e.g., `webhook`, `setWebhook`, `webhookInfo`)

**Rails Examples**:

```ruby
class TelegramController < ApplicationController
  def webhook          # POST /telegram/webhook
  def set_webhook      # POST /telegram/set_webhook
  def webhook_info     # GET /telegram/webhook_info
  def delete_webhook   # DELETE /telegram/webhook
end
```

**Node.js/Express Equivalent**:

```typescript
class TelegramController {
  webhook(req: Request, res: Response): Promise<void> {}
  setWebhook(req: Request, res: Response): Promise<void> {}
  webhookInfo(req: Request, res: Response): Promise<void> {}
  deleteWebhook(req: Request, res: Response): Promise<void> {}
}
```

**Note**: In Node.js/Express, use camelCase for method names (TypeScript convention) while keeping route paths in snake_case.

### Controller Organization and File Structure

Controllers are organized in the `src/controllers/` directory:

```
src/controllers/
├── applicationController.ts    # Base controller
├── telegramController.ts
├── cursorRunnerController.ts
├── cursorRunnerCallbackController.ts
├── healthController.ts
└── agentToolsController.ts
```

Each controller file should:

- Export a single controller class
- Be named using camelCase with `Controller` suffix
- Contain only controller-specific logic (delegate to services)

## Service Naming Conventions

### Service Suffix Pattern

All services use the `*Service` suffix pattern:

**Rails Examples**:

- `TelegramService`
- `CursorRunnerService`
- `CursorRunnerCallbackService`
- `ElevenLabsSpeechToTextService`
- `ElevenLabsTextToSpeechService`

**Node.js/Express Equivalent**:

- `TelegramService`
- `CursorRunnerService`
- `CursorRunnerCallbackService`
- `ElevenLabsSpeechToTextService`
- `ElevenLabsTextToSpeechService`

### Service Class Organization

Services are organized in the `src/services/` directory:

```
src/services/
├── telegramService.ts
├── cursorRunnerService.ts
├── cursorRunnerCallbackService.ts
├── elevenLabsSpeechToTextService.ts
├── elevenLabsTextToSpeechService.ts
└── toolRouter.ts
```

### Service Method Naming Patterns

Service methods use descriptive, action-oriented names:

**Rails Examples** (`app/services/telegram_service.rb`):

```ruby
class TelegramService
  def self.send_message(chat_id:, text:, parse_mode: 'HTML', reply_to_message_id: nil)
  def self.set_webhook(url:, secret_token: nil)
  def self.delete_webhook
  def self.webhook_info
  def self.send_voice(chat_id:, voice_path:, reply_to_message_id: nil, caption: nil)
end
```

**Node.js/Express Equivalent**:

```typescript
class TelegramService {
  async sendMessage(params: {
    chatId: number;
    text: string;
    parseMode?: 'HTML' | 'Markdown';
    replyToMessageId?: number;
  }): Promise<void> {}

  async setWebhook(params: { url: string; secretToken?: string }): Promise<WebhookInfo> {}

  async deleteWebhook(): Promise<void> {}

  async webhookInfo(): Promise<WebhookInfo> {}

  async sendVoice(params: {
    chatId: number;
    voicePath: string;
    replyToMessageId?: number;
    caption?: string;
  }): Promise<void> {}
}
```

**Naming Guidelines**:

- Use camelCase for method names (TypeScript convention)
- Use descriptive, action-oriented names (e.g., `sendMessage`, `setWebhook`)
- Use consistent parameter naming (camelCase for TypeScript)
- Group related methods in the same service class

### Service Location and Structure

- **Location**: `src/services/`
- **Structure**: One service class per file
- **Dependencies**: Use constructor injection for dependencies
- **Error Handling**: Services throw typed errors (e.g., `CursorRunnerService::Error`)

**Example Structure**:

```typescript
// src/services/telegramService.ts
export class TelegramService {
  constructor(
    private httpClient: HttpClient,
    private config: Config
  ) {}

  async sendMessage(params: SendMessageParams): Promise<void> {
    // Implementation
  }
}

// Custom error classes
export class TelegramServiceError extends Error {}
export class TelegramApiError extends TelegramServiceError {}
```

## Middleware Naming Conventions

### Express Middleware Patterns

Express middleware replaces Rails `before_action` filters. Middleware functions follow these naming patterns:

**Rails Pattern** (`app/controllers/telegram_controller.rb`):

```ruby
class TelegramController < ApplicationController
  before_action :authenticate_webhook, only: [:webhook]

  def webhook
    # Handler logic
  end

  private

  def authenticate_webhook
    # Authentication logic
  end
end
```

**Node.js/Express Equivalent**:

```typescript
// Middleware function
export function authenticateWebhook(req: Request, res: Response, next: NextFunction): void {
  // Authentication logic
  next();
}

// Controller usage
router.post('/webhook', authenticateWebhook, telegramController.webhook);
```

### Authentication Middleware Patterns

Authentication middleware follows these naming conventions:

- **`authenticateWebhook`**: Validates webhook secret tokens
- **`authenticateAdmin`**: Validates admin secret tokens
- **`authenticateCursorRunnerWebhook`**: Validates cursor-runner callback secrets

**Rails Examples**:

```ruby
def authenticate_webhook
  secret_token = request.headers['X-Telegram-Bot-Api-Secret-Token']
  expected_secret = Rails.application.config.telegram_webhook_secret
  return if expected_secret.blank? || secret_token == expected_secret

  head :unauthorized
end

def authenticate_admin
  admin_secret = request.headers['X-Admin-Secret'] ||
                 request.env['HTTP_X_ADMIN_SECRET'] ||
                 params[:admin_secret]
  expected_secret = Rails.application.config.webhook_secret

  return head :unauthorized unless admin_secret == expected_secret
end
```

**Node.js/Express Equivalent**:

```typescript
export function authenticateWebhook(req: Request, res: Response, next: NextFunction): void {
  const secretToken = req.headers['x-telegram-bot-api-secret-token'];
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (!expectedSecret || secretToken === expectedSecret) {
    return next();
  }

  res.status(401).json({ error: 'Unauthorized' });
}

export function authenticateAdmin(req: Request, res: Response, next: NextFunction): void {
  const adminSecret = req.headers['x-admin-secret'] || req.query.admin_secret;
  const expectedSecret = process.env.WEBHOOK_SECRET;

  if (adminSecret === expectedSecret) {
    return next();
  }

  res.status(401).json({ error: 'Unauthorized' });
}
```

### Validation Middleware Patterns

Validation middleware validates request parameters before processing:

**Rails Example** (`app/controllers/agent_tools_controller.rb`):

```ruby
class AgentToolsController < ApplicationController
  before_action :validate_request_params

  def create
    # Handler logic
  end

  private

  def validate_request_params
    return if params[:tool].present?

    render json: {
      ok: false,
      say: 'Missing required parameter: tool',
      result: { error: 'tool parameter is required' }
    }, status: :bad_request
  end
end
```

**Node.js/Express Equivalent**:

```typescript
export function validateRequestParams(req: Request, res: Response, next: NextFunction): void {
  if (!req.body.tool) {
    return res.status(400).json({
      ok: false,
      say: 'Missing required parameter: tool',
      result: { error: 'tool parameter is required' },
    });
  }

  next();
}

// Usage
router.post('/agent-tools', validateRequestParams, agentToolsController.create);
```

### Middleware Organization and Structure

Middleware functions are organized in the `src/middleware/` directory:

```
src/middleware/
├── authenticateWebhook.ts
├── authenticateAdmin.ts
├── authenticateCursorRunnerWebhook.ts
├── validateRequestParams.ts
└── errorHandler.ts
```

Each middleware file should:

- Export a single middleware function
- Use camelCase naming (TypeScript convention)
- Follow Express middleware signature: `(req, res, next) => void`
- Call `next()` on success or send error response on failure

## Error Handling Conventions

### Global Error Handler Pattern

A global error handler catches all unhandled errors and formats consistent error responses:

**Rails Pattern** (`app/controllers/application_controller.rb`):

```ruby
class ApplicationController < ActionController::API
  rescue_from StandardError, with: :handle_error

  private

  def handle_error(exception)
    Rails.logger.error("#{exception.class}: #{exception.message}")
    Rails.logger.error(exception.backtrace.join("\n"))

    render json: {
      ok: false,
      say: 'Sorry, I encountered an error processing your request.',
      result: { error: exception.message }
    }, status: :internal_server_error
  end
end
```

**Node.js/Express Equivalent**:

```typescript
// src/middleware/errorHandler.ts
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  logger.error(`${err.constructor.name}: ${err.message}`);
  logger.error(err.stack);

  res.status(500).json({
    ok: false,
    say: 'Sorry, I encountered an error processing your request.',
    result: { error: err.message },
  });
}

// app.ts
app.use(errorHandler);
```

### Error Response Format

Error responses follow a consistent format:

**Global Error Handler Format**:

```json
{
  "ok": false,
  "say": "Sorry, I encountered an error processing your request.",
  "result": {
    "error": "Error message here"
  }
}
```

**Controller-Level Error Format**:

```json
{
  "ok": false,
  "error": "Error message here"
}
```

**Service-Level Error Format** (when returned from service):

```json
{
  "success": false,
  "error": "Error message here"
}
```

**Simple Error Format** (for authentication/validation):

```json
{
  "error": "Unauthorized"
}
```

### HTTP Status Code Conventions

Use the following HTTP status codes consistently:

- **200 OK**: Successful operations
- **400 Bad Request**: Validation errors, missing required parameters
- **401 Unauthorized**: Authentication failures (missing or invalid credentials)
- **422 Unprocessable Entity**: Service-level validation failures (e.g., invalid repository name)
- **500 Internal Server Error**: Unhandled exceptions, unexpected errors
- **502 Bad Gateway**: External service errors (e.g., CursorRunnerService connection failures)

**Rails Examples**:

```ruby
# 200 OK - Success
render json: { ok: true, message: 'Webhook set successfully' }

# 400 Bad Request - Validation error
render json: { error: 'request_id is required' }, status: :bad_request

# 401 Unauthorized - Authentication failure
head :unauthorized

# 422 Unprocessable Entity - Service validation failure
render json: result, status: result[:success] ? :ok : :unprocessable_entity

# 500 Internal Server Error - Unhandled exception
render json: { ok: false, error: e.message }, status: :internal_server_error

# 502 Bad Gateway - External service error
render json: { success: false, error: e.message }, status: :bad_gateway
```

**Node.js/Express Equivalent**:

```typescript
// 200 OK - Success
res.json({ ok: true, message: 'Webhook set successfully' });

// 400 Bad Request - Validation error
res.status(400).json({ error: 'request_id is required' });

// 401 Unauthorized - Authentication failure
res.status(401).json({ error: 'Unauthorized' });

// 422 Unprocessable Entity - Service validation failure
res.status(result.success ? 200 : 422).json(result);

// 500 Internal Server Error - Unhandled exception
res.status(500).json({ ok: false, error: err.message });

// 502 Bad Gateway - External service error
res.status(502).json({ success: false, error: err.message });
```

### Specific Error Type Handling

Services throw typed errors that controllers catch and handle appropriately:

**Rails Pattern** (`app/services/cursor_runner_service.rb`):

```ruby
class CursorRunnerService
  class Error < StandardError; end
  class ConnectionError < Error; end
  class TimeoutError < Error; end
  class InvalidResponseError < Error; end
end

# Controller usage
rescue CursorRunnerService::Error => e
  render json: {
    success: false,
    error: e.message
  }, status: :bad_gateway
end
```

**Node.js/Express Equivalent**:

```typescript
// Service error classes
export class CursorRunnerServiceError extends Error {}
export class ConnectionError extends CursorRunnerServiceError {}
export class TimeoutError extends CursorRunnerServiceError {}
export class InvalidResponseError extends CursorRunnerServiceError {}

// Controller usage
try {
  const result = await cursorRunnerService.execute(params);
  res.json(result);
} catch (error) {
  if (error instanceof CursorRunnerServiceError) {
    return res.status(502).json({
      success: false,
      error: error.message,
    });
  }
  throw error; // Let error middleware handle
}
```

### Error Logging Patterns

Always log errors with sufficient context:

**Rails Pattern**:

```ruby
Rails.logger.error("Error handling Telegram webhook: #{e.message}")
Rails.logger.error(e.backtrace.join("\n"))
```

**Node.js/Express Equivalent**:

```typescript
logger.error(`Error handling Telegram webhook: ${error.message}`);
logger.error(error.stack);
```

**Logging Guidelines**:

- Log error message and stack trace
- Include context (e.g., request ID, user ID, operation)
- Use appropriate log levels (error, warn, info)
- Never log sensitive information (passwords, tokens, etc.)

## Response Format Conventions

### Success Response Format Variations

Different endpoints use different success response formats based on their purpose:

#### Standard Success Format (`{ ok: true, ... }`)

Used by most controllers for standard API responses:

**Rails Example** (`app/controllers/telegram_controller.rb`):

```ruby
render json: {
  ok: true,
  message: 'Webhook set successfully',
  webhook_info: result
}
```

**Node.js/Express Equivalent**:

```typescript
res.json({
  ok: true,
  message: 'Webhook set successfully',
  webhookInfo: result,
});
```

**Used by**: `TelegramController`, `AgentToolsController`

**AgentToolsController Specific Format** (`app/controllers/agent_tools_controller.rb`):
The AgentToolsController wraps tool router results in a specific format:

**Rails Example**:

```ruby
result = ToolRouter.route(...)
render json: {
  ok: result[:ok],
  say: result[:say],
  result: result[:data]
}
```

**Node.js/Express Equivalent**:

```typescript
const toolResult = await toolRouter.route(params);
res.json({
  ok: toolResult.ok,
  say: toolResult.say,
  result: toolResult.data,
});
```

This format includes:

- `ok`: Boolean indicating success/failure
- `say`: User-friendly message string
- `result`: The actual data/result from the tool execution

#### Service Response Format (`{ success: true, ... }`)

Used when returning responses directly from service calls:

**Rails Example** (`app/controllers/cursor_runner_controller.rb`):

```ruby
result = @service.execute(...)
render json: result, status: result[:success] ? :ok : :unprocessable_entity
```

**Node.js/Express Equivalent**:

```typescript
const result = await cursorRunnerService.execute(params);
res.status(result.success ? 200 : 422).json(result);
```

**Used by**: `CursorRunnerController` (proxies service responses)

#### Health Check Format (`{ status: 'healthy', ... }`)

Used for health check endpoints:

**Rails Example** (`app/controllers/health_controller.rb`):

```ruby
render json: {
  status: 'healthy',
  service: Rails.application.config.app_name || 'Virtual Assistant API',
  version: Rails.application.config.app_version || '1.0.0'
}
```

**Node.js/Express Equivalent**:

```typescript
res.json({
  status: 'healthy',
  service: process.env.APP_NAME || 'Virtual Assistant API',
  version: process.env.APP_VERSION || '1.0.0',
});
```

**Used by**: `HealthController`

#### Callback Acknowledgment Format (`{ received: true, ... }`)

Used for webhook callback acknowledgments:

**Rails Example** (`app/controllers/cursor_runner_callback_controller.rb`):

```ruby
render json: { received: true, request_id: request_id }, status: :ok
```

**Node.js/Express Equivalent**:

```typescript
res.json({ received: true, requestId: requestId });
```

**Used by**: `CursorRunnerCallbackController`

### Error Response Format Variations

Different error scenarios use different error response formats:

#### Global Error Handler Format

Used by the global error handler for unhandled exceptions:

```json
{
  "ok": false,
  "say": "Sorry, I encountered an error processing your request.",
  "result": {
    "error": "Error message here"
  }
}
```

#### Controller-Level Error Format

Used by controllers for handled errors:

```json
{
  "ok": false,
  "error": "Error message here"
}
```

#### Service-Level Error Format

Used when services return error responses:

```json
{
  "success": false,
  "error": "Error message here"
}
```

#### Simple Error Format

Used for authentication and validation errors:

```json
{
  "error": "Unauthorized"
}
```

### Simple Acknowledgment Responses

Some endpoints return empty responses with just a status code:

**Rails Pattern** (`app/controllers/telegram_controller.rb`):

```ruby
# Return 200 OK immediately to Telegram
head :ok
```

**Node.js/Express Equivalent**:

```typescript
// Return 200 OK immediately
res.sendStatus(200);
// or
res.status(200).end();
```

**Used when**:

- Webhook endpoints that must respond immediately (e.g., Telegram webhook)
- Simple acknowledgment endpoints that don't need response data

### Response Status Code Selection Guidelines

Choose status codes based on the error type and context:

1. **200 OK**: Successful operations
2. **400 Bad Request**: Client errors (validation, missing parameters)
3. **401 Unauthorized**: Authentication failures
4. **422 Unprocessable Entity**: Service-level validation failures
5. **500 Internal Server Error**: Unhandled exceptions
6. **502 Bad Gateway**: External service errors

**Decision Tree**:

```
Is the request valid?
├─ No → 400 Bad Request
└─ Yes → Is authentication valid?
    ├─ No → 401 Unauthorized
    └─ Yes → Can the service process it?
        ├─ No (validation) → 422 Unprocessable Entity
        ├─ No (service error) → 502 Bad Gateway
        └─ Yes → 200 OK (or 500 if unexpected error)
```

### JSON Response Structure Consistency

Maintain consistency within each response format:

- **Use camelCase** for JSON keys (TypeScript/JavaScript convention)
- **Be consistent** within the same endpoint type
- **Include relevant data** but avoid over-fetching
- **Use consistent field names** across similar endpoints

**Example**:

```typescript
// Consistent success response
{
  ok: true,
  message: 'Operation completed',
  data: { /* relevant data */ }
}

// Consistent error response
{
  ok: false,
  error: 'Error message',
  details: { /* optional additional details */ }
}
```

### When to Use Each Response Format Variation

#### Success Response Formats

**Use `{ ok: true, ... }` format when:**

- Building standard API endpoints that return data
- Endpoints that need to indicate success/failure clearly
- User-facing endpoints (e.g., TelegramController, AgentToolsController)
- Endpoints that return structured data with additional metadata

**Example**: Setting webhook, getting webhook info, tool execution results

**Use `{ success: true, ... }` format when:**

- Proxying responses directly from external services
- Service-level operations that return service-specific response structures
- Endpoints that wrap service calls without transformation (e.g., CursorRunnerController)
- When the service already defines its response format

**Example**: Cursor execution endpoints that proxy CursorRunnerService responses

**Use `{ status: 'healthy', service: ..., version: ... }` format when:**

- Health check endpoints
- Status monitoring endpoints
- Service discovery endpoints
- Endpoints that report system state

**Example**: `GET /health` endpoint

**Use `{ received: true, ... }` format when:**

- Webhook callback acknowledgment endpoints
- Endpoints that acknowledge receipt without processing
- Async operation callbacks that need immediate acknowledgment
- Endpoints that process asynchronously and return immediately

**Example**: `POST /cursor-runner/callback` endpoint

**Use empty response with status code (`head :ok`) when:**

- Webhook endpoints that must respond immediately (e.g., Telegram webhook)
- Endpoints that trigger async processing and don't need to return data
- Simple acknowledgment endpoints
- Endpoints where the HTTP status code is sufficient information

**Example**: `POST /telegram/webhook` endpoint

#### Error Response Formats

**Use `{ ok: false, say: '...', result: { error: ... } }` format when:**

- Global error handler catches unhandled exceptions
- User-facing errors that need friendly messages
- Errors that should be displayed to end users
- Errors that need additional context in the `result` object

**Example**: ApplicationController global error handler

**Use `{ ok: false, error: '...' }` format when:**

- Controller-level handled errors
- Errors that don't need user-friendly messages
- Standard API error responses
- Errors that are caught and handled in controller methods

**Example**: Controller catch blocks, validation errors in controllers

**Use `{ success: false, error: '...' }` format when:**

- Service-level error responses
- Errors returned from service methods
- External service integration errors
- Errors that match service response format conventions

**Example**: CursorRunnerService errors, service validation failures

**Use `{ error: '...' }` format when:**

- Authentication failures (401 Unauthorized)
- Simple validation errors (400 Bad Request)
- Errors that don't need additional context
- Standard HTTP error responses

**Example**: Authentication middleware, simple validation middleware

#### Decision Flow

```
Is this a success response?
├─ Yes → What type of endpoint?
│   ├─ Standard API endpoint → { ok: true, ... }
│   ├─ Service proxy endpoint → { success: true, ... }
│   ├─ Health check → { status: 'healthy', ... }
│   ├─ Webhook callback → { received: true, ... }
│   └─ Immediate webhook → Empty body, 200 status
│
└─ No → What type of error?
    ├─ Unhandled exception → { ok: false, say: '...', result: { error: ... } }
    ├─ Controller error → { ok: false, error: '...' }
    ├─ Service error → { success: false, error: '...' }
    └─ Auth/validation error → { error: '...' }
```

## Authentication Conventions

### Authentication Headers

Authentication is performed via HTTP headers:

**Header Names**:

- `X-Admin-Secret`: Admin authentication secret
- `X-Telegram-Bot-Api-Secret-Token`: Telegram webhook secret token
- `X-Webhook-Secret`: Generic webhook secret (cursor-runner callbacks)
- `X-Cursor-Runner-Secret`: Alternative cursor-runner webhook secret
- `X-EL-Secret`: ElevenLabs webhook secret (agent tools)
- `Authorization`: Bearer token (alternative format for agent tools)

**Rails Pattern**:

```ruby
secret_token = request.headers['X-Telegram-Bot-Api-Secret-Token']
admin_secret = request.headers['X-Admin-Secret'] ||
               request.env['HTTP_X_ADMIN_SECRET'] ||
               params[:admin_secret]
```

**Node.js/Express Equivalent**:

```typescript
const secretToken = req.headers['x-telegram-bot-api-secret-token'];
const adminSecret = req.headers['x-admin-secret'] || req.query.admin_secret;
```

**Note**: Express normalizes header names to lowercase, so use lowercase when accessing headers.

### Webhook Authentication Patterns

Webhook endpoints validate secret tokens before processing:

**Pattern**:

1. Extract secret token from header (or query param as fallback)
2. Compare with expected secret from configuration
3. Return 401 Unauthorized if mismatch
4. Allow if expected secret is blank (development mode)

**Rails Example**:

```ruby
def authenticate_webhook
  secret_token = request.headers['X-Telegram-Bot-Api-Secret-Token']
  expected_secret = Rails.application.config.telegram_webhook_secret

  return if expected_secret.blank? || secret_token == expected_secret

  Rails.logger.warn('Unauthorized Telegram webhook request - invalid secret token')
  head :unauthorized
end
```

**Node.js/Express Equivalent**:

```typescript
export function authenticateWebhook(req: Request, res: Response, next: NextFunction): void {
  const secretToken = req.headers['x-telegram-bot-api-secret-token'];
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

  // Allow if expected secret is not configured (development)
  if (!expectedSecret || secretToken === expectedSecret) {
    return next();
  }

  logger.warn('Unauthorized Telegram webhook request - invalid secret token');
  res.status(401).json({ error: 'Unauthorized' });
}
```

### Admin Authentication Patterns

Admin endpoints require `X-Admin-Secret` header:

**Rails Example**:

```ruby
def authenticate_admin
  admin_secret = request.headers['X-Admin-Secret'] ||
                 request.env['HTTP_X_ADMIN_SECRET'] ||
                 params[:admin_secret] ||
                 params['admin_secret']
  expected_secret = Rails.application.config.webhook_secret

  return head :unauthorized unless admin_secret == expected_secret
end
```

**Node.js/Express Equivalent**:

```typescript
export function authenticateAdmin(req: Request, res: Response, next: NextFunction): void {
  const adminSecret = req.headers['x-admin-secret'] || req.query.admin_secret;
  const expectedSecret = process.env.WEBHOOK_SECRET;

  if (adminSecret === expectedSecret) {
    return next();
  }

  res.status(401).json({ error: 'Unauthorized' });
}
```

## Request Parameter Handling

### Parameter Sources

Request parameters can come from multiple sources:

1. **Query Parameters**: `req.query` (e.g., `?admin_secret=xxx`)
2. **Body Parameters**: `req.body` (JSON body)
3. **Headers**: `req.headers` (authentication, metadata)
4. **Route Parameters**: `req.params` (e.g., `:id` in route)

**Rails Pattern**:

```ruby
# Query params
admin_secret = params[:admin_secret]

# Body params (JSON)
repository = params[:repository]
branch_name = params[:branch_name] || params[:branchName]

# Headers
secret_token = request.headers['X-Telegram-Bot-Api-Secret-Token']
```

**Node.js/Express Equivalent**:

```typescript
// Query params
const adminSecret = req.query.admin_secret;

// Body params (JSON) - requires body-parser middleware
const repository = req.body.repository;
const branchName = req.body.branch_name || req.body.branchName;

// Headers
const secretToken = req.headers['x-telegram-bot-api-secret-token'];
```

### Parameter Normalization

Handle both camelCase and snake_case parameter names for compatibility:

**Rails Pattern**:

```ruby
branch_name = params[:branch_name] || params[:branchName]
request_id = params[:id] || params[:request_id] || params[:requestId]
```

**Node.js/Express Equivalent**:

```typescript
const branchName = req.body.branch_name || req.body.branchName;
const requestId = req.body.id || req.body.request_id || req.body.requestId;
```

### Parameter Validation

Validate required parameters before processing:

**Rails Pattern**:

```ruby
def validate_request_params
  return if params[:tool].present?

  render json: {
    ok: false,
    say: 'Missing required parameter: tool',
    result: { error: 'tool parameter is required' }
  }, status: :bad_request
end
```

**Node.js/Express Equivalent**:

```typescript
export function validateRequestParams(req: Request, res: Response, next: NextFunction): void {
  if (!req.body.tool) {
    return res.status(400).json({
      ok: false,
      say: 'Missing required parameter: tool',
      result: { error: 'tool parameter is required' },
    });
  }

  next();
}
```

## Examples

### Complete Controller Example

**Rails** (`app/controllers/telegram_controller.rb`):

```ruby
class TelegramController < ApplicationController
  before_action :authenticate_webhook, only: [:webhook]

  def webhook
    update = request.parameters
    TelegramMessageJob.perform_later(update.to_json)
    head :ok
  rescue StandardError => e
    Rails.logger.error("Error handling Telegram webhook: #{e.message}")
    head :ok
  end

  def set_webhook
    return head :unauthorized unless authenticate_admin

    webhook_url = params[:url] || default_webhook_url
    secret_token = params[:secret_token] || Rails.application.config.telegram_webhook_secret

    result = TelegramService.set_webhook(url: webhook_url, secret_token: secret_token)

    render json: {
      ok: true,
      message: 'Webhook set successfully',
      webhook_info: result
    }
  rescue StandardError => e
    Rails.logger.error("Error setting webhook: #{e.message}")
    render json: {
      ok: false,
      error: e.message
    }, status: :internal_server_error
  end

  private

  def authenticate_webhook
    secret_token = request.headers['X-Telegram-Bot-Api-Secret-Token']
    expected_secret = Rails.application.config.telegram_webhook_secret
    return if expected_secret.blank? || secret_token == expected_secret

    head :unauthorized
  end

  def authenticate_admin
    admin_secret = request.headers['X-Admin-Secret'] ||
                   request.env['HTTP_X_ADMIN_SECRET'] ||
                   params[:admin_secret]
    expected_secret = Rails.application.config.webhook_secret
    admin_secret == expected_secret
  end
end
```

**Node.js/Express Equivalent**:

```typescript
// src/controllers/telegramController.ts
import { Request, Response } from 'express';
import { TelegramService } from '../services/telegramService';
import { authenticateWebhook } from '../middleware/authenticateWebhook';
import { authenticateAdmin } from '../middleware/authenticateAdmin';
import { logger } from '../utils/logger';
import { enqueueTelegramMessage } from '../jobs/telegramMessageJob';

export class TelegramController {
  constructor(private telegramService: TelegramService) {}

  webhook = async (req: Request, res: Response): Promise<void> => {
    try {
      const update = req.body;
      await enqueueTelegramMessage(update);
      res.sendStatus(200);
    } catch (error) {
      logger.error(`Error handling Telegram webhook: ${error.message}`);
      // Always return 200 to Telegram to avoid retries
      res.sendStatus(200);
    }
  };

  setWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      const webhookUrl = req.body.url || this.defaultWebhookUrl();
      const secretToken = req.body.secret_token || process.env.TELEGRAM_WEBHOOK_SECRET;

      const result = await this.telegramService.setWebhook({
        url: webhookUrl,
        secretToken: secretToken,
      });

      res.json({
        ok: true,
        message: 'Webhook set successfully',
        webhookInfo: result,
      });
    } catch (error) {
      logger.error(`Error setting webhook: ${error.message}`);
      res.status(500).json({
        ok: false,
        error: error.message,
      });
    }
  };

  private defaultWebhookUrl(): string {
    const baseUrl = process.env.TELEGRAM_WEBHOOK_BASE_URL || 'http://localhost:3000';
    return `${baseUrl}/telegram/webhook`;
  }
}

// src/routes/telegramRoutes.ts
import express from 'express';
import { TelegramController } from '../controllers/telegramController';
import { authenticateWebhook } from '../middleware/authenticateWebhook';
import { authenticateAdmin } from '../middleware/authenticateAdmin';

const router = express.Router();
const telegramController = new TelegramController(/* inject dependencies */);

router.post('/webhook', authenticateWebhook, telegramController.webhook);
router.post('/set_webhook', authenticateAdmin, telegramController.setWebhook);

export default router;
```

## Summary

This document defines the API conventions for the telegram-receiver application. Key principles:

1. **Consistency**: Follow established patterns from the Rails codebase
2. **TypeScript Conventions**: Use camelCase for code, snake_case for routes
3. **Error Handling**: Use typed errors and consistent error response formats
4. **Authentication**: Use header-based authentication with consistent patterns
5. **Response Formats**: Use appropriate response formats for different endpoint types
6. **Status Codes**: Use HTTP status codes consistently based on error type

When implementing new endpoints, refer to this document to ensure consistency with existing patterns.

---

**References**:

- Rails Application: `/cursor/repositories/jarek-va`
- Architecture Documentation: `docs/architecture.md`
- Application Description: `Plan/app-description.md`
