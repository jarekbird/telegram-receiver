# PHASE1-020: Create request logging middleware

**Section**: 6. Request/Response Middleware
**Subsection**: 6.4
**Task ID**: PHASE1-020

## Description

Create request logging middleware that logs incoming HTTP requests and their responses. This middleware should provide comprehensive request/response logging similar to Rails' built-in request logging with request_id tagging (see `jarek-va/config/environments/production.rb` line 43: `config.log_tags = [:request_id]`).

The middleware should log:
- Request method (GET, POST, etc.)
- Request URL/path
- Client IP address
- Request timestamp
- Unique request ID (for request tracing)
- Response status code
- Response time/duration

## Checklist

- [ ] Create `src/middleware/request-logger.middleware.ts` file
- [ ] Create Express middleware function with signature `(req, res, next) => void`
- [ ] Generate or extract unique request ID (use `req.id` if available from request-id middleware, or generate UUID)
- [ ] Store request start time using `Date.now()` or `process.hrtime()`
- [ ] Log incoming request with: method, URL, IP address, request ID, and timestamp
- [ ] Attach request ID to `req` object for use in other middleware/handlers
- [ ] Use `res.on('finish', ...)` to log response when request completes
- [ ] Log response with: status code, response time/duration, and request ID
- [ ] Use application logger (if available) or `console.log` with structured format (for now, use `console.log` since logger infrastructure may not exist yet)
- [ ] Handle errors appropriately and ensure `next()` is always called (wrap in try-catch if needed)
- [ ] Export middleware function
- [ ] Import and apply in `src/app.ts` (middleware order: JSON parser → URL-encoded parser → CORS → Request logger → Routes)

## Notes

- This task is part of Phase 1: Basic Node.js API Infrastructure
- Section: 6. Request/Response Middleware
- Task can be completed independently by a single agent
- **Rails Reference**: The jarek-va Rails application uses `config.log_tags = [:request_id]` in production (see `jarek-va/config/environments/production.rb` line 43), which prepends request_id to all log lines automatically. Rails generates a unique request ID for each request and tags all log entries with it. This Express middleware provides similar request tracing capability by logging request/response details with a unique request ID, enabling request correlation in logs. Note: Rails tags ALL log lines with request_id, while this middleware logs request/response events - both approaches enable request tracing.
- **Logging Format**: Consider logging in a structured format (JSON) for easier parsing and analysis. Example format: `{ "timestamp": "...", "requestId": "...", "method": "GET", "url": "/health", "ip": "127.0.0.1", "statusCode": 200, "duration": 15 }`
- **Request ID**: If a request-id middleware is already in place, use `req.id`. Otherwise, generate a UUID using `crypto.randomUUID()` (Node.js 14.17.0+) or the `uuid` package. Attach the request ID to `req.requestId` or `req.id` for use in other middleware/handlers.
- **Response Time**: Calculate duration as the difference between request start time and response finish time. Express `res.on('finish')` event fires when the response has been sent. Use `process.hrtime()` or `Date.now()` for timing (hrtime provides higher precision).
- **IP Address**: Extract client IP from `req.ip` (if Express trust proxy is configured via `app.set('trust proxy', true)`) or `req.connection.remoteAddress`. Consider `req.headers['x-forwarded-for']` for proxied requests (may contain comma-separated list of IPs).
- **Logger**: Since logger infrastructure may not exist yet (logger setup is in Phase 3), use `console.log` with structured JSON format for now. The middleware can be updated later to use a proper logger when available.
- **Middleware Ordering**: Request logger should be placed after CORS middleware (PHASE1-019) but before route handlers. This ensures all requests are logged, including those that fail CORS checks. Typical order: JSON parser → URL-encoded parser → CORS → **Request logger** → Routes → Error handlers.

## Related Tasks

- Previous: PHASE1-019
- Next: PHASE1-021


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
