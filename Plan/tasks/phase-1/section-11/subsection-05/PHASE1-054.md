# PHASE1-054: Configure CI job - Testing

**Section**: 11. CI/CD Pipeline Configuration
**Subsection**: 11.5
**Task ID**: PHASE1-054

## Description

Configure CI job for automated testing in GitHub Actions. This task converts the testing workflow from jarek-va (`.github/workflows/test.yml`) to a Node.js/TypeScript equivalent for telegram-receiver.

The workflow should run on push and pull requests to main/master branches, and support manual triggering. It should include code quality checks (linting, formatting, type checking) and comprehensive test execution (unit, integration) with coverage reporting.

**Reference Implementation**: `jarek-va/.github/workflows/test.yml`

## Checklist

### Workflow Setup
- [ ] Create `.github/workflows/test.yml` file
- [ ] Configure workflow triggers (push, pull_request, workflow_dispatch)
- [ ] Set up job to run on ubuntu-latest

### Environment Setup
- [ ] Add step to checkout code (with full history for diff comparison)
- [ ] Add step to set up Node.js (version >=18.0.0 as per package.json engines)
- [ ] Add step to install dependencies (`npm ci` for reproducible builds)
- [ ] Configure caching for node_modules (optional optimization)

### Code Quality Checks
- [ ] Add step to run ESLint with changed file detection (lint only changed source files when files changed, exclude test files)
- [ ] If changed files detected: run ESLint on changed source files only (filter out tests/**/*.ts)
- [ ] If no changed files: run ESLint on all files (`npm run lint`)
- [ ] Add step to check code formatting (`npm run format:check`)
- [ ] Add step to run TypeScript type checking (`npm run type-check`)

### Changed File Detection (Core Feature)
- [ ] Add step to detect changed TypeScript/JavaScript files (.ts, .js) for PRs and pushes
- [ ] For PRs: compare against base branch (`github.event.pull_request.base.sha`)
- [ ] For pushes: compare against previous commit (`HEAD~1`)
- [ ] Filter changed files to source files (src/**/*.ts) and test files (tests/**/*.ts)
- [ ] Output changed files for use in subsequent steps

### Testing
- [ ] Add step to run tests with changed file detection (run only affected tests when files changed)
- [ ] Map changed source files to related test files:
  - `src/services/telegramService.ts` → `tests/unit/services/telegramService.test.ts` or `tests/integration/services/telegramService.test.ts`
  - `src/controllers/telegramController.ts` → `tests/unit/controllers/telegramController.test.ts` or `tests/integration/controllers/telegramController.test.ts`
- [ ] If changed files detected: run tests for changed test files + tests related to changed source files
- [ ] If no changed files: run all tests (`npm run test`)
- [ ] Add step to run unit tests (`npm run test:unit` or via Jest test patterns)
- [ ] Add step to run integration tests (`npm run test:integration` or via Jest test patterns)
- [ ] Configure test environment variables (NODE_ENV=test, REDIS_URL if needed for integration tests)
- [ ] Add step to generate coverage report (`npm run test:coverage`)
- [ ] Consider adding Redis service container if integration tests require real Redis connection

### Coverage Reporting
- [ ] Configure coverage report generation (already configured in jest.config.ts)
- [ ] Add step to upload coverage report (optional: to codecov, coveralls, or GitHub Actions artifacts)
- [ ] Ensure coverage reports are generated in formats: text, lcov, html (as per jest.config.ts)

### Optional Enhancements
- [ ] Add test result summary/annotation in GitHub Actions
- [ ] Configure test timeout handling (Jest default is 5000ms, can be increased if needed)
- [ ] Add step to fail workflow if coverage drops below threshold (optional)

## Notes

- This task is part of Phase 1: Basic Node.js API Infrastructure
- Section: 11. CI/CD Pipeline Configuration
- Task can be completed independently by a single agent

### Implementation Guidance

**Rails Reference**: The jarek-va application has a comprehensive test workflow at `.github/workflows/test.yml` that includes:
- **Changed file detection** (core feature, not optional) - detects changed `.rb` and `.rake` files
- **Smart linting** - RuboCop runs only on changed source files (excludes spec files)
- **Smart test execution** - RSpec runs only tests related to changed files:
  - Changed spec files are run directly
  - Changed source files trigger their corresponding spec files (e.g., `app/services/telegram_service.rb` → `spec/services/telegram_service_spec.rb`)
- Database setup for tests

**Node.js/TypeScript Adaptation**:
- Use `actions/setup-node@v4` for Node.js setup
- Use `npm ci` instead of `npm install` for reproducible builds in CI
- Jest is already configured in `jest.config.ts` with coverage reporting
- ESLint, Prettier, and TypeScript are configured in `package.json`
- Test scripts are available: `test:unit`, `test:integration`, `test:coverage`
- Coverage is configured to generate text, lcov, and html reports
- **Changed file detection** must be adapted for TypeScript/JavaScript:
  - Detect `.ts` and `.js` files instead of `.rb` and `.rake`
  - Map source files to test files: `src/**/*.ts` → `tests/unit/**/*.test.ts` or `tests/integration/**/*.test.ts`
  - Test file naming: `telegramService.ts` → `telegramService.test.ts` (not `telegram_service_spec.rb`)
- **Smart linting**: Run ESLint only on changed source files (exclude `tests/**/*.ts`), similar to Rails RuboCop pattern

**Key Differences from Rails**:
- No database setup needed (telegram-receiver uses Redis, which can be mocked or use a service container)
- TypeScript type checking is additional step not present in Rails
- Prettier formatting check is additional step
- Jest handles both unit and integration tests (no separate test framework)
- File extensions: `.ts`, `.js` instead of `.rb`, `.rake`
- Test file patterns: `tests/unit/**/*.test.ts` and `tests/integration/**/*.test.ts` instead of `spec/**/*_spec.rb`
- Source file patterns: `src/**/*.ts` instead of `app/**/*.rb`
- Test file naming: `telegramService.test.ts` instead of `telegram_service_spec.rb`

**Workflow Structure**:
1. Checkout code (with full history for diff comparison)
2. Setup Node.js
3. Install dependencies
4. **Detect changed files** (TypeScript/JavaScript files)
5. Run linting (ESLint) - only on changed source files if changes detected
6. Check formatting (Prettier)
7. Type check (TypeScript)
8. Run tests with coverage - only affected tests if changes detected
9. Upload coverage (optional)

**Changed File Detection Logic** (adapted from Rails):
- For PRs: `git diff --name-only --diff-filter=ACMR $BASE_SHA..$HEAD_SHA | grep -E '\.(ts|js)$'`
- For pushes: `git diff --name-only --diff-filter=ACMR HEAD~1..HEAD | grep -E '\.(ts|js)$'`
- Filter source files: `grep -E '^src/.*\.(ts|js)$'`
- Filter test files: `grep -E '^tests/.*\.(ts|js)$'`
- Map source to tests: `src/services/telegramService.ts` → `tests/unit/services/telegramService.test.ts` or `tests/integration/services/telegramService.test.ts`

**Coverage Upload Options**:
- Use `codecov/codecov-action@v3` for Codecov integration
- Use `actions/upload-artifact` to store coverage reports as artifacts
- Or use `coverallsapp/github-action` for Coveralls integration

## Related Tasks

- Previous: PHASE1-053
- Next: PHASE1-055


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
