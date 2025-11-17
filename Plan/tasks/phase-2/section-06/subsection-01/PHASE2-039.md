# PHASE2-039: Create CursorRunnerCallbackService class structure

**Section**: 6. CursorRunnerCallbackService Conversion
**Subsection**: 6.1
**Task ID**: PHASE2-039

## Description

Create the CursorRunnerCallbackService class structure in TypeScript/Node.js. This service manages cursor-runner callback state by storing pending requests in Redis and handling webhook callbacks. It provides methods to store, retrieve, and remove pending request information with TTL support.

Reference the Rails implementation at `jarek-va/app/services/cursor_runner_callback_service.rb` for complete behavior details.

## Checklist

- [ ] Create `src/services/cursor-runner-callback-service.ts` file
- [ ] Define `CursorRunnerCallbackService` class
- [ ] Define `REDIS_KEY_PREFIX` constant with value `'cursor_runner_callback:'`
- [ ] Define `DEFAULT_TTL` constant with value `3600` (1 hour in seconds)
- [ ] Add constructor that accepts optional `redisClient` OR `redisUrl` parameter
  - If `redisClient` is provided, use it directly
  - If `redisUrl` is provided, create new Redis client from URL
  - If neither provided, use `REDIS_URL` environment variable (default: `'redis://localhost:6379/0'`)
  - Store Redis client instance as private property
- [ ] Add private `redisKey(requestId: string)` helper method that returns `${REDIS_KEY_PREFIX}${requestId}`
- [ ] Add public `storePendingRequest(requestId: string, data: object, ttl?: number)` method
  - Stores data as JSON in Redis with TTL (defaults to DEFAULT_TTL)
  - Uses `redis.setex()` with generated key
  - Logs info message about stored request
- [ ] Add public `getPendingRequest(requestId: string)` method
  - Retrieves data from Redis using generated key
  - Parses JSON and returns object with symbol keys (or null if not found)
  - Handles JSON parsing errors gracefully (catches, logs error, returns null)
- [ ] Add public `removePendingRequest(requestId: string)` method
  - Deletes key from Redis using generated key
  - Logs info message about removed request
- [ ] Add proper TypeScript type definitions for all parameters and return types
- [ ] Add error handling for JSON parsing errors
- [ ] Add logging (use appropriate Node.js logger - check project's logging setup)

## Notes

- This task is part of Phase 2: File-by-File Conversion
- Section: 6. CursorRunnerCallbackService Conversion
- Reference the Rails implementation at `jarek-va/app/services/cursor_runner_callback_service.rb` for complete behavior details

- **Redis Client**: The project uses both `redis` and `ioredis` packages. Check which one is used elsewhere in the project and use the same for consistency
- **Logging**: The Rails version uses `Rails.logger`. Check the project's logging setup (may use console.log, winston, pino, or another logger)
- **Error Handling**: The `getPendingRequest` method must handle JSON parsing errors gracefully - catch errors, log them, and return null
- **TypeScript Types**: Define proper interfaces/types for the data parameter (likely includes chat_id, message_id, etc. based on usage)
- **Environment Variables**: In Docker, REDIS_URL is set to `redis://redis:6379/0` (shared Redis instance). Local development falls back to `redis://localhost:6379/0`
- **Method Naming**: Convert Ruby snake_case method names to TypeScript camelCase (e.g., `store_pending_request` → `storePendingRequest`)

- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE2-038
- Next: PHASE2-040

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
