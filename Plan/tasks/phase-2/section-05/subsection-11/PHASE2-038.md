# PHASE2-038: Write CursorRunnerService unit tests

**Section**: 5. CursorRunnerService Conversion
**Subsection**: 5.11
**Task ID**: PHASE2-038

## Description

Write comprehensive unit tests for CursorRunnerService in TypeScript/Node.js. Reference the Rails implementation at `jarek-va/app/services/cursor_runner_service.rb` and the Rails spec at `jarek-va/spec/services/cursor_runner_service_spec.rb` for test coverage requirements.

## Checklist

- [ ] Create `tests/unit/services/cursor-runner-service.test.ts`
- [ ] Set up test fixtures and mocks for HTTP requests
  - Mock HTTP client (fetch or axios depending on implementation)
  - Mock successful responses (200 OK)
  - Mock error responses (400, 500, etc.)
  - Mock connection errors
  - Mock timeout errors
- [ ] Test `execute` method
  - Test successful execution with all required parameters (repository, branch_name, prompt)
  - Test with optional request_id parameter
  - Test request_id generation when not provided
  - Test POST request to `/cursor/execute` endpoint
  - Test request body contains correct fields (repository, branchName, prompt, id)
  - Test HTTP error handling (non-200 status codes)
  - Test connection errors (ECONNREFUSED, EHOSTUNREACH, SocketError)
  - Test timeout errors (OpenTimeout, ReadTimeout)
- [ ] Test `iterate` method
  - Test successful iteration with all required parameters
  - Test with optional request_id parameter
  - Test with optional callback_url parameter
  - Test with max_iterations parameter (default: 25)
  - Test POST request to `/cursor/iterate` endpoint
  - Test request body contains correct fields (repository, branchName, prompt, maxIterations, id, callbackUrl when provided)
  - Test response parsing with iterations count
  - Test error handling (HTTP errors, connection errors, timeout errors)
- [ ] Test `clone_repository` method
  - Test successful clone with repository_url
  - Test with optional repository_name parameter
  - Test POST request to `/git/clone` endpoint
  - Test request body contains correct fields (repositoryUrl, repositoryName when provided)
  - Test error handling
- [ ] Test `list_repositories` method
  - Test successful list retrieval
  - Test GET request to `/git/repositories` endpoint
  - Test response parsing with repositories array and count
  - Test error handling
- [ ] Test `checkout_branch` method
  - Test successful checkout
  - Test POST request to `/git/checkout` endpoint
  - Test request body contains correct fields (repository, branch)
  - Test error handling
- [ ] Test `push_branch` method
  - Test successful push
  - Test POST request to `/git/push` endpoint
  - Test request body contains correct fields (repository, branch)
  - Test error handling
- [ ] Test `pull_branch` method
  - Test successful pull
  - Test POST request to `/git/pull` endpoint
  - Test request body contains correct fields (repository, branch)
  - Test error handling
- [ ] Test error handling scenarios
  - Test ConnectionError for connection failures (ECONNREFUSED, EHOSTUNREACH, SocketError)
  - Test TimeoutError for timeout scenarios (OpenTimeout, ReadTimeout)
  - Test InvalidResponseError for JSON parsing failures
  - Test generic Error for HTTP error responses (non-200, non-422)
  - Test HTTP 422 Unprocessable Entity is treated as valid response (not an error)
  - Test error messages include original error details
- [ ] Test response parsing
  - Test successful JSON parsing with symbol keys (or equivalent in TypeScript)
  - Test InvalidResponseError when JSON parsing fails
  - Test error body parsing for HTTP error responses
- [ ] Test request ID generation
  - Test request_id is generated when not provided
  - Test request_id format matches Rails pattern (req-{timestamp}-{random})
- [ ] Test initialization
  - Test with custom base_url and timeout
  - Test with default base_url and timeout from config
- [ ] Achieve >80% code coverage
  - Ensure all public methods are tested
  - Ensure all error paths are tested
  - Ensure all edge cases are covered

## Notes

- This task is part of Phase 2: File-by-File Conversion
- Section: 5. CursorRunnerService Conversion
- Reference the Rails implementation at `jarek-va/app/services/cursor_runner_service.rb` for exact behavior
- Reference the Rails spec at `jarek-va/spec/services/cursor_runner_service_spec.rb` for test coverage examples
- Test file should be located at `tests/unit/services/cursor-runner-service.test.ts` (following the project's test directory structure)
- Use Jest or the project's configured test framework
- Mock HTTP client library (fetch, axios, or whatever the implementation uses)
- Test all 7 public methods: execute, iterate, clone_repository, list_repositories, checkout_branch, push_branch, pull_branch
- Test all error types: ConnectionError, TimeoutError, InvalidResponseError, and generic Error
- HTTP 422 status code should be treated as a valid response (not an error) to allow callers to receive error details
- Request ID generation should match Rails pattern: "req-{timestamp}-{random_hex}"
- All error messages should include original error details for debugging
- Test both success and error scenarios for comprehensive coverage

- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE2-037
- Next: PHASE2-039

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
