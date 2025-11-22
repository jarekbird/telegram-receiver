# Dev Environment Setup

This document outlines the development environment setup for the Telegram Receiver Node.js TypeScript application. Since end-to-end testing on a live server won't be available until late in the development process, we need a robust local development environment with comprehensive testing capabilities.

## Table of Contents

1. [Project Structure](#project-structure)
2. [Initial Setup](#initial-setup)
3. [TypeScript Configuration](#typescript-configuration)
4. [Development Dependencies](#development-dependencies)
5. [Testing Setup](#testing-setup)
6. [Development Tools](#development-tools)
7. [Mocking & Stubbing](#mocking--stubbing)
8. [Environment Configuration](#environment-configuration)
9. [Hot Reloading & Development Server](#hot-reloading--development-server)
10. [Debugging](#debugging)
11. [CI/CD Considerations](#cicd-considerations)

## Project Structure

```
telegram-receiver/
├── src/
│   ├── index.ts                 # Application entry point
│   ├── config/                  # Configuration files
│   ├── controllers/             # Request handlers
│   ├── services/                # Business logic
│   ├── models/                  # Data models
│   ├── middleware/              # Express middleware
│   ├── routes/                  # Route definitions
│   ├── utils/                   # Utility functions
│   └── types/                   # TypeScript type definitions
├── tests/
│   ├── unit/                    # Unit tests
│   ├── integration/             # Integration tests
│   ├── e2e/                     # End-to-end tests
│   ├── fixtures/                # Test fixtures and mock data
│   └── helpers/                 # Test helpers and utilities
├── scripts/                     # Build and utility scripts
├── .env.example                 # Example environment variables
├── .env.development             # Development environment variables
├── .env.test                    # Test environment variables
├── tsconfig.json                # TypeScript configuration
├── tsconfig.test.json           # TypeScript config for tests
├── package.json
├── jest.config.js               # Jest configuration
├── .eslintrc.js                 # ESLint configuration
├── .prettierrc                  # Prettier configuration
└── docker-compose.dev.yml       # Docker setup for local development
```

## Initial Setup

### Prerequisites

- Node.js (v18.x or higher recommended)
- npm (v9.x or higher) or yarn (v1.22.x or higher)
- Docker and Docker Compose (for local services)
- Git

### Project Initialization

```bash
# Initialize npm project
npm init -y

# Install TypeScript and essential dependencies
npm install --save-dev typescript @types/node ts-node nodemon

# Install production dependencies (adjust based on your needs)
npm install express dotenv
npm install --save-dev @types/express
```

## TypeScript Configuration

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "allowSyntheticDefaultImports": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### tsconfig.test.json

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist-test",
    "rootDir": "./tests",
    "types": ["jest", "node"]
  },
  "include": ["tests/**/*", "src/**/*"]
}
```

## Development Dependencies

### Essential Development Packages

```bash
# TypeScript and build tools
npm install --save-dev typescript @types/node ts-node nodemon

# Testing framework
npm install --save-dev jest @types/jest ts-jest

# E2E testing
npm install --save-dev @playwright/test
# OR
npm install --save-dev puppeteer @types/puppeteer

# Code quality
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install --save-dev prettier eslint-config-prettier eslint-plugin-prettier

# Testing utilities
npm install --save-dev supertest @types/supertest
npm install --save-dev nock  # HTTP mocking
npm install --save-dev sinon @types/sinon  # Spies, stubs, mocks

# Environment management
npm install --save-dev dotenv cross-env

# Development server
npm install --save-dev concurrently

# Code coverage
npm install --save-dev @jest/coverage

# Pre-commit hooks
npm install --save-dev husky lint-staged
```

## Testing Setup

### Jest Configuration (jest.config.js)

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/index.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 10000,
  verbose: true,
};
```

### Test Setup File (tests/setup.ts)

```typescript
// Global test setup
beforeAll(() => {
  // Setup test environment
  process.env.NODE_ENV = 'test';
});

afterAll(() => {
  // Cleanup after all tests
});

// Global test utilities
global.testHelpers = {
  // Add common test helpers here
};
```

### Unit Testing Example

```typescript
// tests/unit/services/example.service.test.ts
import { ExampleService } from '../../../src/services/example.service';

describe('ExampleService', () => {
  let service: ExampleService;

  beforeEach(() => {
    service = new ExampleService();
  });

  it('should perform action correctly', () => {
    const result = service.doSomething();
    expect(result).toBeDefined();
  });
});
```

### Integration Testing Example

```typescript
// tests/integration/api/example.integration.test.ts
import request from 'supertest';
import { app } from '../../../src/app';

describe('Example API Integration', () => {
  it('should handle GET request', async () => {
    const response = await request(app).get('/api/example').expect(200);

    expect(response.body).toBeDefined();
  });
});
```

### End-to-End Testing Setup

#### Option 1: Playwright (Recommended)

```typescript
// tests/e2e/example.e2e.test.ts
import { test, expect } from '@playwright/test';

test.describe('E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
  });

  test('should complete user flow', async ({ page }) => {
    await page.goto('http://localhost:3000');
    // Test implementation
  });
});
```

**playwright.config.ts:**

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

#### Option 2: Puppeteer

```typescript
// tests/e2e/example.e2e.test.ts
import puppeteer from 'puppeteer';

describe('E2E Tests', () => {
  let browser: puppeteer.Browser;
  let page: puppeteer.Page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: process.env.CI === 'true',
    });
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  it('should complete user flow', async () => {
    await page.goto('http://localhost:3000');
    // Test implementation
  });
});
```

## Development Tools

### ESLint Configuration (.eslintrc.js)

```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    'prettier/prettier': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
  env: {
    node: true,
    jest: true,
  },
};
```

### Prettier Configuration (.prettierrc)

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "avoid"
}
```

### Package.json Scripts

```json
{
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch",
    "dev": "nodemon --exec ts-node src/index.ts",
    "start": "node dist/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testPathPattern=tests/unit",
    "test:integration": "jest --testPathPattern=tests/integration",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "lint": "eslint src tests --ext .ts",
    "lint:fix": "eslint src tests --ext .ts --fix",
    "format": "prettier --write \"src/**/*.ts\" \"tests/**/*.ts\"",
    "format:check": "prettier --check \"src/**/*.ts\" \"tests/**/*.ts\"",
    "type-check": "tsc --noEmit",
    "prepare": "husky install"
  }
}
```

## Mocking & Stubbing

Since we can't test against live services, we need robust mocking capabilities:

### HTTP Mocking with Nock

```typescript
// tests/helpers/http-mocks.ts
import nock from 'nock';

export const mockTelegramAPI = () => {
  return nock('https://api.telegram.org')
    .get('/bot123456:ABC-DEF/bot/getMe')
    .reply(200, { ok: true, result: { id: 123456, is_bot: true } });
};
```

### Service Mocking with Sinon

```typescript
// tests/unit/services/example.service.test.ts
import sinon from 'sinon';
import { ExternalService } from '../../../src/services/external.service';

describe('ExampleService with mocked dependencies', () => {
  let externalServiceStub: sinon.SinonStub;

  beforeEach(() => {
    externalServiceStub = sinon.stub(ExternalService.prototype, 'callAPI');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should handle mocked external service', () => {
    externalServiceStub.resolves({ data: 'mocked' });
    // Test implementation
  });
});
```

### Database Mocking

```typescript
// Use in-memory database for testing
// Example with a mock database service
import { MockDatabase } from '../helpers/mock-database';

beforeEach(() => {
  MockDatabase.reset();
});
```

## Environment Configuration

### .env.example

```env
NODE_ENV=development
PORT=3000
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_API_URL=https://api.telegram.org
DATABASE_URL=postgresql://user:password@localhost:5432/telegram_receiver
REDIS_URL=redis://localhost:6379
LOG_LEVEL=debug
```

### Environment-specific Config

```typescript
// src/config/environment.ts
import dotenv from 'dotenv';

dotenv.config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    apiUrl: process.env.TELEGRAM_API_URL || 'https://api.telegram.org',
  },
  database: {
    url: process.env.DATABASE_URL || '',
  },
  redis: {
    url: process.env.REDIS_URL || '',
  },
  logLevel: process.env.LOG_LEVEL || 'info',
};
```

## Hot Reloading & Development Server

### Nodemon Configuration (nodemon.json)

```json
{
  "watch": ["src"],
  "ext": "ts,json",
  "ignore": ["src/**/*.spec.ts", "src/**/*.test.ts"],
  "exec": "ts-node src/index.ts",
  "env": {
    "NODE_ENV": "development"
  }
}
```

### Concurrent Development Scripts

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:watch\"",
    "dev:server": "nodemon --exec ts-node src/index.ts",
    "dev:watch": "tsc --watch"
  }
}
```

## Debugging

### VS Code Launch Configuration (.vscode/launch.json)

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Current File",
      "runtimeExecutable": "ts-node",
      "runtimeArgs": ["${file}"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Application",
      "runtimeExecutable": "ts-node",
      "runtimeArgs": ["src/index.ts"],
      "console": "integratedTerminal",
      "env": {
        "NODE_ENV": "development"
      }
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Jest Tests",
      "runtimeExecutable": "node",
      "runtimeArgs": [
        "${workspaceFolder}/node_modules/.bin/jest",
        "--runInBand",
        "--no-cache",
        "${relativeFile}"
      ],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

## CI/CD Considerations

### GitHub Actions Example (.github/workflows/ci.yml)

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run type-check

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

      - name: Generate coverage
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

## Docker Development Setup

### docker-compose.dev.yml

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    volumes:
      - .:/app
      - /app/node_modules
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/telegram_receiver_dev
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    command: npm run dev

  db:
    image: postgres:14
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: telegram_receiver_dev
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'

volumes:
  postgres_data:
```

### Dockerfile.dev

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
```

## Best Practices

1. **Always run tests before committing**: Use pre-commit hooks with Husky
2. **Keep test coverage high**: Aim for >80% coverage
3. **Mock external dependencies**: Never make real API calls in tests
4. **Use test fixtures**: Create reusable test data
5. **Isolate tests**: Each test should be independent
6. **Use descriptive test names**: Test names should describe what they test
7. **Keep dev environment close to production**: Use similar configurations
8. **Document test setup**: Keep this document updated as the project evolves

## Next Steps

1. Initialize the project with the configurations above
2. Set up CI/CD pipeline
3. Create initial test suite structure
4. Set up monitoring and logging for development
5. Document API endpoints and expected behaviors
6. Create mock services for external dependencies
