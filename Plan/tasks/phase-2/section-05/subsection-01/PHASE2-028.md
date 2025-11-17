# PHASE2-028: Create CursorRunnerService class structure

**Section**: 5. CursorRunnerService Conversion
**Subsection**: 5.1
**Task ID**: PHASE2-028

## Description

Create the CursorRunnerService class structure in TypeScript/Node.js. This service handles HTTP communication with the cursor-runner API for cursor execution and git operations. This task focuses on creating the basic class structure, constructor, and error classes only - method implementations will be added in subsequent tasks.

Reference the Rails implementation at `jarek-va/app/services/cursor_runner_service.rb` for the complete service structure and behavior.

## Checklist

- [ ] Create `src/services/cursorRunnerService.ts` file (use camelCase naming per TypeScript conventions)
- [ ] Define `CursorRunnerService` class structure
- [ ] Add constructor with optional `baseUrl` and `timeout` parameters that default to application config values
  - Constructor should accept: `constructor(baseUrl?: string, timeout?: number)`
  - Default `baseUrl` should come from application config (e.g., `process.env.CURSOR_RUNNER_URL` or config module)
  - Default `timeout` should come from application config (e.g., `process.env.CURSOR_RUNNER_TIMEOUT` or config module)
- [ ] Import required types and dependencies:
  - HTTP client: `axios` (already in package.json)
  - JSON parsing: Built-in `JSON` (no import needed)
  - UUID generation: `crypto` module for generating request IDs (similar to Rails `SecureRandom`)
- [ ] Add custom error classes matching Rails implementation (as separate exported classes, not nested):
  - `CursorRunnerServiceError` (base error class, extends `Error`)
  - `ConnectionError` (extends `CursorRunnerServiceError` - for connection failures)
  - `TimeoutError` (extends `CursorRunnerServiceError` - for request timeouts)
  - `InvalidResponseError` (extends `CursorRunnerServiceError` - for JSON parsing errors)
  - Note: In TypeScript, these should be exported as separate classes, not nested classes like in Ruby

## Notes

- This task is part of Phase 2: File-by-File Conversion
- Section: 5. CursorRunnerService Conversion
- Reference the Rails implementation for behavior

- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE2-027
- Next: PHASE2-029

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
