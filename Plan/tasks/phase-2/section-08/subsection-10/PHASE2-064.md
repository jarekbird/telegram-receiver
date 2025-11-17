# PHASE2-064: Write TelegramController integration tests

**Section**: 8. TelegramController Conversion
**Subsection**: 8.10
**Task ID**: PHASE2-064

## Description

Write TelegramController integration tests in TypeScript/Node.js. Convert the Rails test suite from `jarek-va/spec/controllers/telegram_controller_spec.rb` to TypeScript integration tests. The tests should verify all TelegramController endpoints and their behavior, including webhook handling, authentication, admin endpoints, and error handling.

## Rails Test Reference

Reference the Rails test file: `jarek-va/spec/controllers/telegram_controller_spec.rb`

The Rails test suite covers:
- POST `/telegram/webhook` endpoint with various update types
- Webhook authentication (X-Telegram-Bot-Api-Secret-Token header)
- Admin authentication (X-Admin-Secret header)
- Admin endpoints: `set_webhook`, `webhook_info`, `delete_webhook`
- Error handling and error message sending to users
- Job enqueueing for asynchronous processing

## Checklist

### Test File Setup
- [ ] Create `tests/integration/api/telegram-controller.test.ts` (integration tests should be in `tests/integration/api/`)
- [ ] Import necessary testing utilities (supertest, test fixtures, mocks)
- [ ] Set up test configuration and mocks

### Mocking Setup
- [ ] Mock TelegramService (all methods: sendMessage, setWebhook, webhookInfo, deleteWebhook)
- [ ] Mock queue system (job enqueueing - equivalent to TelegramMessageJob.perform_later)
- [ ] Mock configuration values (telegram_webhook_secret, webhook_secret, telegram_webhook_base_url)
- [ ] Reset mocks in beforeEach/afterEach hooks

### POST /telegram/webhook Tests
- [ ] Test webhook endpoint without authentication (when webhook secret is configured) - should return 401
- [ ] Test webhook endpoint without authentication (when webhook secret is not configured) - should accept request
- [ ] Test webhook endpoint with valid authentication header (X-Telegram-Bot-Api-Secret-Token)
- [ ] Test webhook returns 200 OK immediately
- [ ] Test webhook enqueues job for processing (equivalent to TelegramMessageJob)
- [ ] Test webhook passes correct update data to job (excluding controller/action/format params)
- [ ] Test webhook with message update (command message)
- [ ] Test webhook with message update (non-command message)
- [ ] Test webhook with edited_message update
- [ ] Test webhook with callback_query update
- [ ] Test webhook with unhandled update type
- [ ] Test webhook error handling - returns 200 even on error (to avoid Telegram retries)
- [ ] Test webhook error handling - logs errors
- [ ] Test webhook error handling - sends error message to user if chat_id is available
- [ ] Test webhook error handling - handles errors when sending error message fails

### POST /telegram/set_webhook Tests (Admin Endpoint)
- [ ] Test set_webhook without admin authentication - returns 401
- [ ] Test set_webhook with admin authentication - returns success
- [ ] Test set_webhook calls TelegramService.set_webhook with correct parameters
- [ ] Test set_webhook uses default webhook URL when not provided
- [ ] Test set_webhook uses provided secret_token parameter
- [ ] Test set_webhook error handling - returns error response when TelegramService raises error

### GET /telegram/webhook_info Tests (Admin Endpoint)
- [ ] Test webhook_info without admin authentication - returns 401
- [ ] Test webhook_info with admin authentication - returns success
- [ ] Test webhook_info returns webhook info from TelegramService
- [ ] Test webhook_info error handling - returns error response when TelegramService raises error

### DELETE /telegram/webhook Tests (Admin Endpoint)
- [ ] Test delete_webhook without admin authentication - returns 401
- [ ] Test delete_webhook with admin authentication - returns success
- [ ] Test delete_webhook calls TelegramService.delete_webhook
- [ ] Test delete_webhook error handling - returns error response when TelegramService raises error

### Authentication Tests
- [ ] Test webhook authentication via X-Telegram-Bot-Api-Secret-Token header
- [ ] Test admin authentication via X-Admin-Secret header
- [ ] Test admin authentication via HTTP_X_ADMIN_SECRET env variable
- [ ] Test admin authentication via query parameters (admin_secret)
- [ ] Test authentication failure scenarios

## Notes

- This task is part of Phase 2: File-by-File Conversion
- Section: 8. TelegramController Conversion
- Reference the Rails implementation for behavior: `jarek-va/app/controllers/telegram_controller.rb`
- Reference the Rails test implementation: `jarek-va/spec/controllers/telegram_controller_spec.rb`

### Implementation Guidance

1. **Test Location**: Integration tests should be placed in `tests/integration/api/telegram-controller.test.ts` (not in `tests/unit/controllers/`)

2. **Testing Framework**: Use Jest with Supertest for HTTP endpoint testing. See `tests/integration/README.md` for integration test patterns.

3. **Test Fixtures**: Use existing fixtures from `tests/fixtures/telegramMessages.ts` for Telegram update payloads.

4. **Mocks**: 
   - Use `tests/mocks/telegramApi.ts` for TelegramService mocking
   - Mock the queue system (equivalent to Rails' `TelegramMessageJob.perform_later`)
   - Mock configuration values appropriately

5. **Test Structure**: Follow the Rails test structure:
   - Group tests by endpoint (POST #webhook, POST #set_webhook, etc.)
   - Use nested contexts for different scenarios (with/without auth, different update types, error cases)
   - Test both success and error paths

6. **Key Behaviors to Test**:
   - Webhook endpoint always returns 200 OK (even on errors) to prevent Telegram retries
   - Job enqueueing happens asynchronously
   - Error messages are sent to users when chat_id is available
   - Admin endpoints require X-Admin-Secret header authentication
   - Webhook endpoint requires X-Telegram-Bot-Api-Secret-Token header when secret is configured

7. **Update Types**: Test all Telegram update types:
   - `message` (command and non-command)
   - `edited_message`
   - `callback_query`
   - Unhandled update types

- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE2-063
- Next: PHASE2-065

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
