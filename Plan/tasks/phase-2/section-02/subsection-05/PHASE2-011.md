# PHASE2-011: Test Redis connection

**Section**: 2. Redis Integration
**Subsection**: 2.5
**Task ID**: PHASE2-011

## Description

Create a comprehensive test script to verify Redis connection functionality, matching the Redis operations used in the Rails application. While the Rails implementation (`jarek-va/app/services/cursor_runner_callback_service.rb`) doesn't have a dedicated connection test script, it uses Redis operations (`setex`, `get`, `del`) that should be tested to ensure the Node.js implementation works correctly.

**Rails Implementation Reference:**
- `app/services/cursor_runner_callback_service.rb` - Uses Redis operations:
  - `setex(key, ttl, value)` - Store data with expiration (line 30)
  - `get(key)` - Retrieve data (line 39)
  - `del(key)` - Delete data (line 55)
- Redis client initialized with `Redis.new(url: redis_url)` (line 20)
- Default URL: `redis://localhost:6379/0` or from `REDIS_URL` environment variable
- In Docker: `REDIS_URL=redis://redis:6379/0`

**Node.js Implementation:**
- Create a test script that uses the Redis utility from PHASE2-009 (`src/utils/redis.ts`)
- Test connection establishment using `getRedisClient()`
- Test all Redis operations used by CursorRunnerCallbackService:
  - `setex` (or `set` with `EX` option in ioredis) - Store with TTL
  - `get` - Retrieve values
  - `del` - Delete keys
- Test error handling scenarios (connection failures, invalid operations)
- Test connection status monitoring (from PHASE2-010)
- Use Jest testing framework (already configured in project)

## Checklist

- [ ] Create test file `tests/integration/services/redis.test.ts` (or similar location following project structure)
- [ ] Import `getRedisClient` from `src/utils/redis.ts` (PHASE2-009)
- [ ] Import `getConnectionStatus` if available from `src/utils/redis.ts` (PHASE2-010)
- [ ] Test connection establishment:
  - [ ] Call `getRedisClient()` and verify it returns a Redis client instance
  - [ ] Verify singleton behavior (multiple calls return same instance)
  - [ ] Test `ping()` command to verify connection is active
- [ ] Test basic Redis operations matching CursorRunnerCallbackService:
  - [ ] Test `setex` or `set` with expiration (store key-value with TTL)
  - [ ] Test `get` to retrieve stored value
  - [ ] Test `del` to delete a key
  - [ ] Verify operations work with JSON data (matching callback service pattern)
- [ ] Test error handling:
  - [ ] Test connection failure scenario (invalid Redis URL)
  - [ ] Test operation on non-existent key (should return null/undefined)
  - [ ] Test operation with invalid data format
- [ ] Test connection status monitoring (if PHASE2-010 is complete):
  - [ ] Verify `getConnectionStatus()` returns correct status
  - [ ] Test status changes during connection lifecycle
- [ ] Add proper test cleanup:
  - [ ] Clean up test keys after each test
  - [ ] Close Redis connection after all tests complete
- [ ] Use Jest test structure:
  - [ ] `describe` blocks for organization
  - [ ] `beforeAll`/`afterAll` for setup/teardown
  - [ ] `beforeEach`/`afterEach` for test isolation
  - [ ] Proper assertions using Jest matchers
- [ ] Add test documentation:
  - [ ] JSDoc comments explaining test purpose
  - [ ] Comments for complex test scenarios
  - [ ] Reference to Rails implementation

## Notes

- This task is part of Phase 2: File-by-File Conversion
- Section: 2. Redis Integration
- **Rails Files to Reference:**
  - `jarek-va/app/services/cursor_runner_callback_service.rb` - Redis operations pattern (lines 29-30, 38-39, 54-55)
  - `jarek-va/spec/config/sidekiq_spec.rb` - Example of Redis configuration testing (lines 24-30)
- **Dependencies:**
  - Requires PHASE2-009 (Redis connection utility) to be completed first
  - PHASE2-010 (Redis error handling) should be completed for comprehensive testing
  - Uses Jest testing framework (already configured in `jest.config.ts`)
  - Uses `ioredis` package (already in package.json dependencies)
- **Implementation Details:**
  - Test file should be placed in `tests/integration/services/` directory (following project structure)
  - Use `getRedisClient()` from `src/utils/redis.ts` to get Redis instance
  - Test operations should match those used in CursorRunnerCallbackService: `setex`, `get`, `del`
  - ioredis uses `set(key, value, 'EX', ttl)` instead of `setex(key, ttl, value)` (different parameter order)
  - Test should verify JSON serialization/deserialization (callback service stores JSON)
  - Use unique test keys (e.g., `test:redis:connection:${Date.now()}`) to avoid conflicts
  - Clean up test data after each test to prevent test pollution
  - Test should handle both success and failure scenarios
  - Consider testing with both default Redis URL and custom URL from environment
- **Key Differences from Rails:**
  - Rails: No dedicated connection test script, relies on service tests
  - Node.js: Explicit connection test ensures Redis utility works before service implementation
  - ioredis API differs slightly from Ruby redis gem (parameter order, method names)
- **Test Environment:**
  - Tests should work with local Redis instance (`redis://localhost:6379/0`)
  - Tests should work with Docker Redis instance (`redis://redis:6379/0` via REDIS_URL)
  - Consider skipping tests if Redis is not available (graceful degradation)
- Task can be completed independently by a single agent (after PHASE2-009 is complete)

## Related Tasks

- Previous: PHASE2-010
- Next: PHASE2-012

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
