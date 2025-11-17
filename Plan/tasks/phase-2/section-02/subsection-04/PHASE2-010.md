# PHASE2-010: Add Redis connection error handling

**Section**: 2. Redis Integration
**Subsection**: 2.4
**Task ID**: PHASE2-010

## Description

Add comprehensive Redis connection error handling, reconnection logic, and connection status monitoring to the Redis utility created in PHASE2-009. While the Rails implementation (`jarek-va/app/services/cursor_runner_callback_service.rb`) relies on the Ruby `redis` gem's automatic reconnection, Node.js/ioredis requires explicit error handling and event listeners for production-ready applications.

**Rails Implementation Reference:**
- `app/services/cursor_runner_callback_service.rb` - Creates Redis client with `Redis.new(url: redis_url)` but relies on gem's built-in reconnection
- The Ruby `redis` gem handles reconnection automatically without explicit error handling
- No explicit error event listeners or connection status monitoring in Rails code

**Node.js Implementation:**
- Enhance `src/utils/redis.ts` (created in PHASE2-009) with error handling
- Use ioredis event system (`error`, `connect`, `ready`, `close`, `reconnecting`, `end` events)
- Implement connection status tracking
- Add comprehensive logging for connection events
- Configure ioredis reconnection options (max retries, retry delay, etc.)
- Handle connection failures gracefully

## Checklist

- [ ] Update `src/utils/redis.ts` to add error handling:
  - [ ] Import logger utility (from `src/utils/logger.ts` or similar)
  - [ ] Add connection status tracking (enum: `connecting`, `connected`, `disconnected`, `reconnecting`, `error`)
  - [ ] Create `getConnectionStatus()` function to return current status
- [ ] Add ioredis event listeners:
  - [ ] `error` event listener - Log errors and update connection status
  - [ ] `connect` event listener - Log connection established, update status to `connected`
  - [ ] `ready` event listener - Log Redis ready, update status to `connected`
  - [ ] `close` event listener - Log connection closed, update status to `disconnected`
  - [ ] `reconnecting` event listener - Log reconnection attempts, update status to `reconnecting`
  - [ ] `end` event listener - Log connection ended, update status to `disconnected`
- [ ] Configure ioredis reconnection options:
  - [ ] Set `maxRetriesPerRequest` (recommended: `null` for pub/sub, `3` for commands)
  - [ ] Set `retryStrategy` function to control retry delays
  - [ ] Set `enableReadyCheck` to `true` (verify Redis is ready before accepting commands)
  - [ ] Set `enableOfflineQueue` to `true` (queue commands when offline)
- [ ] Add connection status monitoring:
  - [ ] Track connection state in private variable
  - [ ] Update state on each event
  - [ ] Export `getConnectionStatus()` function for external monitoring
- [ ] Add comprehensive logging:
  - [ ] Log all connection events with appropriate log levels (info for normal events, error for failures)
  - [ ] Include Redis URL (masked if contains credentials) in logs
  - [ ] Log reconnection attempts with attempt count
  - [ ] Log connection errors with error details
- [ ] Handle edge cases:
  - [ ] Prevent multiple event listener registrations (check if already registered)
  - [ ] Clean up event listeners if client is replaced (dependency injection scenario)
  - [ ] Handle errors during client initialization
- [ ] Update JSDoc comments:
  - [ ] Document event listeners and their behavior
  - [ ] Document connection status values
  - [ ] Document reconnection configuration
  - [ ] Add usage examples for monitoring connection status

## Notes

- This task is part of Phase 2: File-by-File Conversion
- Section: 2. Redis Integration
- **Rails Files to Reference:**
  - `jarek-va/app/services/cursor_runner_callback_service.rb` - Note that Rails relies on gem's automatic reconnection (lines 15-21)
- **Dependencies:**
  - Requires PHASE2-009 (Redis connection utility) to be completed first
  - Uses `ioredis` package (already in package.json dependencies)
- **Implementation Details:**
  - ioredis provides built-in reconnection, but explicit event handling improves observability
  - Connection status monitoring enables health checks and better error reporting
  - Event listeners should be registered when client is first created (in `getRedisClient()`)
  - Reconnection options should balance reliability with performance
  - Logging should use application logger (not console.log) for consistency
- **Key Differences from Rails:**
  - Rails: Ruby `redis` gem handles reconnection automatically, no explicit handling needed
  - Node.js: ioredis has reconnection but requires explicit event listeners for production monitoring
  - This task adds observability and control that Rails doesn't explicitly implement
- Task can be completed independently by a single agent (after PHASE2-009 is complete)

## Related Tasks

- Previous: PHASE2-009
- Next: PHASE2-011

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
