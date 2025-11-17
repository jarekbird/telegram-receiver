# PHASE2-066: Implement callback endpoint handler

**Section**: 9. CursorRunnerCallbackController Conversion
**Subsection**: 9.2
**Task ID**: PHASE2-066

## Description

Convert the callback endpoint handler (`create` method) from Rails to TypeScript/Node.js. This endpoint receives webhook callbacks from cursor-runner when iterate operations complete. It authenticates the webhook, retrieves pending request data from Redis, processes the callback result, and sends formatted responses to Telegram.

**Route**: `POST /cursor-runner/callback`

**Reference**: `jarek-va/app/controllers/cursor_runner_callback_controller.rb`

## Checklist

### Main Handler (`create` method)
- [ ] Implement webhook authentication middleware/handler (`authenticate_webhook`)
  - [ ] Check for `X-Webhook-Secret` or `X-Cursor-Runner-Secret` headers
  - [ ] Check for `secret` query parameter
  - [ ] Compare against configured webhook secret (from environment/config)
  - [ ] Allow if secret matches or if secret is not configured (development mode)
  - [ ] Return 401 Unauthorized if secret is invalid
  - [ ] Log unauthorized attempts with IP address
- [ ] Parse request body parameters
  - [ ] Accept: `success`, `requestId`/`request_id`, `repository`, `branchName`/`branch_name`, `iterations`, `maxIterations`/`max_iterations`, `output`, `error`, `exitCode`/`exit_code`, `duration`, `timestamp`
- [ ] Extract and normalize `request_id`
  - [ ] Handle both camelCase (`requestId`) and snake_case (`request_id`) formats
  - [ ] Validate that `request_id` is present and not blank
  - [ ] Return 400 Bad Request if `request_id` is missing
  - [ ] Log callback receipt with request_id and success status
- [ ] Retrieve pending request from Redis using `CursorRunnerCallbackService`
  - [ ] Use `get_pending_request(request_id)` method
  - [ ] Handle case where pending_data is `null` (unknown request_id)
  - [ ] If pending_data is null, log warning and return 200 OK (to prevent cursor-runner retries)
- [ ] Process callback synchronously
  - [ ] Call `process_callback(request_id, result, pending_data)` method
- [ ] Return 200 OK response
  - [ ] Response format: `{ received: true, request_id: request_id }`
- [ ] Implement comprehensive error handling
  - [ ] Wrap entire handler in try-catch
  - [ ] Log errors with full stack trace (first 5 lines)
  - [ ] Attempt to send error notification to user if pending_data exists
  - [ ] Always return 200 OK even on errors (to prevent cursor-runner retries)
  - [ ] Error response format: `{ received: true, error: 'Internal error' }`

### Callback Processing (`process_callback` method)
- [ ] Normalize result data
  - [ ] Call `normalize_result(result)` to handle camelCase/snake_case conversion
  - [ ] Convert success to boolean (handle string "true"/"false", 1/0, etc.)
- [ ] Extract data from pending_data
  - [ ] Extract `chat_id` (handle both symbol and string keys)
  - [ ] Extract `message_id` (handle both symbol and string keys)
  - [ ] Extract `original_was_audio` (default to false if not present)
- [ ] Validate chat_id
  - [ ] Log warning and return early if chat_id is blank
- [ ] Send response to Telegram
  - [ ] Call `send_response_to_telegram(chat_id, message_id, normalized_result, original_was_audio)`
- [ ] Clean up pending request
  - [ ] Call `callback_service.remove_pending_request(request_id)` after successful processing
- [ ] Error handling
  - [ ] Catch and log errors with request_id and stack trace
  - [ ] Attempt to send error message to user via Telegram if chat_id is available
  - [ ] Handle errors when sending error notifications

### Result Normalization (`normalize_result` method)
- [ ] Convert result to normalized format with symbol keys
- [ ] Handle both camelCase and snake_case input formats
- [ ] Normalize `success` field to boolean
  - [ ] Convert: `true`, `'true'`, `1`, `'1'` → `true`
  - [ ] Convert: `false`, `'false'`, `0`, `'0'`, `null` → `false`
- [ ] Normalize `request_id` (handle `requestId`/`request_id`)
- [ ] Normalize `branch_name` (handle `branchName`/`branch_name`)
- [ ] Normalize `max_iterations` (handle `maxIterations`/`max_iterations`, default to 25)
- [ ] Normalize `exit_code` (handle `exitCode`/`exit_code`, default to 0)
- [ ] Normalize other fields: `repository`, `iterations` (default 0), `output` (default ''), `error`, `duration`, `timestamp`

### Telegram Response Sending (`send_response_to_telegram` method)
- [ ] Check if cursor debug is enabled
  - [ ] Use `cursor_debug_enabled?()` which checks `SystemSetting.enabled?('debug')`
- [ ] Format response message
  - [ ] If success: call `format_success_message(result, cursor_debug)`
  - [ ] If error: call `format_error_message(result, cursor_debug)`
- [ ] Handle audio output
  - [ ] If `original_was_audio` is true AND audio output is not disabled
    - [ ] Check `!SystemSetting.disabled?('allow_audio_output')`
    - [ ] Call `send_text_as_audio(chat_id, response_text, message_id)`
  - [ ] Otherwise, send as text message
- [ ] Implement parse mode fallback chain
  - [ ] Try Markdown parse mode first
  - [ ] If Markdown parsing fails, fallback to HTML parse mode
  - [ ] If HTML parsing fails, send as plain text (no parse_mode)
  - [ ] Log warnings for each fallback
- [ ] Error handling
  - [ ] Catch errors when sending to Telegram
  - [ ] Log errors with stack trace
  - [ ] Call `send_error_fallback_message(chat_id, message_id)` on failure

### Audio Response (`send_text_as_audio` method)
- [ ] Generate audio from text using ElevenLabs
  - [ ] Use `ElevenLabsTextToSpeechService.synthesize(text)` to generate audio file
- [ ] Send as voice message to Telegram
  - [ ] Use `TelegramService.send_voice(chat_id, voice_path, reply_to_message_id)`
- [ ] Clean up generated audio file
  - [ ] Delete audio file after sending (in `finally` block)
  - [ ] Log cleanup success/failure
- [ ] Fallback to text message
  - [ ] If audio generation or sending fails, fallback to sending text message with Markdown parse mode
  - [ ] Log errors for audio operations

### Message Formatting Methods
- [ ] `format_success_message(result, cursor_debug)`
  - [ ] Include metadata if cursor_debug is enabled (call `format_metadata`)
  - [ ] Include output if present (call `format_output`)
  - [ ] Include warnings if cursor_debug and error is present (call `format_warnings`)
  - [ ] Join all parts with newlines
- [ ] `format_error_message(result, cursor_debug)`
  - [ ] Clean ANSI escape sequences from error text
  - [ ] If cursor_debug: format as "❌ Cursor command failed\n\nError: {error}"
  - [ ] Otherwise: format as "❌ {error}"
- [ ] `format_metadata(result)`
  - [ ] Return array with: "✅ Cursor command completed successfully", "📊 Iterations: {iterations}", "⏱ Duration: {duration}"
- [ ] `format_output(output, cursor_debug)`
  - [ ] Clean ANSI escape sequences from output
  - [ ] Set max_length: 3500 if cursor_debug, 4000 otherwise
  - [ ] Truncate if exceeds max_length, append "..."
  - [ ] If cursor_debug: wrap in HTML code blocks `<pre><code>{output}</code></pre>`
  - [ ] Otherwise: return plain text
- [ ] `format_warnings(error, cursor_debug)`
  - [ ] Clean ANSI escape sequences from error text
  - [ ] Truncate to 500 characters if longer, append "..."
  - [ ] Format as "⚠️ Warnings:\n<pre><code>{error_text}</code></pre>"
- [ ] `clean_ansi_escape_sequences(text)`
  - [ ] Return empty string if text is blank
  - [ ] Remove ANSI escape codes (pattern: `\u001b\[[?0-9;]*[a-zA-Z]`)
  - [ ] Normalize line endings (`\r\n` → `\n`)
  - [ ] Strip whitespace

### Helper Methods
- [ ] `cursor_debug_enabled?()`
  - [ ] Check `SystemSetting.enabled?('debug')` using cursor-runner-shared-sqlite MCP connection
- [ ] `send_error_fallback_message(chat_id, message_id)`
  - [ ] Send generic error message: "⚠️ Command completed but failed to format response. Check logs for details."
  - [ ] Handle errors when sending fallback message

### Error Notification
- [ ] `send_error_notification(pending_data, error)`
  - [ ] Extract chat_id and message_id from pending_data
  - [ ] Return early if chat_id is blank
  - [ ] Send error message: "❌ Error processing cursor command result: {error.message}"
  - [ ] Use HTML parse mode
  - [ ] Reply to original message_id
  - [ ] Handle errors when sending error notification

## Dependencies

- `CursorRunnerCallbackService` - For Redis operations (get_pending_request, remove_pending_request)
- `TelegramService` - For sending messages and voice messages to Telegram
- `ElevenLabsTextToSpeechService` - For converting text to speech
- `SystemSetting` - For checking debug mode and audio output settings (use cursor-runner-shared-sqlite MCP)
- Webhook secret configuration from environment/config

## Notes

- This task is part of Phase 2: File-by-File Conversion
- Section: 9. CursorRunnerCallbackController Conversion
- Reference the Rails implementation for behavior

- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE2-065
- Next: PHASE2-067

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
