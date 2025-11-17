# PHASE2-103: Write integration tests for webhook flow

**Section**: 13. Testing
**Subsection**: 13.4
**Task ID**: PHASE2-103

## Description

Write integration tests for the Telegram webhook flow. These tests should verify the complete end-to-end flow from webhook reception through job processing. While Rails has controller specs (`telegram_controller_spec.rb`) and job specs (`telegram_message_job_spec.rb`) as unit tests, this task creates integration tests that test multiple components working together.

**Rails Reference Files:**
- `jarek-va/app/controllers/telegram_controller.rb` - Webhook endpoint implementation
- `jarek-va/app/jobs/telegram_message_job.rb` - Message processing job
- `jarek-va/spec/controllers/telegram_controller_spec.rb` - Controller unit tests (reference for behavior)
- `jarek-va/spec/jobs/telegram_message_job_spec.rb` - Job unit tests (reference for behavior)

## Checklist

- [ ] Create `tests/integration/api/telegram-webhook.test.ts` using Supertest
- [ ] Test webhook reception with authentication (X-Telegram-Bot-Api-Secret-Token header)
- [ ] Test webhook reception without authentication (should return 401 when secret is configured)
- [ ] Test webhook reception when secret is not configured (should accept request)
- [ ] Test job enqueueing for message updates
- [ ] Test job enqueueing for edited_message updates
- [ ] Test job enqueueing for callback_query updates
- [ ] Test job enqueueing for unhandled update types
- [ ] Test end-to-end flow: webhook → job enqueue → job processing → external service calls
- [ ] Test message processing with command messages (/start, /help, /status)
- [ ] Test message processing with non-command messages (forwarded to cursor-runner)
- [ ] Test error handling when job enqueue fails (should return 200 to avoid Telegram retries)
- [ ] Test error handling when job processing fails (should send error message to user)
- [ ] Mock TelegramService (send_message, download_file, etc.)
- [ ] Mock CursorRunnerService (iterate method)
- [ ] Mock CursorRunnerCallbackService (store_pending_request, remove_pending_request)
- [ ] Mock Redis for callback state management
- [ ] Mock BullMQ job queue for job enqueueing verification
- [ ] Verify job receives correct update data (JSON format)
- [ ] Test that webhook returns 200 OK immediately (before job processing)
- [ ] Use fixtures from `tests/fixtures/telegramMessages.ts` for test data
- [ ] Test with different message types (text, audio/voice, callback queries)
- [ ] Verify proper cleanup and isolation between tests

## Test Scenarios

### Authentication Tests
1. **Without authentication when secret is configured**: Should return 401 Unauthorized
2. **Without authentication when secret is not configured**: Should accept request (return 200)
3. **With valid authentication**: Should accept request and process

### Update Type Tests
1. **Message update**: Should enqueue job and process message
2. **Edited message update**: Should enqueue job and process edited message
3. **Callback query update**: Should enqueue job and process callback
4. **Unhandled update type**: Should enqueue job but handle gracefully

### Message Processing Tests
1. **Command messages** (/start, /help, /status): Should process locally and send response
2. **Non-command messages**: Should forward to cursor-runner via CursorRunnerService
3. **Audio/voice messages**: Should transcribe and process (if implemented)

### Error Handling Tests
1. **Job enqueue error**: Should return 200 OK, log error, send error message to user if chat_id available
2. **Job processing error**: Should log error, send error message to user, re-raise error to mark job as failed
3. **Missing chat_id in error**: Should not attempt to send error message

### Integration Flow Tests
1. **Complete flow**: HTTP POST → Controller → Job Queue → Job Processing → External Services
2. **Verify job data**: Ensure update data is correctly passed to job as JSON string
3. **Verify immediate response**: Webhook should return 200 OK before job completes

## Implementation Notes

- Use Supertest for HTTP endpoint testing
- Use Jest for test framework
- Mock external services (TelegramService, CursorRunnerService) using Jest mocks
- Mock BullMQ queue to verify job enqueueing without actually processing jobs
- Mock Redis for callback state management
- Use test fixtures from `tests/fixtures/telegramMessages.ts`
- Ensure proper test isolation (cleanup between tests)
- Reference Rails specs for expected behavior and edge cases
- Test should verify the complete flow but mock external dependencies

## Notes

- This task is part of Phase 2: File-by-File Conversion
- Section: 13. Testing
- Subsection: 13.4 Integration Tests
- Rails has unit tests (controller specs, job specs) but no integration tests - this task creates new integration tests based on the Rails unit test behavior
- Integration tests should test multiple components together (controller + job queue + job processing)
- External services should be mocked to ensure test isolation and speed
- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE2-102
- Next: PHASE2-104

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
