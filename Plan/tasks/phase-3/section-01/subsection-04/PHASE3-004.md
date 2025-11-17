# PHASE3-004: Review error handling strategies

**Section**: 1. Architecture Review
**Subsection**: 1.4
**Task ID**: PHASE3-004

## Description

Review and improve error handling strategies in the codebase to ensure best practices. This review should evaluate how errors are handled across all layers (controllers, services, jobs, middleware), verify consistent error handling patterns, check error propagation and logging, identify inconsistencies, and ensure proper error responses are returned to clients.

## Architecture Reference

Reference the planned architecture from:
- `Plan/app-description.md` - Application overview and component descriptions
- `Plan/CONVERSION_STEPS.md` - Conversion plan and architecture considerations
- `src/` directory structure - Current implementation structure

The application follows a layered architecture with:
- **Controllers** (`src/controllers/`) - HTTP request handling and routing
- **Services** (`src/services/`) - Business logic and external API integration
- **Models** (`src/models/`) - Data models and database interactions
- **Routes** (`src/routes/`) - Route definitions and middleware
- **Middleware** (`src/middleware/`) - Request processing middleware
- **Jobs** - Background job processing (BullMQ)
- **Utils** (`src/utils/`) - Utility functions and helpers
- **Types** (`src/types/`) - TypeScript type definitions

## Error Handling Best Practices

In Node.js/TypeScript applications, error handling should follow these patterns:

1. **Custom Error Classes**: Use custom error classes that extend `Error` for different error types
2. **Error Propagation**: Let errors bubble up appropriately, don't swallow errors silently
3. **Error Middleware**: Use Express error middleware to handle errors consistently
4. **Structured Error Responses**: Return consistent error response formats
5. **Error Logging**: Log errors with appropriate context and severity levels
6. **Async Error Handling**: Properly handle errors in async/await and Promise chains
7. **Type Safety**: Use TypeScript to type errors appropriately

## Checklist

- [ ] Review error handling in services
  - [ ] Verify services throw appropriate error types (not generic Error)
  - [ ] Check that services don't swallow errors silently
  - [ ] Verify error messages are descriptive and actionable
  - [ ] Check for proper error handling in async operations
  - [ ] Verify external API errors are handled gracefully
  - [ ] Check that services propagate errors appropriately (don't catch and ignore)
  - [ ] Verify error handling for network timeouts and connection failures
  - [ ] Check for proper error handling in service methods that call external APIs
  - [ ] Identify services that catch errors but don't handle them properly
- [ ] Review error handling in controllers
  - [ ] Verify controllers use try-catch blocks appropriately
  - [ ] Check that controllers don't contain business logic in error handlers
  - [ ] Verify error responses follow consistent format
  - [ ] Check that HTTP status codes are appropriate for error types
  - [ ] Verify controllers handle validation errors properly
  - [ ] Check for proper error handling in async route handlers
  - [ ] Verify controllers use error middleware instead of duplicating error handling
  - [ ] Check that sensitive error information is not exposed to clients
- [ ] Review error handling in jobs
  - [ ] Verify jobs handle errors without crashing the job processor
  - [ ] Check that failed jobs are properly logged
  - [ ] Verify jobs retry appropriately for transient errors
  - [ ] Check that jobs don't swallow errors silently
  - [ ] Verify error handling for job timeouts
  - [ ] Check for proper error handling in async job operations
  - [ ] Verify jobs handle external API errors gracefully
- [ ] Review error handling middleware
  - [ ] Verify Express error middleware is properly configured
  - [ ] Check that error middleware handles all error types consistently
  - [ ] Verify error middleware returns appropriate HTTP status codes
  - [ ] Check that error middleware formats error responses consistently
  - [ ] Verify error middleware logs errors appropriately
  - [ ] Check for proper error middleware ordering in Express app
- [ ] Check error propagation patterns
  - [ ] Verify errors propagate correctly through service layers
  - [ ] Check that errors are not unnecessarily caught and re-thrown
  - [ ] Verify error context is preserved during propagation
  - [ ] Check for proper error wrapping when propagating errors
  - [ ] Identify places where errors are caught but not properly handled
  - [ ] Verify error propagation doesn't leak implementation details
- [ ] Review error logging strategies
  - [ ] Verify errors are logged with appropriate severity levels
  - [ ] Check that error logs include sufficient context (request ID, user ID, etc.)
  - [ ] Verify error logs don't contain sensitive information
  - [ ] Check for consistent logging format across the codebase
  - [ ] Verify errors are logged at appropriate layers (not duplicated)
  - [ ] Check that critical errors trigger alerts/notifications
  - [ ] Verify error logs are structured and searchable
- [ ] Review custom error classes
  - [ ] Check if custom error classes are used appropriately
  - [ ] Verify custom errors extend Error properly
  - [ ] Check that custom errors include necessary context
  - [ ] Verify custom errors are typed correctly in TypeScript
  - [ ] Check for consistent naming conventions for error classes
- [ ] Review async/await error handling
  - [ ] Verify all async functions have proper error handling
  - [ ] Check for unhandled promise rejections
  - [ ] Verify Promise chains have proper catch handlers
  - [ ] Check that async errors are properly propagated
  - [ ] Verify async error handling doesn't cause memory leaks
- [ ] Review error response formats
  - [ ] Verify error responses follow a consistent structure
  - [ ] Check that error responses include appropriate fields (message, code, details)
  - [ ] Verify error responses don't expose sensitive information
  - [ ] Check that error responses are properly typed
  - [ ] Verify error responses match API documentation
- [ ] Identify inconsistencies
  - [ ] Find places where error handling patterns differ
  - [ ] Identify services/controllers that handle errors differently
  - [ ] Check for inconsistent error message formats
  - [ ] Verify consistent use of error types across the codebase
  - [ ] Find places where error handling could be standardized
- [ ] Review error handling for external integrations
  - [ ] Verify Telegram API errors are handled appropriately
  - [ ] Check Cursor Runner API error handling
  - [ ] Verify ElevenLabs API error handling
  - [ ] Check Redis error handling
  - [ ] Verify database error handling (if applicable)
  - [ ] Check for proper timeout handling for external calls
- [ ] Document error handling approach
  - [ ] Create error handling guidelines document
  - [ ] Document error types and when to use them
  - [ ] Document error response format standards
  - [ ] Document error logging standards
  - [ ] Create examples of proper error handling patterns
  - [ ] Document error handling for each layer (controllers, services, jobs)

## Notes

- This task is part of Phase 3: Holistic Review and Best Practices
- Section: 1. Architecture Review
- Focus on identifying issues and improvements
- Document findings and decisions
- Compare implemented error handling with Node.js/TypeScript best practices
- Review both existing code and planned structure to ensure consistent error handling
- Reference Rails error handling patterns from jarek-va but adapt to Node.js/TypeScript conventions
- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE3-003
- Next: PHASE3-005

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
