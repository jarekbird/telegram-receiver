# PHASE3-029: Review Redis query patterns

**Section**: 5. Performance Review
**Subsection**: 5.1
**Task ID**: PHASE3-029

## Description

Review and improve Redis query patterns in the codebase to ensure best practices. This task focuses on analyzing Redis usage patterns, identifying performance bottlenecks, and ensuring efficient Redis operations throughout the application.

Reference the Rails implementation at `jarek-va/app/services/cursor_runner_callback_service.rb` to understand the original Redis usage patterns and ensure the TypeScript implementation follows best practices.

## Checklist

### Query Frequency and Patterns
- [ ] Review Redis query frequency across all services
  - Identify high-frequency Redis operations (e.g., callback state lookups)
  - Check for unnecessary Redis calls in hot paths
  - Review if operations can be batched or cached
- [ ] Analyze Redis operation patterns
  - Count total Redis operations per request/operation
  - Identify operations that could be combined (pipelining)
  - Check for redundant Redis calls

### Query Efficiency
- [ ] Check for inefficient queries
  - Avoid using `KEYS` command (use `SCAN` instead for production)
  - Review if any operations can use Redis pipelining for multiple commands
  - Check for N+1 query patterns (multiple sequential Redis calls that could be batched)
  - Verify atomic operations are used where appropriate (e.g., `setex` instead of `set` + `expire`)
- [ ] Review Redis command usage
  - Verify `setex` is used for storing with TTL (matches Rails `setex` pattern)
  - Check that `get` operations handle null responses correctly
  - Verify `del` operations are used appropriately for cleanup
  - Ensure no blocking operations are used inappropriately

### Key Naming Patterns
- [ ] Review key naming patterns
  - Verify consistent key prefix usage (e.g., `cursor_runner_callback:` from Rails implementation)
  - Check that keys follow a clear namespace pattern
  - Ensure keys are descriptive and follow naming conventions
  - Verify no key collisions or conflicts
  - Check that keys are properly scoped (e.g., per-request IDs)

### TTL (Time To Live) Usage
- [ ] Check for proper TTL usage
  - Verify all stored data has appropriate TTL values
  - Review default TTL values (Rails uses 3600 seconds = 1 hour)
  - Check that TTL values are reasonable for the data lifecycle
  - Verify TTL is set atomically with storage (using `setex` not `set` + `expire`)
  - Ensure expired data is handled gracefully (null checks)

### Connection Management
- [ ] Review connection pooling
  - Verify Redis client uses connection pooling (not creating new clients per request)
  - Check if multiple Redis client instances are created unnecessarily
  - Review singleton pattern or shared Redis client usage
  - Verify connection reuse across service instances
  - Check for proper connection cleanup on shutdown
- [ ] Review Redis client initialization
  - Verify Redis URL configuration matches Rails pattern (`REDIS_URL` env var, default `redis://localhost:6379/0`)
  - Check Docker environment support (`redis://redis:6379/0`)
  - Review if dependency injection pattern is used for Redis client (allows testing)

### Error Handling and Resilience
- [ ] Review Redis error handling
  - Check for proper error handling around Redis operations
  - Verify graceful degradation when Redis is unavailable
  - Review connection error handling (ECONNREFUSED, timeouts)
  - Check for retry logic where appropriate
  - Verify error logging includes context (request IDs, operation types)

### Optimization Opportunities
- [ ] Identify optimization opportunities
  - Check if pipelining can reduce round trips for multiple operations
  - Review if caching can reduce Redis calls
  - Check if operations can be made atomic
  - Verify no unnecessary serialization/deserialization overhead
  - Review JSON parsing patterns (Rails uses `JSON.parse` with `symbolize_names: true`)
- [ ] Review data structures
  - Verify appropriate Redis data types are used (strings vs hashes vs sets)
  - Check if hash operations could replace multiple string operations
  - Review if sorted sets or other structures could improve performance

### Documentation and Patterns
- [ ] Document Redis usage patterns
  - Document key naming conventions
  - Document TTL policies and defaults
  - Document connection management approach
  - Create guidelines for future Redis usage
  - Document error handling patterns

## Notes

- This task is part of Phase 3: Holistic Review and Best Practices
- Section: 5. Performance Review
- Focus on identifying issues and improvements
- Document findings and decisions

- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE3-028
- Next: PHASE3-030

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
