# PHASE4-023: Optimize performance bottlenecks

**Section**: 3. Refactoring
**Subsection**: 3.6
**Task ID**: PHASE4-023

## Description

Optimize performance bottlenecks identified during Phase 3 performance review and any additional bottlenecks discovered during Phase 4 code quality audit. This task focuses on implementing optimizations to improve response times, reduce memory usage, optimize database/Redis queries, and fix performance bottlenecks that impact code quality and maintainability.

This task builds on the performance review work completed in Phase 3 (PHASE3-029 through PHASE3-035) and addresses any remaining or newly identified performance issues as part of the Phase 4 code quality audit.

## Scope

This task covers:
- Reviewing performance findings from Phase 3 performance review tasks
- Identifying any additional performance bottlenecks through code analysis
- Optimizing slow database/Redis queries
- Optimizing inefficient algorithms and data structures
- Implementing caching strategies where beneficial
- Optimizing memory usage and fixing memory leaks
- Reducing unnecessary computations and redundant operations
- Verifying performance improvements through testing
- Documenting all optimizations and their impact

**Note**: This task focuses on performance optimizations that improve code quality. For comprehensive performance optimization, refer to PHASE3-035 (Optimize identified performance issues).

## Context from Phase 3

Phase 3 performance review tasks (PHASE3-029 through PHASE3-035) identified performance issues in:
- Redis query patterns and connection management
- Database query efficiency
- API response times
- External API call patterns (Telegram, Cursor Runner, ElevenLabs)
- Asynchronous operation patterns
- Memory usage and potential leaks
- Caching strategies

This task addresses any remaining issues or newly discovered bottlenecks.

## Checklist

### Review Phase 3 Findings
- [ ] Review performance issues documented in Phase 3 tasks (PHASE3-029 through PHASE3-035)
- [ ] Identify any performance bottlenecks that were not fully addressed in Phase 3
- [ ] Review performance benchmarks and metrics from Phase 3
- [ ] Prioritize bottlenecks by impact (response time, memory, throughput)

### Code Analysis for Additional Bottlenecks
- [ ] Run performance profiling tools (Node.js profiler, clinic.js, or similar)
- [ ] Identify slow functions and hot paths in the codebase
- [ ] Review code complexity metrics for performance-critical sections
- [ ] Identify inefficient patterns introduced during Phase 2 conversion
- [ ] Check for performance regressions compared to Rails implementation

### Database/Redis Query Optimization
- [ ] Review and optimize slow Redis queries
  - Check for N+1 query patterns in Redis operations
  - Optimize Redis connection pooling if needed
  - Review TTL-based cleanup operations
  - Implement Redis pipelining where applicable
- [ ] Optimize database queries (if applicable)
  - Fix N+1 query problems
  - Add appropriate indexes
  - Optimize query execution plans
  - Review query result caching opportunities
- [ ] Review query caching strategies
  - Implement caching for frequently accessed data
  - Optimize cache key strategies
  - Review cache invalidation overhead

### Algorithm and Data Structure Optimization
- [ ] Identify and optimize inefficient algorithms
  - Review loop patterns and nested loops
  - Optimize string manipulation operations
  - Review regex performance
  - Optimize data transformation operations
- [ ] Optimize data structure choices
  - Use appropriate data structures for use cases
  - Review array vs object vs Map/Set trade-offs
  - Optimize data structure access patterns

### Caching Implementation
- [ ] Implement response caching where beneficial
  - Cache static or semi-static responses
  - Implement cache for frequently accessed data
  - Review cache invalidation strategies
- [ ] Implement query result caching
  - Cache expensive query results
  - Optimize cache hit rates
- [ ] Review caching overhead
  - Ensure caching doesn't add significant latency
  - Optimize cache key generation

### Memory Optimization
- [ ] Fix memory leaks
  - Identify and fix unclosed connections
  - Fix event listener leaks
  - Fix timer/interval leaks
  - Review and fix circular references
- [ ] Optimize memory usage
  - Reduce unnecessary object creation in hot paths
  - Optimize buffer allocation strategies
  - Review memory pressure and GC pauses
  - Optimize data structure choices

### Code-Level Optimizations
- [ ] Remove unnecessary operations
  - Remove redundant API calls
  - Remove unnecessary data transformations
  - Remove over-fetching of data
  - Optimize logging overhead
- [ ] Optimize async/await patterns
  - Convert sequential operations to parallel where possible
  - Use Promise.all() for independent operations
  - Review waterfall patterns and parallelize
  - Remove unnecessary await calls
- [ ] Fix event loop blocking
  - Move CPU-intensive operations to workers or jobs
  - Optimize synchronous file operations
  - Optimize large JSON parsing/serialization

### Performance Testing and Verification
- [ ] Test performance improvements
  - Run performance benchmarks before and after optimizations
  - Compare response times for key endpoints
  - Verify memory usage improvements
  - Check for performance regressions
- [ ] Update performance benchmarks
  - Document baseline metrics
  - Document optimized metrics
  - Calculate improvement percentages
- [ ] Run performance regression tests
  - Ensure optimizations don't break functionality
  - Verify performance improvements are maintained

### Documentation
- [ ] Document optimizations made
  - List all optimizations implemented
  - Document performance gains achieved (before/after metrics)
  - Document optimization techniques used
  - Update performance documentation
- [ ] Document remaining optimization opportunities
  - Identify future optimization opportunities
  - Document optimization recommendations

## Notes

- This task is part of Phase 4: Code Quality Audit
- Section: 3. Refactoring
- Focus on identifying and fixing performance bottlenecks that impact code quality
- This task builds on Phase 3 performance review findings (PHASE3-029 through PHASE3-035)
- Document all findings and improvements
- Verify improvements through performance testing

- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE4-022
- Next: PHASE4-024

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
