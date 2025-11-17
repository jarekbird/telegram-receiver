# PHASE2-063: Create extract_chat_info utility function

**Section**: 8. TelegramController Conversion
**Subsection**: 8.9
**Task ID**: PHASE2-063

## Description

Create the `extractChatInfoFromUpdate` utility function in TypeScript/Node.js. This function extracts chat ID and message ID from Telegram update objects for error handling purposes. The function is used in both the TelegramController and TelegramMessageJob to extract chat information when sending error messages to users.

**Rails Implementation References**:
- `jarek-va/app/controllers/telegram_controller.rb` (lines 151-169)
- `jarek-va/app/jobs/telegram_message_job.rb` (lines 279-295)

Both implementations are identical and handle three types of Telegram updates: `message`, `edited_message`, and `callback_query`.

## Checklist

- [ ] Create `extractChatInfoFromUpdate` utility function in `src/utils/` directory
- [ ] Function signature: `extractChatInfoFromUpdate(update: TelegramUpdate): [number | null, number | null]`
- [ ] Handle type conversion: ensure update is treated as a plain object (handle Hash/object conversion)
- [ ] Handle `message` updates:
  - [ ] Extract `chat.id` from `update.message.chat.id`
  - [ ] Extract `message_id` from `update.message.message_id`
- [ ] Handle `edited_message` updates:
  - [ ] Extract `chat.id` from `update.edited_message.chat.id`
  - [ ] Extract `message_id` from `update.edited_message.message_id`
- [ ] Handle `callback_query` updates:
  - [ ] Check that `update.callback_query.message` exists
  - [ ] Extract `chat.id` from `update.callback_query.message.chat.id`
  - [ ] Extract `message_id` from `update.callback_query.message.message_id`
- [ ] Return `[chat_id, message_id]` tuple (both can be `null` if not found)
- [ ] Use optional chaining (`?.`) for safe nested property access
- [ ] Return `[null, null]` if none of the update types match
- [ ] Export function as named export from utility file
- [ ] Add TypeScript type definitions for TelegramUpdate (if not already defined)

## Notes

- This task is part of Phase 2: File-by-File Conversion
- Section: 8. TelegramController Conversion
- **Purpose**: This utility function is primarily used for error handling - extracting chat information from Telegram updates so error messages can be sent to users
- **Rails Implementation Details**:
  - The function converts the update to a hash if needed: `update_hash = update.is_a?(Hash) ? update : update.to_h`
  - Uses safe navigation operator (`&.[]`) for nested property access
  - Returns `[nil, nil]` if no matching update type is found
  - The function is identical in both `telegram_controller.rb` and `telegram_message_job.rb`
- **TypeScript Conversion**:
  - Use optional chaining (`?.`) instead of Ruby's safe navigation (`&.[]`)
  - Return `[null, null]` instead of `[nil, nil]`
  - Ensure the function handles plain objects (TypeScript doesn't have Hash types)
  - The function should be placed in `src/utils/` as a reusable utility
- **Usage**: This function will be used by TelegramController (PHASE2-062) and TelegramMessageJob (future task) for error handling
- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE2-062
- Next: PHASE2-064

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
