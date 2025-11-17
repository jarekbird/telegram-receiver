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
  - [ ] Handle different update types (message, edited_message, callback_query)
  - [ ] Route to appropriate handler method
  - [ ] Implement comprehensive error handling with try-catch
  - [ ] Extract chat info from update for error messages
  - [ ] Send error message to Telegram if chat_id is available
  - [ ] Log all errors with stack traces

### Message Handling
- [ ] Implement `handleMessage(message)` method
  - [ ] Extract chat_id, text, and message_id from message
  - [ ] Track if original message was audio/voice
  - [ ] Check for audio/voice messages and transcribe if present
  - [ ] Replace text with transcribed text if transcription succeeds
  - [ ] Handle transcription errors gracefully with user feedback
  - [ ] Forward message to cursor-runner (returns true if forwarded)
  - [ ] Process local commands if not forwarded
  - [ ] Send response back to Telegram
  - [ ] Send response as audio if original was audio and audio output is enabled
  - [ ] Send response as text otherwise

### Callback Query Handling
- [ ] Implement `handleCallbackQuery(callbackQuery)` method
  - [ ] Extract message and data from callback query
  - [ ] Answer callback query with "Processing..." status
  - [ ] Extract chat_id and message_id from callback message
  - [ ] Forward callback data to cursor-runner as a prompt
  - [ ] Send simple response if not forwarded

### Cursor Runner Integration
- [ ] Implement `forwardToCursorRunner(message, chatId, messageId, originalWasAudio?)` method
  - [ ] Extract message text, return false if blank
  - [ ] Skip local commands (/start, /help, /status)
  - [ ] Return false if chat_id is blank
  - [ ] Generate unique request ID (format: "telegram-{timestamp}-{random}")
  - [ ] Store pending request in Redis via CursorRunnerCallbackService
  - [ ] Store chat_id, message_id, prompt, original_was_audio, created_at
  - [ ] Set TTL to 3600 seconds (1 hour)
  - [ ] Pass blank repository value for Telegram messages
  - [ ] Call CursorRunnerService.iterate() with repository, branch_name, prompt, max_iterations, request_id
  - [ ] Send immediate acknowledgment if cursor debug is enabled
  - [ ] Handle CursorRunnerService errors gracefully
  - [ ] Clean up pending request on error
  - [ ] Send error message to Telegram on failure
  - [ ] Return true to indicate message was forwarded (even on error to prevent duplicate processing)

### Local Message Processing
- [ ] Implement `processLocalMessage(text, chatId, messageId)` method
  - [ ] Handle `/start` and `/help` commands
  - [ ] Handle `/status` command
  - [ ] Return default response for other messages
  - [ ] Return object with `ok` and `say` properties

### Utility Methods
- [ ] Implement `extractChatInfoFromUpdate(update)` method
  - [ ] Extract chat_id and message_id from message updates
  - [ ] Extract chat_id and message_id from edited_message updates
  - [ ] Extract chat_id and message_id from callback_query updates
  - [ ] Return [chatId, messageId] tuple or [null, null]

- [ ] Implement `extractAudioFileId(message)` method
  - [ ] Check for voice message (most common)
  - [ ] Check for audio file
  - [ ] Check for document with audio mime type
  - [ ] Return file_id or null

- [ ] Implement `transcribeAudio(fileId, chatId, messageId)` method
  - [ ] Send processing message if cursor debug is enabled
  - [ ] Download audio file using TelegramService.downloadFile()
  - [ ] Transcribe using ElevenLabsSpeechToTextService
  - [ ] Clean up downloaded file in finally block
  - [ ] Return transcribed text

- [ ] Implement `sendTextAsAudio(chatId, text, messageId)` method
  - [ ] Generate audio from text using ElevenLabsTextToSpeechService
  - [ ] Send as voice message using TelegramService.sendVoice()
  - [ ] Fallback to text message if audio generation fails
  - [ ] Clean up generated audio file in finally block

- [ ] Implement `cursorDebugEnabled()` method
  - [ ] Check SystemSetting.enabled('debug')
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
- [ ] Send user-friendly error messages to Telegram
- [ ] Handle file cleanup errors gracefully
- [ ] Handle service errors (CursorRunnerService, TelegramService, etc.)
- [ ] Re-raise errors to mark job as failed

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
- Audio messages are transcribed before processing
- Messages are forwarded to cursor-runner unless they are local commands (/start, /help, /status)
- If original message was audio and audio output is enabled, responses are sent as voice messages
- Request IDs are generated in format: "telegram-{timestamp}-{random-hex}"
- Pending requests are stored in Redis with 1 hour TTL
- Error handling includes sending user-friendly messages to Telegram
- File cleanup is critical - downloaded and generated audio files must be deleted

### Queue Configuration
- Queue name: "default"
- Should extend base job processor class (equivalent to ApplicationJob in Rails)
- May need retry logic similar to Rails implementation (exponential backoff, 3 attempts)

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
