# PHASE2-023: Implement send_voice method

**Section**: 4. TelegramService Conversion
**Subsection**: 4.6
**Task ID**: PHASE2-023

## Description

Convert the `send_voice` method from Rails to TypeScript/Node.js. This method sends a voice/audio file to a Telegram chat. Reference `jarek-va/app/services/telegram_service.rb` lines 77-117.

## Checklist

- [ ] Implement `sendVoice` method with signature matching `SendVoiceParams` interface
  - Required parameters: `chat_id` (number), `voice_path` (string - local file path)
  - Optional parameters: `reply_to_message_id` (number), `caption` (string)
- [ ] Add early return if `telegram_bot_token` is blank (consistent with other methods)
- [ ] Validate that the voice file exists at `voice_path`
  - Raise/throw error if file does not exist: "Voice file does not exist"
- [ ] Read file content from disk using binary read
  - Use Node.js `fs.readFileSync` or `fs.promises.readFile` with binary encoding
- [ ] Extract filename from `voice_path` using basename
- [ ] Implement MIME type detection based on file extension:
  - `.ogg` or `.oga` → `audio/ogg`
  - `.wav` → `audio/wav`
  - Default (including `.mp3`) → `audio/mpeg`
- [ ] Create multipart form data with file upload
  - Use `FormData` or similar library (e.g., `form-data` package)
  - Include file content, MIME type, and filename
  - Field name should be `voice` (as per Telegram Bot API)
- [ ] Build request parameters:
  - Required: `chat_id`, `voice` (file)
  - Optional: `reply_to_message_id` (if provided), `caption` (if provided)
- [ ] Call Telegram Bot API `sendVoice` endpoint
  - Use POST request with multipart/form-data content type
  - Endpoint: `https://api.telegram.org/bot{token}/sendVoice`
- [ ] Return Telegram API response (should match `TelegramApiResponse` type)
- [ ] Add comprehensive error handling:
  - Catch and log errors with descriptive messages
  - Log error stack trace
  - Re-throw errors after logging
  - Error message format: "Error sending Telegram voice: {error message}"

## Implementation Details

Based on Rails implementation analysis (`jarek-va/app/services/telegram_service.rb` lines 77-117):

1. **Method Signature**: The method accepts `chat_id`, `voice_path`, `reply_to_message_id` (optional), and `caption` (optional). This matches the `SendVoiceParams` interface defined in PHASE2-001.

2. **File Handling**: The Rails implementation:
   - Validates file existence before attempting to read
   - Reads file content using `File.binread` (binary read)
   - Extracts filename using `File.basename`
   - Determines MIME type from file extension

3. **MIME Type Detection**: The Rails code uses a case statement on file extension:
   - `.ogg` and `.oga` → `audio/ogg`
   - `.wav` → `audio/wav`
   - All other extensions (including `.mp3`) → `audio/mpeg`

4. **Multipart Upload**: Rails uses `Faraday::UploadIO` with `StringIO` to create the upload object. In Node.js, use `FormData` with a file stream or buffer.

5. **Error Handling**: The Rails implementation:
   - Catches `StandardError`
   - Logs error message and full backtrace
   - Re-raises the error after logging

6. **Return Value**: The method returns the Telegram API response (Hash/object).

## Notes

- This task is part of Phase 2: File-by-File Conversion
- Section: 4. TelegramService Conversion
- Reference the Rails implementation at `jarek-va/app/services/telegram_service.rb` lines 77-117 for exact behavior
- The `SendVoiceParams` interface is defined in PHASE2-001
- Use the `form-data` npm package or Node.js built-in `FormData` (Node.js 18+) for multipart uploads
- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE2-022
- Next: PHASE2-024

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
