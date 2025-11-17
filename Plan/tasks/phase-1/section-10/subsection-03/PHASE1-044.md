# PHASE1-044: Create test setup file

**Section**: 10. Test Suite Setup
**Subsection**: 10.3
**Task ID**: PHASE1-044

## Description

Create and enhance the test setup file (`tests/setup.ts`) for the TypeScript/Node.js application. This file replaces the Rails test setup files (`spec/spec_helper.rb` and `spec/rails_helper.rb`) and provides global test configuration, setup hooks, and cleanup hooks that run before and after all tests.

The setup file should:
- Set the test environment variable
- Configure Jest timeout settings
- Provide global setup hooks (`beforeAll`) for initializing test infrastructure
- Provide global cleanup hooks (`afterAll`) for cleaning up after all tests complete
- Set up any global mocks or test utilities needed across all tests

**Rails Equivalent**: This task converts the functionality from `spec/spec_helper.rb` and `spec/rails_helper.rb` in the jarek-va Rails application. The Rails helpers:
- Set `ENV['RAILS_ENV'] = 'test'` (in `rails_helper.rb`)
- Load the Rails environment and RSpec Rails
- Include FactoryBot methods for test data creation
- Load support files (including `spec/support/sidekiq.rb` which clears ActiveJob queues before each test)
- Configure transactional fixtures for database tests
- Check for pending migrations before running tests

Note: `spec_helper.rb` contains basic RSpec configuration (expectations, mocks) but does not set the test environment variable. The environment variable is set in `rails_helper.rb`, which also requires `spec_helper.rb`.

## Checklist

- [ ] Open `tests/setup.ts` file (file already exists, needs enhancement)
- [ ] Ensure `process.env.NODE_ENV` is set to 'test' (already present, verify)
- [ ] Ensure `jest.setTimeout(10000)` is configured (already present, verify)
- [ ] Add `beforeAll` hook for global test setup
  - [ ] Clear/reset any global mocks (Redis, Telegram API, Cursor Runner API)
  - [ ] Set up test environment variables if needed
  - [ ] Initialize any test infrastructure (e.g., test database connections, Redis connections)
- [ ] Add `afterAll` hook for global test cleanup
  - [ ] Clean up any resources created during tests
  - [ ] Close connections (database, Redis, etc.)
  - [ ] Verify no test leaks or hanging promises
- [ ] Add `beforeEach` hook for per-test setup (optional, but recommended)
  - [ ] Clear mocks before each test to ensure test isolation
  - [ ] Reset Redis mocks using `resetRedisMocks()` from `tests/mocks/redis.ts`
  - [ ] Reset Telegram API mocks using `resetTelegramApiMocks()` from `tests/mocks/telegramApi.ts`
  - [ ] Reset Cursor Runner API mocks using `resetCursorRunnerApiMocks()` from `tests/mocks/cursorRunnerApi.ts`
- [ ] Add `afterEach` hook for per-test cleanup (optional, but recommended)
  - [ ] Clear any test-specific state
  - [ ] Ensure no async operations are left hanging
- [ ] Add JSDoc comments explaining the purpose of each hook
- [ ] Export any test utilities if needed (or reference existing utilities in `tests/helpers/testUtils.ts`)

## Notes

- This task is part of Phase 1: Basic Node.js API Infrastructure
- Section: 10. Test Suite Setup
- Task can be completed independently by a single agent
- The `tests/setup.ts` file already exists with basic configuration and needs to be enhanced with setup/cleanup hooks
- This file is automatically loaded by Jest via `setupFilesAfterEnv` configuration in `jest.config.ts` (configured in PHASE1-043)
- The setup file runs before each test file, similar to how `rails_helper.rb` runs before each RSpec test file
- Unlike Rails which uses `before` blocks in `spec/support/sidekiq.rb` to clear queues, Jest uses `beforeEach` hooks for per-test setup
- Mock reset functions are available in `tests/mocks/redis.ts`, `tests/mocks/telegramApi.ts`, and `tests/mocks/cursorRunnerApi.ts` and should be used in `beforeEach` hooks
- Test utilities are available in `tests/helpers/testUtils.ts` and don't need to be re-exported from setup.ts

## Related Tasks

- Previous: PHASE1-043
- Next: PHASE1-045


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
