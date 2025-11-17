# PHASE3-030: Check for N+1 query problems

**Section**: 5. Performance Review
**Subsection**: 5.2
**Task ID**: PHASE3-030

## Description

Review and identify N+1 query problems in the codebase to ensure best practices. This task focuses on detecting patterns where multiple queries are executed in loops when they could be batched or optimized into a single query. The application uses MCP database connections (cursor-runner-shared-sqlite), Redis operations, and external API calls, all of which can exhibit N+1 patterns.

**Key Areas to Review:**
- **MCP Database Queries**: SystemSetting lookups and tasks table operations via cursor-runner-shared-sqlite MCP connection
- **Redis Operations**: Callback state management in `CursorRunnerCallbackService`, BullMQ job queue operations
- **External API Calls**: Telegram Bot API calls in `TelegramService`, Cursor Runner API calls in `CursorRunnerService`, ElevenLabs API calls
- **Background Job Processing**: BullMQ job processors that might query data for each job item
- **Message Processing**: `TelegramMessageJob` processing multiple updates or messages sequentially

Reference the Rails implementation patterns where applicable to understand expected query behavior:
- `jarek-va/app/services/cursor_runner_callback_service.rb` - Redis callback state management
- `jarek-va/app/services/telegram_service.rb` - Telegram Bot API interactions
- `jarek-va/app/jobs/telegram_message_job.rb` - Message processing patterns

## Checklist

### MCP Database Query Patterns
- [ ] Review MCP database query patterns (cursor-runner-shared-sqlite)
  - Identify loops that execute MCP queries (SELECT, INSERT, UPDATE, DELETE)
  - Check for patterns where a list query is followed by individual queries for each item
  - Look for SystemSetting queries executed in loops (e.g., checking multiple settings sequentially)
  - Look for tasks table queries executed in loops (e.g., updating multiple tasks one by one)
  - Review any service that accesses SystemSetting or tasks table for loop-based queries
  - Identify opportunities to batch multiple queries into single operations
- [ ] Check for N+1 patterns in MCP queries
  - Review code that fetches a list, then queries each item individually
  - Check if multiple SystemSetting lookups can be combined (e.g., fetching multiple settings in one query)
  - Verify if task queries can be batched (e.g., updating multiple tasks in a single transaction or batch UPDATE)
  - Look for patterns where related data is fetched separately instead of using JOINs or batch queries
  - Review task operator patterns that might query tasks individually instead of batching
  - Check if SystemSetting lookups in request handlers could be cached or batched

### Redis Query Patterns
- [ ] Review Redis operations for N+1 patterns
  - Check for loops that execute individual Redis GET/SET operations
  - Identify patterns where multiple Redis keys are accessed sequentially in loops
  - Review `CursorRunnerCallbackService` for patterns where multiple callbacks are processed individually
  - Check BullMQ job processing for patterns that access Redis keys in loops
  - Look for opportunities to use Redis pipelining for batch operations
  - Check if MGET/MSET could replace multiple individual GET/SET operations
  - Review callback cleanup operations that might delete keys one by one
- [ ] Check Redis batch operation opportunities
  - Verify if multiple Redis operations can be combined using pipelining
  - Check if hash operations (HGETALL, HMSET) could replace multiple string operations
  - Review if sorted sets or other structures could reduce query count
  - Check if callback state retrieval can be batched when processing multiple callbacks
  - Review BullMQ's internal Redis operations (ensure they're efficient, though this is library-managed)

### External API Call Patterns
- [ ] Review external API calls for N+1 patterns
  - Check `TelegramService` for Telegram Bot API calls executed in loops (sending messages to multiple users, getting file info for multiple files)
  - Review `CursorRunnerService` for Cursor Runner API calls that might be batched
  - Check `ElevenLabsSpeechToTextService` and `ElevenLabsTextToSpeechService` for batch opportunities
  - Review `TelegramMessageJob` for patterns that send multiple messages sequentially
  - Identify patterns where multiple API calls could be combined (e.g., sending multiple Telegram messages)
  - Check webhook management endpoints for sequential API calls
- [ ] Check for sequential API calls that could be parallelized
  - Review if Promise.all() could parallelize independent API calls (e.g., sending multiple Telegram messages concurrently)
  - Check if batch endpoints exist for external APIs (Telegram doesn't support batch, but parallelization is possible)
  - Verify if rate limiting considerations allow for batching or parallelization
  - Review callback processing that might make sequential API calls to Telegram
  - Check if file downloads from Telegram could be parallelized when processing multiple files

### Loop Analysis
- [ ] Identify loops with queries
  - Review all for/while/forEach loops that contain database queries (MCP, Redis, API calls)
  - Check map/filter/reduce operations that trigger queries (common in TypeScript/JavaScript)
  - Identify async operations in loops that could be batched (await in loops is a red flag)
  - Review recursive functions that might trigger multiple queries
  - Check `TelegramMessageJob` for loops processing multiple updates sequentially
  - Review any batch processing logic that might query data per item
- [ ] Check for unnecessary queries in loops
  - Verify if data fetched in loops could be prefetched before the loop (e.g., fetch all SystemSettings needed upfront)
  - Check if queries inside loops could be moved outside (e.g., configuration lookups)
  - Review if cached data could prevent repeated queries (e.g., SystemSetting values, bot client instances)
  - Identify queries that return unused data (fetching more than needed)
  - Check if loop iterations could be parallelized with Promise.all() instead of sequential await

### Batch Operation Opportunities
- [ ] Review batch operation possibilities
  - Check if multiple individual queries can be combined into batch queries (MCP supports multiple statements)
  - Verify if bulk operations are available for MCP database queries (e.g., batch UPDATE for tasks)
  - Review if batch endpoints exist for external APIs (Telegram doesn't support batch, but parallelization helps)
  - Check if Redis pipelining can batch multiple operations (MGET, MSET, pipeline)
  - Review if multiple SystemSetting lookups can be combined into a single query
- [ ] Identify optimization opportunities
  - Review if data can be prefetched before processing loops (e.g., fetch all SystemSettings at startup or per-request)
  - Check if JOINs or batch queries can replace multiple individual queries (MCP SQLite supports JOINs)
  - Verify if caching can prevent repeated queries (SystemSetting values, bot clients, etc.)
  - Review if parallel execution (Promise.all) can improve performance (independent API calls, file downloads)
  - Check if BullMQ job processing could batch operations when processing multiple jobs

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
