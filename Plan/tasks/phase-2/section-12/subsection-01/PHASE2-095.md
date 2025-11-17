# PHASE2-095: Create authentication middleware directory

**Section**: 12. Middleware
**Subsection**: 12.1
**Task ID**: PHASE2-095

## Description

Set up the authentication middleware directory structure and plan the middleware files that will be created to convert Rails `before_action` authentication filters to Express middleware. This task establishes the foundation for converting authentication logic from Rails controllers to reusable Express middleware functions.

## Rails Implementation Reference

The Rails application uses `before_action` filters in controllers for authentication:

1. **TelegramController** (`app/controllers/telegram_controller.rb`):
   - `authenticate_webhook` (private method) - Authenticates Telegram webhook requests
     - Checks `X-Telegram-Bot-Api-Secret-Token` header
     - Validates against `Rails.application.config.telegram_webhook_secret`
     - Allows requests if secret is blank (development mode)
     - Returns 401 Unauthorized if secret doesn't match
     - Logs warning: "Unauthorized Telegram webhook request - invalid secret token"
   - `authenticate_admin` (protected method) - Authenticates admin endpoints
     - Checks `X-Admin-Secret` header, `HTTP_X_ADMIN_SECRET` env var, or `admin_secret` query param
     - Validates against `Rails.application.config.webhook_secret`
     - Has debug logging in test environment when authentication fails
     - Returns boolean (true if authenticated)

2. **CursorRunnerCallbackController** (`app/controllers/cursor_runner_callback_controller.rb`):
   - `authenticate_webhook` (private method) - Authenticates cursor-runner callback requests
     - Checks `X-Webhook-Secret` or `X-Cursor-Runner-Secret` headers, or `secret` query param
     - Validates against `Rails.application.config.webhook_secret`
     - Allows requests if secret is blank (development mode)
     - Returns 401 Unauthorized with JSON error if secret doesn't match
     - Logs warning with secret status and IP address

3. **AgentToolsController** (`app/controllers/agent_tools_controller.rb`):
   - `authenticate_webhook` (private method) - Authenticates agent tool requests
     - Checks `X-EL-Secret` header or `Authorization: Bearer <token>` header
     - Validates against `Rails.application.config.webhook_secret`
     - **Note**: Unlike other controllers, does NOT allow blank secrets in development mode (always requires valid secret)
     - Returns 401 Unauthorized with JSON error if secret doesn't match
     - Logs warning: "Unauthorized tool request - invalid secret"

## Checklist

- [ ] Verify `src/middleware` directory exists (should already exist from Phase 1)
- [ ] Create `src/middleware/README.md` documenting middleware structure and purpose
- [ ] Plan the following middleware files to be created in subsequent tasks:
  - [ ] `src/middleware/telegram-webhook-auth.middleware.ts` - Telegram webhook authentication (PHASE2-096)
  - [ ] `src/middleware/admin-auth.middleware.ts` - Admin endpoint authentication (PHASE2-097)
  - [ ] `src/middleware/cursor-runner-webhook-auth.middleware.ts` - Cursor-runner callback authentication (to be created)
  - [ ] `src/middleware/agent-tools-auth.middleware.ts` - Agent tools authentication (to be created)
- [ ] Document authentication patterns:
  - [ ] Header-based authentication (X-*-Secret headers)
  - [ ] Query parameter fallbacks (where applicable)
  - [ ] Authorization Bearer token support (for agent tools)
  - [ ] Development mode behavior (allow when secret not configured) - **Note**: AgentToolsController does NOT allow blank secrets, always requires valid secret
  - [ ] Error response formats (401 Unauthorized with JSON)
- [ ] Document configuration requirements:
  - [ ] `TELEGRAM_WEBHOOK_SECRET` - For Telegram webhook authentication
  - [ ] `WEBHOOK_SECRET` - For admin, cursor-runner, and agent tools authentication
- [ ] Create `src/middleware/index.ts` barrel export file (empty for now, will export middleware in subsequent tasks)

## Notes

- This task is part of Phase 2: File-by-File Conversion
- Section: 12. Middleware
- The `src/middleware` directory should already exist from Phase 1 infrastructure setup
- This task focuses on planning and documentation - actual middleware implementation happens in subsequent tasks
- Rails uses `before_action` filters which are controller-specific; Express middleware is more reusable and can be applied to routes
- Each authentication method in Rails will become a separate Express middleware function
- Middleware should follow Express middleware pattern: `(req, res, next) => { ... }`
- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE2-094
- Next: PHASE2-096

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
