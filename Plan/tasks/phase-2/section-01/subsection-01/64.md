# PHASE2-001: Create Telegram API types

**Section**: 1. TypeScript Type Definitions
**Subsection**: 1.1
**Task ID**: PHASE2-001

## Description

Create TypeScript type definitions for Telegram Bot API. These types will be used throughout the application for type safety when working with Telegram updates, messages, and API responses.

## Checklist

- [ ] Create `src/types/telegram.ts` file
- [ ] Define `TelegramUpdate` interface for webhook updates
  - Should include optional fields: `message`, `edited_message`, `callback_query`
- [ ] Define `TelegramMessage` interface for message objects
  - Required fields: `message_id` (number), `chat` (TelegramChat)
  - Optional fields: `text` (string), `from` (TelegramUser), `voice` (TelegramVoice), `audio` (TelegramAudio), `document` (TelegramDocument)
- [ ] Define `TelegramChat` interface for chat information
  - Required fields: `id` (number)
  - Optional fields: `type`, `title`, `username` (refer to Telegram Bot API docs)
- [ ] Define `TelegramUser` interface for user information
  - Required fields: `id` (number)
  - Optional fields: `first_name`, `last_name`, `username` (refer to Telegram Bot API docs)
- [ ] Define `TelegramCallbackQuery` interface for callback queries
  - Required fields: `id` (string), `data` (string)
  - Optional fields: `message` (TelegramMessage), `from` (TelegramUser)
- [ ] Define `TelegramFile` interface for file information (from get_file API)
  - Should match structure: `{ result: { file_path: string } }`
  - Note: `file_id` is the input parameter, not part of the response structure
- [ ] Define `TelegramVoice` interface for voice/audio messages
  - Required fields: `file_id` (string)
  - Optional fields: `duration`, `mime_type`, `file_size` (refer to Telegram Bot API docs)
- [ ] Define `TelegramAudio` interface for audio messages
  - Required fields: `file_id` (string)
  - Optional fields: `duration`, `performer`, `title`, `mime_type`, `file_size` (refer to Telegram Bot API docs)
- [ ] Define `TelegramDocument` interface for document messages
  - Required fields: `file_id` (string)
  - Optional fields: `mime_type` (string), `file_name`, `file_size` (refer to Telegram Bot API docs)
- [ ] Define `SendMessageParams` interface for sending messages
  - Required fields: `chat_id` (number), `text` (string)
  - Optional fields: `parse_mode` ('HTML' | 'Markdown' | 'MarkdownV2' | null), `reply_to_message_id` (number)
  - Note: `parse_mode` can be `null` for plain text (no formatting)
- [ ] Define `SendVoiceParams` interface for sending voice messages
  - Required fields: `chat_id` (number), `voice_path` (string - local file path)
  - Optional fields: `reply_to_message_id` (number), `caption` (string)
  - Note: `voice_path` is a local file path, not a Telegram file_id
- [ ] Define `SetWebhookParams` interface for webhook configuration
  - Required fields: `url` (string)
  - Optional fields: `secret_token` (string)
- [ ] Define `AnswerCallbackQueryParams` interface for answering callback queries
  - Required fields: `callback_query_id` (string)
  - Optional fields: `text` (string), `show_alert` (boolean)
- [ ] Define `GetFileParams` interface for getting file information
  - Required fields: `file_id` (string)
- [ ] Define `WebhookInfo` interface for webhook information
  - Required fields: `url` (string), `pending_update_count` (number)
  - Optional fields: Refer to Telegram Bot API docs for additional fields (last_error_date, last_error_message, etc.)
  - Note: This is the structure inside the `result` field of `TelegramApiResponse<WebhookInfo>`
- [ ] Define `TelegramApiResponse<T>` generic type for API responses
  - Required fields: `ok` (boolean)
  - When `ok` is `true`: `result` (T) field is present
  - When `ok` is `false`: `description` (string) and `error_code` (number) fields are present
  - Note: This matches Telegram Bot API response structure
- [ ] Export all types and interfaces

## Notes

- This task is part of Phase 2: File-by-File Conversion
- Section: 1. TypeScript Type Definitions
- Reference the Telegram Bot API documentation: https://core.telegram.org/bots/api
- Types should match the structure used in the Rails application
- Task can be completed independently by a single agent

### Implementation Details

Based on the Rails implementation analysis:

1. **TelegramUpdate** is the root object received from webhook. It contains one of: `message`, `edited_message`, or `callback_query`.

2. **TelegramMessage** is used extensively throughout the codebase. Key fields accessed:
   - `message['chat']['id']` - Chat ID (number)
   - `message['text']` - Message text (string, optional)
   - `message['message_id']` - Message ID (number)
   - `message['voice']` - Voice message (optional)
   - `message['audio']` - Audio message (optional)
   - `message['document']` - Document (optional, used for audio files with mime_type)

3. **TelegramDocument** is used in `extract_audio_file_id` method to handle audio files sent as documents. Must include `file_id` and `mime_type` fields.

4. **AnswerCallbackQueryParams** is needed for the `answer_callback_query` API call used in `telegram_message_job.rb`.

5. **SendVoiceParams** uses `voice_path` which is a local file path (not a Telegram file_id). This is different from Telegram's native `sendVoice` API which uses file_id or file upload.

6. **TelegramFile** structure matches the response from `get_file` API: `{ result: { file_path: string } }`. The `file_id` is the input parameter, not part of the response structure.

7. All optional fields should be marked with `?` in TypeScript. Required fields should not have `?`.

8. **parse_mode** in `SendMessageParams` can be `null` for plain text messages (no formatting). The Rails code shows fallback patterns that use `nil` parse_mode when HTML/Markdown parsing fails.

9. **WebhookInfo** structure includes at least `url` (string) and `pending_update_count` (number) based on usage in `telegram_service_spec.rb`. Additional fields may be present per Telegram Bot API documentation.

10. **TelegramApiResponse<T>** should handle both success (`ok: true, result: T`) and error (`ok: false, description: string, error_code: number`) cases.

## Related Tasks

- Previous: PHASE1-063 (Phase 1 completion)
- Next: PHASE2-002

## Reference Implementation

Refer to `jarek-va/app/jobs/telegram_message_job.rb` and `jarek-va/app/services/telegram_service.rb` to understand the data structures used.

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

