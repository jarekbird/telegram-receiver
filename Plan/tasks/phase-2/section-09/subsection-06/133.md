# PHASE2-070: Implement send_response_to_telegram method

**Section**: 9. CursorRunnerCallbackController Conversion
**Subsection**: 9.6
**Task ID**: PHASE2-070

## Description

Convert and implement the `send_response_to_telegram` method from Rails to TypeScript/Node.js. This method handles sending cursor-runner callback results to Telegram, with support for audio responses, parse mode fallbacks, and error handling.

**Rails Reference**: `jarek-va/app/controllers/cursor_runner_callback_controller.rb` (lines 170-218)

## Checklist

- [ ] Create `sendResponseToTelegram` method with signature: `(chatId: string, messageId: number, result: NormalizedResult, originalWasAudio?: boolean)`
- [ ] Return early if `chatId` is blank/null/undefined
- [ ] Check if cursor debug is enabled using `SystemSetting.enabled?('debug')` (store in `cursorDebug` variable)
- [ ] Format response text based on `result.success`:
  - If `result.success` is true: call `formatSuccessMessage(result, cursorDebug)` (PHASE2-071)
  - If `result.success` is false: call `formatErrorMessage(result, cursorDebug)` (PHASE2-072)
- [ ] Handle audio response logic:
  - If `originalWasAudio` is true AND `!SystemSetting.disabled?('allow_audio_output')`:
    - Call `sendTextAsAudio(chatId, responseText, messageId)` (PHASE2-074)
    - Return early (don't send text message)
- [ ] Send text message with parse mode fallback:
  - First attempt: `TelegramService.sendMessage()` with `parseMode: 'Markdown'` and `replyToMessageId: messageId`
  - If Markdown fails: catch error, log warning, retry with `parseMode: 'HTML'`
  - If HTML fails: catch error, log warning, retry with `parseMode: undefined` (plain text)
- [ ] Add comprehensive error handling:
  - Wrap entire method in try-catch
  - On error: log error message and stack trace
  - Call `sendErrorFallbackMessage(chatId, messageId)` as fallback (implement as simple helper method that sends fallback error message via TelegramService)
- [ ] Ensure all `TelegramService.sendMessage()` calls include `replyToMessageId: messageId` parameter

## Notes

- This task is part of Phase 2: File-by-File Conversion
- Section: 9. CursorRunnerCallbackController Conversion
- **Rails Implementation**: `jarek-va/app/controllers/cursor_runner_callback_controller.rb` (lines 170-218)
- The method is called from `process_callback` method (line 112) with normalized result and original_was_audio flag
- The `result` parameter is a normalized result object (from `normalizeResult` utility - PHASE2-069) with the following structure:
  - `success: boolean` - indicates if cursor command succeeded
  - `request_id: string` - request identifier
  - `repository?: string` - repository name
  - `branch_name?: string` - branch name
  - `iterations: number` - number of iterations (defaults to 0)
  - `max_iterations: number` - max iterations (defaults to 25)
  - `output?: string` - command output (defaults to empty string)
  - `error?: string` - error message if failed
  - `exit_code: number` - exit code (defaults to 0)
  - `duration?: string` - execution duration
  - `timestamp?: string` - timestamp
- The method depends on several helper methods:
  - `formatSuccessMessage` - PHASE2-071 (separate task)
  - `formatErrorMessage` - PHASE2-072 (separate task)
  - `sendTextAsAudio` - PHASE2-074 (separate task)
  - `sendErrorFallbackMessage` - Simple helper method that sends fallback error message (can be implemented inline or as a small helper)
  - `cleanAnsiEscapeSequences` - PHASE2-073 (used by format methods, not directly by this method)
- SystemSetting checks:
  - `SystemSetting.enabled?('debug')` - determines if debug information should be included
  - `SystemSetting.disabled?('allow_audio_output')` - determines if audio output is disabled
- Parse mode fallback logic is critical: Markdown → HTML → plain text ensures message delivery even if formatting fails
- All TelegramService calls must include `replyToMessageId` to maintain conversation context
- Error handling ensures user always receives feedback even if formatting or sending fails
- Task can be completed independently by a single agent (after dependencies PHASE2-071, PHASE2-072, and PHASE2-074 are complete)

## Related Tasks

- Previous: PHASE2-069
- Next: PHASE2-071

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
