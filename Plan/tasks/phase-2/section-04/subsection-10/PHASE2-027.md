# PHASE2-027: Write TelegramService unit tests

**Section**: 4. TelegramService Conversion
**Subsection**: 4.10
**Task ID**: PHASE2-027

## Description

Write comprehensive unit tests for TelegramService in TypeScript/Node.js. The tests should cover all public methods, error handling, edge cases, and private helper methods. Reference `jarek-va/app/services/telegram_service.rb` for the Rails implementation behavior.

The Rails TelegramService (`jarek-va/app/services/telegram_service.rb`) has the following public methods that need to be tested:
- `send_message()` - sends text messages with HTML escaping support
- `set_webhook()` - sets Telegram webhook URL with optional secret token
- `delete_webhook()` - deletes the Telegram webhook
- `webhook_info()` - gets current webhook information
- `send_voice()` - sends voice/audio files with file validation
- `download_file()` - downloads files from Telegram with file path handling

Private methods that should also be tested:
- `download_file_from_url()` - HTTP file download with response validation
- `escape_html_entities()` - HTML entity escaping for message text

## Checklist

- [ ] Create `tests/unit/services/telegramService.test.ts` (use camelCase naming convention)
- [ ] Set up proper mocks for Telegram Bot API (use existing `tests/mocks/telegramApi.ts` as reference)
- [ ] Mock file system operations (fs, path modules) for file-related tests
- [ ] Mock HTTP client for `download_file_from_url()` tests
- [ ] Test `sendMessage()` method:
  - [ ] Successfully sends message with all parameters
  - [ ] Handles HTML parse mode with entity escaping (`escape_html_entities`)
  - [ ] Handles non-HTML parse modes (Markdown, plain text)
  - [ ] Handles optional `reply_to_message_id` parameter
  - [ ] Returns early when bot token is blank
  - [ ] Logs errors and re-throws exceptions on failure
- [ ] Test `setWebhook()` method:
  - [ ] Successfully sets webhook with URL
  - [ ] Handles optional `secret_token` parameter
  - [ ] Returns early when bot token is blank
  - [ ] Logs errors and re-throws exceptions on failure
- [ ] Test `deleteWebhook()` method:
  - [ ] Successfully deletes webhook
  - [ ] Returns early when bot token is blank
  - [ ] Logs errors and re-throws exceptions on failure
- [ ] Test `getWebhookInfo()` method:
  - [ ] Successfully retrieves webhook info
  - [ ] Returns early when bot token is blank
  - [ ] Logs errors and re-throws exceptions on failure
- [ ] Test `sendVoice()` method:
  - [ ] Successfully sends voice file with all parameters
  - [ ] Validates file exists before sending (throws error if file missing)
  - [ ] Handles different file types and sets correct MIME types (.ogg/.oga → audio/ogg, .wav → audio/wav, others → audio/mpeg)
  - [ ] Handles optional `reply_to_message_id` parameter
  - [ ] Handles optional `caption` parameter
  - [ ] Returns early when bot token is blank
  - [ ] Logs errors and re-throws exceptions on failure
- [ ] Test `downloadFile()` method:
  - [ ] Successfully downloads file with provided destination path
  - [ ] Generates default destination path in temp directory when not provided
  - [ ] Uses correct filename from Telegram file path
  - [ ] Calls `download_file_from_url()` with correct URL
  - [ ] Returns early when bot token is blank
  - [ ] Logs errors and re-throws exceptions on failure
- [ ] Test `downloadFileFromUrl()` private method (if exposed for testing or test via `downloadFile()`):
  - [ ] Successfully downloads file from URL
  - [ ] Validates HTTP response is successful (throws error if not HTTPSuccess)
  - [ ] Creates destination directory if it doesn't exist
  - [ ] Writes file content correctly
  - [ ] Logs download progress
- [ ] Test `escapeHtmlEntities()` private method (if exposed for testing or test via `sendMessage()`):
  - [ ] Escapes `&` to `&amp;` (must be first to avoid double-escaping)
  - [ ] Escapes `<` to `&lt;`
  - [ ] Escapes `>` to `&gt;`
  - [ ] Handles string conversion for non-string inputs
- [ ] Test error handling across all methods:
  - [ ] All methods catch and log errors with descriptive messages
  - [ ] All methods log full stack traces
  - [ ] All methods re-throw exceptions after logging (maintains error propagation)
  - [ ] Error messages follow pattern: "Error {operation}: {error message}"
- [ ] Test early return behavior:
  - [ ] All methods return early (undefined/null) when bot token is blank
  - [ ] No API calls are made when token is blank
- [ ] Achieve >80% code coverage
- [ ] Follow AAA pattern (Arrange, Act, Assert) in all tests
- [ ] Use descriptive test names that clearly describe what is being tested

## Notes

- This task is part of Phase 2: File-by-File Conversion
- Section: 4. TelegramService Conversion
- Reference the Rails implementation (`jarek-va/app/services/telegram_service.rb`) for exact behavior and error handling patterns
- The Rails implementation uses consistent error handling:
  - All methods wrap operations in `begin/rescue/end` blocks
  - All methods log errors with `Rails.logger.error` and full stack traces
  - All methods re-raise exceptions after logging using `raise`
  - All methods check for blank bot token before proceeding (early return pattern)
- Specific validations from Rails:
  - `send_voice` (line 87): Validates file exists with `raise 'Voice file does not exist' unless File.exist?(voice_path)`
  - `download_file_from_url` (line 166): Validates HTTP response with `raise "Failed to download file: HTTP #{response.code} #{response.message}" unless response.is_a?(Net::HTTPSuccess)`
- HTML escaping in `send_message` (lines 20-24): Only escapes HTML entities when `parse_mode == 'HTML'`, otherwise uses text as-is
- File MIME type detection in `send_voice` (lines 93-100): Maps file extensions to MIME types (.ogg/.oga → audio/ogg, .wav → audio/wav, default → audio/mpeg)
- Default destination path generation in `download_file` (lines 135-139): Uses temp directory with format `telegram_{file_id}_{filename}` when destination_path is not provided
- Use existing test infrastructure:
  - Use `tests/mocks/telegramApi.ts` as reference for mocking Telegram API
  - Follow patterns in `tests/README.md` for test structure
  - Use Jest for testing framework
- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE2-026
- Next: PHASE2-028

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
