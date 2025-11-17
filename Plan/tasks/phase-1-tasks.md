# Phase 1: Basic Node.js API Infrastructure - Task Breakdown

**Objective**: Create a foundational Node.js API that can receive requests and handle basic routing.

**Note**: All tasks are designed to be extremely small and unit-sized so they can be handled by different agents independently.

---

## 1. Project Initialization

### 1.1 Create package.json
- [ ] Create `package.json` file in project root
- [ ] Set `name` field to "jarek-va"
- [ ] Set `version` field to "1.0.0"
- [ ] Set `description` field
- [ ] Set `main` field to "dist/index.js"
- [ ] Set `scripts` object (empty initially)
- [ ] Set `keywords` array
- [ ] Set `author` field
- [ ] Set `license` field to "MIT"

### 1.2 Initialize Git repository (if not exists)
- [ ] Check if `.git` directory exists
- [ ] If not, run `git init`
- [ ] Create `.gitignore` file
- [ ] Add `node_modules/` to `.gitignore`
- [ ] Add `dist/` to `.gitignore`
- [ ] Add `.env` to `.gitignore`
- [ ] Add `*.log` to `.gitignore`
- [ ] Add `coverage/` to `.gitignore`

### 1.3 Install TypeScript dependencies
- [ ] Install `typescript` as dev dependency
- [ ] Install `@types/node` as dev dependency
- [ ] Install `ts-node` as dev dependency
- [ ] Install `nodemon` as dev dependency
- [ ] Verify all packages installed correctly

---

## 2. Project Structure Setup

### 2.1 Create source directory structure
- [ ] Create `src/` directory
- [ ] Create `src/index.ts` file (empty initially)
- [ ] Create `src/config/` directory
- [ ] Create `src/controllers/` directory
- [ ] Create `src/services/` directory
- [ ] Create `src/models/` directory
- [ ] Create `src/middleware/` directory
- [ ] Create `src/routes/` directory
- [ ] Create `src/utils/` directory
- [ ] Create `src/types/` directory

### 2.2 Create test directory structure
- [ ] Create `tests/` directory
- [ ] Create `tests/unit/` directory
- [ ] Create `tests/integration/` directory
- [ ] Create `tests/e2e/` directory
- [ ] Create `tests/fixtures/` directory
- [ ] Create `tests/helpers/` directory
- [ ] Create `tests/setup.ts` file (empty initially)

### 2.3 Create configuration files directory
- [ ] Create `config/` directory (if needed for non-TypeScript configs)
- [ ] Create `.env.example` file
- [ ] Create `.env.development` file
- [ ] Create `.env.test` file

---

## 3. TypeScript Configuration

### 3.1 Create base tsconfig.json
- [ ] Create `tsconfig.json` file
- [ ] Set `compilerOptions.target` to "ES2020"
- [ ] Set `compilerOptions.module` to "commonjs"
- [ ] Set `compilerOptions.lib` to ["ES2020"]
- [ ] Set `compilerOptions.outDir` to "./dist"
- [ ] Set `compilerOptions.rootDir` to "./src"
- [ ] Set `compilerOptions.strict` to true
- [ ] Set `compilerOptions.esModuleInterop` to true
- [ ] Set `compilerOptions.skipLibCheck` to true
- [ ] Set `compilerOptions.forceConsistentCasingInFileNames` to true
- [ ] Set `compilerOptions.resolveJsonModule` to true
- [ ] Set `compilerOptions.moduleResolution` to "node"
- [ ] Set `compilerOptions.declaration` to true
- [ ] Set `compilerOptions.declarationMap` to true
- [ ] Set `compilerOptions.sourceMap` to true
- [ ] Set `compilerOptions.noUnusedLocals` to true
- [ ] Set `compilerOptions.noUnusedParameters` to true
- [ ] Set `compilerOptions.noImplicitReturns` to true
- [ ] Set `compilerOptions.noFallthroughCasesInSwitch` to true
- [ ] Set `compilerOptions.allowSyntheticDefaultImports` to true
- [ ] Set `include` array to ["src/**/*"]
- [ ] Set `exclude` array to ["node_modules", "dist", "tests"]

### 3.2 Create test tsconfig.json
- [ ] Create `tsconfig.test.json` file
- [ ] Extend base `tsconfig.json`
- [ ] Override `compilerOptions.outDir` to "./dist-test"
- [ ] Override `compilerOptions.rootDir` to "./tests"
- [ ] Add `compilerOptions.types` array with ["jest", "node"]
- [ ] Set `include` array to ["tests/**/*", "src/**/*"]

---

## 4. Express.js Framework Setup

### 4.1 Install Express dependencies
- [ ] Install `express` as production dependency
- [ ] Install `@types/express` as dev dependency
- [ ] Verify installation

### 4.2 Create Express application instance
- [ ] Create `src/app.ts` file
- [ ] Import `express` module
- [ ] Create Express app instance using `express()`
- [ ] Export app instance as default export

### 4.3 Create application entry point
- [ ] Open `src/index.ts` file
- [ ] Import app from `./app`
- [ ] Import environment configuration (to be created)
- [ ] Create function to start server
- [ ] Call server start function
- [ ] Add error handling for server startup

### 4.4 Add build scripts to package.json
- [ ] Add `"build": "tsc"` to scripts
- [ ] Add `"build:watch": "tsc --watch"` to scripts
- [ ] Add `"dev": "nodemon --exec ts-node src/index.ts"` to scripts
- [ ] Add `"start": "node dist/index.js"` to scripts
- [ ] Verify scripts are valid JSON

---

## 5. Health Check Endpoint

### 5.1 Create health check controller
- [ ] Create `src/controllers/health.controller.ts` file
- [ ] Create `getHealth` function
- [ ] Function should return status 200
- [ ] Function should return JSON with `{ status: "ok" }`
- [ ] Export `getHealth` function

### 5.2 Create health check route
- [ ] Create `src/routes/health.routes.ts` file
- [ ] Import Express Router
- [ ] Import health controller
- [ ] Create router instance
- [ ] Add GET route for `/health` that calls controller
- [ ] Export router

### 5.3 Register health route in app
- [ ] Open `src/app.ts`
- [ ] Import health routes
- [ ] Use health routes with app.use() at path `/`
- [ ] Verify route registration

### 5.4 Test health endpoint manually
- [ ] Build the project (`npm run build`)
- [ ] Start the server (`npm start`)
- [ ] Make GET request to `http://localhost:PORT/health`
- [ ] Verify response is `{ status: "ok" }`
- [ ] Stop the server

---

## 6. Request/Response Middleware

### 6.1 Create JSON body parser middleware
- [ ] Open `src/app.ts`
- [ ] Import `express.json()` middleware
- [ ] Apply middleware using `app.use(express.json())`
- [ ] Verify middleware is applied before routes

### 6.2 Create URL encoded parser middleware
- [ ] Open `src/app.ts`
- [ ] Import `express.urlencoded()` middleware
- [ ] Configure with `{ extended: true }`
- [ ] Apply middleware using `app.use()`
- [ ] Verify middleware is applied before routes

### 6.3 Create CORS middleware (if needed)
- [ ] Install `cors` package as production dependency
- [ ] Install `@types/cors` as dev dependency
- [ ] Import `cors` in `src/app.ts`
- [ ] Configure CORS with appropriate options
- [ ] Apply CORS middleware using `app.use(cors())`

### 6.4 Create request logging middleware
- [ ] Create `src/middleware/request-logger.middleware.ts` file
- [ ] Create middleware function that logs request method
- [ ] Log request URL
- [ ] Log request timestamp
- [ ] Call `next()` to continue request chain
- [ ] Export middleware function
- [ ] Import and apply in `src/app.ts`

### 6.5 Create error handling middleware
- [ ] Create `src/middleware/error-handler.middleware.ts` file
- [ ] Create error handler function with 4 parameters (err, req, res, next)
- [ ] Log error details
- [ ] Return appropriate error response (status 500)
- [ ] Export error handler function
- [ ] Import and apply in `src/app.ts` (after all routes)

### 6.6 Create 404 handler middleware
- [ ] Create `src/middleware/not-found.middleware.ts` file
- [ ] Create middleware function with 3 parameters (req, res, next)
- [ ] Return 404 status with error message
- [ ] Export middleware function
- [ ] Import and apply in `src/app.ts` (after all routes, before error handler)

---

## 7. Environment Variables Management

### 7.1 Install dotenv package
- [ ] Install `dotenv` as production dependency
- [ ] Verify installation

### 7.2 Create environment configuration module
- [ ] Create `src/config/environment.ts` file
- [ ] Import `dotenv` module
- [ ] Call `dotenv.config()` with appropriate path based on NODE_ENV
- [ ] Create `config` object
- [ ] Add `env` property from `process.env.NODE_ENV` or default to "development"
- [ ] Add `port` property from `process.env.PORT` or default to 3000
- [ ] Export `config` object

### 7.3 Create .env.example file
- [ ] Create `.env.example` file
- [ ] Add `NODE_ENV=development` line
- [ ] Add `PORT=3000` line
- [ ] Add comment explaining file purpose
- [ ] Add placeholder for future environment variables

### 7.4 Create .env.development file
- [ ] Create `.env.development` file
- [ ] Copy contents from `.env.example`
- [ ] Set appropriate development values

### 7.5 Create .env.test file
- [ ] Create `.env.test` file
- [ ] Copy contents from `.env.example`
- [ ] Set `NODE_ENV=test`
- [ ] Set `PORT=3001` (different from development)

### 7.6 Use environment config in application
- [ ] Open `src/index.ts`
- [ ] Import config from `./config/environment`
- [ ] Use `config.port` for server port
- [ ] Use `config.env` for environment logging

### 7.7 Add environment validation
- [ ] Create `src/config/validate-env.ts` file
- [ ] Create function to validate required environment variables
- [ ] Check for required variables (PORT, NODE_ENV)
- [ ] Throw error if required variables missing
- [ ] Export validation function
- [ ] Call validation function in `src/index.ts` before starting server

---

## 8. Logging Infrastructure

### 8.1 Choose logging library
- [ ] Research logging options (winston, pino, bunyan)
- [ ] Decide on logging library (recommend: winston or pino)
- [ ] Install chosen logging library as production dependency
- [ ] Install types if available as dev dependency

### 8.2 Create logger configuration module
- [ ] Create `src/config/logger.ts` file
- [ ] Import logging library
- [ ] Create logger instance
- [ ] Configure log levels based on NODE_ENV
- [ ] Configure log format (JSON for production, pretty for development)
- [ ] Configure log transports (console, file if needed)
- [ ] Export logger instance

### 8.3 Create logger utility wrapper
- [ ] Create `src/utils/logger.ts` file
- [ ] Import logger from config
- [ ] Create wrapper functions: `logger.info()`, `logger.error()`, `logger.warn()`, `logger.debug()`
- [ ] Export wrapper functions
- [ ] Ensure consistent logging interface

### 8.4 Integrate logger in application entry
- [ ] Open `src/index.ts`
- [ ] Import logger utility
- [ ] Log server startup message with port
- [ ] Log environment information
- [ ] Add error logging for startup failures

### 8.5 Integrate logger in middleware
- [ ] Open `src/middleware/request-logger.middleware.ts`
- [ ] Import logger utility
- [ ] Replace console.log with logger.info()
- [ ] Add appropriate log level for requests

### 8.6 Integrate logger in error handler
- [ ] Open `src/middleware/error-handler.middleware.ts`
- [ ] Import logger utility
- [ ] Replace console.error with logger.error()
- [ ] Log full error details including stack trace

---

## 9. Docker Configuration

### 9.1 Create Dockerfile
- [ ] Create `Dockerfile` in project root
- [ ] Use Node.js base image (e.g., `node:18-alpine`)
- [ ] Set WORKDIR to `/app`
- [ ] Copy `package.json` and `package-lock.json`
- [ ] Run `npm ci --only=production`
- [ ] Copy source files
- [ ] Run `npm run build`
- [ ] Expose port (use ARG for flexibility)
- [ ] Set CMD to start production server

### 9.2 Create .dockerignore file
- [ ] Create `.dockerignore` file
- [ ] Add `node_modules/` to ignore list
- [ ] Add `dist/` to ignore list (will be built in container)
- [ ] Add `.git/` to ignore list
- [ ] Add `tests/` to ignore list
- [ ] Add `.env*` files to ignore list
- [ ] Add `coverage/` to ignore list
- [ ] Add `*.log` to ignore list

### 9.3 Create docker-compose.yml for development
- [ ] Create `docker-compose.yml` file
- [ ] Define `app` service
- [ ] Set build context to current directory
- [ ] Set Dockerfile path
- [ ] Map port 3000:3000
- [ ] Set environment variables
- [ ] Add volume mount for development (optional)
- [ ] Set command for development mode

### 9.4 Create docker-compose.prod.yml for production
- [ ] Create `docker-compose.prod.yml` file
- [ ] Define `app` service
- [ ] Set build context
- [ ] Set production environment variables
- [ ] Configure restart policy
- [ ] Set appropriate port mapping
- [ ] Add healthcheck configuration

### 9.5 Test Docker build
- [ ] Run `docker build -t jarek-va .`
- [ ] Verify build completes without errors
- [ ] Run container: `docker run -p 3000:3000 jarek-va`
- [ ] Test health endpoint
- [ ] Stop container

### 9.6 Test docker-compose
- [ ] Run `docker-compose up --build`
- [ ] Verify container starts
- [ ] Test health endpoint
- [ ] Run `docker-compose down`

---

## 10. Test Suite Setup

### 10.1 Install Jest dependencies
- [ ] Install `jest` as dev dependency
- [ ] Install `@types/jest` as dev dependency
- [ ] Install `ts-jest` as dev dependency
- [ ] Verify all packages installed

### 10.2 Create Jest configuration file
- [ ] Create `jest.config.js` file
- [ ] Set `preset` to 'ts-jest'
- [ ] Set `testEnvironment` to 'node'
- [ ] Set `roots` to ['<rootDir>/src', '<rootDir>/tests']
- [ ] Set `testMatch` pattern for test files
- [ ] Configure `transform` for TypeScript files
- [ ] Set `collectCoverageFrom` patterns
- [ ] Set `coverageDirectory` to 'coverage'
- [ ] Set `coverageReporters` array
- [ ] Set `moduleFileExtensions` array
- [ ] Set `setupFilesAfterEnv` to test setup file
- [ ] Set `testTimeout` to 10000
- [ ] Set `verbose` to true

### 10.3 Create test setup file
- [ ] Open `tests/setup.ts` file
- [ ] Set `process.env.NODE_ENV` to 'test'
- [ ] Add `beforeAll` hook for global test setup
- [ ] Add `afterAll` hook for global test cleanup
- [ ] Export any test utilities if needed

### 10.4 Install testing utilities
- [ ] Install `supertest` as dev dependency
- [ ] Install `@types/supertest` as dev dependency
- [ ] Install `nock` as dev dependency (for HTTP mocking)
- [ ] Install `sinon` as dev dependency (for spies/stubs)
- [ ] Install `@types/sinon` as dev dependency

### 10.5 Add test scripts to package.json
- [ ] Add `"test": "jest"` to scripts
- [ ] Add `"test:watch": "jest --watch"` to scripts
- [ ] Add `"test:coverage": "jest --coverage"` to scripts
- [ ] Add `"test:unit": "jest --testPathPattern=tests/unit"` to scripts
- [ ] Add `"test:integration": "jest --testPathPattern=tests/integration"` to scripts

### 10.6 Create sample unit test
- [ ] Create `tests/unit/utils/example.test.ts` file
- [ ] Write simple test that always passes
- [ ] Verify test runs with `npm test`
- [ ] Verify test appears in output

### 10.7 Create health endpoint integration test
- [ ] Create `tests/integration/health.integration.test.ts` file
- [ ] Import app from `../../src/app`
- [ ] Import `request` from `supertest`
- [ ] Write test for GET `/health` endpoint
- [ ] Verify response status is 200
- [ ] Verify response body has `status: "ok"`
- [ ] Run test and verify it passes

### 10.8 Configure test coverage
- [ ] Run `npm run test:coverage`
- [ ] Verify coverage report is generated
- [ ] Check coverage directory exists
- [ ] Verify HTML coverage report is accessible

---

## 11. CI/CD Pipeline Configuration

### 11.1 Create GitHub Actions directory
- [ ] Create `.github/` directory
- [ ] Create `.github/workflows/` directory

### 11.2 Create CI workflow file
- [ ] Create `.github/workflows/ci.yml` file
- [ ] Set workflow name to "CI"
- [ ] Configure trigger on push to main/develop branches
- [ ] Configure trigger on pull requests to main/develop branches

### 11.3 Configure CI job - Setup
- [ ] Define `test` job
- [ ] Set `runs-on` to `ubuntu-latest`
- [ ] Add step to checkout code
- [ ] Add step to setup Node.js (version 18)
- [ ] Configure Node.js cache for npm
- [ ] Add step to install dependencies (`npm ci`)

### 11.4 Configure CI job - Linting
- [ ] Add step to run linting (if configured)
- [ ] Add step to run type checking (`npm run type-check` or `tsc --noEmit`)

### 11.5 Configure CI job - Testing
- [ ] Add step to run unit tests
- [ ] Add step to run integration tests
- [ ] Add step to generate coverage report
- [ ] Add step to upload coverage (optional, to codecov or similar)

### 11.6 Configure CI job - Build
- [ ] Add step to build the project (`npm run build`)
- [ ] Verify build artifacts are created
- [ ] Add step to verify dist/ directory exists

### 11.7 Test CI workflow locally (optional)
- [ ] Install `act` tool for local GitHub Actions testing (optional)
- [ ] Run workflow locally to verify it works
- [ ] Fix any issues found

### 11.8 Create CD workflow file (basic)
- [ ] Create `.github/workflows/cd.yml` file
- [ ] Set workflow name to "CD"
- [ ] Configure trigger on push to main branch (or tags)
- [ ] Define `deploy` job
- [ ] Add step to checkout code
- [ ] Add step to setup Node.js
- [ ] Add step to install dependencies
- [ ] Add step to build project
- [ ] Add step to build Docker image
- [ ] Add step to push Docker image (if registry configured)
- [ ] Add step to deploy (placeholder for now)

---

## 12. API Structure Documentation

### 12.1 Create API documentation directory
- [ ] Create `docs/` directory
- [ ] Create `docs/api/` directory

### 12.2 Document project structure
- [ ] Create `docs/STRUCTURE.md` file
- [ ] Document `src/` directory structure
- [ ] Document `tests/` directory structure
- [ ] Document `config/` directory structure
- [ ] Explain purpose of each directory

### 12.3 Document API conventions
- [ ] Create `docs/API_CONVENTIONS.md` file
- [ ] Document route naming conventions
- [ ] Document controller naming conventions
- [ ] Document service naming conventions
- [ ] Document middleware naming conventions
- [ ] Document error handling conventions
- [ ] Document response format conventions

### 12.4 Document health endpoint
- [ ] Create `docs/api/HEALTH.md` file
- [ ] Document GET `/health` endpoint
- [ ] Document request format
- [ ] Document response format
- [ ] Document status codes
- [ ] Add example request/response

### 12.5 Create API README
- [ ] Create `docs/API.md` file
- [ ] Add overview of API
- [ ] List all available endpoints
- [ ] Link to detailed endpoint documentation
- [ ] Add authentication information (if applicable)
- [ ] Add rate limiting information (if applicable)

### 12.6 Update main README
- [ ] Open `README.md` (create if doesn't exist)
- [ ] Add project description
- [ ] Add installation instructions
- [ ] Add development setup instructions
- [ ] Add API documentation link
- [ ] Add testing instructions
- [ ] Add Docker instructions
- [ ] Add CI/CD status badge (if applicable)

---

## Verification Checklist

After completing all tasks, verify:

- [ ] Project builds successfully (`npm run build`)
- [ ] Project runs successfully (`npm start`)
- [ ] Health endpoint responds correctly (`GET /health`)
- [ ] All tests pass (`npm test`)
- [ ] Test coverage is generated (`npm run test:coverage`)
- [ ] Docker image builds successfully (`docker build`)
- [ ] Docker container runs successfully (`docker run`)
- [ ] Environment variables are loaded correctly
- [ ] Logging works in all environments
- [ ] CI pipeline runs successfully (if pushed to GitHub)
- [ ] Documentation is complete and accurate

---

## Notes

- Each task should be completable independently by a single agent
- Tasks are ordered logically, but some can be done in parallel
- Dependencies between tasks are noted where relevant
- All code should follow TypeScript best practices
- All code should have appropriate error handling
- All public APIs should be documented


---

IMPORTANT: When updating system settings (SystemSetting model), you MUST use the cursor-runner-shared-sqlite MCP connection.

IMPORTANT: When working with tasks (creating, querying, updating, or deleting tasks), you MUST use the cursor-runner-shared-sqlite MCP connection. The tasks table is in the shared SQLite database at /app/shared_db/shared.sqlite3.

Tasks Table Schema:
- id: INTEGER PRIMARY KEY AUTOINCREMENT
- prompt: TEXT NOT NULL (the task prompt/description to be executed)
- status: INTEGER NOT NULL DEFAULT 0 (task status enum: 0=ready, 1=complete, 2=archived, 3=backlogged)
- createdat: DATETIME DEFAULT CURRENT_TIMESTAMP
- updatedat: DATETIME DEFAULT CURRENT_TIMESTAMP
- order: INTEGER DEFAULT 0 (lower numbers are processed first)
- uuid: TEXT (unique identifier, indexed)

Task Status Values:
- 0 = ready (ready to be processed by task operator)
- 1 = complete (task has been completed)
- 2 = archived (task has been archived)
- 3 = backlogged (task is in backlog, not ready for processing)

Task Management Examples:
- To create a ready task: INSERT INTO tasks (prompt, "order", status) VALUES ('your prompt here', 0, 0)
- To list ready tasks: SELECT * FROM tasks WHERE status = 0 ORDER BY "order" ASC, id ASC
- To mark a task as complete: UPDATE tasks SET status = 1, updatedat = CURRENT_TIMESTAMP WHERE id = ?
- To archive a task: UPDATE tasks SET status = 2, updatedat = CURRENT_TIMESTAMP WHERE id = ?
- To backlog a task: UPDATE tasks SET status = 3, updatedat = CURRENT_TIMESTAMP WHERE id = ?
- To get next ready task: SELECT * FROM tasks WHERE status = 0 ORDER BY "order" ASC, id ASC LIMIT 1

The task operator agent (when enabled) automatically processes tasks with status = 0 (ready), sending the prompt to cursor-runner for execution.

IMPORTANT: When working with cursor-agents (creating, listing, getting status, or deleting agents), use the Python scripts in /cursor/tools/cursor-agents/ directory. These scripts communicate with the cursor-agents service over HTTP:

Agent Management:
- To list all agents: python3 /cursor/tools/cursor-agents/list_agents.py
- To get agent status: python3 /cursor/tools/cursor-agents/get_agent_status.py --name <agent-name>
- To create an agent: python3 /cursor/tools/cursor-agents/create_agent.py --name <name> --target-url <url> [options]
  - Use --queue <queue-name> to assign the agent to a specific queue (defaults to "default" if not specified)
  - Use --schedule <cron-pattern> for recurring agents (e.g., "0 8 * * *" for daily at 8 AM)
  - Use --one-time for one-time agents that run immediately
- To delete an agent: python3 /cursor/tools/cursor-agents/delete_agent.py --name <agent-name>

Queue Management:
- To list all queues: python3 /cursor/tools/cursor-agents/list_queues.py
- To get queue info: python3 /cursor/tools/cursor-agents/get_queue_info.py --queue-name <queue-name>
- To delete an empty queue: python3 /cursor/tools/cursor-agents/delete_queue.py --queue-name <queue-name>
  - Note: Cannot delete the "default" queue or queues with active jobs

Task Operator Management:
- To enable the task operator: python3 /cursor/tools/cursor-agents/enable_task_operator.py [--queue <queue-name>]
  - The task operator automatically processes tasks from the tasks table in the database
  - It checks for incomplete tasks (lowest order first) and sends them to cursor-runner
  - Automatically re-enqueues itself every 5 seconds while enabled
- To disable the task operator: python3 /cursor/tools/cursor-agents/disable_task_operator.py
  - Sets the task_operator system setting to false, stopping re-enqueueing

When creating an agent, the target URL should be the cursor-runner docker networked URL (http://cursor-runner:3001/cursor/iterate/async) with a prompt that this agent will later execute.

Queue Organization: Agents can be organized into queues to avoid queue bloat. By default, agents are created in the "default" queue. Use descriptive queue names like "daily-tasks", "hourly-sync", or "urgent-jobs" to group related agents together.

IMPORTANT: When creating one-time scripts (shell scripts, Python scripts, etc.), place them in /cursor/scripts. This directory is shared and persistent across container restarts. Do not create scripts in the repository directories or other temporary locations.
