# PHASE2-034: Implement checkout_branch method

**Section**: 5. CursorRunnerService Conversion
**Subsection**: 5.7
**Task ID**: PHASE2-034

## Description

Convert the `checkout_branch` method from Rails CursorRunnerService to TypeScript/Node.js. This method checks out a Git branch in a repository by calling the cursor-runner API's `/git/checkout` endpoint.

**Rails Reference**: `jarek-va/app/services/cursor_runner_service.rb` (lines 88-98)

## Method Signature

```typescript
checkoutBranch(params: {
  repository: string;
  branch: string;
}): Promise<CheckoutBranchResponse>
```

**Parameters**:
- `repository` (required): Repository name
- `branch` (required): Branch name to checkout

**Return Type**: Promise resolving to a response object with `success`, `message`, etc.

## Implementation Details

### Request Body Structure

The method should POST to `/git/checkout` with the following JSON body:
```json
{
  "repository": "<repository_name>",
  "branch": "<branch_name>"
}
```

**Important Notes**:
- The request body uses `repository` and `branch` (both camelCase)
- Both parameters are required

### Response Parsing

- Parse the JSON response body
- Return the parsed object with symbol keys (or equivalent TypeScript object)
- Handle JSON parsing errors appropriately
- The response should include:
  - `success`: boolean indicating if the request was successful
  - `message`: string message (may be included)

### Error Handling

The method should handle and potentially throw the following error types:
- **ConnectionError**: Failed to connect to cursor-runner (ECONNREFUSED, EHOSTUNREACH, SocketError)
- **TimeoutError**: Request timed out (OpenTimeout, ReadTimeout)
- **InvalidResponseError**: Failed to parse JSON response
- **Error**: HTTP error responses (non-2xx, non-422 status codes)
  - Note: 422 Unprocessable Entity should be treated as a valid response (operation failed but request was valid)

### HTTP Request Details

- Method: POST
- Content-Type: `application/json`
- Accept: `application/json`
- Use the base URL from configuration (cursor-runner URL)
- Use timeout from configuration (cursor-runner timeout)

## Checklist

- [ ] Implement `checkoutBranch` method with correct TypeScript signature
- [ ] Accept required parameters: `repository` and `branch`
- [ ] Build request body with `repository` and `branch` (camelCase)
- [ ] POST to `/git/checkout` endpoint
- [ ] Set proper HTTP headers (`Content-Type: application/json`, `Accept: application/json`)
- [ ] Handle connection errors (ConnectionError)
- [ ] Handle timeout errors (TimeoutError)
- [ ] Handle HTTP error responses (non-2xx, except 422)
- [ ] Treat 422 Unprocessable Entity as valid response (not an error)
- [ ] Parse JSON response body
- [ ] Handle JSON parsing errors (InvalidResponseError)
- [ ] Return parsed response object with success and message
- [ ] Add appropriate logging (request and response logging)
- [ ] Write unit tests for the method
- [ ] Test successful response parsing
- [ ] Test error handling scenarios (connection errors, timeouts, HTTP errors, JSON parse errors)
- [ ] Test 422 response handling (should not throw error)

## Notes

- This task is part of Phase 2: File-by-File Conversion
- Section: 5. CursorRunnerService Conversion
- The method uses a private `post` helper method in Rails - ensure similar helper is available or implement HTTP request directly
- The method uses a private `parse_response` helper method in Rails - ensure similar helper is available or implement JSON parsing directly
- Reference the Rails implementation at `jarek-va/app/services/cursor_runner_service.rb` lines 88-98 for exact behavior
- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE2-033
- Next: PHASE2-035

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
