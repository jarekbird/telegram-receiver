# PHASE1-028: Use environment config in application

**Section**: 7. Environment Variables Management
**Subsection**: 7.6
**Task ID**: PHASE1-028

## Description

Integrate the environment configuration module into the main application entry point (`src/index.ts`) to use environment variables for server port and environment logging. This task imports the Express app from `src/app.ts`, starts the Express server using the port from the environment configuration, and logs the environment when the server starts.

In Rails, the server port is configured in `config/puma.rb` using `ENV.fetch("PORT") { 3000 }`, and the environment is accessed via `ENV.fetch("RAILS_ENV") { "development" }`. The Rails application logs the environment when starting. This task replicates that behavior in the Node.js application by using the centralized environment configuration module created in PHASE1-024.

**Rails Equivalent**: `jarek-va/config/puma.rb` (lines 18, 22) - Rails uses `ENV.fetch("PORT") { 3000 }` for port configuration and `ENV.fetch("RAILS_ENV") { "development" }` for environment. The Rails application logs the environment when starting.

**Note**: This task assumes that `src/app.ts` exists (created in PHASE1-015) and exports the Express app instance. The task also assumes that `src/config/environment.ts` exists (created in PHASE1-024) and exports a `config` object with `port` and `env` properties.

## Checklist

- [ ] Open `src/index.ts` (create if it doesn't exist)
- [ ] Import the Express app from `./app` (default export from `src/app.ts` created in PHASE1-015)
- [ ] Import config from `./config/environment` (default export from `src/config/environment.ts` created in PHASE1-024)
- [ ] Start the Express server using `app.listen(config.port, ...)` with the port from config
- [ ] Log the environment when server starts (e.g., `console.log(`Server running in ${config.env} mode on port ${config.port}`)`)
- [ ] Add error handling for server startup (handle port binding errors, etc.)

## Notes

- This task is part of Phase 1: Basic Node.js API Infrastructure
- Section: 7. Environment Variables Management
- Task can be completed independently by a single agent
- **Rails Equivalent**: `jarek-va/config/puma.rb` (lines 18, 22) - Rails uses `ENV.fetch("PORT") { 3000 }` for port configuration and `ENV.fetch("RAILS_ENV") { "development" }` for environment
- **Dependencies**: 
  - Requires `src/app.ts` to exist (created in PHASE1-015) and export the Express app instance
  - Requires `src/config/environment.ts` to exist (created in PHASE1-024) and export a `config` object with `port` and `env` properties
- **Server Startup**: The `src/index.ts` file is the main entry point that starts the Express server. It should import the app from `src/app.ts` and start listening on the configured port
- **Environment Logging**: Logging the environment when the server starts helps with debugging and confirms which environment the application is running in, similar to how Rails logs the environment on startup
- **Port Configuration**: The port comes from the environment configuration module, which reads from `process.env.PORT` or defaults to 3000 (matching Rails default port)
- **Error Handling**: The server startup should handle errors such as port already in use, permission denied, etc., and log appropriate error messages

## Related Tasks

- Previous: PHASE1-027
- Next: PHASE1-029


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
