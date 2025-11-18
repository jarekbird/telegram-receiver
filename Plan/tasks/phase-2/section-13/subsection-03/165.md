# PHASE2-102: Create job test fixtures

**Section**: 13. Testing
**Subsection**: 13.3
**Task ID**: PHASE2-102

## Description

Create test fixtures for TelegramMessageJob payloads. These fixtures should cover all update types and scenarios that the job processes, based on the Rails implementation in `jarek-va/app/jobs/telegram_message_job.rb` and `jarek-va/spec/jobs/telegram_message_job_spec.rb`.

The fixtures should provide reusable test data for job payloads that match the Telegram Bot API update structure, including messages, edited messages, callback queries, and various message types (text commands, non-command messages, audio/voice messages).

## Rails Reference

- **Source File**: `jarek-va/app/jobs/telegram_message_job.rb`
- **Test File**: `jarek-va/spec/jobs/telegram_message_job_spec.rb`
- **Existing Fixtures Pattern**: `telegram-receiver/tests/fixtures/telegramMessages.ts`

## Checklist

- [ ] Create `tests/fixtures/job-payloads.ts` file
- [ ] Create basic message update fixture (with /start command)
- [ ] Create non-command message update fixture
- [ ] Create edited message update fixture
- [ ] Create callback query update fixture
- [ ] Create audio/voice message update fixtures (voice, audio, document with audio mime type)
- [ ] Create update with missing chat object (error scenario - matches Rails spec `update_data_no_chat`)
- [ ] Create update as JSON string format (job accepts both Hash and String)
- [ ] Create helper function `createJobPayload(overrides)` for custom payloads
- [ ] Export all fixtures following the pattern in `telegramMessages.ts`
- [ ] Ensure fixtures match Telegram Bot API update structure
- [ ] Include all required fields: update_id, message/edited_message/callback_query, chat, from, message_id, text

## Implementation Details

Based on the Rails spec, the fixtures should include:

1. **Command Message Payload** (`/start`, `/help`, `/status`)
   - Message with text starting with `/` (case-insensitive matching in Rails)
   - Structure matches Rails spec `message_data`: `{ message_id: number, text: string, chat: { id: number }, from: { id: number, username: string } }`
   - Wrapped in update: `{ update_id: number, message: { ... } }`
   - These commands are handled locally and not forwarded to cursor-runner

2. **Non-Command Message Payload**
   - Regular text message that gets forwarded to cursor-runner
   - Should not match `/start`, `/help`, or `/status` patterns (case-insensitive)
   - Structure matches Rails spec `non_command_message`: `{ message_id: number, text: string, chat: { id: number }, from: { id: number, username: string } }`
   - Wrapped in update: `{ update_id: number, message: { ... } }`

3. **Edited Message Payload**
   - Uses `edited_message` field instead of `message` field at the update level
   - Same structure as regular message: `{ message_id: number, text: string, chat: { id: number }, from: { id: number, username: string } }`
   - Wrapped in update: `{ update_id: number, edited_message: { ... } }`
   - The job processes edited messages the same way as regular messages

4. **Callback Query Payload**
   - Uses `callback_query` field instead of `message` field
   - Must include: `callback_query.id` (string), `callback_query.data` (string), `callback_query.message` (object)
   - The `callback_query.message` must include `chat.id` and `message_id` fields
   - Structure: `{ update_id: number, callback_query: { id: string, data: string, message: { message_id: number, chat: { id: number }, ... } } }`

5. **Audio/Voice Message Payloads**
   - Voice message: `message.voice.file_id` (string) - most common for speech transcription
   - Audio file: `message.audio.file_id` (string) - standard audio file
   - Document with audio mime type: `message.document.file_id` (string) with `message.document.mime_type` starting with 'audio/'
   - All audio types should include standard message fields (message_id, chat, from, text may be empty/null)
   - The job extracts audio using `extract_audio_file_id()` which checks voice, audio, then document in that order

6. **Error Scenario Payloads**
   - Update with missing chat object: `{ message: { text: string, message_id: number } }` (no `chat` field) - matches Rails spec `update_data_no_chat`
   - Update with missing message_id: Optional edge case (not in Rails spec but useful for testing)

7. **JSON String Format**
   - Same payloads but as JSON strings (job accepts both formats)

## Notes

- This task is part of Phase 2: File-by-File Conversion
- Section: 13. Testing
- Reference the Rails implementation in `jarek-va/spec/jobs/telegram_message_job_spec.rb` for exact payload structures
- Follow the existing fixture pattern in `telegram-receiver/tests/fixtures/telegramMessages.ts`
- Payloads should match the structure used in Rails spec `let` blocks (message_data, update_data, non_command_message, non_command_update, update_data_no_chat)
- All update fixtures should include `update_id` field (standard Telegram Bot API field, even though Rails job doesn't use it)
- Base structure from Rails spec: `{ update_id: number, message: { message_id: number, text: string, chat: { id: number }, from: { id: number, username: string } } }`
- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE2-101
- Next: PHASE2-103

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
