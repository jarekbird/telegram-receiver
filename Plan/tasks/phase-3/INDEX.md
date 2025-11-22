# Phase 3 Tasks Index

This file provides an index of all tasks for Phase 3: Holistic Review and Best Practices.

## Task List

### 1. Architecture Review

- [PHASE3-001](section-01/subsection-01/PHASE3-001.md): Review overall application architecture
- [PHASE3-002](section-01/subsection-02/PHASE3-002.md): Review separation of concerns
- [PHASE3-003](section-01/subsection-03/PHASE3-003.md): Verify dependency injection patterns
- [PHASE3-004](section-01/subsection-04/PHASE3-004.md): Review error handling strategies
- [PHASE3-005](section-01/subsection-05/PHASE3-005.md): Review async/await patterns and Promise handling
- [PHASE3-006](section-01/subsection-06/PHASE3-006.md): Document architectural decisions
- [PHASE3-007](section-01/subsection-07/PHASE3-007.md): Create architecture diagram

### 2. TypeScript Best Practices

- [PHASE3-008](section-02/subsection-01/PHASE3-008.md): Review type definitions throughout codebase
- [PHASE3-009](section-02/subsection-02/PHASE3-009.md): Review interface/type usage patterns
- [PHASE3-010](section-02/subsection-03/PHASE3-010.md): Review generic type usage
- [PHASE3-011](section-02/subsection-04/PHASE3-011.md): Verify type safety in all modules
- [PHASE3-012](section-02/subsection-05/PHASE3-012.md): Review and improve type inference
- [PHASE3-013](section-02/subsection-06/PHASE3-013.md): Fix any type-related issues
- [PHASE3-014](section-02/subsection-07/PHASE3-014.md): Add missing type annotations

### 3. Node.js Best Practices

- [PHASE3-015](section-03/subsection-01/PHASE3-015.md): Review Node.js style guide compliance
- [PHASE3-016](section-03/subsection-02/PHASE3-016.md): Review error handling patterns
- [PHASE3-017](section-03/subsection-03/PHASE3-017.md): Review async patterns (avoid callback hell)
- [PHASE3-018](section-03/subsection-04/PHASE3-018.md): Review resource cleanup (file handles, connections)
- [PHASE3-019](section-03/subsection-05/PHASE3-019.md): Review logging practices
- [PHASE3-020](section-03/subsection-06/PHASE3-020.md): Review security best practices
- [PHASE3-021](section-03/subsection-07/PHASE3-021.md): Fix identified Node.js best practice issues

### 4. Code Organization

- [PHASE3-022](section-04/subsection-01/PHASE3-022.md): Review file/folder structure
- [PHASE3-023](section-04/subsection-02/PHASE3-023.md): Review naming conventions consistency
- [PHASE3-024](section-04/subsection-03/PHASE3-024.md): Review module boundaries
- [PHASE3-025](section-04/subsection-04/PHASE3-025.md): Review import/export patterns
- [PHASE3-026](section-04/subsection-05/PHASE3-026.md): Review code reusability
- [PHASE3-027](section-04/subsection-06/PHASE3-027.md): Refactor code organization issues
- [PHASE3-028](section-04/subsection-07/PHASE3-028.md): Standardize naming conventions

### 5. Performance Review

- [PHASE3-029](section-05/subsection-01/PHASE3-029.md): Review Redis query patterns
- [PHASE3-030](section-05/subsection-02/PHASE3-030.md): Check for N+1 query problems
- [PHASE3-031](section-05/subsection-03/PHASE3-031.md): Review caching strategies
- [PHASE3-032](section-05/subsection-04/PHASE3-032.md): Analyze memory usage patterns
- [PHASE3-033](section-05/subsection-05/PHASE3-033.md): Review API response times
- [PHASE3-034](section-05/subsection-06/PHASE3-034.md): Create performance benchmarks
- [PHASE3-035](section-05/subsection-07/PHASE3-035.md): Optimize identified performance issues

### 6. Security Review

- [PHASE3-036](section-06/subsection-01/PHASE3-036.md): Review authentication/authorization
- [PHASE3-037](section-06/subsection-02/PHASE3-037.md): Review input validation
- [PHASE3-038](section-06/subsection-03/PHASE3-038.md): Review SQL injection prevention (if applicable)
- [PHASE3-039](section-06/subsection-04/PHASE3-039.md): Review secure credential handling
- [PHASE3-040](section-06/subsection-05/PHASE3-040.md): Review CORS and security headers
- [PHASE3-041](section-06/subsection-06/PHASE3-041.md): Perform security audit
- [PHASE3-042](section-06/subsection-07/PHASE3-042.md): Fix identified security issues
- [PHASE3-043](section-06/subsection-08/PHASE3-043.md): Create security audit report

### 7. Testing Review

- [PHASE3-044](section-07/subsection-01/PHASE3-044.md): Review test coverage
- [PHASE3-045](section-07/subsection-02/PHASE3-045.md): Review test organization
- [PHASE3-046](section-07/subsection-03/PHASE3-046.md): Review mocking strategies
- [PHASE3-047](section-07/subsection-04/PHASE3-047.md): Review integration test coverage
- [PHASE3-048](section-07/subsection-05/PHASE3-048.md): Review test performance
- [PHASE3-049](section-07/subsection-06/PHASE3-049.md): Add missing tests
- [PHASE3-050](section-07/subsection-07/PHASE3-050.md): Improve test quality

## Summary

Total tasks: 50

## Quick Reference

This phase focuses on reviewing the entire codebase holistically and ensuring adherence to Node.js/TypeScript best practices:

- Architecture review and documentation
- TypeScript best practices enforcement
- Node.js best practices compliance
- Code organization improvements
- Performance optimization
- Security audit and fixes
- Testing improvements

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
- To list ready tasks: SELECT \* FROM tasks WHERE status = 0 ORDER BY "order" ASC, id ASC
- To mark a task as complete: UPDATE tasks SET status = 1, updatedat = CURRENT_TIMESTAMP WHERE id = ?
- To archive a task: UPDATE tasks SET status = 2, updatedat = CURRENT_TIMESTAMP WHERE id = ?
- To backlog a task: UPDATE tasks SET status = 3, updatedat = CURRENT_TIMESTAMP WHERE id = ?
- To get next ready task: SELECT \* FROM tasks WHERE status = 0 ORDER BY "order" ASC, id ASC LIMIT 1

The task operator agent (when enabled) automatically processes tasks with status = 0 (ready), sending the prompt to cursor-runner for execution.

IMPORTANT: When working with cursor-agents (creating, listing, getting status, or deleting agents), use the Python scripts in /cursor/tools/cursor-agents/ directory. These scripts communicate with the cursor-agents service over HTTP:

Agent Management:

- To list all agents: python3 /cursor/tools/cursor-agents/list_agents.py
- To get agent status: python3 /cursor/tools/cursor-agents/get_agent_status.py --name <agent-name>
- To create an agent: python3 /cursor/tools/cursor-agents/create_agent.py --name <name> --target-url <url> [options]
  - Use --queue <queue-name> to assign the agent to a specific queue (defaults to "default" if not specified)
  - Use --schedule <cron-pattern> for recurring agents (e.g., "0 8 \* \* \*" for daily at 8 AM)
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
