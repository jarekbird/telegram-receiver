# PHASE2-044: Write CursorRunnerCallbackService unit tests

**Section**: 6. CursorRunnerCallbackService Conversion
**Subsection**: 6.6
**Task ID**: PHASE2-044

## Description

Write comprehensive unit tests for the CursorRunnerCallbackService class in TypeScript/Node.js. The tests should cover all public methods, error handling, TTL management, and Redis operations. Reference the Rails implementation at `jarek-va/app/services/cursor_runner_callback_service.rb` and the TypeScript implementation created in PHASE2-039 through PHASE2-043.

## Checklist

- [ ] Create `tests/unit/services/cursor-runner-callback-service.test.ts` file
- [ ] Import necessary testing utilities and mocks
  - Import `mockRedisClient` and `resetRedisMocks` from `tests/mocks/redis.ts`
  - Import Jest testing utilities (`describe`, `it`, `expect`, `beforeEach`, `afterEach`)
  - Import the `CursorRunnerCallbackService` class from `src/services/cursor-runner-callback-service.ts`
- [ ] Set up test suite structure
  - Use `describe` blocks to organize tests by method
  - Add `beforeEach` to reset Redis mocks before each test
  - Add `afterEach` to clean up after each test
- [ ] Test constructor initialization
  - Test constructor with provided `redisClient` parameter (should use provided client)
  - Test constructor with provided `redisUrl` parameter (should create new Redis client from URL)
  - Test constructor with neither parameter (should use `REDIS_URL` env var or default)
  - Test that Redis client is stored as private property
- [ ] Test `storePendingRequest` method
  - Test storing request with default TTL (should use `DEFAULT_TTL` constant = 3600)
  - Test storing request with custom TTL (should use provided TTL value)
  - Test that Redis key is generated correctly with `REDIS_KEY_PREFIX` prefix
  - Test that data is serialized to JSON before storing
  - Test that `redis.setex()` is called with correct parameters (key, ttl, jsonString)
  - Test that info log is written with request ID and TTL
  - Test Redis connection error handling (should throw or handle gracefully)
  - Test Redis operation error handling (should throw or handle gracefully)
  - Test TTL validation (if implemented in PHASE2-043: should validate TTL is positive integer, should validate TTL is within bounds)
- [ ] Test `getPendingRequest` method
  - Test retrieving existing request (should return parsed JSON object)
  - Test retrieving non-existent request (should return `null`)
  - Test that Redis key is generated correctly with `REDIS_KEY_PREFIX` prefix
  - Test that `redis.get()` is called with correct key
  - Test JSON parsing of valid JSON string (should return parsed object)
  - Test JSON parsing error handling (should catch `SyntaxError`, log error with request ID and error message, return `null`)
  - Test Redis connection error handling (should return `null` gracefully)
  - Test Redis operation error handling (should return `null` gracefully)
  - Test that error log includes request ID and error message when JSON parsing fails
- [ ] Test `removePendingRequest` method
  - Test removing existing request (should call `redis.del()` with correct key)
  - Test removing non-existent request (should still call `redis.del()`)
  - Test that Redis key is generated correctly with `REDIS_KEY_PREFIX` prefix
  - Test that info log is written with request ID
  - Test Redis connection error handling (should log error, may throw or handle gracefully)
  - Test Redis operation error handling (should log error, may throw or handle gracefully)
- [ ] Test Redis key generation (indirectly through method tests)
  - Verify that all methods use the correct Redis key format: `${REDIS_KEY_PREFIX}${requestId}`
  - Verify that `REDIS_KEY_PREFIX` constant is `'cursor_runner_callback:'`
- [ ] Test constants
  - Verify `REDIS_KEY_PREFIX` constant value is `'cursor_runner_callback:'`
  - Verify `DEFAULT_TTL` constant value is `3600` (1 hour in seconds)
- [ ] Test integration scenarios
  - Test complete flow: store → get → remove (should work end-to-end)
  - Test storing multiple requests with different IDs (should not interfere)
  - Test TTL expiration behavior (if testable with mocks)
- [ ] Achieve >80% code coverage
  - Run coverage report: `npm run test:coverage`
  - Verify all public methods are tested
  - Verify error paths are tested
  - Verify edge cases are tested

## Notes

- This task is part of Phase 2: File-by-File Conversion
- Section: 6. CursorRunnerCallbackService Conversion
- Subsection: 6.6
- Reference the Rails implementation at `jarek-va/app/services/cursor_runner_callback_service.rb` for complete behavior details
- Reference the TypeScript implementation created in PHASE2-039 through PHASE2-043

**Rails Implementation Analysis:**

The Rails service (`cursor_runner_callback_service.rb`) has:
- Constructor: `initialize(redis_client: nil, redis_url: nil)` - accepts optional Redis client or URL
- `store_pending_request(request_id, data, ttl: DEFAULT_TTL)` - stores JSON data in Redis with TTL
- `get_pending_request(request_id)` - retrieves and parses JSON data, handles JSON parsing errors
- `remove_pending_request(request_id)` - deletes key from Redis
- Private `redis_key(request_id)` helper - generates key with prefix
- Constants: `REDIS_KEY_PREFIX = 'cursor_runner_callback:'`, `DEFAULT_TTL = 3600`

**Test Requirements:**

1. **Mock Redis Client**: Use the existing `mockRedisClient` from `tests/mocks/redis.ts` which provides mocked methods: `get`, `set`, `del`, etc. Note: The mock may need `setex` method added if it's not already present (add `setex: jest.fn().mockResolvedValue('OK')` to the mock object).

2. **Test Structure**: Follow the project's test conventions:
   - Use `describe` blocks to group related tests
   - Use descriptive test names: `it('should return null when request does not exist', ...)`
   - Follow AAA pattern: Arrange, Act, Assert
   - Reset mocks in `beforeEach` to ensure test isolation

3. **Redis Method Mocking**: 
   - Mock `setex` for `storePendingRequest` tests (should be called with `key`, `ttl`, `jsonString`)
   - Mock `get` for `getPendingRequest` tests (should return `string | null`)
   - Mock `del` for `removePendingRequest` tests (should return number of keys deleted)

4. **Error Handling Tests**: Based on PHASE2-043, test:
   - Redis connection errors (network failures, connection refused)
   - Redis operation errors (write failures, command errors)
   - JSON parsing errors (`SyntaxError` for invalid JSON)
   - TTL validation errors (if TTL validation was added in PHASE2-043)

5. **Logging Tests**: Verify that appropriate log messages are written:
   - Info logs for successful operations (store, remove)
   - Error logs for failures (JSON parsing errors, Redis errors)

6. **File Path**: The test file should be created at `tests/unit/services/cursor-runner-callback-service.test.ts` (not `tests/services/`)

**Dependencies:**
- Assumes `CursorRunnerCallbackService` class exists (from PHASE2-039)
- Assumes all methods are implemented (from PHASE2-040, PHASE2-041, PHASE2-042)
- Assumes error handling is added (from PHASE2-043)
- Assumes Redis mock exists at `tests/mocks/redis.ts`

- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE2-043
- Next: PHASE2-045

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
