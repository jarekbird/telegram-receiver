# Architecture Documentation

## Overview

The Telegram Receiver application is a Node.js/TypeScript conversion of the Telegram webhook integration portion of the `jarek-va` Ruby on Rails application. It serves as a lightweight bridge between Telegram Bot API and the Cursor Runner service, handling message reception, processing, and forwarding.

## Architectural Patterns

### Layered Architecture

The application follows a layered architecture pattern with clear separation of concerns:

```
┌─────────────────────────────────────┐
│         HTTP Layer (Routes)        │
│  Express routes and middleware      │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Controllers Layer               │
│  Request/response handling          │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Services Layer                 │
│  Business logic and integrations    │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Models Layer                   │
│  Data models and persistence        │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   External Services                 │
│  Telegram API, Cursor Runner, etc. │
└─────────────────────────────────────┘
```

#### Layer Responsibilities

**Routes Layer** (`src/routes/`)
- Define HTTP endpoints
- Apply middleware (authentication, validation, etc.)
- Route requests to appropriate controllers
- Should not contain business logic

**Controllers Layer** (`src/controllers/`)
- Handle HTTP request/response concerns
- Parse request data
- Call services for business logic
- Format responses
- Handle HTTP-specific errors
- Should be thin - delegate to services

**Services Layer** (`src/services/`)
- Contain business logic
- Integrate with external APIs (Telegram, Cursor Runner, ElevenLabs)
- Handle complex workflows
- Manage state (via Redis)
- Should be framework-agnostic (no Express dependencies)

**Models Layer** (`src/models/`)
- Define data structures
- Handle data validation
- Manage persistence (if applicable)
- Should not contain business logic

**Middleware Layer** (`src/middleware/`)
- Cross-cutting concerns (authentication, logging, error handling)
- Request/response transformation
- Should be reusable and composable

**Jobs Layer** (Background Processing)
- Asynchronous task processing
- Long-running operations
- Should use BullMQ for job queuing

**Utils Layer** (`src/utils/`)
- Pure utility functions
- Shared helpers
- Should be stateless and testable

**Types Layer** (`src/types/`)
- TypeScript type definitions
- Interfaces and type aliases
- Should provide type safety across the application

### Service Layer Pattern

Business logic is encapsulated in service classes that:
- Are instantiated with dependencies via constructor injection
- Provide a clean API for controllers and jobs
- Handle external API communication
- Manage complex workflows
- Are easily testable through dependency injection

### Dependency Injection Pattern

**Decision**: Use constructor injection for all dependencies

**Rationale**:
- Improves testability (easy to mock dependencies)
- Reduces coupling between components
- Makes dependencies explicit
- Follows Node.js/TypeScript best practices

**Pattern**:
```typescript
// Service with constructor injection
class TelegramService {
  constructor(
    private httpClient: HttpClient,
    private config: Config
  ) {}
}

// Controller with service injection
class TelegramController {
  constructor(
    private telegramService: TelegramService,
    private callbackService: CursorRunnerCallbackService
  ) {}
}
```

**Trade-offs**:
- **Pros**: Testable, maintainable, explicit dependencies
- **Cons**: Requires dependency management (factory functions or DI container)

### Repository Pattern (Future Consideration)

Currently, the application uses direct Redis access for state management. If database persistence is added, consider implementing a repository pattern to:
- Abstract data access logic
- Make data access testable
- Provide a consistent interface for data operations

### Middleware Pattern

Express middleware is used for:
- Request authentication (webhook secret validation)
- Admin authentication (X-Admin-Secret header)
- Error handling (centralized error middleware)
- Request logging
- Request/response transformation

### Job Queue Pattern

**Decision**: Use BullMQ with Redis for background job processing

**Rationale**:
- Provides reliable job processing
- Supports job retries and failure handling
- Integrates well with Redis (already used for state management)
- Better than Rails Sidekiq for Node.js ecosystem

**Pattern**:
- Jobs are enqueued immediately upon webhook receipt
- Jobs process messages asynchronously
- Failed jobs are retried with exponential backoff
- Job state is tracked in Redis

## Design Decisions

### 1. TypeScript over JavaScript

**Decision**: Use TypeScript for type safety and better developer experience

**Rationale**:
- Catches errors at compile time
- Improves IDE support and autocomplete
- Makes refactoring safer
- Better documentation through types

**Trade-offs**:
- **Pros**: Type safety, better tooling, self-documenting code
- **Cons**: Additional compilation step, learning curve

### 2. Express.js Framework

**Decision**: Use Express.js for HTTP server

**Rationale**:
- Mature and widely used
- Large ecosystem of middleware
- Simple and flexible
- Good performance for API workloads

**Trade-offs**:
- **Pros**: Mature, flexible, large ecosystem
- **Cons**: Less opinionated than Rails (more decisions to make)

### 3. Async Processing with BullMQ

**Decision**: Process Telegram updates asynchronously using BullMQ

**Rationale**:
- Must return 200 OK immediately to Telegram to prevent retries
- Allows handling of long-running operations (audio transcription, API calls)
- Provides job retry and failure handling
- Better than synchronous processing for webhook handling

**Trade-offs**:
- **Pros**: Reliable, scalable, handles failures gracefully
- **Cons**: Additional complexity, requires Redis

### 4. Redis for State Management

**Decision**: Use Redis for storing callback state and job queues

**Rationale**:
- Fast in-memory storage
- Supports TTL for automatic cleanup
- Used by BullMQ for job queues
- No need for persistent database for temporary state

**Trade-offs**:
- **Pros**: Fast, simple, integrates with BullMQ
- **Cons**: Data is ephemeral (by design), requires Redis instance

### 5. Direct HTTP Calls over SDKs

**Decision**: Use axios for direct HTTP calls to Telegram and Cursor Runner APIs

**Rationale**:
- More control over request/response handling
- Easier to mock in tests
- No dependency on potentially outdated SDKs
- Consistent error handling

**Trade-offs**:
- **Pros**: Control, testability, consistency
- **Cons**: More boilerplate, need to handle API changes manually

### 6. Environment-Based Configuration

**Decision**: Use environment variables for all configuration

**Rationale**:
- Follows 12-factor app principles
- Easy to configure for different environments
- No secrets in code
- Simple and standard approach

**Trade-offs**:
- **Pros**: Simple, secure, environment-agnostic
- **Cons**: No type checking for configuration (can be mitigated with validation)

### 7. Layered Error Handling

**Decision**: Use custom error classes and centralized error middleware

**Rationale**:
- Consistent error responses
- Proper error propagation
- Type-safe error handling
- Better error logging and debugging

**Pattern**:
- Services throw typed errors
- Controllers catch and format errors
- Error middleware handles uncaught errors
- Consistent error response format

### 8. Test Structure Mirrors Source Structure

**Decision**: Test directory structure mirrors `src/` directory structure

**Rationale**:
- Easy to find tests for specific files
- Clear organization
- Follows common Node.js patterns

**Structure**:
```
tests/
├── unit/          # Unit tests (mirrors src/)
├── integration/   # Integration tests
├── e2e/           # End-to-end tests
├── fixtures/      # Test data
├── mocks/         # Mock implementations
└── helpers/       # Test utilities
```

## Conversion Considerations

### From Rails to Node.js/TypeScript

#### Key Differences

1. **No ActiveJob**: Replaced with BullMQ for background jobs
2. **No ActiveRecord**: Using direct Redis access and potentially a lightweight ORM if database is added
3. **No Rails Credentials**: Using environment variables
4. **Express Middleware**: Replacing Rails before_action filters
5. **TypeScript Types**: Replacing Ruby duck typing with explicit types
6. **Dependency Injection**: Replacing Rails class methods with constructor injection

#### Preserved Functionality

- Same webhook authentication mechanism
- Same request forwarding logic
- Same callback handling flow
- Same error handling approach
- Same local command processing

#### Migration Strategy

1. **Phase 1**: Basic infrastructure (Express, TypeScript, testing)
2. **Phase 2**: File-by-file conversion maintaining feature parity
3. **Phase 3**: Holistic review and best practices

## Technology Stack

### Core Technologies

- **Node.js** (>=18.0.0): Runtime environment
- **TypeScript** (^5.3.3): Type-safe JavaScript
- **Express.js** (^4.18.2): Web framework

### Key Dependencies

- **axios** (^1.6.2): HTTP client
- **redis** (^4.6.10) / **ioredis** (^5.3.2): Redis client
- **bullmq** (^5.1.0): Job queue system
- **@elevenlabs/elevenlabs-js** (^2.24.1): ElevenLabs API client

### Development Tools

- **Jest** (^29.7.0): Testing framework
- **Playwright** (^1.40.1): End-to-end testing
- **ESLint** (^8.56.0): Linting
- **Prettier** (^3.1.1): Code formatting
- **TypeScript Compiler**: Type checking and compilation

## Data Flow

### Telegram Webhook Flow

```
1. Telegram → Application
   └─ POST /telegram/webhook
   └─ Validates X-Telegram-Bot-Api-Secret-Token
   └─ Returns 200 OK immediately
   └─ Enqueues job for async processing

2. Job Processing
   └─ TelegramMessageJob processes update
   └─ Handles different update types (message, edited_message, callback_query)
   └─ Processes audio transcription if needed
   └─ Detects local commands vs. forwarding to Cursor Runner

3. Application → Cursor Runner
   └─ Forwards non-command messages to Cursor Runner API
   └─ Stores request context in Redis with unique request ID
   └─ Cursor Runner processes asynchronously

4. Cursor Runner → Application
   └─ POST /cursor-runner/callback with results
   └─ Retrieves request context from Redis
   └─ Formats response for Telegram user

5. Application → Telegram
   └─ Sends formatted response to user
   └─ Handles errors gracefully
```

### State Management

- **Redis** stores temporary state:
  - Callback request context (request ID → chat context mapping)
  - TTL: 1 hour (automatic cleanup)
  - BullMQ job queues and job state

## Error Handling Strategy

### Error Types

1. **Validation Errors**: Invalid request data
2. **Authentication Errors**: Missing or invalid authentication
3. **External API Errors**: Telegram API, Cursor Runner API failures
4. **Network Errors**: Timeouts, connection failures
5. **Business Logic Errors**: Application-specific errors

### Error Handling Pattern

```typescript
// Services throw typed errors
throw new TelegramApiError('Failed to send message', { statusCode: 500 });

// Controllers catch and format
try {
  await service.processMessage(message);
} catch (error) {
  if (error instanceof TelegramApiError) {
    return res.status(500).json({ ok: false, error: error.message });
  }
  throw error; // Let error middleware handle
}

// Error middleware handles uncaught errors
app.use((err, req, res, next) => {
  logger.error(err);
  res.status(500).json({ ok: false, error: 'Internal server error' });
});
```

### Error Response Format

```typescript
{
  ok: false,
  error: "Error message",
  details?: {} // Optional additional details
}
```

## Async/Await Patterns

### Best Practices

1. **Consistent async/await**: Use async/await instead of Promise chains
2. **Error handling**: Always use try-catch with async/await
3. **Parallelization**: Use `Promise.all()` for independent operations
4. **Express async handlers**: Wrap async route handlers properly

### Pattern Examples

```typescript
// Service method
async processMessage(message: TelegramMessage): Promise<void> {
  try {
    const text = await this.transcribeAudio(message);
    await this.forwardToCursorRunner(text);
  } catch (error) {
    logger.error('Failed to process message', error);
    throw error;
  }
}

// Controller handler
router.post('/webhook', async (req, res, next) => {
  try {
    await telegramService.processMessage(req.body);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});
```

## Security Considerations

### Authentication

1. **Webhook Authentication**: Validates `X-Telegram-Bot-Api-Secret-Token` header
2. **Admin Endpoints**: Requires `X-Admin-Secret` header
3. **No User Authentication**: Telegram handles user authentication

### Security Practices

- Environment variables for secrets (never commit secrets)
- Input validation on all endpoints
- Rate limiting (future consideration)
- Error messages don't expose sensitive information
- HTTPS required in production

## Testing Strategy

### Test Types

1. **Unit Tests**: Test individual services, utilities, models
2. **Integration Tests**: Test API endpoints with mocked dependencies
3. **End-to-End Tests**: Test full flows with Playwright

### Testing Patterns

- Use dependency injection for testability
- Mock external APIs (Telegram, Cursor Runner)
- Use fixtures for test data
- Test error scenarios
- Maintain high test coverage

## Performance Considerations

### Optimization Strategies

1. **Async Processing**: Process webhooks asynchronously to respond quickly
2. **Redis Caching**: Use Redis for fast state access
3. **Connection Pooling**: Reuse HTTP connections
4. **Job Queues**: Distribute work across workers

### Scalability

- Stateless application (can scale horizontally)
- Redis for shared state
- BullMQ for distributed job processing
- No database bottlenecks (using Redis)

## Future Enhancements

### Potential Improvements

1. **Database Persistence**: Add database for persistent data (if needed)
2. **Repository Pattern**: Implement repository pattern for data access
3. **Caching Layer**: Add caching for frequently accessed data
4. **Rate Limiting**: Implement rate limiting middleware
5. **Monitoring**: Add metrics and monitoring (Prometheus, Grafana)
6. **Logging**: Structured logging with correlation IDs
7. **API Versioning**: Support multiple API versions
8. **Multi-bot Support**: Support multiple Telegram bots

## Architecture Evolution

This document should be updated as the architecture evolves. Key areas to monitor:

- New patterns introduced
- Changes to layer responsibilities
- New dependencies or technologies
- Performance optimizations
- Security improvements
- Testing strategy changes

## References

- `Plan/app-description.md`: Application overview and requirements
- `Plan/CONVERSION_STEPS.md`: Conversion plan and considerations
- `Plan/tasks/phase-3/`: Architecture review tasks
- `package.json`: Dependencies and scripts
- `tsconfig.json`: TypeScript configuration
