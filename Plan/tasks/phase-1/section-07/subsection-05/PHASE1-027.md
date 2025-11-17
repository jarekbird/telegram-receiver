# PHASE1-027: Create .env.test file

**Section**: 7. Environment Variables Management
**Subsection**: 7.5
**Task ID**: PHASE1-027

## Description

Create a `.env.test` file that contains test-specific environment variable values. This file is used during test execution and should contain values suitable for automated testing, including minimal logging, test-specific ports, and safe placeholder values for secrets.

This task creates the `.env.test` file by copying the template from `.env.example` (created in PHASE1-025) and setting appropriate test values. The file should use test-specific URLs (localhost), error-level logging (to reduce test output noise), and placeholder values for secrets that are safe for test execution.

**Rails Equivalent**: Rails uses `RAILS_ENV=test` environment variable and test-specific configuration in `config/environments/test.rb`. The `.env.test` file serves a similar purpose by providing test-specific environment variable values.

**Note**: This task creates the `.env.test` file with test-appropriate values. The test environment should use minimal logging, isolated database/Redis instances, and safe placeholder values for external service tokens.

## Checklist

- [ ] Create `.env.test` file in project root directory
- [ ] Copy all contents from `.env.example` file
- [ ] Set `NODE_ENV=test` (matches Rails `RAILS_ENV=test` behavior)
- [ ] Set `PORT=3001` (different from development port 3000 to avoid conflicts)
- [ ] Set `LOG_LEVEL=error` (minimal logging for tests, matches Rails test environment minimal logging)
- [ ] Set `TELEGRAM_WEBHOOK_BASE_URL=http://localhost:3001` (test-specific URL)
- [ ] Set `CURSOR_RUNNER_URL=http://localhost:3001` (test-specific URL for cursor-runner service)
- [ ] Set `REDIS_URL=redis://localhost:6379/1` (test-specific Redis database, isolated from development)
- [ ] Use test placeholder values for secrets (TELEGRAM_BOT_TOKEN=test_bot_token, TELEGRAM_WEBHOOK_SECRET=test_webhook_secret, WEBHOOK_SECRET=test_webhook_secret, ELEVENLABS_API_KEY empty)
- [ ] Add header comment indicating this is a test environment configuration file
- [ ] Ensure all values are safe for test execution (no production secrets, isolated resources)

## Notes

- This task is part of Phase 1: Basic Node.js API Infrastructure
- Section: 7. Environment Variables Management
- Task can be completed independently by a single agent
- Rails equivalent: Rails uses `RAILS_ENV=test` and test-specific configuration in `config/environments/test.rb` (see jarek-va/config/environments/test.rb)
- The `.env.test` file should never be committed to version control (should be in `.gitignore`)
- Test values should use minimal logging (error level) to reduce test output noise
- Test environment should use isolated resources (different Redis database, different port) to avoid conflicts with development
- Placeholder values for secrets allow tests to run without requiring real external service credentials
- The test environment is used exclusively for running the test suite and should not be used for development work

## Related Tasks

- Previous: PHASE1-026
- Next: PHASE1-028


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
