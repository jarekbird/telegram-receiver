# PHASE1-035: Integrate logger in error handler

**Section**: 8. Logging Infrastructure
**Subsection**: 8.6
**Task ID**: PHASE1-035

## Description

Integrate logger utility in the error handler middleware (`src/middleware/error-handler.middleware.ts`) to replace `console.error()` statements with proper logging using the logger utility wrapper created in PHASE1-032. This task ensures that error logging uses the configured logger instead of console methods, matching Rails error logging patterns from jarek-va's `ApplicationController`.

**Rails Error Logging Patterns to Replicate:**
- The jarek-va Rails application uses `Rails.logger.error()` for error logging in `ApplicationController` (see `jarek-va/app/controllers/application_controller.rb` lines 10-11)
- Errors are logged in two separate calls:
  1. Error class and message: `Rails.logger.error("#{exception.class}: #{exception.message}")`
  2. Stack trace: `Rails.logger.error(exception.backtrace.join("\n"))`
- This pattern ensures error class, message, and stack trace are all logged for debugging

**Purpose:**
- Replace `console.error()` with proper logger methods for consistent logging across the application
- Ensure error logging uses the configured logger (matching Rails error logging patterns)
- Enable structured logging for error events (useful for log aggregation in production)
- Match Rails error logging pattern where error class/message and stack trace are logged separately

## Checklist

- [ ] Open `src/middleware/error-handler.middleware.ts` (created in PHASE1-021)
- [ ] Import logger utility from `@/utils/logger` (created in PHASE1-032)
- [ ] Replace `console.error()` calls with `logger.error()` for error logging:
  - [ ] Replace error class and message logging with `logger.error()` (matching Rails pattern: `Rails.logger.error("#{exception.class}: #{exception.message}")`)
  - [ ] Replace stack trace logging with `logger.error()` (matching Rails pattern: `Rails.logger.error(exception.backtrace.join("\n"))`)
- [ ] Ensure error logging matches Rails pattern:
  - [ ] Log error class name: `err.constructor.name` (preferred, matches Rails `exception.class`) or `err.name` as fallback
  - [ ] Log error message: `err.message`
  - [ ] Log stack trace: `err.stack` (as separate log call, matching Rails pattern where `exception.backtrace.join("\n")` is logged separately)
- [ ] Verify all `console.error()` statements are replaced with logger methods
- [ ] Ensure logging format is consistent with the logger configuration (from PHASE1-031)

## Notes

- This task is part of Phase 1: Basic Node.js API Infrastructure
- Section: 8. Logging Infrastructure
- Task can be completed independently by a single agent
- **Prerequisite**: PHASE1-032 must be completed first to create the logger utility wrapper
- **Prerequisite**: PHASE1-021 must be completed first to create the error handler middleware (`src/middleware/error-handler.middleware.ts`)
- **Rails Reference**: The jarek-va Rails application uses `Rails.logger.error()` for error logging in `ApplicationController`:
  - `jarek-va/app/controllers/application_controller.rb` (lines 10-11) - Error logging with error class/message and separate stack trace logging
  - Errors are logged in two separate calls: first the error class and message, then the backtrace
- **Error Logging**: The `src/middleware/error-handler.middleware.ts` file (created in PHASE1-021) should already have error logging code using `console.error()`. This task replaces those console statements with logger methods.
- **Rails Logging Pattern**: Match the Rails pattern where error class/message and stack trace are logged separately:
  ```typescript
  // Before (from PHASE1-021):
  console.error(`Error: ${err.name}: ${err.message}`);
  console.error(err.stack);
  
  // After (this task):
  import logger from '@/utils/logger';
  // Match Rails pattern: Rails.logger.error("#{exception.class}: #{exception.message}")
  logger.error(`${err.constructor.name}: ${err.message}`);
  // Match Rails pattern: Rails.logger.error(exception.backtrace.join("\n"))
  logger.error(err.stack);
  ```
- **Error Object Handling**: The logger utility (from PHASE1-032) should handle Error objects and include stack traces automatically, but the error handler should still log them explicitly to match Rails pattern.

## Related Tasks

- Previous: PHASE1-034
- Next: PHASE1-036


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
