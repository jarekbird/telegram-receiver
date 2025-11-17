# PHASE3-038: Review SQL and Redis injection prevention

**Section**: 6. Security Review
**Subsection**: 6.3
**Task ID**: PHASE3-038

## Description

Review and improve SQL injection prevention (if applicable) and Redis injection prevention in the codebase to ensure best practices. This task focuses on identifying and preventing injection vulnerabilities in database queries and Redis operations, ensuring that user-controlled input is properly sanitized and parameterized.

## Rails Implementation Reference

The Rails application uses Redis for state management and does not use SQL databases directly:

1. **CursorRunnerCallbackService** (`app/services/cursor_runner_callback_service.rb`):
   - Uses Redis for storing callback state
   - Key construction: `"#{REDIS_KEY_PREFIX}#{request_id}"`
   - Redis commands: `setex`, `get`, `del`
   - JSON serialization: `data.to_json`
   - Potential vulnerability: If `request_id` contains special characters, it could affect key construction

2. **Redis Key Patterns**:
   - Keys are constructed by concatenating prefix with user-provided `request_id`
   - No explicit validation or sanitization of `request_id` before key construction
   - Redis commands are called with constructed keys directly

3. **No SQL Database**:
   - The application does not use SQL databases
   - All persistence is handled via Redis
   - No ActiveRecord models or SQL queries

## Checklist

### SQL Injection Prevention (if applicable)

- [ ] Review any SQL database usage
  - [ ] Verify no SQL databases are used (application uses Redis only)
  - [ ] If SQL is added in future, ensure parameterized queries are used
  - [ ] Document that SQL is not currently used

- [ ] Review any raw SQL queries (if applicable)
  - [ ] Check for string concatenation in SQL queries
  - [ ] Verify all SQL queries use parameterized statements
  - [ ] Check for use of query builders (if SQL is added)
  - [ ] Verify no `eval()` or dynamic SQL construction from user input

- [ ] Review ORM usage (if SQL is added)
  - [ ] Verify ORM methods are used instead of raw SQL
  - [ ] Check that ORM properly escapes parameters
  - [ ] Review any custom SQL queries in ORM context

### Redis Injection Prevention

- [ ] Review Redis key construction
  - [ ] Review `CursorRunnerCallbackService` key construction
  - [ ] Verify `request_id` is validated before use in key construction
  - [ ] Check for special characters in `request_id` that could affect Redis keys
  - [ ] Verify key prefix is properly separated from user input
  - [ ] Check for key collision vulnerabilities (different users with same request_id)
  - [ ] Review all Redis key construction patterns in the codebase

- [ ] Review Redis command usage
  - [ ] Verify Redis commands (`setex`, `get`, `del`, etc.) are called with properly constructed keys
  - [ ] Check that user input is never directly passed to Redis commands
  - [ ] Verify Redis client library handles special characters safely
  - [ ] Review BullMQ job queue key construction (if applicable)
  - [ ] Check for Redis command injection vulnerabilities

- [ ] Review Redis value handling
  - [ ] Verify JSON serialization is safe (`JSON.stringify()` in TypeScript)
  - [ ] Check that user-controlled data is properly serialized
  - [ ] Verify JSON deserialization handles malformed data gracefully
  - [ ] Check for injection in Redis values (if values are used in commands)

- [ ] Review Redis key validation
  - [ ] Validate `request_id` format (UUID, alphanumeric, etc.)
  - [ ] Sanitize or reject `request_id` containing special characters
  - [ ] Set maximum length limits for Redis keys
  - [ ] Verify key namespaces are properly separated

- [ ] Review Redis connection and URL handling
  - [ ] Verify `REDIS_URL` environment variable is validated
  - [ ] Check for injection in Redis URL construction
  - [ ] Verify Redis connection parameters are safe

### Query Construction Safety

- [ ] Review all query construction patterns
  - [ ] Identify all places where user input is used in queries/keys
  - [ ] Verify input validation before query construction
  - [ ] Check for string interpolation vulnerabilities
  - [ ] Verify template literals are used safely (no user input in template strings)

- [ ] Review input sanitization
  - [ ] Verify user input is sanitized before use in queries/keys
  - [ ] Check for proper escaping of special characters
  - [ ] Verify input type validation (strings, numbers, etc.)
  - [ ] Check for length limits on input used in queries/keys

### BullMQ Query Safety

- [ ] Review BullMQ job queue operations
  - [ ] Verify job IDs are safely constructed
  - [ ] Check job data serialization
  - [ ] Review queue name construction (if dynamic)
  - [ ] Verify job options are safely constructed

### Injection Vulnerability Testing

- [ ] Test Redis key injection scenarios
  - [ ] Test with special characters in `request_id` (spaces, newlines, quotes, etc.)
  - [ ] Test with very long `request_id` values
  - [ ] Test with Unicode characters in `request_id`
  - [ ] Verify Redis keys are constructed safely

- [ ] Test Redis command injection scenarios
  - [ ] Verify malicious input cannot execute arbitrary Redis commands
  - [ ] Test with Redis command-like strings in input
  - [ ] Verify Redis client library prevents command injection

- [ ] Test JSON serialization safety
  - [ ] Test with malformed JSON in stored values
  - [ ] Test with very large JSON payloads
  - [ ] Verify JSON parsing handles errors gracefully

### Documentation and Guidelines

- [ ] Document Redis key construction patterns
  - [ ] Document safe key construction practices
  - [ ] Document key naming conventions
  - [ ] Document key validation requirements

- [ ] Document injection prevention guidelines
  - [ ] Create guidelines for safe Redis key construction
  - [ ] Document input validation requirements
  - [ ] Document Redis command usage best practices
  - [ ] Create or update security guidelines

- [ ] Document findings and decisions
  - [ ] Document any vulnerabilities found
  - [ ] Document fixes implemented
  - [ ] Document remaining risks (if any)

### Implementation Recommendations

- [ ] Create Redis key validation utility
  - [ ] Create function to validate and sanitize Redis keys
  - [ ] Create function to safely construct Redis keys with prefixes
  - [ ] Add TypeScript types for Redis key validation

- [ ] Add input validation for Redis operations
  - [ ] Validate `request_id` format before use
  - [ ] Add length limits for Redis keys
  - [ ] Sanitize special characters if needed

- [ ] Consider Redis key namespace isolation
  - [ ] Ensure keys from different sources don't collide
  - [ ] Use proper key prefixes for different data types
  - [ ] Consider using Redis hash structures for complex data

## Notes

- This task is part of Phase 3: Holistic Review and Best Practices
- Section: 6. Security Review
- Focus on identifying issues and improvements
- Document findings and decisions

- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE3-037
- Next: PHASE3-039

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
