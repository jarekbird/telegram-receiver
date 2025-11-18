# PHASE1-025: Create .env.example file

**Section**: 7. Environment Variables Management
**Subsection**: 7.3
**Task ID**: PHASE1-025

## Description

Create a `.env.example` file that serves as a template for environment variable configuration. This file documents all environment variables used by the application and provides placeholder values for developers to copy into their own `.env.development`, `.env.test`, or `.env.production` files.

This task creates the foundational `.env.example` file with the basic environment variables that are implemented in PHASE1-024 (NODE_ENV, PORT, LOG_LEVEL). Additional environment variables (such as TELEGRAM_BOT_TOKEN, CURSOR_RUNNER_URL, REDIS_URL, ELEVENLABS_API_KEY, etc.) will be added in later tasks as the corresponding features are implemented.

**Rails Equivalent**: `.env.example` file (jarek-va/.env.example) - serves as a template for environment variable configuration

**Note**: This task creates the basic `.env.example` file with only the environment variables implemented in PHASE1-024. The file should be structured to allow easy addition of more variables in later tasks.

## Checklist

- [ ] Create `.env.example` file in project root directory
- [ ] Add header comment explaining the file's purpose (template for environment variables)
- [ ] Add comment instructing users to copy to `.env.development`, `.env.test`, or `.env.production`
- [ ] Add "Application Environment" section comment
- [ ] Add `NODE_ENV=development` line (matches Rails `RAILS_ENV` behavior)
- [ ] Add `PORT=3000` line (matches Rails `config/puma.rb` port configuration)
- [ ] Add `LOG_LEVEL=info` line (matches Rails `config/application.rb` LOG_LEVEL configuration)
- [ ] Add comment sections for future environment variables (Telegram, Cursor Runner, Redis, ElevenLabs, etc.) with placeholder comments indicating they will be added in later tasks
- [ ] Ensure all placeholder values are safe defaults (no real secrets or tokens)
- [ ] Format file with clear sections and comments for maintainability

## Notes

- This task is part of Phase 1: Basic Node.js API Infrastructure
- Section: 7. Environment Variables Management
- Task can be completed independently by a single agent
- Rails equivalent: `.env.example` file (jarek-va/.env.example)
- The Rails application uses environment variables defined in `config/application.rb` (see jarek-va/config/application.rb)
- This task creates the basic `.env.example` with only NODE_ENV, PORT, and LOG_LEVEL (matching what's implemented in PHASE1-024)
- Additional environment variables will be added in later tasks as features are implemented:
  - Telegram configuration (TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, TELEGRAM_WEBHOOK_BASE_URL, TELEGRAM_API_URL)
  - Cursor Runner configuration (CURSOR_RUNNER_URL, CURSOR_RUNNER_TIMEOUT)
  - Redis configuration (REDIS_URL)
  - ElevenLabs configuration (ELEVENLABS_API_KEY, ELEVENLABS_STT_MODEL_ID, ELEVENLABS_TTS_MODEL_ID, ELEVENLABS_VOICE_ID)
  - Application metadata (APP_NAME, APP_VERSION)
- The `.env.example` file should never contain real secrets or production values - only safe placeholder values
- Developers should copy `.env.example` to `.env.development`, `.env.test`, or `.env.production` and fill in actual values

## Related Tasks

- Previous: PHASE1-024
- Next: PHASE1-026


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
