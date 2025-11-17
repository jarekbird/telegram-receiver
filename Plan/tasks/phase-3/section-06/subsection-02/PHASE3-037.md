# PHASE3-037: Review input validation

**Section**: 6. Security Review
**Subsection**: 6.2
**Task ID**: PHASE3-037

## Description

Review and improve input validation in the codebase to ensure best practices. This task focuses on validating that all API endpoints properly validate, sanitize, and type-check incoming request data to prevent security vulnerabilities and ensure data integrity.

## Rails Implementation Reference

The Rails application uses `params.permit()` for strong parameters and manual validation:

1. **TelegramController** (`app/controllers/telegram_controller.rb`):
   - `webhook`: Receives JSON Telegram updates (no explicit permit, relies on JSON parsing)
   - `set_webhook`: Receives `url` and `secret_token` params (no explicit permit)
   - `webhook_info`: No params
   - `delete_webhook`: No params

2. **CursorRunnerCallbackController** (`app/controllers/cursor_runner_callback_controller.rb`):
   - `create`: Uses `params.permit()` with specific allowed fields:
     - `success`, `requestId`, `request_id`, `repository`, `branchName`, `branch_name`
     - `iterations`, `maxIterations`, `max_iterations`, `output`, `error`
     - `exitCode`, `exit_code`, `duration`, `timestamp`
   - Validates `request_id` is present (returns 400 if blank)
   - Normalizes camelCase/snake_case field names
   - Handles boolean conversion for `success` field

3. **AgentToolsController** (`app/controllers/agent_tools_controller.rb`):
   - Receives tool requests (validation patterns to be reviewed)

## Checklist

### Request Body Validation

- [ ] Review Telegram webhook endpoint (`POST /telegram/webhook`)
  - [ ] Validate request body is valid JSON
  - [ ] Validate Content-Type header is `application/json` (or handle gracefully)
  - [ ] Validate Telegram update structure (message, edited_message, callback_query)
  - [ ] Check for required fields in update structure
  - [ ] Validate request body size limits (prevent DoS via large payloads)
  - [ ] Verify update data is sanitized before processing

- [ ] Review cursor-runner callback endpoint (`POST /cursor-runner/callback`)
  - [ ] Validate request body is valid JSON
  - [ ] Validate `request_id` is present and not blank (return 400 if missing)
  - [ ] Validate allowed fields only (equivalent to Rails `params.permit()`)
  - [ ] Validate field types (success: boolean, iterations: integer, etc.)
  - [ ] Validate string length limits for `output` and `error` fields
  - [ ] Handle both camelCase and snake_case field names (normalize)
  - [ ] Validate boolean conversion for `success` field (handle string "true"/"false")
  - [ ] Validate numeric fields (iterations, max_iterations, exit_code) are valid numbers
  - [ ] Check for request body size limits

- [ ] Review admin endpoints (`POST /telegram/set_webhook`, `GET /telegram/webhook_info`, `DELETE /telegram/webhook`)
  - [ ] Validate `url` parameter format (if provided in set_webhook)
  - [ ] Validate `secret_token` parameter (if provided in set_webhook)
  - [ ] Validate URL is valid format (not malicious)
  - [ ] Check for parameter injection vulnerabilities

- [ ] Review agent tools endpoint (`POST /agent-tools`)
  - [ ] Validate request body structure
  - [ ] Validate required fields
  - [ ] Check for allowed fields only

### Input Sanitization

- [ ] Review all string inputs for sanitization
  - [ ] Sanitize `output` and `error` fields from cursor-runner callbacks
  - [ ] Remove ANSI escape sequences from output (as done in Rails)
  - [ ] Sanitize Telegram message text before processing
  - [ ] Validate and sanitize URLs in admin endpoints
  - [ ] Check for XSS vulnerabilities in user-controlled data

- [ ] Review file path handling
  - [ ] Validate file paths don't contain directory traversal (`../`)
  - [ ] Validate file paths are within allowed directories
  - [ ] Check for path injection vulnerabilities

### Type Validation

- [ ] Review type checking for all endpoints
  - [ ] Validate numeric fields are numbers (not strings)
  - [ ] Validate boolean fields are booleans (handle string conversions)
  - [ ] Validate string fields are strings
  - [ ] Validate array/object structures match expected types
  - [ ] Use TypeScript types for compile-time validation
  - [ ] Add runtime type validation where needed (using validation library like Zod or Joi)

### Injection Vulnerabilities

- [ ] Check for SQL injection risks
  - [ ] Review any database queries (if applicable)
  - [ ] Verify parameterized queries are used
  - [ ] Check Redis key construction for injection risks

- [ ] Check for command injection risks
  - [ ] Review any shell command execution
  - [ ] Validate inputs before passing to shell commands
  - [ ] Use safe command execution methods

- [ ] Check for NoSQL injection risks
  - [ ] Review Redis operations for injection risks
  - [ ] Validate Redis key names

- [ ] Check for template injection risks
  - [ ] Review any template rendering (if applicable)
  - [ ] Validate template variables

### File Upload Validation (if applicable)

- [ ] Review file download/upload handling
  - [ ] Validate file types (if file uploads are added)
  - [ ] Validate file sizes
  - [ ] Validate file names
  - [ ] Check for malicious file content
  - [ ] Note: Current implementation downloads files from Telegram, doesn't accept uploads

### Request Size Limits

- [ ] Review Express body parser limits
  - [ ] Verify `express.json()` has appropriate `limit` option
  - [ ] Verify `express.urlencoded()` has appropriate `limit` option
  - [ ] Set reasonable limits to prevent DoS attacks
  - [ ] Document size limits in configuration

### Validation Gaps

- [ ] Identify endpoints missing validation
- [ ] Identify fields missing type checking
- [ ] Identify missing sanitization steps
- [ ] Check for validation inconsistencies across endpoints
- [ ] Review error handling for validation failures

### Validation Strategy Documentation

- [ ] Document validation approach (validation library choice, if any)
- [ ] Document validation patterns used across endpoints
- [ ] Document field normalization strategies (camelCase/snake_case handling)
- [ ] Document error response format for validation failures
- [ ] Document request size limits
- [ ] Create or update validation guidelines
- [ ] Document any validation middleware patterns

### Implementation Recommendations

- [ ] Consider using validation library (Zod, Joi, or express-validator)
- [ ] Create reusable validation schemas/functions in `src/validators/` directory
- [ ] Implement validation middleware for common patterns
- [ ] Add TypeScript types for all request/response structures
- [ ] Ensure validation errors return appropriate HTTP status codes (400 Bad Request)

## Notes

- This task is part of Phase 3: Holistic Review and Best Practices
- Section: 6. Security Review
- Focus on identifying issues and improvements
- Document findings and decisions

- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE3-036
- Next: PHASE3-038

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
