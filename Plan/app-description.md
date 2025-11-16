# Telegram Receiver Application Description

## Overview

This application is a Node.js and TypeScript conversion of a portion of the `jarek-va` Ruby on Rails application. Specifically, this application will handle the Telegram webhook integration and forward messages to the Cursor Runner API.

## Purpose

The Telegram Receiver application serves as a lightweight bridge between Telegram Bot API and the Cursor Runner service. It receives messages from Telegram users, processes them, and forwards them to the Cursor Runner API for execution. The application also handles callbacks from Cursor Runner and sends responses back to Telegram users.

## Core Functionality

### 1. Telegram Webhook Handling

The application receives webhook requests from Telegram Bot API containing user messages, edited messages, and callback queries. Key responsibilities include:

- **Webhook Authentication**: Validates incoming requests using the `X-Telegram-Bot-Api-Secret-Token` header to ensure requests are from Telegram
- **Update Processing**: Parses and processes different types of Telegram updates:
  - Regular messages (`message`)
  - Edited messages (`edited_message`)
  - Callback queries (`callback_query`)
- **Async Processing**: Processes updates asynchronously to immediately return 200 OK to Telegram, preventing retries

### 2. Message Processing

When a message is received, the application:

- **Audio Transcription**: If the message contains audio/voice, it transcribes the audio to text using ElevenLabs Speech-to-Text service
- **Command Detection**: Identifies local commands (e.g., `/start`, `/help`, `/status`) that should be handled locally
- **Message Forwarding**: Forwards non-command messages to Cursor Runner API for processing
- **Response Handling**: Sends responses back to Telegram users, either as text or audio (if the original message was audio)

### 3. Cursor Runner Integration

The application communicates with the Cursor Runner API to execute user prompts:

- **Request Forwarding**: Sends user messages as prompts to Cursor Runner's `/cursor/iterate` endpoint
- **Request Tracking**: Generates unique request IDs and stores pending requests in Redis for callback processing
- **Callback Handling**: Receives callbacks from Cursor Runner when execution completes and forwards results to Telegram users
- **Error Handling**: Handles connection errors, timeouts, and API errors gracefully

### 4. Local Command Processing

Certain commands are handled locally without forwarding to Cursor Runner:

- `/start` - Welcome message and bot introduction
- `/help` - Help text with available commands
- `/status` - Bot status check

## Key Components (from Rails Implementation)

### Controllers

- **TelegramController**: Handles webhook endpoints
  - `POST /telegram/webhook` - Receives updates from Telegram
  - `POST /telegram/set_webhook` - Sets webhook URL (admin only)
  - `GET /telegram/webhook_info` - Gets webhook information (admin only)
  - `DELETE /telegram/webhook` - Deletes webhook (admin only)

- **CursorRunnerCallbackController**: Handles callbacks from Cursor Runner
  - `POST /cursor-runner/callback` - Receives execution results from Cursor Runner

### Services

- **TelegramService**: Handles Telegram Bot API interactions
  - Sending messages
  - Downloading files
  - Setting/getting/deleting webhooks
  - Sending voice messages

- **CursorRunnerService**: Communicates with Cursor Runner API
  - `iterate()` - Sends prompts for iterative execution
  - `execute()` - Sends prompts for single execution
  - Error handling and timeout management

- **CursorRunnerCallbackService**: Manages callback state in Redis
  - Stores pending requests
  - Retrieves request context
  - Cleans up completed requests

- **ElevenLabsSpeechToTextService**: Transcribes audio messages
- **ElevenLabsTextToSpeechService**: Converts text to speech for audio responses

### Jobs

- **TelegramMessageJob**: Processes Telegram updates asynchronously
  - Handles different update types
  - Forwards messages to Cursor Runner
  - Processes local commands
  - Manages audio transcription and response

## Technical Requirements

### Dependencies

- **Express.js**: Web framework for handling HTTP requests
- **TypeScript**: Type-safe JavaScript
- **Redis**: For storing pending request state
- **HTTP Client**: For communicating with Cursor Runner API (e.g., `axios` or `node-fetch`)
- **Telegram Bot API Client**: For interacting with Telegram (e.g., `node-telegram-bot-api` or direct HTTP calls)

### Environment Variables

- `TELEGRAM_BOT_TOKEN` - Telegram bot token from BotFather
- `TELEGRAM_WEBHOOK_SECRET` - Secret token for webhook authentication
- `TELEGRAM_WEBHOOK_BASE_URL` - Base URL for webhook registration
- `CURSOR_RUNNER_URL` - URL of the Cursor Runner service (e.g., `http://cursor-runner:3001`)
- `CURSOR_RUNNER_TIMEOUT` - Request timeout in seconds (default: 300)
- `REDIS_URL` - Redis connection URL
- `ELEVENLABS_API_KEY` - API key for ElevenLabs services (optional, for audio features)
- `WEBHOOK_SECRET` - Admin secret for management endpoints

### API Endpoints

#### Public Endpoints

- `POST /telegram/webhook` - Receives Telegram updates (authenticated via secret token)

#### Admin Endpoints (require `X-Admin-Secret` header)

- `POST /telegram/set_webhook` - Set webhook URL
- `GET /telegram/webhook_info` - Get webhook information
- `DELETE /telegram/webhook` - Delete webhook

#### Callback Endpoints

- `POST /cursor-runner/callback` - Receives callbacks from Cursor Runner

## Data Flow

1. **Telegram → Application**:
   - User sends a message via Telegram
   - Telegram sends webhook request to `/telegram/webhook`
   - Application validates request and enqueues job for processing
   - Application returns 200 OK immediately

2. **Application → Cursor Runner**:
   - Job processes the message
   - If not a local command, forwards to Cursor Runner API
   - Stores request context in Redis with unique request ID
   - Cursor Runner processes the prompt asynchronously

3. **Cursor Runner → Application**:
   - Cursor Runner completes execution
   - Sends callback to `/cursor-runner/callback` with results
   - Application retrieves request context from Redis
   - Application formats and sends response to Telegram user

4. **Application → Telegram**:
   - Sends formatted response back to user
   - Handles errors gracefully with user-friendly messages

## Features to Convert

### Core Features (Must Have)

- ✅ Telegram webhook receiving and authentication
- ✅ Message processing and forwarding to Cursor Runner
- ✅ Callback handling from Cursor Runner
- ✅ Local command processing (`/start`, `/help`, `/status`)
- ✅ Request tracking with Redis
- ✅ Error handling and user feedback

### Optional Features (Nice to Have)

- ⚠️ Audio transcription (requires ElevenLabs integration)
- ⚠️ Text-to-speech responses (requires ElevenLabs integration)
- ⚠️ Webhook management endpoints (admin functionality)
- ⚠️ Multi-bot support (if needed)

## Architecture Considerations

### Async Processing

The Rails application uses Sidekiq for background job processing. In Node.js, we can use:
- **Bull** or **BullMQ** with Redis for job queues
- **Node.js worker threads** for CPU-intensive tasks
- **Simple async/await** for I/O-bound operations

### State Management

- Use Redis for storing pending request state (request ID → chat context mapping)
- Set appropriate TTL (e.g., 1 hour) for pending requests
- Clean up completed requests

### Error Handling

- Always return 200 OK to Telegram webhook to prevent retries
- Log errors for debugging
- Send user-friendly error messages when possible
- Handle Cursor Runner connection errors gracefully

### Configuration

- Use environment variables for all configuration
- Support different environments (development, test, production)
- Validate required configuration on startup

## Testing Strategy

Since end-to-end testing on a live server won't be available until late in development:

- **Unit Tests**: Test individual services and utilities
- **Integration Tests**: Test API endpoints with mocked dependencies
- **Mocking**: Mock Telegram API and Cursor Runner API calls
- **Test Fixtures**: Use realistic Telegram update payloads

## Migration Notes

### Key Differences from Rails

1. **No ActiveJob**: Use Bull/BullMQ or similar for job queues
2. **No ActiveRecord**: Use direct Redis client or a lightweight ORM if needed
3. **No Rails Credentials**: Use environment variables or a secrets management system
4. **Express Middleware**: Use Express middleware for authentication and request parsing
5. **TypeScript Types**: Define types for Telegram updates, Cursor Runner responses, etc.

### Preserved Functionality

- Same webhook authentication mechanism
- Same request forwarding logic
- Same callback handling flow
- Same error handling approach
- Same local command processing

## Success Criteria

The converted application should:

1. Successfully receive and authenticate Telegram webhook requests
2. Forward messages to Cursor Runner API correctly
3. Handle callbacks from Cursor Runner and send responses to Telegram
4. Process local commands without forwarding to Cursor Runner
5. Handle errors gracefully and provide user feedback
6. Maintain the same functionality as the Rails version

## Future Enhancements

- Support for multiple Telegram bots
- Enhanced command processing
- Message queuing and retry logic
- Rate limiting
- Analytics and logging
- Health check endpoints
- Metrics and monitoring
