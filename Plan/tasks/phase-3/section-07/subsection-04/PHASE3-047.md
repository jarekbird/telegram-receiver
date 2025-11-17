# PHASE3-047: Review integration test coverage

**Section**: 7. Testing Review
**Subsection**: 7.4
**Task ID**: PHASE3-047

## Description

Review and improve integration test coverage in the codebase to ensure best practices. Integration tests verify that multiple components work together correctly, testing API endpoints and service interactions with proper test isolation.

## Checklist

### Current State Review
- [ ] Review existing integration tests in `tests/integration/` directory
- [ ] Check integration test structure and organization
- [ ] Review test setup and teardown procedures
- [ ] Verify test isolation and cleanup mechanisms

### API Endpoint Integration Tests (`tests/integration/api/`)
- [ ] Review Telegram webhook endpoint integration tests (`POST /telegram/webhook`)
  - Test webhook authentication with `X-Telegram-Bot-Api-Secret-Token` header
  - Test processing of different update types (message, edited_message, callback_query)
  - Test async processing and immediate 200 OK response
  - Test error handling and invalid payloads
- [ ] Review admin endpoint integration tests (if implemented)
  - `POST /telegram/set_webhook` (admin only)
  - `GET /telegram/webhook_info` (admin only)
  - `DELETE /telegram/webhook` (admin only)
- [ ] Review Cursor Runner callback endpoint integration tests (`POST /cursor-runner/callback`)
  - Test callback processing and response forwarding to Telegram
  - Test Redis state retrieval and cleanup
  - Test error handling for invalid callbacks

### Service Integration Tests (`tests/integration/services/`)
- [ ] Review TelegramService + CursorRunnerService integration tests
  - Test message forwarding flow from Telegram to Cursor Runner
  - Test request ID generation and Redis storage
  - Test error handling and retry logic
- [ ] Review CursorRunnerCallbackService integration tests
  - Test callback state management in Redis
  - Test request context retrieval and cleanup
  - Test TTL handling for pending requests
- [ ] Review ElevenLabs services integration tests (if implemented)
  - Test audio transcription flow
  - Test text-to-speech conversion flow

### Critical Path Coverage
- [ ] Verify end-to-end flow coverage: Telegram webhook → message processing → Cursor Runner → callback → Telegram response
- [ ] Test local command processing (`/start`, `/help`, `/status`) without Cursor Runner forwarding
- [ ] Test audio message transcription flow (if implemented)
- [ ] Test error scenarios and graceful degradation

### Test Quality and Best Practices
- [ ] Review test scenarios for completeness
- [ ] Check for edge cases and error conditions
- [ ] Review test data setup and fixtures usage
- [ ] Verify proper mocking of external APIs (Telegram Bot API, Cursor Runner API)
- [ ] Check test isolation (each test cleans up after itself)
- [ ] Review test timeout settings for async operations
- [ ] Verify test coverage metrics

### Missing Tests Identification
- [ ] Identify missing integration tests for implemented features
- [ ] Document gaps in integration test coverage
- [ ] Prioritize missing tests by criticality

### Documentation
- [ ] Review and update `tests/integration/README.md` with current practices
- [ ] Document integration test strategy and patterns
- [ ] Document findings and improvement recommendations
- [ ] Update test coverage documentation

## Notes

- This task is part of Phase 3: Holistic Review and Best Practices
- Section: 7. Testing Review
- Subsection: 7.4 - Integration Test Coverage Review
- Focus on identifying issues and improvements in integration test coverage
- Document findings and decisions for future reference
- Reference `Plan/app-description.md` for application functionality that should be tested
- Reference `tests/README.md` and `tests/integration/README.md` for test structure and guidelines
- Integration tests should use Supertest for API endpoint testing
- External APIs (Telegram Bot API, Cursor Runner API) should be mocked using nock or similar
- Integration tests may use real Redis connections but should use test databases/instances
- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE3-046
- Next: PHASE3-048

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
