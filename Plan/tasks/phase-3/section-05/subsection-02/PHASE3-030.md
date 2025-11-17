# PHASE3-030: Check for N+1 query problems

**Section**: 5. Performance Review
**Subsection**: 5.2
**Task ID**: PHASE3-030

## Description

Review and identify N+1 query problems in the codebase to ensure best practices. This task focuses on detecting patterns where multiple queries are executed in loops when they could be batched or optimized into a single query. The application uses MCP database connections (cursor-runner-shared-sqlite), Redis operations, and external API calls, all of which can exhibit N+1 patterns.

## Checklist

### MCP Database Query Patterns
- [ ] Review MCP database query patterns (cursor-runner-shared-sqlite)
  - Identify loops that execute MCP queries (SELECT, INSERT, UPDATE, DELETE)
  - Check for patterns where a list query is followed by individual queries for each item
  - Look for SystemSetting queries executed in loops
  - Look for tasks table queries executed in loops
  - Identify opportunities to batch multiple queries into single operations
- [ ] Check for N+1 patterns in MCP queries
  - Review code that fetches a list, then queries each item individually
  - Check if multiple SystemSetting lookups can be combined
  - Verify if task queries can be batched (e.g., updating multiple tasks)
  - Look for patterns where related data is fetched separately instead of using JOINs or batch queries

### Redis Query Patterns
- [ ] Review Redis operations for N+1 patterns
  - Check for loops that execute individual Redis GET/SET operations
  - Identify patterns where multiple Redis keys are accessed sequentially in loops
  - Look for opportunities to use Redis pipelining for batch operations
  - Check if MGET/MSET could replace multiple individual GET/SET operations
  - Review callback service for patterns where multiple callbacks are processed individually
- [ ] Check Redis batch operation opportunities
  - Verify if multiple Redis operations can be combined using pipelining
  - Check if hash operations (HGETALL, HMSET) could replace multiple string operations
  - Review if sorted sets or other structures could reduce query count

### External API Call Patterns
- [ ] Review external API calls for N+1 patterns
  - Check Telegram Bot API calls executed in loops (sending messages, getting updates)
  - Review Cursor Runner API calls that might be batched
  - Check ElevenLabs API calls for batch opportunities
  - Identify patterns where multiple API calls could be combined
- [ ] Check for sequential API calls that could be parallelized
  - Review if Promise.all() could parallelize independent API calls
  - Check if batch endpoints exist for external APIs
  - Verify if rate limiting considerations allow for batching

### Loop Analysis
- [ ] Identify loops with queries
  - Review all for/while/forEach loops that contain database queries
  - Check map/filter/reduce operations that trigger queries
  - Identify async operations in loops that could be batched
  - Review recursive functions that might trigger multiple queries
- [ ] Check for unnecessary queries in loops
  - Verify if data fetched in loops could be prefetched before the loop
  - Check if queries inside loops could be moved outside
  - Review if cached data could prevent repeated queries
  - Identify queries that return unused data

### Batch Operation Opportunities
- [ ] Review batch operation possibilities
  - Check if multiple individual queries can be combined into batch queries
  - Verify if bulk operations are available for MCP database queries
  - Review if batch endpoints exist for external APIs
  - Check if Redis pipelining can batch multiple operations
- [ ] Identify optimization opportunities
  - Review if data can be prefetched before processing loops
  - Check if JOINs or batch queries can replace multiple individual queries
  - Verify if caching can prevent repeated queries
  - Review if parallel execution (Promise.all) can improve performance

### Documentation and Fixes
- [ ] Document identified N+1 patterns
  - List all identified N+1 query problems
  - Document the impact of each issue (query count, performance impact)
  - Prioritize fixes based on frequency and impact
  - Create a plan for fixing identified issues
- [ ] Implement fixes for critical N+1 patterns
  - Fix high-impact N+1 patterns (frequently executed, high query count)
  - Refactor loops to use batch operations where possible
  - Implement prefetching strategies where appropriate
  - Add batching for external API calls where supported

## Notes

- This task is part of Phase 3: Holistic Review and Best Practices
- Section: 5. Performance Review
- Focus on identifying issues and improvements
- Document findings and decisions

- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE3-029
- Next: PHASE3-031

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
