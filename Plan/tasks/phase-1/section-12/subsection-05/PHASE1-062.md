# PHASE1-062: Create API README

**Section**: 12. API Structure Documentation
**Subsection**: 12.5
**Task ID**: PHASE1-062

## Description

Create a comprehensive API README that provides an overview of the telegram-receiver API, lists all available endpoints, and links to detailed endpoint documentation. The README should serve as the main entry point for API documentation and should be based on the jarek-va Rails application API structure.

## Checklist

- [ ] Create `docs/API.md` file
- [ ] Add API overview section:
  - [ ] Describe the purpose of the API (Virtual Assistant orchestration layer)
  - [ ] Explain the main functionality areas (Telegram integration, cursor-runner integration, agent tools)
  - [ ] Note that this is a conversion from the jarek-va Rails application
- [ ] List all available endpoint groups:
  - [ ] Health endpoints:
    - [ ] `GET /health` - Health check endpoint
    - [ ] `GET /` - Root endpoint (also serves health check)
    - [ ] Link to `docs/api/HEALTH.md` for detailed documentation
  - [ ] Agent Tools endpoints:
    - [ ] `POST /agent-tools` - Tool execution webhook endpoint
    - [ ] Note: Requires authentication via `X-EL-Secret` header or `Authorization: Bearer` token
  - [ ] Cursor Runner endpoints:
    - [ ] `POST /cursor-runner/cursor/execute` - Execute cursor command
    - [ ] `POST /cursor-runner/cursor/iterate` - Execute cursor command iteratively
    - [ ] `POST /cursor-runner/callback` - Callback endpoint for cursor-runner results
    - [ ] `POST /cursor-runner/git/clone` - Clone a repository
    - [ ] `GET /cursor-runner/git/repositories` - List cloned repositories
    - [ ] `POST /cursor-runner/git/checkout` - Checkout a branch
    - [ ] `POST /cursor-runner/git/push` - Push branch to origin
    - [ ] `POST /cursor-runner/git/pull` - Pull branch from origin
  - [ ] Telegram endpoints:
    - [ ] `POST /telegram/webhook` - Telegram webhook endpoint (receives updates)
    - [ ] `POST /telegram/set_webhook` - Set Telegram webhook (admin only)
    - [ ] `GET /telegram/webhook_info` - Get webhook information (admin only)
    - [ ] `DELETE /telegram/webhook` - Delete Telegram webhook (admin only)
- [ ] Add authentication information section:
  - [ ] Document authentication header patterns:
    - [ ] Admin endpoints: `X-Admin-Secret` header (matches `WEBHOOK_SECRET` config)
    - [ ] Telegram webhook: `X-Telegram-Bot-Api-Secret-Token` header (matches `TELEGRAM_WEBHOOK_SECRET` config)
    - [ ] Cursor runner callback: `X-Webhook-Secret` or `X-Cursor-Runner-Secret` header (matches `WEBHOOK_SECRET` config)
    - [ ] Agent tools: `X-EL-Secret` header or `Authorization: Bearer <token>` (matches `WEBHOOK_SECRET` config)
  - [ ] Note that authentication secrets come from environment variables
  - [ ] Document which endpoints require authentication
  - [ ] Reference `docs/API_CONVENTIONS.md` for authentication patterns
- [ ] Add rate limiting information section:
  - [ ] Note if rate limiting is implemented (check jarek-va implementation)
  - [ ] Document rate limits if applicable
  - [ ] Document rate limit headers if applicable
- [ ] Add links to detailed documentation:
  - [ ] Link to `docs/API_CONVENTIONS.md` for API conventions and patterns
  - [ ] Link to `docs/api/HEALTH.md` for health endpoint details
  - [ ] Note that additional endpoint documentation will be added as tasks are completed
- [ ] Add base URL and versioning information:
  - [ ] Document default base URL (if applicable)
  - [ ] Document API versioning strategy (if applicable)
- [ ] Reference the Rails implementation:
  - [ ] Routes: `jarek-va/config/routes.rb`
  - [ ] Controllers: `jarek-va/app/controllers/*.rb`
  - [ ] Note that the Node.js/Express implementation should match Rails API structure

## Notes

- This task is part of Phase 1: Basic Node.js API Infrastructure
- Section: 12. API Structure Documentation
- Task can be completed independently by a single agent
- Reference the jarek-va Rails application (`/cursor/repositories/jarek-va`) for actual API structure:
  - Routes: `config/routes.rb` - Defines all API endpoints and their HTTP methods
  - Controllers: `app/controllers/*.rb` - Implement endpoint logic and authentication
  - Application Controller: `app/controllers/application_controller.rb` - Base controller with global error handling
- The API README should serve as the main entry point for API documentation
- All endpoints should be listed with their HTTP methods and brief descriptions
- Authentication requirements should be clearly documented for each endpoint group
- Rate limiting: The Rails application does not implement rate limiting at the application level. Rate limiting may be handled at the infrastructure level (e.g., Traefik reverse proxy), but this is not part of the Rails application code. Document this in the rate limiting section.
- The API follows RESTful conventions where applicable, but also includes webhook endpoints and callback endpoints
- Response formats vary by endpoint:
  - Health endpoint: `{ status: 'healthy', service: '...', version: '...' }`
  - Success responses: `{ ok: true, ... }` or `{ success: true, ... }`
  - Error responses: `{ ok: false, say: '...', result: { error: ... } }`
  - Some endpoints return empty body with HTTP status codes
- Link to detailed endpoint documentation as it becomes available (e.g., `docs/api/HEALTH.md` for health endpoint)
- Reference `docs/API_CONVENTIONS.md` for detailed API conventions and patterns

## Related Tasks

- Previous: PHASE1-061
- Next: PHASE1-063


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
