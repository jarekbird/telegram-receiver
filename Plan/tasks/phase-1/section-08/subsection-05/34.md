# PHASE1-034: Integrate logger in middleware

**Section**: 8. Logging Infrastructure
**Subsection**: 8.5
**Task ID**: PHASE1-034

## Description

Integrate logger utility in the request logging middleware (`src/middleware/request-logger.middleware.ts`) to replace console.log statements with proper logging using the logger utility wrapper created in PHASE1-032. This task ensures that request/response logging uses the configured logger instead of console methods, matching Rails logging patterns from jarek-va with request_id tagging.

**Rails Logging Patterns to Replicate:**
- The jarek-va Rails application uses `config.log_tags = [:request_id]` in production (see `jarek-va/config/environments/production.rb` line 43), which prepends request_id to all log lines
- Rails' built-in request logging middleware (`ActionDispatch::RequestId` and `Rack::Logger`) automatically logs incoming requests with method, path, IP, and request_id
- Request logging uses `Rails.logger.info()` for normal request/response logging
- The request_id is included in all log entries for request tracing (see `jarek-va/config/environments/production.rb` line 69: `ActiveSupport::TaggedLogging` wrapper)
- Rails automatically generates a unique request ID for each request and includes it in all log entries via the `TaggedLogging` wrapper

**Purpose:**
- Replace console.log with proper logger methods for consistent logging across the application
- Ensure request/response logging uses the configured logger (matching Rails logging patterns with request_id tagging)
- Enable structured logging for request/response events (useful for log aggregation in production)
- Maintain request_id context in logs for request tracing (matching Rails `config.log_tags = [:request_id]` behavior)

## Checklist

- [ ] Open `src/middleware/request-logger.middleware.ts` (created in PHASE1-020)
- [ ] Import logger utility from `@/utils/logger` (created in PHASE1-032)
- [ ] Replace `console.log()` calls with `logger.info()` for request logging:
  - [ ] Replace request logging (method, URL, IP, request ID, timestamp) with `logger.info()`
  - [ ] Replace response logging (status code, duration, request ID) with `logger.info()`
- [ ] Ensure request_id is included in log messages (for request tracing, matching Rails `config.log_tags = [:request_id]` behavior)
- [ ] Use structured logging format that includes request_id (matching Rails TaggedLogging behavior)
- [ ] Verify all console.log statements are replaced with logger methods
- [ ] Ensure logging format is consistent with the logger configuration (from PHASE1-031)

## Notes

- This task is part of Phase 1: Basic Node.js API Infrastructure
- Section: 8. Logging Infrastructure
- Task can be completed independently by a single agent
- **Prerequisite**: PHASE1-032 must be completed first to create the logger utility wrapper
- **Prerequisite**: PHASE1-020 must be completed first to create the request logging middleware (`src/middleware/request-logger.middleware.ts`)
- **Rails Reference**: The jarek-va Rails application uses request_id tagging for request tracing:
  - `jarek-va/config/environments/production.rb` (line 43) - Request ID tagging via `config.log_tags = [:request_id]`
  - `jarek-va/config/environments/production.rb` (line 69) - `ActiveSupport::TaggedLogging` wrapper that prepends request_id to all log lines
  - Rails automatically logs requests with request_id included in log output
- **Request Logging**: The `src/middleware/request-logger.middleware.ts` file (created in PHASE1-020) should already have request/response logging code using `console.log()`. This task replaces those console statements with logger methods.
- **Request ID Context**: The middleware should log request_id in all log messages to enable request tracing, matching Rails' `config.log_tags = [:request_id]` behavior. The logger utility (from PHASE1-032) should support request_id context if needed.
- **Usage Pattern**: Replace console statements like:
  ```typescript
  // Before (from PHASE1-020):
  console.log(`[${requestId}] ${method} ${url} - ${ip}`);
  console.log(`[${requestId}] ${statusCode} ${duration}ms`);
  
  // After (this task):
  import logger from '@/utils/logger';
  logger.info(`[${requestId}] ${method} ${url} - ${ip}`);
  logger.info(`[${requestId}] ${statusCode} ${duration}ms`);
  ```
- **Structured Logging**: Consider logging in a structured format (JSON) that includes request_id, matching Rails TaggedLogging behavior where request_id is prepended to all log lines.

## Related Tasks

- Previous: PHASE1-033
- Next: PHASE1-035


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
