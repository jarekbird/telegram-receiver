# PHASE2-007: Install Redis client dependencies

**Section**: 2. Redis Integration
**Subsection**: 2.1
**Task ID**: PHASE2-007

## Description

Verify and ensure Redis client dependencies are properly installed for TypeScript/Node.js conversion. The Rails application uses Redis for:
1. **CursorRunnerCallbackService** (`app/services/cursor_runner_callback_service.rb`) - Stores callback state using direct Redis operations (`setex`, `get`, `del`)
2. **Sidekiq** (`config/initializers/sidekiq.rb`) - Background job processing (will be converted to BullMQ)

**Rails Implementation Reference:**
- Rails uses `redis` gem version `~> 5.0` (see `jarek-va/Gemfile`)
- Redis connection configured via `REDIS_URL` environment variable (default: `redis://localhost:6379/0`)
- In Docker: `REDIS_URL=redis://redis:6379/0` (shared Redis instance)

**Node.js Implementation:**
- Both `redis` (^4.6.10) and `ioredis` (^5.3.2) are already in `package.json`
- **bullmq** (^5.1.0) is also in `package.json` - this is the Sidekiq replacement for background jobs
- **ioredis** is the recommended choice for BullMQ integration (BullMQ requires ioredis for background jobs)
- **redis** or **ioredis** package can be used for direct Redis operations (matching CursorRunnerCallbackService pattern)
- Both packages have TypeScript type definitions (`@types/redis` and `@types/ioredis`)

## Checklist

- [ ] Verify `redis` package is installed (check `package.json` and `node_modules`)
- [ ] Verify `ioredis` package is installed (check `package.json` and `node_modules`)
- [ ] Verify `bullmq` package is installed (check `package.json` and `node_modules`) - required for Sidekiq replacement
- [ ] Verify `@types/redis` is installed in devDependencies
- [ ] Verify `@types/ioredis` is installed in devDependencies
- [ ] Run `npm install` to ensure all dependencies are properly installed
- [ ] Verify Redis connection configuration matches Rails pattern (REDIS_URL environment variable)
- [ ] Document which Redis client will be used for each component:
  - [ ] `ioredis` for BullMQ (background jobs - Sidekiq replacement)
  - [ ] `redis` or `ioredis` for CursorRunnerCallbackService (direct Redis operations)
- [ ] Test basic Redis connectivity (optional: create simple connection test)

## Notes

- This task is part of Phase 2: File-by-File Conversion
- Section: 2. Redis Integration
- **Current Status**: Redis dependencies (`redis`, `ioredis`, and `bullmq`) are already present in `package.json`
- This task focuses on verification and ensuring proper setup rather than initial installation
- Reference the Rails implementation in `jarek-va/app/services/cursor_runner_callback_service.rb` for Redis usage patterns
- Reference `jarek-va/config/initializers/sidekiq.rb` for Sidekiq/Redis configuration
- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE2-006
- Next: PHASE2-008

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
