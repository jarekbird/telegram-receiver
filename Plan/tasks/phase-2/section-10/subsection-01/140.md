# PHASE2-077: Create TelegramMessageJob processor class

**Section**: 10. TelegramMessageJob Conversion
**Subsection**: 10.1
**Task ID**: PHASE2-077

## Description

Convert the TelegramMessageJob processor class from Rails to TypeScript/Node.js. This job processes Telegram updates asynchronously, allowing the webhook endpoint to return 200 OK immediately. It handles messages, edited messages, and callback queries, with support for audio transcription, text-to-speech, and forwarding messages to cursor-runner.

Reference: `jarek-va/app/jobs/telegram_message_job.rb`

## Checklist

### File Structure
- [ ] Create `src/jobs/telegram-message-job.ts` file
- [ ] Create `src/jobs/` directory if it doesn't exist
- [ ] Extend base job processor class (ApplicationJob equivalent)
- [ ] Define job name constant (e.g., `JOB_NAME = 'telegram-message'`)
- [ ] Configure queue name (default queue)

### Core Functionality
- [ ] Implement `perform(update)` method - main entry point
  - [ ] Parse JSON string if update is a string
  - [ ] Convert update to allow string or number key access (equivalent to Rails `with_indifferent_access`)
  - [ ] Handle different update types (message, edited_message, callback_query)
  - [ ] Route to appropriate handler method
  - [ ] Log unhandled update types (log update keys if no handler matches)
  - [ ] Implement comprehensive error handling with try-catch
  - [ ] Extract chat info from update for error messages
  - [ ] Send error message to Telegram if chat_id is available (use parse_mode: 'HTML')
  - [ ] Log all errors with stack traces
  - [ ] Re-raise errors after handling to mark job as failed

### Message Handling
- [ ] Implement `handleMessage(message)` method
  - [ ] Extract chat_id, text, and message_id from message (use safe navigation/optional chaining)
  - [ ] Track if original message was audio/voice (before transcription)
  - [ ] Check for audio/voice messages and transcribe if present
  - [ ] Replace text with transcribed text if transcription succeeds
  - [ ] Update message object with transcribed text (create copy of message object, set text property)
  - [ ] Handle transcription errors gracefully with user feedback
  - [ ] Truncate transcription error messages to 4000 characters (leave room for prefix text)
  - [ ] Return early if transcription fails (after sending error message)
  - [ ] Forward message to cursor-runner (returns true if forwarded)
  - [ ] Process local commands if not forwarded
  - [ ] Send response back to Telegram (only if result.say is present and chat_id is present)
  - [ ] Send response as audio if original was audio and audio output is enabled
  - [ ] Send response as text otherwise (use parse_mode: 'HTML')

### Callback Query Handling
- [ ] Implement `handleCallbackQuery(callbackQuery)` method
  - [ ] Extract message and data from callback query
  - [ ] Answer callback query with "Processing..." status using TelegramService.bot.api.answer_callback_query()
  - [ ] Handle errors when answering callback query gracefully (log but don't fail)
  - [ ] Return early if message or message.chat is missing
  - [ ] Extract chat_id and message_id from callback message
  - [ ] Forward callback data to cursor-runner as a prompt (create message-like object with text=data)
  - [ ] Send simple response if not forwarded ("You selected: {data}")

### Cursor Runner Integration
- [ ] Implement `forwardToCursorRunner(message, chatId, messageId, originalWasAudio?)` method
  - [ ] Extract message text, return false if blank
  - [ ] Skip local commands using regex pattern matching (/start, /help, /status) - case insensitive
  - [ ] Return false if chat_id is blank
  - [ ] Generate unique request ID (format: "telegram-{timestamp}-{random-hex-4-chars}")
  - [ ] Store pending request in Redis via CursorRunnerCallbackService
  - [ ] Store chat_id, message_id, prompt, original_was_audio, created_at (ISO8601 format)
  - [ ] Set TTL to 3600 seconds (1 hour)
  - [ ] Pass blank repository value ('') for Telegram messages
  - [ ] Call CursorRunnerService.iterate() with repository, branch_name='main', prompt, max_iterations=25, request_id
  - [ ] Log successful forwarding with request_id and truncated prompt (first 50 chars)
  - [ ] Send immediate acknowledgment if cursor debug is enabled (parse_mode: 'HTML')
  - [ ] Handle CursorRunnerService::Error exceptions specifically
  - [ ] Clean up pending request on error (remove from Redis)
  - [ ] Send error message to Telegram on failure (parse_mode: 'HTML')
  - [ ] Return true to indicate message was forwarded (even on error to prevent duplicate processing)

### Local Message Processing
- [ ] Implement `processLocalMessage(text, chatId, messageId)` method
  - [ ] Normalize text (downcase, strip whitespace) before matching
  - [ ] Handle `/start` and `/help` commands using regex pattern matching (case insensitive)
  - [ ] Handle `/status` command using regex pattern matching (case insensitive)
  - [ ] Return default response for other messages
  - [ ] Return object with `ok: true` and `say` properties (string message)
  - [ ] Help message should include available commands (/help, /status)

### Utility Methods
- [ ] Implement `extractChatInfoFromUpdate(update)` method
  - [ ] Extract chat_id and message_id from message updates (use safe navigation/optional chaining)
  - [ ] Extract chat_id and message_id from edited_message updates (use safe navigation)
  - [ ] Extract chat_id and message_id from callback_query updates (nested: callback_query.message.chat.id)
  - [ ] Return [chatId, messageId] tuple or [null, null] if not found
  - [ ] Handle missing chat or message objects gracefully

- [ ] Implement `extractAudioFileId(message)` method
  - [ ] Check for voice message (most common)
  - [ ] Check for audio file
  - [ ] Check for document with audio mime type
  - [ ] Return file_id or null

- [ ] Implement `transcribeAudio(fileId, chatId, messageId)` method
  - [ ] Send processing message if cursor debug is enabled (parse_mode: 'HTML')
  - [ ] Handle errors when sending processing message (log warning, don't fail)
  - [ ] Download audio file using TelegramService.downloadFile()
  - [ ] Log downloaded file path
  - [ ] Transcribe using ElevenLabsSpeechToTextService
  - [ ] Clean up downloaded file in finally block (check if file exists before deleting)
  - [ ] Handle file deletion errors gracefully (log warning)
  - [ ] Return transcribed text (or null/undefined if transcription fails)

- [ ] Implement `sendTextAsAudio(chatId, text, messageId)` method
  - [ ] Generate audio from text using ElevenLabsTextToSpeechService
  - [ ] Send as voice message using TelegramService.sendVoice() with reply_to_message_id
  - [ ] Fallback to text message if audio generation fails (parse_mode: 'HTML')
  - [ ] Log errors with stack traces when audio generation fails
  - [ ] Clean up generated audio file in finally block (check if file exists before deleting)
  - [ ] Handle file deletion errors gracefully (log warning)

- [ ] Implement `cursorDebugEnabled()` method
  - [ ] Check SystemSetting.enabled?('debug') (note: method name has question mark)
  - [ ] Return boolean

### Dependencies and Imports
- [ ] Import TelegramService
- [ ] Import CursorRunnerService
- [ ] Import CursorRunnerCallbackService
- [ ] Import ElevenLabsSpeechToTextService
- [ ] Import ElevenLabsTextToSpeechService
- [ ] Import SystemSetting model/service
- [ ] Import base job processor class
- [ ] Import required types (TelegramUpdate, TelegramMessage, etc.)
- [ ] Import crypto/random utilities for request ID generation
- [ ] Import logging utilities

### Error Handling
- [ ] Wrap perform method in try-catch
- [ ] Log errors with full stack traces
- [ ] Send user-friendly error messages to Telegram (format: "Sorry, I encountered an error processing your message: {error.message}")
- [ ] Use parse_mode: 'HTML' for all Telegram error messages
- [ ] Handle errors when sending error messages (log but don't fail)
- [ ] Handle file cleanup errors gracefully (log warnings)
- [ ] Handle service errors (CursorRunnerService::Error, TelegramService errors, etc.)
- [ ] Truncate error messages if needed (e.g., transcription errors to 4000 chars)
- [ ] Re-raise errors to mark job as failed (after handling)

### Testing Considerations
- [ ] Test perform method with different update types
- [ ] Test message handling with text messages
- [ ] Test message handling with audio messages
- [ ] Test callback query handling
- [ ] Test forwardToCursorRunner with various scenarios
- [ ] Test local command processing
- [ ] Test error handling and recovery
- [ ] Test audio transcription flow
- [ ] Test text-to-speech flow
- [ ] Test file cleanup in error scenarios

## Notes

- This task is part of Phase 2: File-by-File Conversion
- Section: 10. TelegramMessageJob Conversion
- Reference the Rails implementation for behavior: `jarek-va/app/jobs/telegram_message_job.rb`

### Dependencies
This job depends on the following services (which should be converted in earlier tasks):
- TelegramService - for sending messages, downloading files, sending voice messages
- CursorRunnerService - for forwarding messages to cursor-runner
- CursorRunnerCallbackService - for storing pending requests in Redis
- ElevenLabsSpeechToTextService - for audio transcription
- ElevenLabsTextToSpeechService - for text-to-speech conversion
- SystemSetting - for checking debug mode and audio output settings

### Key Implementation Details
- The job processes updates asynchronously to allow webhook to return 200 OK immediately
- Updates can be passed as JSON strings or objects (parse if string)
- Use safe navigation/optional chaining when accessing nested properties (equivalent to Rails `&.` operator)
- Audio messages are transcribed before processing
- When audio is transcribed, the message object is updated with the transcribed text (create copy, don't mutate original)
- Messages are forwarded to cursor-runner unless they are local commands (/start, /help, /status) - use regex matching, case insensitive
- If original message was audio and audio output is NOT disabled, responses are sent as voice messages
- Request IDs are generated in format: "telegram-{timestamp}-{random-hex-4-chars}"
- Pending requests are stored in Redis with 1 hour TTL (3600 seconds)
- Error handling includes sending user-friendly messages to Telegram with parse_mode: 'HTML'
- File cleanup is critical - downloaded and generated audio files must be deleted in finally blocks
- Transcription error messages are truncated to 4000 characters (leaving room for prefix text)
- forwardToCursorRunner returns true even on error to prevent duplicate processing
- Callback queries are answered using TelegramService.bot.api.answer_callback_query()
- All Telegram messages use parse_mode: 'HTML' (including error messages and responses)
- CursorRunnerService.iterate() is called with max_iterations=25 and branch_name='main'

### Queue Configuration
- Queue name: "default"
- Should extend base job processor class (equivalent to ApplicationJob in Rails)
- Retry configuration: exponential backoff, 3 attempts (matches Rails ApplicationJob)
- Job should be retried on StandardError exceptions
- Job should be discarded on deserialization errors (if applicable)

### Task Scope
- Task can be completed independently by a single agent
- However, ensure dependent services are available or mocked for testing

## Related Tasks

- Previous: PHASE2-076
- Next: PHASE2-078

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
