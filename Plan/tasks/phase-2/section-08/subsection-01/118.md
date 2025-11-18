# PHASE2-055: Create TelegramController class structure

**Section**: 8. TelegramController Conversion
**Subsection**: 8.1
**Task ID**: PHASE2-055

## Description

Create the TelegramController class structure in TypeScript/Node.js. This is the foundational task that sets up the class skeleton. Method implementations will be added in subsequent tasks (PHASE2-056 through PHASE2-063).

The Rails implementation (`jarek-va/app/controllers/telegram_controller.rb`) inherits from `ApplicationController` and includes:
- A `before_action :authenticate_webhook` filter for the webhook endpoint
- 4 public endpoint methods: `webhook`, `set_webhook`, `webhook_info`, `delete_webhook`
- 1 protected method: `authenticate_admin` (for admin endpoints)
- 3 private helper methods: `authenticate_webhook`, `default_webhook_url`, `extract_chat_info_from_update`
- Error handling that sends error messages to Telegram users when possible (in webhook method)
- Always returns 200 OK to Telegram to avoid retries

**Key Implementation Details:**
- The `webhook` method filters out Rails-specific params (`controller`, `action`, `format`, `telegram`) before processing
- The `webhook` method enqueues the update as JSON string to `TelegramMessageJob.perform_later`
- Admin endpoints (`set_webhook`, `webhook_info`, `delete_webhook`) return JSON with `{ ok: true/false, ... }` format
- The `authenticate_admin` method checks `X-Admin-Secret` header or `admin_secret` param, returns early with 401 if unauthorized
- The `default_webhook_url` method uses config values (`telegram_webhook_base_url`) or environment variable (`TELEGRAM_WEBHOOK_BASE_URL`)
- The `extract_chat_info_from_update` method handles three update types: `message`, `edited_message`, and `callback_query` (extracting chat info from nested message in callback_query)

For TypeScript, convert to an Express controller class that:
- Uses Express Request, Response, and NextFunction types
- Accepts dependencies via constructor (TelegramService, job queue service)
- Will have method implementations added in subsequent tasks
- Uses middleware for authentication (webhook auth and admin auth)

## Checklist

- [ ] Create `src/controllers/telegram-controller.ts` file
- [ ] Define `TelegramController` class
- [ ] Import Express types (`Request`, `Response`, `NextFunction` from `express`)
- [ ] Import TelegramService (will be created in Section 4)
- [ ] Import job queue service/types for enqueuing TelegramMessageJob
- [ ] Add constructor that accepts dependencies:
  - `telegramService: TelegramService`
  - `messageJobQueue: Queue` (or appropriate job queue service)
- [ ] Add method stubs with proper TypeScript signatures for:
  - `webhook(req: Request, res: Response): Promise<void>` - will be implemented in PHASE2-056
  - `setWebhook(req: Request, res: Response): Promise<void>` - will be implemented in PHASE2-058
  - `getWebhookInfo(req: Request, res: Response): Promise<void>` - will be implemented in PHASE2-059
  - `deleteWebhook(req: Request, res: Response): Promise<void>` - will be implemented in PHASE2-060
- [ ] Add protected/private method stubs for helper methods:
  - `authenticateAdmin(req: Request): boolean` - will be implemented in PHASE2-061
    - Should check `X-Admin-Secret` header or `admin_secret` query/body param
    - Returns `true` if authenticated, `false` otherwise
  - `defaultWebhookUrl(): string` - helper method to get default webhook URL from config
    - Should use config value or environment variable, appends `/telegram/webhook` path
  - `extractChatInfoFromUpdate(update: TelegramUpdate): [number | null, number | null]` - will be implemented in PHASE2-063
    - Returns tuple of `[chat_id, message_id]` or `[null, null]` if not found
    - Handles `message`, `edited_message`, and `callback_query` update types
- [ ] Add basic error handling structure (try-catch pattern, error logging)
- [ ] Add TypeScript types/interfaces for TelegramUpdate (if not already defined)
- [ ] Export the class as default export or named export

## Notes

- This task is part of Phase 2: File-by-File Conversion
- Section: 8. TelegramController Conversion
- **This task only creates the class structure** - method implementations are in subsequent tasks
- Reference the Rails implementation (`jarek-va/app/controllers/telegram_controller.rb`) for behavior patterns
- The Rails controller uses `before_action` filters, but TypeScript version should use Express middleware (implemented in PHASE2-057 and PHASE2-061)
- Method names should follow TypeScript/JavaScript camelCase convention (e.g., `setWebhook` instead of `set_webhook`)
- The controller will need to enqueue jobs to process Telegram updates asynchronously (similar to Rails `TelegramMessageJob.perform_later`)
- Error handling should always return 200 OK to Telegram to prevent retries (see Rails implementation lines 26-48)
- The `webhook` method should filter out Express-specific params before processing (similar to Rails filtering `controller`, `action`, `format`, `telegram`)
- The `webhook` method's error handler should attempt to send error messages to Telegram users when chat info is available (see Rails implementation lines 30-45)
- Admin endpoints should return JSON responses with `{ ok: boolean, ... }` format
- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE2-054
- Next: PHASE2-056

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
