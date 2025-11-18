# PHASE1-021: Create error handling middleware

**Section**: 6. Request/Response Middleware
**Subsection**: 6.5
**Task ID**: PHASE1-021

## Description

Create error handling middleware that catches all unhandled errors and returns a standardized error response matching the Rails `ApplicationController` error handling pattern (see `jarek-va/app/controllers/application_controller.rb`).

The middleware should:
- Catch all errors thrown in route handlers and middleware
- Log error details (error name/class, message, and stack trace)
- Return a standardized JSON error response matching the Rails format
- Set appropriate HTTP status code (500 for internal server errors)

## Checklist

- [ ] Create `src/middleware/error-handler.middleware.ts` file
- [ ] Create error handler function with 4 parameters `(err: Error, req: Request, res: Response, next: NextFunction)`
- [ ] Log error details using `console.error()`:
  - Log error name/class: `err.constructor.name` or `err.name`
  - Log error message: `err.message`
  - Log stack trace: `err.stack`
- [ ] Return JSON error response matching Rails format:
  ```json
  {
    "ok": false,
    "say": "Sorry, I encountered an error processing your request.",
    "result": {
      "error": "<error message>"
    }
  }
  ```
- [ ] Set HTTP status code to 500 (internal server error)
- [ ] Handle case where response has already been sent (check `res.headersSent`)
- [ ] Export error handler function
- [ ] Import and apply in `src/app.ts` (after all routes, as the last middleware)

## Notes

- This task is part of Phase 1: Basic Node.js API Infrastructure
- Section: 6. Request/Response Middleware
- Task can be completed independently by a single agent
- **Rails Reference**: The jarek-va Rails application uses `rescue_from StandardError` in `ApplicationController` (see `jarek-va/app/controllers/application_controller.rb`) which:
  - Logs error class, message, and backtrace
  - Returns JSON: `{ ok: false, say: '...', result: { error: ... } }`
  - Sets status to `:internal_server_error` (500)
- **Logging**: Use `console.error()` for now. Logger integration will be added in PHASE1-035
- **Error Response Format**: Must match the Rails format exactly to maintain API consistency:
  - `ok: false` - indicates request failure
  - `say: "Sorry, I encountered an error processing your request."` - user-friendly message
  - `result: { error: "<error message>" }` - error details
- **Express Error Handler**: Express error handling middleware must have exactly 4 parameters `(err, req, res, next)` to be recognized as an error handler. It should be registered after all routes and other middleware.
- **Response Already Sent**: Check `res.headersSent` before attempting to send a response to avoid "Cannot set headers after they are sent" errors

## Related Tasks

- Previous: PHASE1-020
- Next: PHASE1-022


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
