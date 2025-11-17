# PHASE1-048: Create health endpoint integration test

**Section**: 10. Test Suite Setup
**Subsection**: 10.7
**Task ID**: PHASE1-048

## Description

Create health endpoint integration test using Supertest to verify the health endpoint returns the correct response format matching the Rails implementation. This task creates an automated integration test that validates the health endpoint implementation from PHASE1-013, PHASE1-014, and PHASE1-015.

**Rails Reference**: `jarek-va/app/controllers/health_controller.rb` (for expected response format)

## Checklist

- [ ] Create `tests/integration/api/health.test.ts` file
- [ ] Import app from `../../../src/index` (or appropriate app export path)
- [ ] Import `request` from `supertest` (use: `import request from 'supertest'`)
- [ ] Write test suite using `describe('Health Endpoint', ...)`
- [ ] Write test for GET `/health` endpoint
- [ ] Verify response status is 200
- [ ] Verify response body is JSON with:
  - `status: "healthy"` (must match Rails implementation, not "ok")
  - `service: string` (should be `'Virtual Assistant API'` or value from `APP_NAME` env var)
  - `version: string` (should be `'1.0.0'` or value from `APP_VERSION` env var)
- [ ] Write test for GET `/` (root route) endpoint
- [ ] Verify root route returns same health response as `/health`
- [ ] Run test and verify it passes

## Notes

- This task is part of Phase 1: Basic Node.js API Infrastructure
- Section: 10. Test Suite Setup
- Task can be completed independently by a single agent
- **Rails Reference**: `jarek-va/app/controllers/health_controller.rb` (for expected response format)
- **Previous Tasks**: This task tests the implementation from PHASE1-013 (controller), PHASE1-014 (route), and PHASE1-015 (route registration)
- **Expected Response Format**: The health endpoint should return:
  ```json
  {
    "status": "healthy",
    "service": "Virtual Assistant API",
    "version": "1.0.0"
  }
  ```
  - Note: Status must be `"healthy"` (not `"ok"`) to match Rails implementation
  - `service` and `version` may come from `APP_NAME` and `APP_VERSION` environment variables
- **Routes to Test**: Both `/health` and `/` (root) routes should be tested, as Rails has both routes pointing to the same controller
- **Test Location**: Integration tests for API endpoints should be placed in `tests/integration/api/` directory

## Related Tasks

- Previous: PHASE1-047
- Next: PHASE1-049


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
