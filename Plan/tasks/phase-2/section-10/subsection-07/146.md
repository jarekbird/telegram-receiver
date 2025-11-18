# PHASE2-083: Implement forward_to_cursor_runner method

**Section**: 10. TelegramMessageJob Conversion
**Subsection**: 10.7
**Task ID**: PHASE2-083

## Description

Convert the `forward_to_cursor_runner` method from Rails to TypeScript/Node.js. This method forwards Telegram messages to cursor-runner for processing, skipping local commands and managing callback state in Redis. Reference `jarek-va/app/jobs/telegram_message_job.rb` (lines 173-251).

## Method Signature

```typescript
forwardToCursorRunner(
  message: TelegramMessage,
  chatId: number,
  messageId: number,
  originalWasAudio?: boolean
): boolean
```

## Checklist

- [ ] Create `forwardToCursorRunner` method with correct signature
- [ ] Extract message text from `message.text`
- [ ] Return `false` if message text is blank/empty
- [ ] Skip local commands: check if message matches `/start`, `/help`, or `/status` (case-insensitive regex) and return `false`
- [ ] Return `false` if `chatId` is blank/null/undefined
- [ ] Generate unique `requestId`: format `"telegram-{unixTimestamp}-{8HexChars}"` where timestamp is Unix seconds and hex is 8 characters from 4 random bytes (e.g., `"telegram-1234567890-a1b2c3d4"`)
- [ ] Store pending request in Redis using `CursorRunnerCallbackService.storePendingRequest`:
  - Store data object: `{ chatId, messageId, prompt: messageText, originalWasAudio, createdAt: ISO8601 timestamp }`
  - Set TTL to 3600 seconds (1 hour)
- [ ] Set `repository` to empty string `''`
- [ ] Call `CursorRunnerService.iterate` with parameters:
  - `repository`: `''` (empty string)
  - `branchName`: `'main'`
  - `prompt`: `messageText`
  - `maxIterations`: `25`
  - `requestId`: generated request ID
  - (callbackUrl is optional and auto-constructed by cursor-runner)
- [ ] Log operation: log info message with `requestId`, `repository`, and truncated prompt (first 50 chars)
- [ ] Send acknowledgment message to Telegram ONLY if debug mode is enabled (`cursorDebugEnabled()`):
  - Message: `"⏳ Processing your request... I'll send the results when complete."`
  - Use `replyToMessageId: messageId`
  - Use `parseMode: 'HTML'`
- [ ] Return `true` to indicate message was forwarded successfully
- [ ] Add error handling:
  - Catch `CursorRunnerService.Error` exceptions
  - Log warning with error message
  - Remove pending request from Redis using `CursorRunnerCallbackService.removePendingRequest(requestId)` if request was created
  - Send error message to Telegram if `chatId` is present:
    - Message: `"❌ Error: Failed to execute cursor command. {errorMessage}"`
    - Use `replyToMessageId: messageId`
    - Use `parseMode: 'HTML'`
  - Return `true` even on error (to prevent duplicate processing)

## Implementation Details

### Method Behavior

1. **Early Returns**: The method returns `false` immediately if:
   - Message text is blank/empty
   - Message matches local commands (`/start`, `/help`, `/status`)
   - `chatId` is blank/null/undefined

2. **Request ID Generation**: Format is `"telegram-{unixTimestamp}-{4ByteHex}"` (e.g., `"telegram-1704067200-a1b2c3d4"`)

3. **Redis Storage**: Stores callback state with 1-hour TTL for later retrieval when cursor-runner sends callback

4. **Cursor Runner Call**: Uses empty repository string and fixed branch `'main'` for Telegram messages

5. **Debug Mode**: Acknowledgment message is only sent if system setting `debug` is enabled

6. **Error Handling**: On `CursorRunnerService.Error`:
   - Cleans up Redis entry if created
   - Notifies user via Telegram
   - Returns `true` to prevent duplicate processing

### Dependencies

- `CursorRunnerService` - for calling cursor-runner API
- `CursorRunnerCallbackService` - for managing Redis callback state
- `TelegramService` - for sending messages to Telegram
- `SystemSetting` - for checking debug mode status
- `SecureRandom` or crypto library - for generating request ID

## Notes

- This task is part of Phase 2: File-by-File Conversion
- Section: 10. TelegramMessageJob Conversion
- Reference the Rails implementation at `jarek-va/app/jobs/telegram_message_job.rb` lines 173-251 for exact behavior
- The method is called from `handleMessage` and `handleCallbackQuery` methods
- The `originalWasAudio` parameter is used to determine response format in callbacks
- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE2-082
- Next: PHASE2-084

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
