# PHASE2-105: Write E2E tests for complete message flow

**Section**: 13. Testing
**Subsection**: 13.6
**Task ID**: PHASE2-105

## Description

Write comprehensive E2E tests for the complete Telegram message flow. These tests should verify the end-to-end flow from webhook receipt through message processing, cursor-runner integration, and callback handling. The tests should use Supertest to test the full HTTP stack and verify all components work together correctly.

## Rails Reference

The Rails implementation does not have explicit E2E tests, but the complete flow is tested through:
- `spec/controllers/telegram_controller_spec.rb` - Webhook endpoint tests
- `spec/jobs/telegram_message_job_spec.rb` - Message processing tests
- `spec/controllers/cursor_runner_callback_controller_spec.rb` - Callback handling tests

The complete flow includes:
1. **Webhook Receipt** (`TelegramController#webhook`) - Receives Telegram updates
2. **Message Processing** (`TelegramMessageJob#perform`) - Processes messages, handles audio transcription
3. **Cursor Runner Integration** - Forwards non-command messages to cursor-runner
4. **Callback Handling** (`CursorRunnerCallbackController#create`) - Receives and processes cursor-runner callbacks
5. **Response Delivery** - Sends formatted responses back to Telegram

## Checklist

- [ ] Create `tests/e2e/telegram-message-flow.test.ts` using Supertest
- [ ] Test webhook authentication:
  - [ ] Webhook endpoint requires `X-Telegram-Bot-Api-Secret-Token` header when secret is configured
  - [ ] Returns 401 Unauthorized when secret token is missing or invalid
  - [ ] Accepts requests without secret when webhook secret is not configured (development mode)
- [ ] Test complete text message flow:
  - [ ] Webhook receives message update with valid authentication
  - [ ] Returns 200 OK immediately (before processing)
  - [ ] Message is enqueued for processing (job queue)
  - [ ] Non-command message is forwarded to cursor-runner
  - [ ] Request ID is generated in format `telegram-{timestamp}-{random_hex}`
  - [ ] Pending request is stored in Redis with key prefix `cursor_runner_callback:`
  - [ ] Pending request includes: chat_id, message_id, prompt, original_was_audio, created_at
  - [ ] Pending request has TTL of 3600 seconds (1 hour)
  - [ ] Callback is received from cursor-runner with matching request_id
  - [ ] Response is sent back to Telegram
  - [ ] Pending request is cleaned up from Redis after callback processing
- [ ] Test audio transcription flow:
  - [ ] Webhook receives voice/audio message
  - [ ] Audio file is downloaded from Telegram
  - [ ] Audio is transcribed using ElevenLabs service
  - [ ] Transcribed text is processed as regular message
  - [ ] Response is sent as audio (if original was audio and audio output enabled)
  - [ ] Audio files are cleaned up after processing
- [ ] Test callback authentication:
  - [ ] Callback endpoint requires `X-Webhook-Secret` header or `secret` query parameter
  - [ ] Returns 401 Unauthorized when secret is missing or invalid
  - [ ] Accepts requests without secret when webhook secret is not configured (development mode)
- [ ] Test callback response flow:
  - [ ] Callback is received with success result and valid authentication
  - [ ] Returns 200 OK to cursor-runner (even on errors, to prevent retries)
  - [ ] Pending request is retrieved from Redis using request_id
  - [ ] Response is formatted (with/without debug metadata based on CURSOR_DEBUG setting)
  - [ ] Response is sent to Telegram with parse mode fallback sequence:
    - [ ] First attempt: Markdown parse mode
    - [ ] Falls back to HTML parse mode if Markdown parsing fails
    - [ ] Falls back to plain text (no parse_mode) if HTML parsing fails
  - [ ] ANSI escape sequences are cleaned from output
  - [ ] Long output (>4000 chars) is truncated with "..." suffix
  - [ ] Pending request is removed from Redis after successful processing
  - [ ] Test callback with failed result (success: false)
  - [ ] Test callback with unknown request_id (logs warning, returns 200 OK)
  - [ ] Test callback with missing request_id (returns 400 Bad Request)
- [ ] Test local command handling:
  - [ ] `/start` command returns welcome message
  - [ ] `/help` command returns help message
  - [ ] `/status` command returns status message
  - [ ] Commands are not forwarded to cursor-runner
- [ ] Test edited message flow:
  - [ ] Edited message is processed same as regular message
- [ ] Test callback query flow:
  - [ ] Callback query is answered with "Processing..." text
  - [ ] Callback data is extracted and forwarded to cursor-runner as prompt
  - [ ] Chat info is extracted from callback query message
- [ ] Test error handling:
  - [ ] Error during webhook processing (e.g., job enqueue failure):
    - [ ] Returns 200 OK to Telegram (to avoid retries)
    - [ ] Logs the error
    - [ ] Sends error message to user if chat_id is available
    - [ ] Error message includes error details and is sent with HTML parse mode
  - [ ] Error during message processing (in job):
    - [ ] Sends error message to user with chat_id and message_id
    - [ ] Error message format: "Sorry, I encountered an error processing your message: {error}"
    - [ ] Re-raises error to mark job as failed
  - [ ] Error during callback processing:
    - [ ] Returns 200 OK to cursor-runner (to prevent retries)
    - [ ] Logs the error
    - [ ] Sends error message to user if chat_id is available
    - [ ] Error message format: "❌ Error processing cursor command result: {error}"
  - [ ] Missing chat_id prevents error message sending (no crash)
  - [ ] Error sending error message is logged but doesn't crash the process
- [ ] Test CURSOR_DEBUG behavior:
  - [ ] When disabled (default):
    - [ ] No acknowledgment message sent when forwarding to cursor-runner
    - [ ] Callback response contains only raw output (no metadata)
    - [ ] Output is not wrapped in code blocks
    - [ ] Output truncation limit is 4000 characters
  - [ ] When enabled:
    - [ ] Acknowledgment message sent: "⏳ Processing your request... I'll send the results when complete."
    - [ ] Callback response contains formatted output with metadata:
      - [ ] Success indicator: "✅ Cursor command completed successfully"
      - [ ] Iterations count: "📊 Iterations: {count}"
      - [ ] Duration: "⏱ Duration: {duration}"
      - [ ] Output wrapped in HTML code blocks: `<pre><code>{output}</code></pre>`
      - [ ] Warnings section if error field present (even on success)
    - [ ] Output truncation limit is 3500 characters (leaves room for metadata)
    - [ ] Failed results show detailed error message with "❌ Cursor command failed" prefix
- [ ] Test audio output behavior:
  - [ ] When original message was audio and `allow_audio_output` setting is enabled:
    - [ ] Response is sent as voice message using `send_voice`
    - [ ] Generated audio file is cleaned up after sending
  - [ ] When `allow_audio_output` setting is disabled: response sent as text message
  - [ ] Audio generation failure falls back to text message
  - [ ] Audio file cleanup errors are logged but don't crash the process
- [ ] Use test fixtures from `tests/fixtures/telegramMessages.ts` (expand fixtures as needed for E2E tests)
- [ ] Mock external services (Telegram Bot API, Cursor Runner API, ElevenLabs API)
- [ ] Use real Redis test instance for callback state management (not mocked)
- [ ] Use real job queue for message processing (not mocked)
- [ ] Verify all components work together (webhook → job → cursor-runner → callback → Telegram)
- [ ] Verify Redis key structure: `cursor_runner_callback:{request_id}`
- [ ] Verify request_id format: `telegram-{timestamp}-{random_hex}`
- [ ] Verify pending request data structure matches expected format

## Test Structure

The E2E test should:
- Use Supertest to make HTTP requests to the Express app
- Mock external APIs (Telegram Bot API, Cursor Runner API, ElevenLabs API) using nock or similar
- Use a real test Redis instance for callback state (not mocked)
- Use a real job queue for message processing (not mocked)
- Use fixtures for Telegram message structures (expand fixtures as needed)
- Test the complete flow without mocking internal services (Redis, job queue)
- Verify Redis state changes:
  - [ ] Pending request storage with correct key format and TTL
  - [ ] Pending request retrieval by request_id
  - [ ] Pending request cleanup after processing
- Verify HTTP responses and status codes:
  - [ ] Webhook endpoint returns 200 OK immediately
  - [ ] Webhook endpoint returns 401 Unauthorized for invalid auth
  - [ ] Callback endpoint returns 200 OK (even on errors)
  - [ ] Callback endpoint returns 400 Bad Request for missing request_id
  - [ ] Callback endpoint returns 401 Unauthorized for invalid auth
- Verify external API calls (mocked) are made with correct parameters:
  - [ ] Telegram API calls: sendMessage, sendVoice, downloadFile, answerCallbackQuery
  - [ ] Cursor Runner API calls: iterate with correct parameters (repository, branch_name, prompt, request_id)
  - [ ] ElevenLabs API calls: transcribe, synthesize

## Notes

- This task is part of Phase 2: File-by-File Conversion
- Section: 13. Testing
- Reference the Rails implementation in `jarek-va/spec/` for behavior expectations
- E2E tests should use Supertest (not Playwright) since this is a backend API
- Tests should verify the complete flow from webhook receipt to Telegram response
- Mock external services but use real internal services (Redis, job queue)
- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE2-104
- Next: PHASE3-001

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
