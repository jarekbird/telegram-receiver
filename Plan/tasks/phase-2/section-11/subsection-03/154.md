# PHASE2-091: Create telegram routes

**Section**: 11. Routes Configuration
**Subsection**: 11.3
**Task ID**: PHASE2-091

## Description

Convert telegram routes from Rails to TypeScript/Node.js. Reference `jarek-va/config/routes.rb` and `jarek-va/app/controllers/telegram_controller.rb`.

This task creates the Express route definitions for Telegram webhook endpoints. The routes should be scoped under `/telegram` path and include appropriate authentication middleware.

## Checklist

- [ ] Create `src/routes/telegram-routes.ts`
- [ ] Define POST /telegram/webhook route
  - Apply webhook authentication middleware (checks X-Telegram-Bot-Api-Secret-Token header)
  - Route should delegate to telegram controller webhook handler
- [ ] Define POST /telegram/set_webhook route
  - Apply admin authentication middleware (checks X-Admin-Secret header, HTTP_X_ADMIN_SECRET env var, admin_secret query/body params)
  - Route should delegate to telegram controller set_webhook handler
  - Handler accepts optional `url` and `secret_token` parameters (uses defaults if not provided)
- [ ] Define GET /telegram/webhook_info route
  - Apply admin authentication middleware (checks X-Admin-Secret header, HTTP_X_ADMIN_SECRET env var, admin_secret query/body params)
  - Route should delegate to telegram controller webhook_info handler
- [ ] Define DELETE /telegram/webhook route
  - Apply admin authentication middleware (checks X-Admin-Secret header, HTTP_X_ADMIN_SECRET env var, admin_secret query/body params)
  - Route should delegate to telegram controller delete_webhook handler
- [ ] Export router for use in main application

## Authentication Requirements

Based on `jarek-va/app/controllers/telegram_controller.rb`:

1. **Webhook Authentication** (for POST /telegram/webhook):
   - Checks `X-Telegram-Bot-Api-Secret-Token` header
   - Compares against `telegram_webhook_secret` configuration value
   - **Important**: If `telegram_webhook_secret` is blank/empty, authentication is bypassed and request is allowed
   - Returns 401 Unauthorized only if secret token doesn't match AND expected secret is not blank
   - Logs warning on unauthorized requests

2. **Admin Authentication** (for set_webhook, webhook_info, delete_webhook):
   - Checks in order: `X-Admin-Secret` header, `HTTP_X_ADMIN_SECRET` environment variable, `admin_secret` query parameter, `admin_secret` body parameter
   - Compares against `webhook_secret` configuration value
   - Returns 401 Unauthorized if secret doesn't match
   - Note: In test environment, logs authentication failures for debugging

## Implementation Notes

- Routes are scoped under `/telegram` path prefix (as defined in Rails routes.rb)
- Reference `jarek-va/app/controllers/telegram_controller.rb` for controller implementation details
- The webhook endpoint should return 200 OK immediately and process updates asynchronously
- Admin endpoints should return JSON responses with `ok` field and appropriate data/error fields
- Error handling should follow the pattern in ApplicationController:
  - Success responses: `{ ok: true, ... }` with appropriate data fields
  - Error responses: `{ ok: false, say: 'Sorry, I encountered an error processing your request.', result: { error: errorMessage } }` with 500 status
  - Admin endpoints (set_webhook, webhook_info, delete_webhook) use simpler format: `{ ok: false, error: errorMessage }` with 500 status
  - Webhook endpoint always returns 200 OK even on errors (to prevent Telegram retries), but may attempt to send error message to chat if chat info is available

## Notes

- This task is part of Phase 2: File-by-File Conversion
- Section: 11. Routes Configuration
- Reference the Rails implementation for behavior
- Controller implementation will be handled in a separate task
- Authentication middleware should be created/referenced as needed

- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE2-090
- Next: PHASE2-092

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
