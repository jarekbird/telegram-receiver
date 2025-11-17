# PHASE1-061: Document health endpoint

**Section**: 12. API Structure Documentation
**Subsection**: 12.4
**Task ID**: PHASE1-061

## Description

Document the health check endpoint based on the jarek-va Rails application implementation. The health endpoint provides basic service status information and is used for monitoring and service discovery. The endpoint returns the service status, name, and version information.

## Checklist

- [ ] Create `docs/api/HEALTH.md` file
- [ ] Document GET `/health` endpoint
- [ ] Document that root endpoint `GET /` also serves the health check
- [ ] Document request format:
  - [ ] No request body required
  - [ ] No query parameters required
  - [ ] No authentication required
- [ ] Document response format:
  - [ ] HTTP status code: `200 OK`
  - [ ] Response body fields:
    - [ ] `status` (string): Always `"healthy"` when service is running
    - [ ] `service` (string): Service name from `APP_NAME` environment variable (default: `"Virtual Assistant API"`)
    - [ ] `version` (string): Service version from `APP_VERSION` environment variable (default: `"1.0.0"`)
- [ ] Document status codes:
  - [ ] `200 OK`: Service is healthy and responding
  - [ ] `500 Internal Server Error`: Service error (handled by ApplicationController error handler)
- [ ] Add example request/response:
  - [ ] Example request (curl)
  - [ ] Example successful response (JSON)
- [ ] Reference the Rails implementation:
  - [ ] Controller: `jarek-va/app/controllers/health_controller.rb`
  - [ ] Route: `jarek-va/config/routes.rb` (GET `/health` and root `/`)
  - [ ] Configuration: `jarek-va/config/application.rb` (app_name and app_version)

## Notes

- This task is part of Phase 1: Basic Node.js API Infrastructure
- Section: 12. API Structure Documentation
- Task can be completed independently by a single agent
- Reference the jarek-va Rails application (`/cursor/repositories/jarek-va`) for actual implementation:
  - Controller: `app/controllers/health_controller.rb` - Simple controller that returns health status JSON
  - Route: `config/routes.rb` - Defines both `GET /health` and root `GET /` routes pointing to `health#show`
  - Configuration: `config/application.rb` - Defines `app_name` and `app_version` config values from environment variables
- The health endpoint is a simple GET endpoint that requires no authentication and returns basic service information
- Response format follows the pattern: `{ status: 'healthy', service: '...', version: '...' }`
- The endpoint is used for service monitoring, health checks, and service discovery
- Both `/health` and `/` (root) endpoints serve the same health check response

## Related Tasks

- Previous: PHASE1-060
- Next: PHASE1-062


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
