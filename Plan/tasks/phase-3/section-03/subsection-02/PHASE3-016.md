# PHASE3-016: Review error handling patterns

**Section**: 3. Node.js Best Practices
**Subsection**: 3.2
**Task ID**: PHASE3-016

## Description

Review and improve error handling patterns in the codebase to ensure Node.js/TypeScript best practices. This task focuses on code-level error handling patterns, including Error object usage, error inheritance, try-catch patterns, error context preservation, and error propagation. This complements PHASE3-004 which covers architectural error handling strategies.

## Error Handling Context

The codebase should use custom error classes defined in `src/types/errors.ts` (created in PHASE2-005):
- `ServiceError` (base class extending Error)
- `ConnectionError` (extends ServiceError)
- `TimeoutError` (extends ServiceError)
- `InvalidResponseError` (extends ServiceError)
- `TranscriptionError` (extends ServiceError)
- `SynthesisError` (extends ServiceError)

Reference PHASE3-004 for comprehensive error handling strategy review.

## Node.js Error Handling Best Practices

1. **Error Objects**: Always use Error objects or custom error classes, never throw strings or primitives
2. **Error Inheritance**: Custom errors should properly extend Error and call `super()` in constructor
3. **Error Context**: Preserve error context when wrapping/re-throwing errors
4. **Error Messages**: Use descriptive, actionable error messages
5. **Error Propagation**: Let errors bubble up appropriately, don't swallow errors silently
6. **Try-Catch Patterns**: Use try-catch appropriately, avoid over-catching or under-catching
7. **Async Error Handling**: Properly handle errors in async/await and Promise chains

## Checklist

- [ ] Review Error object usage
  - [ ] Verify all thrown errors are Error instances (not strings or primitives)
  - [ ] Check that custom error classes properly extend Error
  - [ ] Verify Error constructors call `super(message)` appropriately
  - [ ] Check that error stack traces are preserved
  - [ ] Identify places where non-Error values are thrown
- [ ] Check for proper error inheritance
  - [ ] Verify custom error classes extend appropriate base classes (ServiceError, Error)
  - [ ] Check that error inheritance hierarchy is logical and consistent
  - [ ] Verify error classes maintain proper instanceof relationships
  - [ ] Check that error classes preserve Error.prototype properties
  - [ ] Review error class definitions in `src/types/errors.ts`
- [ ] Review try-catch usage
  - [ ] Verify try-catch blocks catch appropriate error types
  - [ ] Check for over-catching (catching errors that should propagate)
  - [ ] Check for under-catching (missing error handling in async operations)
  - [ ] Verify catch blocks handle errors appropriately (log, re-throw, or transform)
  - [ ] Check for empty catch blocks or catch blocks that silently ignore errors
  - [ ] Verify catch blocks use proper error types (not just `catch (error: any)`)
  - [ ] Review nested try-catch patterns for appropriateness
- [ ] Check for error context preservation
  - [ ] Verify errors preserve original error context when wrapped
  - [ ] Check that error messages include relevant context (request IDs, parameters, etc.)
  - [ ] Verify error stack traces are not lost during propagation
  - [ ] Check for proper error chaining (using `cause` property or custom context)
  - [ ] Review error wrapping patterns to ensure context is preserved
- [ ] Review error message quality
  - [ ] Verify error messages are descriptive and actionable
  - [ ] Check that error messages don't expose sensitive information
  - [ ] Verify error messages follow consistent formatting
  - [ ] Check that error messages include relevant context (what failed, why it failed)
  - [ ] Identify generic or unhelpful error messages
  - [ ] Review error messages for user-facing vs. developer-facing clarity
- [ ] Check for proper error propagation
  - [ ] Verify errors propagate correctly through service layers
  - [ ] Check for unnecessary error catching and re-throwing
  - [ ] Verify errors are not swallowed silently (caught but not logged/re-thrown)
  - [ ] Check that error propagation preserves error types
  - [ ] Review error propagation patterns in async/await chains
  - [ ] Verify Promise chains have proper error handling
  - [ ] Check for unhandled promise rejections
- [ ] Review async/await error handling patterns
  - [ ] Verify all async functions have proper error handling
  - [ ] Check for missing await in try-catch blocks
  - [ ] Verify async errors are properly caught and handled
  - [ ] Check for proper error handling in Promise.all/Promise.allSettled
  - [ ] Review error handling in async iterators/generators
- [ ] Review error type usage in TypeScript
  - [ ] Verify catch blocks use proper TypeScript error types
  - [ ] Check for excessive use of `any` in error handling
  - [ ] Verify error types are properly defined and exported
  - [ ] Check that error type guards are used appropriately
  - [ ] Review error type narrowing in catch blocks
- [ ] Identify improvements
  - [ ] Document specific error handling issues found
  - [ ] Propose fixes for identified issues
  - [ ] Create examples of improved error handling patterns
  - [ ] Document best practices for future development
  - [ ] Identify patterns that should be standardized across the codebase

## Notes

- This task is part of Phase 3: Holistic Review and Best Practices
- Section: 3. Node.js Best Practices
- Focus on code-level error handling patterns (not architectural strategies - see PHASE3-004)
- Review actual implementation files in `src/` directory
- Compare error handling patterns with Node.js/TypeScript best practices
- Document findings with specific file locations and line numbers
- Reference error classes from PHASE2-005 and error handling strategies from PHASE3-004
- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE3-015
- Next: PHASE3-017

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
