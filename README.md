# Telegram Receiver

A Node.js/TypeScript application that serves as a bridge between Telegram Bot API and the Cursor Runner service. This application receives messages from Telegram users, processes them, and forwards them to the Cursor Runner API for execution.

## Overview

This application is a Node.js/TypeScript conversion of the `jarek-va` Ruby on Rails application. It handles Telegram webhook integration, message processing, and Cursor Runner integration. The application receives webhook requests from Telegram Bot API, processes messages (including audio transcription), and forwards them to the Cursor Runner API for execution.

### Core Functionality

- **Telegram Webhook Handling**: Receives and authenticates webhook requests from Telegram Bot API
- **Message Processing**: Processes messages, handles local commands, and forwards non-command messages to Cursor Runner
- **Cursor Runner Integration**: Communicates with Cursor Runner API to execute user prompts and handle callbacks
- **Audio Support**: Transcribes audio messages using ElevenLabs Speech-to-Text service (optional)

For detailed project information, see [`Plan/app-description.md`](Plan/app-description.md).

## Project Structure

```
telegram-receiver/
├── src/                    # Source code
│   ├── app.ts             # Express application setup
│   ├── index.ts           # Application entry point
│   ├── worker.ts          # Worker process entry point
│   ├── config/            # Configuration files
│   │   ├── environment.ts # Environment variable management
│   │   ├── logger.ts      # Logger configuration
│   │   └── validateEnv.ts # Environment validation
│   ├── controllers/       # Request handlers
│   │   └── health.controller.ts
│   ├── routes/            # Route definitions
│   │   └── health.routes.ts
│   ├── services/          # Business logic services
│   ├── models/            # Data models
│   ├── middleware/        # Express middleware
│   │   ├── cors.ts
│   │   ├── error-handler.middleware.ts
│   │   ├── not-found.middleware.ts
│   │   └── request-logger.middleware.ts
│   ├── utils/             # Utility functions
│   │   └── logger.ts
│   ├── types/             # TypeScript type definitions
│   │   ├── cursor-runner.ts
│   │   └── telegram.ts
│   ├── validators/        # Input validation
│   ├── jobs/              # Background job definitions
│   └── errors/            # Custom error classes
├── tests/                 # Test files
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   ├── e2e/              # End-to-end tests
│   ├── fixtures/         # Test fixtures
│   ├── mocks/            # Mock implementations
│   └── helpers/          # Test helper utilities
├── Plan/                  # Conversion planning documents
├── dist/                  # Compiled JavaScript (generated)
├── coverage/              # Test coverage reports (generated)
├── scripts/               # Utility scripts
├── docs/                  # Documentation
├── Dockerfile             # Docker configuration
├── docker-compose.yml     # Docker Compose configuration
├── deploy.sh              # Deployment script
├── package.json           # Project metadata and dependencies
└── tsconfig.json          # TypeScript configuration
```

## Requirements

### Prerequisites

- **Node.js**: >=18.0.0 (see `package.json` engines field)
- **npm**: >=9.0.0 (see `package.json` engines field)
- **Redis**: Required for BullMQ job queues and callback state management

### Environment Variables

Create a `.env` file in the project root (you can copy from `.env.example` if it exists) with the following variables:

#### Required Variables

- `TELEGRAM_BOT_TOKEN` - Telegram bot token from BotFather
- `TELEGRAM_WEBHOOK_SECRET` - Secret token for webhook authentication
- `TELEGRAM_WEBHOOK_BASE_URL` - Base URL for webhook registration
- `CURSOR_RUNNER_URL` - URL of the Cursor Runner service (e.g., `http://cursor-runner:3001`)
- `REDIS_URL` - Redis connection URL (e.g., `redis://localhost:6379/0`)

#### Optional Variables

- `CURSOR_RUNNER_TIMEOUT` - Request timeout in seconds (default: 300)
- `ELEVENLABS_API_KEY` - API key for ElevenLabs services (optional, for audio features)
- `WEBHOOK_SECRET` - Admin secret for management endpoints
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode (development, production, test)
- `LOG_LEVEL` - Logging level (info, debug, warn, error)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd telegram-receiver
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env  # If .env.example exists
   # Edit .env with your configuration
   ```

4. Ensure Redis is running:
   ```bash
   # Using Docker
   docker run -d -p 6379:6379 redis:7-alpine
   
   # Or install Redis locally
   # Follow Redis installation instructions for your OS
   ```

## Development Setup

### Running the Development Server

Start the development server with hot reloading:

```bash
npm run dev
```

The server will start on `http://localhost:3000` (or the port specified in `PORT` environment variable).

### Building the Project

Compile TypeScript to JavaScript:

```bash
npm run build
```

The compiled files will be in the `dist/` directory.

### Running the Production Server

After building, run the production server:

```bash
npm start
```

## Available Scripts

### Build Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run build:watch` - Watch mode for TypeScript compilation

### Development

- `npm run dev` - Start development server with hot reloading (nodemon)

### Testing

- `npm test` or `npm run test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- `npm run test:unit` - Run only unit tests
- `npm run test:integration` - Run only integration tests
- `npm run test:e2e` - Run end-to-end tests (Playwright)
- `npm run test:e2e:ui` - Run E2E tests with Playwright UI
- `npm run test:all` - Run all tests (unit, integration, and E2E)

### Code Quality

- `npm run lint` - Run ESLint to check for code issues
- `npm run lint:fix` - Run ESLint and automatically fix issues
- `npm run format` - Format code using Prettier
- `npm run format:check` - Check code formatting without making changes
- `npm run type-check` - Run TypeScript type checking without emitting files

## Testing

### Unit Tests

Run unit tests for individual components:

```bash
npm run test:unit
```

### Integration Tests

Run integration tests for API endpoints:

```bash
npm run test:integration
```

### End-to-End Tests

Run end-to-end tests using Playwright:

```bash
npm run test:e2e
```

### Test Coverage

Generate and view test coverage report:

```bash
npm run test:coverage
```

Coverage reports are generated in the `coverage/` directory.

### Running All Tests

Run all test suites:

```bash
npm run test:all
```

## API Endpoints

### Public Endpoints

- `GET /health` - Health check endpoint
- `GET /` - Root endpoint (returns health status)
- `POST /telegram/webhook` - Receives Telegram updates (authenticated via secret token)

### Admin Endpoints

Admin endpoints require the `X-Admin-Secret` header with the value from `WEBHOOK_SECRET` environment variable.

- `POST /telegram/set_webhook` - Set webhook URL
- `GET /telegram/webhook_info` - Get webhook information
- `DELETE /telegram/webhook` - Delete webhook

### Callback Endpoints

- `POST /cursor-runner/callback` - Receives callbacks from Cursor Runner

## Code Quality

### Linting

The project uses ESLint for code linting. Run linting checks:

```bash
npm run lint
```

Auto-fix linting issues:

```bash
npm run lint:fix
```

### Formatting

The project uses Prettier for code formatting. Format all code:

```bash
npm run format
```

Check formatting without making changes:

```bash
npm run format:check
```

### Type Checking

Run TypeScript type checking:

```bash
npm run type-check
```

## Deployment

### Using the Deploy Script

The project includes a `deploy.sh` script that automates testing, linting, formatting checks, and git operations:

```bash
./deploy.sh
```

The deploy script:
1. Verifies you're in the correct directory
2. Runs linting checks (`npm run lint`)
3. Checks code formatting (`npm run format:check`)
4. Runs all tests (`npm test`)
5. Generates test coverage (`npm run test:coverage`)
6. Automatically stages and commits changes with an AI-generated commit message
7. Pushes changes to the remote repository

**Note**: The deploy script will fail if any tests, linting, or formatting checks fail. Ensure all checks pass before deployment.

## Docker

### Building the Docker Image

Build the Docker image:

```bash
docker build -t telegram-receiver .
```

### Running with Docker

Run the container:

```bash
docker run -p 3000:3000 --env-file .env telegram-receiver
```

### Docker Compose

Use Docker Compose for development with Redis:

```bash
docker-compose up
```

This will start:
- Redis service on port 6379
- Application service on port 3000

The `docker-compose.yml` file includes:
- Redis service for BullMQ job queues
- Application service with hot reloading in development mode
- Shared volumes for persistent data
- Network configuration for service communication

For production deployment, use `docker-compose.prod.yml`:

```bash
docker-compose -f docker-compose.prod.yml up
```

## Project Status

This project is currently in **Phase 1** of the conversion from Ruby on Rails to Node.js/TypeScript. Phase 1 focuses on basic Node.js API infrastructure.

For detailed conversion progress and plans, see [`Plan/CONVERSION_STEPS.md`](Plan/CONVERSION_STEPS.md).

## Related Documentation

- [`Plan/app-description.md`](Plan/app-description.md) - Detailed application description
- [`Plan/CONVERSION_STEPS.md`](Plan/CONVERSION_STEPS.md) - Conversion plan and progress
- [`docs/API.md`](docs/API.md) - API documentation (if available)
- [`docs/API_CONVENTIONS.md`](docs/API_CONVENTIONS.md) - API conventions and guidelines
- [`docs/STRUCTURE.md`](docs/STRUCTURE.md) - Project structure documentation

## License

MIT License - see `package.json` for details.

## Contributing

When contributing to this project:

1. Follow the project's coding standards and style guide
2. Write tests for new features
3. Ensure all tests pass before submitting changes
4. Use the deploy script (`./deploy.sh`) to commit and push changes
5. Follow conventional commit message format

For more details, see the [Software Developer guidelines](agents/Software%20Developer.md).
