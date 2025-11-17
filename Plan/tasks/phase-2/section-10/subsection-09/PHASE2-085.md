# PHASE2-085: Implement send_text_as_audio method

**Section**: 10. TelegramMessageJob Conversion
**Subsection**: 10.9
**Task ID**: PHASE2-085

## Description

Convert the `send_text_as_audio` method from Rails to TypeScript/Node.js. This method converts text to speech using ElevenLabs and sends it as a voice message via Telegram. Reference `jarek-va/app/jobs/telegram_message_job.rb` (lines 355-389).

The method takes text input, synthesizes it to audio using ElevenLabs Text-to-Speech service, sends the audio file as a voice message via Telegram, and handles cleanup and error fallback.

**Note**: The audio output check (`SystemSetting.disabled?('allow_audio_output')`) is performed by the caller before invoking this method. This method should focus solely on the text-to-speech conversion and sending functionality.

## Method Signature

```typescript
private async sendTextAsAudio(
  chatId: number,
  text: string,
  messageId: number
): Promise<void>
```

## Checklist

- [ ] Create `sendTextAsAudio` method with proper signature (chatId, text, messageId)
- [ ] Initialize audio path variable (null/undefined initially)
- [ ] Use try/catch/finally block for error handling and cleanup
- [ ] Call `ElevenLabsTextToSpeechService.synthesize(text)` to generate audio file
  - Service returns a file path to the generated audio file
  - Handle service errors appropriately
- [ ] Send audio file via `TelegramService.sendVoice(chatId, voicePath, messageId)`
  - Pass chatId, voice_path (audio file path), and reply_to_message_id (messageId)
- [ ] Implement error handling in catch block:
  - Log error with logger (include error message and stack trace)
  - Fallback to sending text message via `TelegramService.sendMessage` with same parameters
- [ ] Implement cleanup in finally block:
  - Check if audio file path exists
  - Delete the audio file if it exists
  - Log cleanup actions (success or warnings)
  - Handle file deletion errors gracefully (log warnings, don't throw)
- [ ] Add appropriate logging:
  - Log errors when text-to-speech conversion fails
  - Log cleanup actions (file deletion success/failure)

## Notes

- This task is part of Phase 2: File-by-File Conversion
- Section: 10. TelegramMessageJob Conversion
- Reference the Rails implementation for behavior

**Rails Implementation Details:**
- Located in `jarek-va/app/jobs/telegram_message_job.rb` (lines 355-389)
- Uses `begin/rescue/ensure` pattern (equivalent to try/catch/finally in TypeScript)
- Calls `ElevenLabsTextToSpeechService.new.synthesize(text)` which returns a file path
- Calls `TelegramService.send_voice(chat_id: chat_id, voice_path: audio_path, reply_to_message_id: message_id)`
- On error, falls back to `TelegramService.send_message` with the original text
- File cleanup happens in `ensure` block, checking if file exists before deletion
- Logs errors using `Rails.logger.error` with message and backtrace
- Logs cleanup actions (success and warnings)

**Dependencies:**
- Requires `ElevenLabsTextToSpeechService` (converts text to audio file)
- Requires `TelegramService.sendVoice` method (sends voice message)
- Requires `TelegramService.sendMessage` method (fallback for errors)
- Requires file system operations for cleanup

**Error Handling:**
- Any error during synthesis or sending should be caught
- Fallback to text message ensures user always receives a response
- File cleanup should never throw errors (warn only)

- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE2-084
- Next: PHASE2-086

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
