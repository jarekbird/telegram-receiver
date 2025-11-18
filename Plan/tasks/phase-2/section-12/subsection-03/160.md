# PHASE2-097: Create admin authentication middleware

**Section**: 12. Middleware
**Subsection**: 12.3
**Task ID**: PHASE2-097

## Description

Convert the admin authentication middleware from Rails to TypeScript/Node.js. This middleware protects admin endpoints (set_webhook, webhook_info, delete_webhook) by validating the admin secret.

**Rails Implementation Reference:**
- Controller: `jarek-va/app/controllers/telegram_controller.rb` (lines 110-130)
- Configuration: `jarek-va/config/application.rb` (lines 22-25)
- Used in endpoints: `set_webhook` (line 52), `webhook_info` (line 74), `delete_webhook` (line 92)

**Rails Implementation Details:**
- The `authenticate_admin` method is a protected method in TelegramController
- Checks for admin secret from multiple sources (in order):
  1. `request.headers['X-Admin-Secret']` (header)
  2. `request.env['HTTP_X_ADMIN_SECRET']` (Rails converts headers to env vars - Express equivalent is checking headers directly)
  3. `params[:admin_secret]` (query/body parameter)
  4. `params['admin_secret']` (query/body parameter as string)
- Compares against `Rails.application.config.webhook_secret`
- Returns boolean (true/false) - the calling code returns `401 Unauthorized` if false
- Has debug logging in test environment when authentication fails (logs secret values, headers, env vars, and params)
- The secret is configured in `application.rb` from Rails credentials or ENV variable `WEBHOOK_SECRET` (defaults to 'changeme')

**Express/TypeScript Implementation Notes:**
- Express middleware should check headers via `req.headers['x-admin-secret']` (Express normalizes headers to lowercase)
- Express should check query parameters via `req.query.admin_secret`
- Express should check body parameters via `req.body.admin_secret` (if using body-parser middleware)
- Middleware should return `401 Unauthorized` response directly if authentication fails, or call `next()` if valid
- Configuration should read from `process.env.WEBHOOK_SECRET` (defaults to 'changeme')

## Checklist

- [ ] Create `src/middleware/admin-auth.ts`
- [ ] Implement Express middleware function
- [ ] Check for admin secret from multiple sources (in order):
  - [ ] `X-Admin-Secret` header (via `req.headers['x-admin-secret']` - Express normalizes headers to lowercase)
  - [ ] `admin_secret` query parameter (via `req.query.admin_secret`)
  - [ ] `admin_secret` body parameter (via `req.body.admin_secret`, if body-parser middleware is used)
- [ ] Get expected secret from application configuration (environment variable `WEBHOOK_SECRET`, defaults to 'changeme')
- [ ] Compare provided secret with expected secret
- [ ] Return 401 Unauthorized if secret doesn't match or is missing
- [ ] Call `next()` if valid
- [ ] Add debug logging in test/development mode when authentication fails (log: found secret value, expected secret value, header value, query param value, and body param value if available)
- [ ] Export middleware function for use in route handlers

## Notes

- This task is part of Phase 2: File-by-File Conversion
- Section: 12. Middleware
- Reference the Rails implementation for behavior

- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE2-096
- Next: PHASE2-098

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
