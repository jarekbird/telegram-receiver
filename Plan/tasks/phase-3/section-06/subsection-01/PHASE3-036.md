# PHASE3-036: Review authentication/authorization

**Section**: 6. Security Review
**Subsection**: 6.1
**Task ID**: PHASE3-036

## Description

Review and improve authentication/authorization in the codebase to ensure best practices. This task focuses on validating that all authentication mechanisms are properly implemented, secure, and follow best practices.

## Authentication Mechanisms to Review

Based on the jarek-va Rails implementation, the following authentication mechanisms exist:

1. **Telegram Webhook Authentication** (`TelegramController#webhook`)
   - Header: `X-Telegram-Bot-Api-Secret-Token`
   - Secret: `telegram_webhook_secret` (from config)
   - Allows blank secret (development mode bypass)
   - Applied via `before_action :authenticate_webhook`

2. **Admin Authentication** (`TelegramController#set_webhook`, `#webhook_info`, `#delete_webhook`)
   - Header: `X-Admin-Secret` (or `HTTP_X_ADMIN_SECRET` env var)
   - Query/Body param: `admin_secret`
   - Secret: `webhook_secret` (from config)
   - Applied via `authenticate_admin` method

3. **Cursor-Runner Callback Authentication** (`CursorRunnerCallbackController#create`)
   - Headers: `X-Webhook-Secret` or `X-Cursor-Runner-Secret`
   - Query param: `secret`
   - Secret: `webhook_secret` (from config)
   - Allows blank secret (development mode bypass)
   - Applied via `before_action :authenticate_webhook`

4. **Agent Tools Authentication** (`AgentToolsController#create`)
   - Header: `X-EL-Secret`
   - Header: `Authorization: Bearer <token>` (token extracted from Bearer)
   - Secret: `webhook_secret` (from config)
   - Applied via `before_action :authenticate_webhook`

5. **Sidekiq Web UI** (mounted at `/sidekiq`)
   - Currently has no visible authentication protection
   - Comment in routes.rb mentions "protect in production" but no implementation found

## Checklist

- [ ] Review Telegram webhook authentication (`X-Telegram-Bot-Api-Secret-Token` header validation)
- [ ] Review admin authentication (`X-Admin-Secret` header/param validation)
- [ ] Review cursor-runner callback authentication (`X-Webhook-Secret`/`X-Cursor-Runner-Secret` headers)
- [ ] Review agent tools authentication (`X-EL-Secret` header and `Authorization: Bearer` token)
- [ ] Review Sidekiq Web UI protection (currently unprotected)
- [ ] Check for authentication bypasses (development mode blank secret checks)
- [ ] Review secret token handling (header vs query param vs body param)
- [ ] Review secret configuration (default values, environment variable handling)
- [ ] Check for proper authorization (role-based access, endpoint-specific permissions)
- [ ] Verify consistent secret naming and usage across endpoints
- [ ] Check for timing attack vulnerabilities in secret comparison
- [ ] Review error handling and logging (avoid leaking secret information)
- [ ] Identify security gaps (unprotected endpoints, weak secrets, etc.)
- [ ] Document authentication flow for each endpoint
- [ ] Review and document secret management best practices

## Rails Files to Review

Reference the following Rails files in jarek-va for authentication implementation:

- `app/controllers/telegram_controller.rb` - Telegram webhook and admin authentication
- `app/controllers/cursor_runner_callback_controller.rb` - Cursor-runner callback authentication
- `app/controllers/agent_tools_controller.rb` - Agent tools authentication
- `app/controllers/application_controller.rb` - Base controller (error handling)
- `config/routes.rb` - Route definitions and Sidekiq Web UI mounting
- `config/application.rb` - Secret configuration (webhook_secret, telegram_webhook_secret)
- `config/initializers/telegram.rb` - Telegram configuration initialization

## Security Concerns to Address

1. **Development Mode Bypasses**: Some authentication methods allow blank secrets in development mode. Review if this is appropriate or if stricter validation is needed.

2. **Default Secrets**: Default secret values ('changeme') are used when secrets are not configured. This is a security risk in production.

3. **Multiple Secret Sources**: Secrets can be passed via headers, query params, or body params. Review if this flexibility is necessary or if it creates security vulnerabilities.

4. **Inconsistent Secret Usage**: Different endpoints use different secret configurations (`webhook_secret` vs `telegram_webhook_secret`). Review if this is intentional or should be standardized.

5. **Unprotected Sidekiq Web UI**: The Sidekiq Web UI is mounted without authentication. This should be protected in production environments.

6. **Secret Comparison**: Review if secret comparison uses constant-time comparison to prevent timing attacks.

7. **Error Messages**: Ensure error messages don't leak information about secret validation failures.

8. **Logging**: Review if authentication failures are logged appropriately without exposing sensitive information.

## Notes

- This task is part of Phase 3: Holistic Review and Best Practices
- Section: 6. Security Review
- Focus on identifying issues and improvements
- Document findings and decisions
- Compare telegram-receiver implementation with jarek-va Rails implementation
- Ensure all authentication mechanisms are properly converted and secured

- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE3-035
- Next: PHASE3-037

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
