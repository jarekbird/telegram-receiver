# PHASE1-033: Integrate logger in application entry

**Section**: 8. Logging Infrastructure
**Subsection**: 8.4
**Task ID**: PHASE1-033

## Description

Integrate logger utility in the application entry point (`src/index.ts`) to replace console.log statements with proper logging using the logger utility wrapper created in PHASE1-032. This task ensures that server startup, environment information, and error handling use the configured logger instead of console methods, matching Rails logging patterns from jarek-va.

**Rails Logging Patterns to Replicate:**
- The jarek-va Rails application logs initialization and startup information through initializers (see `jarek-va/config/initializers/telegram.rb` lines 9, 11, 13 for example logging patterns)
- Rails automatically logs server startup information when the server starts (Puma logs include environment and port)
- Error logging includes full stack traces (see `jarek-va/app/controllers/application_controller.rb` lines 10-11)
- The Rails application uses `Rails.logger.info()` for informational messages and `Rails.logger.error()` for errors

**Purpose:**
- Replace console.log/console.error with proper logger methods for consistent logging
- Ensure server startup logging uses the configured logger (matching Rails logging patterns)
- Enable structured logging for server startup events (useful for log aggregation in production)
- Provide proper error logging with stack traces for startup failures (matching Rails error logging patterns)

## Checklist

- [ ] Open `src/index.ts` (created in PHASE1-028)
- [ ] Import logger utility from `@/utils/logger` (created in PHASE1-032)
- [ ] Replace `console.log()` calls with `logger.info()` for server startup messages
- [ ] Log server startup message with port and environment:
  - [ ] Use `logger.info()` to log message like "Server running in {env} mode on port {port}"
  - [ ] Include environment information (NODE_ENV) in the log message
  - [ ] Include port number in the log message
- [ ] Replace `console.error()` calls with `logger.error()` for startup error handling
- [ ] Add error logging for server startup failures:
  - [ ] Wrap server startup in try-catch or use error callback
  - [ ] Use `logger.error()` to log startup errors, passing the Error object directly (e.g., `logger.error('Server startup error:', error)`)
  - [ ] Ensure error logging includes stack traces (logger utility should handle this automatically for Error objects - it will detect Error objects and log both the error message and stack trace, matching Rails patterns)
- [ ] Verify all console.log/console.error statements are replaced with logger methods
- [ ] Ensure error logging matches Rails patterns (includes stack traces for Error objects)

## Notes

- This task is part of Phase 1: Basic Node.js API Infrastructure
- Section: 8. Logging Infrastructure
- Task can be completed independently by a single agent
- **Prerequisite**: PHASE1-032 must be completed first to create the logger utility wrapper
- **Prerequisite**: PHASE1-028 must be completed first to create the application entry point (`src/index.ts`)
- **Rails Reference**: The jarek-va Rails application logs initialization information:
  - `jarek-va/config/initializers/telegram.rb` (lines 9, 11, 13) - Example of Rails.logger.info() usage for initialization logging
  - `jarek-va/app/controllers/application_controller.rb` (lines 10-11) - Error logging with full backtraces
  - Rails automatically logs server startup (Puma logs include environment and port information)
- **Server Startup**: The `src/index.ts` file (created in PHASE1-028) should already have server startup code using `app.listen()`. This task replaces console.log/console.error with logger methods.
- **Error Handling**: When logging errors, pass the Error object directly to `logger.error()` (e.g., `logger.error('Server startup error:', error)`). The logger utility (from PHASE1-032) should automatically detect Error objects and include stack traces, matching Rails error logging patterns where errors are logged with both the error message and full backtrace.
- **Usage Pattern**: Replace console statements like:
  ```typescript
  // Before (from PHASE1-028):
  console.log(`Server running in ${config.env} mode on port ${config.port}`);
  console.error('Server startup error:', error);
  
  // After (this task):
  import logger from '@/utils/logger';
  logger.info(`Server running in ${config.env} mode on port ${config.port}`);
  logger.error('Server startup error:', error);
  ```

## Related Tasks

- Previous: PHASE1-032
- Next: PHASE1-034


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
