# PHASE2-037: Add error handling and custom error classes

**Section**: 5. CursorRunnerService Conversion
**Subsection**: 5.10
**Task ID**: PHASE2-037

## Description

Add comprehensive error handling and custom error classes to the CursorRunnerService implementation. This task ensures all error scenarios from the Rails implementation are properly handled with appropriate error types and logging.

**Rails Reference**: `jarek-va/app/services/cursor_runner_service.rb` (lines 11-14, 151-161, 163-194, 196-200)

## Checklist

- [ ] Ensure base `Error` class exists (extends standard Error)
  - Base class for all CursorRunnerService errors
  - Should be named `CursorRunnerService.Error` or `CursorRunnerServiceError`

- [ ] Ensure `ConnectionError` class exists (extends base Error)
  - Raised when connection fails: ECONNREFUSED, EHOSTUNREACH, SocketError
  - Error message format: "Failed to connect to cursor-runner: {error message}"
  - Used in `buildHttp` and `executeRequest` methods

- [ ] Ensure `TimeoutError` class exists (extends base Error)
  - Raised when request times out: OpenTimeout, ReadTimeout
  - Error message format: "Request to cursor-runner timed out: {error message}"
  - Used in `buildHttp` and `executeRequest` methods

- [ ] Ensure `InvalidResponseError` class exists (extends base Error)
  - Raised when JSON parsing fails: JSON::ParserError
  - Error message format: "Failed to parse response: {error message}"
  - Used in `parseResponse` method

- [ ] Add error handling to `buildHttp` method
  - Catch connection errors (ECONNREFUSED, EHOSTUNREACH, SocketError) → raise ConnectionError
  - Catch timeout errors (OpenTimeout, ReadTimeout) → raise TimeoutError
  - Include original error message in the raised error

- [ ] Add error handling to `executeRequest` method
  - Log request: "CursorRunnerService: {METHOD} {path}" (e.g., "CursorRunnerService: GET /cursor/execute")
  - Log response: "CursorRunnerService: Response {code} {message}"
  - Handle 422 Unprocessable Entity as valid response (return it, don't raise error)
  - For non-success HTTP status codes (except 422):
    - Try to parse error body JSON and extract 'error' field
    - Fall back to default error message if JSON parsing fails
    - Raise generic Error with the error message
  - Catch timeout errors (OpenTimeout, ReadTimeout) → raise TimeoutError
  - Catch connection errors (ECONNREFUSED, EHOSTUNREACH, SocketError) → raise ConnectionError
  - Include original error message in the raised error

- [ ] Add error handling to `parseResponse` method
  - Catch JSON parsing errors → raise InvalidResponseError
  - Error message should include the parsing error details
  - Ensure error message format matches Rails: "Failed to parse response: {error message}"

- [ ] Ensure error handling covers all public methods
  - All public methods (execute, iterate, clone_repository, list_repositories, checkout_branch, push_branch, pull_branch) should propagate errors appropriately
  - Errors should bubble up with proper error types

- [ ] Add appropriate logging
  - Log all requests before execution (method and path)
  - Log all responses after execution (status code and message)
  - Use appropriate log level (info for normal operations)
  - Log format should match Rails: "CursorRunnerService: {message}"

## Notes

- This task is part of Phase 2: File-by-File Conversion
- Section: 5. CursorRunnerService Conversion
- Reference the Rails implementation at `jarek-va/app/services/cursor_runner_service.rb` for exact error handling behavior
- Error classes may have been created in PHASE2-028, but this task ensures comprehensive error handling is implemented throughout all methods
- Error handling should match Rails implementation exactly, including error message formats
- The 422 status code is treated as a valid response (not an error) to allow callers to receive error details in the response body
- All error messages should include the original error message for debugging purposes
- Logging should occur for both successful and failed requests to aid in debugging

- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE2-036
- Next: PHASE2-038

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
