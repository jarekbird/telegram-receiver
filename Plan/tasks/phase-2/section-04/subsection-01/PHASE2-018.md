# PHASE2-018: Create TelegramService class structure

**Section**: 4. TelegramService Conversion
**Subsection**: 4.1
**Task ID**: PHASE2-018

## Description

Create the TelegramService class structure in TypeScript/Node.js. This is the foundational task that sets up the class skeleton. Method implementations will be added in subsequent tasks (PHASE2-019 through PHASE2-025).

The Rails implementation (`jarek-va/app/services/telegram_service.rb`) uses class methods (`class << self`) and includes:
- A `bot` method that creates/returns a Telegram::Bot::Client instance
- Bot token configuration via `Rails.application.config.telegram_bot_token`
- All methods check if bot token is blank before proceeding
- 6 public methods: `send_message`, `set_webhook`, `delete_webhook`, `webhook_info`, `send_voice`, `download_file`
- 2 private helper methods: `download_file_from_url`, `escape_html_entities`

For TypeScript, convert to an instance-based class that:
- Accepts bot token via constructor or environment variable (`TELEGRAM_BOT_TOKEN`)
- Validates bot token presence before operations (similar to Rails blank check)
- Will have method stubs added in subsequent tasks

## Checklist

- [ ] Create `src/services/telegram-service.ts` file
- [ ] Define `TelegramService` class
- [ ] Add private `botToken` property to store the Telegram bot token
- [ ] Add constructor that accepts bot token (or reads from `process.env.TELEGRAM_BOT_TOKEN`)
- [ ] Add private method to validate bot token is present (similar to Rails blank check)
- [ ] Add placeholder for Telegram Bot API client initialization (will use axios or similar)
- [ ] Import required types and dependencies (axios for HTTP requests, types for Telegram API)
- [ ] Add method stubs with proper TypeScript signatures for:
  - `sendMessage()` - will be implemented in PHASE2-019
  - `setWebhook()` - will be implemented in PHASE2-020
  - `deleteWebhook()` - will be implemented in PHASE2-021
  - `getWebhookInfo()` - will be implemented in PHASE2-022
  - `sendVoice()` - will be implemented in PHASE2-023
  - `downloadFile()` - will be implemented in PHASE2-024
- [ ] Add private method stubs for helper methods:
  - `downloadFileFromUrl()` - helper for file downloads
  - `escapeHtmlEntities()` - helper for HTML escaping (will be implemented in PHASE2-025)
- [ ] Add basic error handling structure (try-catch pattern, error logging)
- [ ] Export the class as default export

## Notes

- This task is part of Phase 2: File-by-File Conversion
- Section: 4. TelegramService Conversion
- **This task only creates the class structure** - method implementations are in subsequent tasks
- Reference the Rails implementation (`jarek-va/app/services/telegram_service.rb`) for behavior patterns
- The Rails service uses class methods, but TypeScript version should use instance methods
- Bot token should be validated in each method (similar to Rails `return if Rails.application.config.telegram_bot_token.blank?`)
- Use `axios` (already in dependencies) for HTTP requests to Telegram Bot API
- Method names should follow TypeScript/JavaScript camelCase convention (e.g., `sendMessage` instead of `send_message`)
- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE2-017
- Next: PHASE2-019

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
