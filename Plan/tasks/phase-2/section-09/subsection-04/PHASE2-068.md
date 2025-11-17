# PHASE2-068: Implement process_callback method

**Section**: 9. CursorRunnerCallbackController Conversion
**Subsection**: 9.4
**Task ID**: PHASE2-068

## Description

Convert and implement the `process_callback` private method from Rails to TypeScript/Node.js. This method processes callback results from cursor-runner, normalizes the result data, extracts chat information from pending request data, sends formatted responses to Telegram, and cleans up the pending request from Redis.

**Reference**: `jarek-va/app/controllers/cursor_runner_callback_controller.rb` (lines 93-139)

**Method Signature**: `private processCallback(requestId: string, result: any, pendingData: any): Promise<void>`

**Rails Implementation Overview:**
- Logs callback processing with request_id and success status
- Normalizes result data using `normalize_result` method (handles camelCase/snake_case)
- Extracts chat_id, message_id, and original_was_audio from pending_data
- Validates chat_id and returns early if blank (with warning log)
- Sends response to Telegram using `send_response_to_telegram` method
- Cleans up pending request using `CursorRunnerCallbackService.remove_pending_request`
- Comprehensive error handling that attempts to send error notifications to user via Telegram

## Checklist

- [ ] Create `processCallback` private method with signature: `private async processCallback(requestId: string, result: any, pendingData: any): Promise<void>`
- [ ] Add logging at method start
  - [ ] Log callback processing with request_id and success status
  - [ ] Format: "Processing cursor-runner callback (request_id: {requestId}, success: {result.success})"
- [ ] Normalize result data
  - [ ] Call `normalizeResult(result)` method to handle camelCase/snake_case conversion
  - [ ] Store normalized result for use in subsequent steps
- [ ] Extract chat info from pending data
  - [ ] Extract `chat_id` (handle both symbol keys `:chat_id` and string keys `'chat_id'`)
  - [ ] Extract `message_id` (handle both symbol keys `:message_id` and string keys `'message_id'`)
  - [ ] Extract `original_was_audio` (handle both symbol and string keys, default to `false` if not present)
- [ ] Validate chat_id
  - [ ] Check if chat_id is blank/undefined/null
  - [ ] If blank, log warning: "Callback processed but no chat_id found (request_id: {requestId})"
  - [ ] Return early if chat_id is blank (don't process further)
- [ ] Send response to Telegram
  - [ ] Call `sendResponseToTelegram(chatId, messageId, normalizedResult, { originalWasAudio: originalWasAudio })`
  - [ ] Pass the normalized result and original_was_audio flag
- [ ] Clean up pending request
  - [ ] Create instance of `CursorRunnerCallbackService`
  - [ ] Call `removePendingRequest(requestId)` to delete pending request from Redis
  - [ ] This should happen after successful Telegram response sending
- [ ] Add comprehensive error handling
  - [ ] Wrap entire method body in try-catch block
  - [ ] Log errors with request_id and full stack trace (first 10 lines)
  - [ ] Extract chat_id and message_id from pending_data in error handler
  - [ ] If chat_id is available, attempt to send error message to user via Telegram
  - [ ] Error message format: "❌ Error processing cursor command result: {error.message}"
  - [ ] Use HTML parse mode for error message
  - [ ] Reply to original message_id
  - [ ] Handle errors when sending error notifications (nested try-catch)

## Dependencies

- `normalizeResult` method - Must be implemented (handles camelCase/snake_case conversion)
- `sendResponseToTelegram` method - Must be implemented (formats and sends response to Telegram)
- `CursorRunnerCallbackService` - For removing pending requests from Redis
- `TelegramService` - For sending error notifications to Telegram

## Notes

- This task is part of Phase 2: File-by-File Conversion
- Section: 9. CursorRunnerCallbackController Conversion
- Reference the Rails implementation in `jarek-va/app/controllers/cursor_runner_callback_controller.rb` (lines 93-139) for complete behavior

**Rails Implementation Details:**
- Method is called from `create` action after retrieving pending_data from Redis
- Handles both symbol keys (`:chat_id`) and string keys (`'chat_id'`) in pending_data (from JSON parsing)
- Normalizes result to handle both camelCase and snake_case formats from cursor-runner
- Always attempts to clean up pending request, even if errors occur
- Error handling ensures user is notified of failures via Telegram when possible

**TypeScript/Node.js Considerations:**
- Use async/await for service calls
- Handle both symbol and string keys in pendingData (JSON.parse may return either)
- Properly type the result and pendingData parameters
- Ensure error handling doesn't throw unhandled exceptions
- Method should be private and async

- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE2-067
- Next: PHASE2-069

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
