# PHASE2-026: Add comprehensive error handling to TelegramService

**Section**: 4. TelegramService Conversion
**Subsection**: 4.9
**Task ID**: PHASE2-026

## Description

Review and ensure comprehensive error handling is implemented across all TelegramService methods, matching the Rails implementation patterns. This task consolidates error handling requirements and ensures consistency across all methods. Reference `jarek-va/app/services/telegram_service.rb`.

The Rails implementation uses consistent error handling patterns:
- All public methods (`send_message`, `set_webhook`, `delete_webhook`, `webhook_info`, `send_voice`, `download_file`) wrap operations in `begin/rescue/end` blocks
- All methods log errors with descriptive messages and full stack traces using `Rails.logger.error`
- All methods re-raise exceptions after logging (using `raise`)
- Specific validations include file existence checks (`send_voice`) and HTTP response validation (`download_file_from_url`)
- All methods check for blank bot token before proceeding (early return pattern)

## Checklist

- [ ] Verify all public methods have try-catch blocks:
  - [ ] `sendMessage()` - wrap Telegram API call in try-catch
  - [ ] `setWebhook()` - wrap Telegram API call in try-catch
  - [ ] `deleteWebhook()` - wrap Telegram API call in try-catch
  - [ ] `getWebhookInfo()` - wrap Telegram API call in try-catch
  - [ ] `sendVoice()` - wrap file operations and Telegram API call in try-catch
  - [ ] `downloadFile()` - wrap file operations and Telegram API call in try-catch
- [ ] Verify all methods log errors appropriately:
  - [ ] Log error messages with descriptive context (e.g., "Error sending Telegram message: {error message}")
  - [ ] Log full stack traces for debugging
  - [ ] Use appropriate logging level (error level)
- [ ] Verify all methods re-throw exceptions after logging (maintain Rails behavior of propagating errors)
- [ ] Verify specific error validations are implemented:
  - [ ] `sendVoice()` validates file exists before reading (throw error: "Voice file does not exist" if file missing)
  - [ ] `downloadFileFromUrl()` (private helper method) validates HTTP response is successful (throw error: "Failed to download file: HTTP {code} {message}" if not successful)
- [ ] Verify all methods have early return checks for blank bot token (consistent with Rails `return if Rails.application.config.telegram_bot_token.blank?` pattern)
- [ ] Ensure error handling is consistent across all methods (same pattern: try-catch, log, re-throw)

## Notes

- This task is part of Phase 2: File-by-File Conversion
- Section: 4. TelegramService Conversion
- **This is a review/consolidation task** - it ensures error handling is comprehensive and consistent across all TelegramService methods
- Reference the Rails implementation (`jarek-va/app/services/telegram_service.rb`) for exact error handling patterns
- Error handling should match Rails behavior:
  - All methods use `begin/rescue/end` blocks (lines 17-36, 42-50, 56-62, 68-74, 86-116, 126-150)
  - Error messages follow pattern: "Error {operation}: {error message}" (e.g., "Error sending Telegram message:", "Error setting Telegram webhook:")
  - Full stack traces are logged using `Rails.logger.error(e.backtrace.join("\n"))`
  - Exceptions are re-raised after logging using `raise`
- Specific error validations from Rails:
  - `send_voice` (line 87): Validates file exists with `raise 'Voice file does not exist' unless File.exist?(voice_path)`
  - `download_file_from_url` (line 166): Validates HTTP response with `raise "Failed to download file: HTTP #{response.code} #{response.message}" unless response.is_a?(Net::HTTPSuccess)`
- All methods check for blank bot token before proceeding (early return pattern, e.g., line 15, 40, 54, 66, 84, 124)
- This task should be completed after all individual method implementation tasks (PHASE2-019 through PHASE2-025) to ensure comprehensive error handling review
- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE2-025
- Next: PHASE2-027

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
