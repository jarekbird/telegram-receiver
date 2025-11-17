# PHASE2-104: Write integration tests for callback flow

**Section**: 13. Testing
**Subsection**: 13.5
**Task ID**: PHASE2-104

## Description

Write integration tests for the cursor-runner callback flow. These tests should verify the complete end-to-end flow from callback reception through Redis retrieval to Telegram response sending. While Rails has controller specs (`cursor_runner_callback_controller_spec.rb`) as unit tests, this task creates integration tests that test multiple components working together.

**Rails Reference Files:**
- `jarek-va/app/controllers/cursor_runner_callback_controller.rb` - Callback endpoint implementation
- `jarek-va/app/services/cursor_runner_callback_service.rb` - Redis state management service
- `jarek-va/spec/controllers/cursor_runner_callback_controller_spec.rb` - Controller unit tests (reference for behavior)

## Checklist

- [ ] Create `tests/integration/api/callback-flow.test.ts` using Supertest
- [ ] Test callback reception with authentication (X-Webhook-Secret or X-Cursor-Runner-Secret header)
- [ ] Test callback reception without authentication (should return 401 when secret is configured)
- [ ] Test callback reception when secret is not configured (should accept request)
- [ ] Test callback reception with secret in query parameter
- [ ] Test callback reception with missing request_id (should return 400 Bad Request)
- [ ] Test callback reception with unknown request_id (should return 200 OK but log warning)
- [ ] Test Redis retrieval of pending request data
- [ ] Test successful callback processing with valid pending data
- [ ] Test Telegram response sending for successful results
- [ ] Test Telegram response sending for failed results
- [ ] Test response formatting with CURSOR_DEBUG disabled (default) - should send raw output only
- [ ] Test response formatting with CURSOR_DEBUG enabled - should include metadata and formatted output
- [ ] Test ANSI escape sequence cleaning from output
- [ ] Test output truncation for long outputs (max 4000 chars without debug, 3500 with debug)
- [ ] Test Markdown parse mode fallback to HTML when Markdown parsing fails
- [ ] Test HTML parse mode fallback to plain text when HTML parsing fails
- [ ] Test error handling when callback processing raises an error (should return 200 OK, send error message to user)
- [ ] Test error handling when Telegram send fails (should send fallback error message)
- [ ] Test cleanup of pending request after successful processing
- [ ] Test callback with camelCase parameters (requestId, branchName, maxIterations, exitCode)
- [ ] Test callback with snake_case parameters (request_id, branch_name, max_iterations, exit_code)
- [ ] Test callback with mixed case parameters (should normalize correctly)
- [ ] Test success boolean normalization (handle string "true"/"false", numbers 1/0, boolean true/false)
- [ ] Test audio response when original message was audio and audio output is enabled
- [ ] Test text fallback when audio generation fails
- [ ] Test audio file cleanup after sending
- [ ] Mock CursorRunnerCallbackService (get_pending_request, remove_pending_request)
- [ ] Mock TelegramService (send_message, send_voice)
- [ ] Mock ElevenLabsTextToSpeechService (synthesize method)
- [ ] Mock SystemSetting (enabled? method for debug and allow_audio_output checks)
- [ ] Mock Redis for callback state management
- [ ] Verify proper cleanup and isolation between tests
- [ ] Test that callback returns 200 OK immediately (to prevent cursor-runner retries)

## Test Scenarios

### Authentication Tests
1. **Without authentication when secret is configured**: Should return 401 Unauthorized
2. **Without authentication when secret is not configured**: Should accept request (return 200)
3. **With valid authentication (header)**: Should accept request and process
4. **With valid authentication (query param)**: Should accept request and process

### Callback Reception Tests
1. **Valid callback with request_id**: Should process callback successfully
2. **Missing request_id**: Should return 400 Bad Request
3. **Unknown request_id**: Should return 200 OK but log warning (to prevent retries)

### Redis Retrieval Tests
1. **Pending request found**: Should retrieve and use pending data (chat_id, message_id, etc.)
2. **Pending request not found**: Should handle gracefully and return 200 OK

### Telegram Response Tests

#### Success Response Tests
1. **With CURSOR_DEBUG disabled**: Should send only raw output (no metadata)
2. **With CURSOR_DEBUG enabled**: Should send formatted response with metadata (iterations, duration, output in HTML code blocks)
3. **With long output**: Should truncate output appropriately (4000 chars without debug, 3500 with debug)
4. **With ANSI escape sequences**: Should clean ANSI codes from output

#### Failure Response Tests
1. **With CURSOR_DEBUG disabled**: Should send simple error message (❌ error text)
2. **With CURSOR_DEBUG enabled**: Should send detailed error message (❌ Cursor command failed\n\nError: ...)

#### Parse Mode Fallback Tests
1. **Markdown parsing fails**: Should fallback to HTML parse mode
2. **HTML parsing fails**: Should fallback to plain text (no parse_mode)
3. **Both parsing fail**: Should send as plain text

#### Audio Response Tests
1. **Original was audio and audio output enabled**: Should convert text to speech and send as voice message
2. **Audio generation fails**: Should fallback to text message
3. **Audio file cleanup**: Should delete generated audio file after sending

### Error Handling Tests
1. **Callback processing error**: Should return 200 OK, log error, send error message to user
2. **Telegram send error**: Should send fallback error message
3. **Missing chat_id in error**: Should not attempt to send error message

### Parameter Normalization Tests
1. **camelCase parameters**: Should normalize to snake_case internally
2. **snake_case parameters**: Should handle correctly
3. **Mixed case parameters**: Should normalize correctly
4. **Success boolean**: Should handle string "true"/"false", numbers 1/0, boolean true/false

### Cleanup Tests
1. **After successful processing**: Should remove pending request from Redis
2. **After error**: Should still attempt cleanup if possible

## Implementation Notes

- Use Supertest for HTTP endpoint testing
- Use Jest for test framework
- Mock external services (TelegramService, CursorRunnerCallbackService, ElevenLabsTextToSpeechService) using Jest mocks
- Mock SystemSetting for debug and audio output checks
- Mock Redis for callback state management
- Ensure proper test isolation (cleanup between tests)
- Reference Rails specs for expected behavior and edge cases
- Test should verify the complete flow but mock external dependencies
- Callback endpoint should always return 200 OK to prevent cursor-runner from retrying (even on errors)
- Test file should be placed in `tests/integration/api/` directory (not `tests/integration/` root)

## Notes

- This task is part of Phase 2: File-by-File Conversion
- Section: 13. Testing
- Subsection: 13.5 Integration Tests
- Rails has unit tests (controller specs) but no integration tests - this task creates new integration tests based on the Rails unit test behavior
- Integration tests should test multiple components together (controller + callback service + Telegram service)
- External services should be mocked to ensure test isolation and speed
- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE2-103
- Next: PHASE2-105

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
