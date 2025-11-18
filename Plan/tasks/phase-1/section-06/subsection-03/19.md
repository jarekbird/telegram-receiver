# PHASE1-019: Create CORS middleware (if needed)

**Section**: 6. Request/Response Middleware
**Subsection**: 6.3
**Task ID**: PHASE1-019

## Description

Create CORS middleware for the Express application. This middleware handles Cross-Origin Resource Sharing (CORS) headers to allow cross-origin AJAX requests from web frontends or other clients.

**Rails Reference**: The jarek-va Rails application has CORS configuration in `config/initializers/cors.rb`, but it is currently commented out (not enabled). The Rails app is configured as `api_only = true`, meaning it's designed as an API backend.

**When CORS is Needed**: CORS middleware should be implemented if:
- The API will be called from web browsers (frontend applications)
- The API needs to support cross-origin requests
- Future frontend integrations are planned

**When CORS May Not Be Needed**: 
- If the API is only called from server-to-server (like Telegram webhooks, cursor-runner callbacks)
- If all clients are same-origin
- If the API is only used internally within Docker networks

Since the Rails version has CORS disabled, this task should evaluate whether CORS is needed for the Node.js conversion based on the intended use case. If CORS is needed, implement it; if not, document why it's not needed and skip implementation.

## Rails Implementation Reference

**File**: `jarek-va/config/initializers/cors.rb`
- CORS configuration is commented out (not enabled)
- Example configuration shows allowing specific origins and all HTTP methods
- Uses `rack-cors` gem (Rails equivalent of Express `cors` middleware)

## Checklist

- [ ] Evaluate whether CORS is needed based on API usage patterns
- [ ] If CORS is needed:
  - [ ] Install `cors` package as production dependency
  - [ ] Install `@types/cors` as dev dependency
  - [ ] Create CORS middleware file in `src/middleware/cors.ts` (or configure in main app file)
  - [ ] Import `cors` in the main application file (`src/index.ts` or `src/app.ts`)
  - [ ] Configure CORS with appropriate options:
    - [ ] Set allowed origins (use environment variable for flexibility)
    - [ ] Configure allowed methods (GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD)
    - [ ] Configure allowed headers (Content-Type, Authorization, etc.)
    - [ ] Set credentials handling if needed
  - [ ] Apply CORS middleware using `app.use(cors(options))` before other middleware
- [ ] If CORS is not needed:
  - [ ] Document decision in code comments
  - [ ] Skip CORS middleware implementation

## Notes

- This task is part of Phase 1: Basic Node.js API Infrastructure
- Section: 6. Request/Response Middleware
- Task can be completed independently by a single agent
- The Rails application has CORS disabled (commented out), so this is an optional enhancement
- Consider using environment variables for CORS configuration (e.g., `CORS_ORIGIN`, `CORS_ENABLED`)
- CORS middleware should be applied early in the middleware stack, typically before route handlers

## Related Tasks

- Previous: PHASE1-018
- Next: PHASE1-020


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
