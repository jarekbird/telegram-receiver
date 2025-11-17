# PHASE1-004: Create source directory structure

**Section**: 2. Project Structure Setup
**Subsection**: 2.1
**Task ID**: PHASE1-004

## Description

Create source directory structure that aligns with the Rails application structure from jarek-va. This establishes the foundational directory layout for the Node.js/TypeScript conversion.

## Checklist

- [ ] Create `src/` directory (if it doesn't exist)
- [ ] Create `src/index.ts` file (empty initially, will be the application entry point)
- [ ] Create `src/config/` directory (for configuration files, equivalent to Rails `config/`)
- [ ] Create `src/controllers/` directory (for Express route handlers, equivalent to Rails `app/controllers/`)
- [ ] Create `src/services/` directory (for business logic, equivalent to Rails `app/services/`)
- [ ] Create `src/models/` directory (for data models/entities, equivalent to Rails `app/models/`)
- [ ] Create `src/jobs/` directory (for background job processors, equivalent to Rails `app/jobs/`)
- [ ] Create `src/middleware/` directory (for Express middleware functions)
- [ ] Create `src/routes/` directory (for route definitions, equivalent to Rails `config/routes.rb`)
- [ ] Create `src/utils/` directory (for utility functions and helpers)
- [ ] Create `src/types/` directory (for TypeScript type definitions and interfaces)

## Notes

- This task is part of Phase 1: Basic Node.js API Infrastructure
- Section: 2. Project Structure Setup
- Task can be completed independently by a single agent
- The directory structure mirrors the Rails application structure (`app/controllers/`, `app/services/`, `app/models/`, `app/jobs/`) to maintain consistency and ease conversion
- Additional directories (`middleware/`, `routes/`, `utils/`, `types/`) are Node.js/TypeScript-specific and will be used throughout the application
- Subdirectories within these main directories (e.g., `services/tools/`, `services/telegram_message_processors/`) will be created when those specific components are converted in later phases

## Related Tasks

- Previous: PHASE1-003
- Next: PHASE1-005


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
