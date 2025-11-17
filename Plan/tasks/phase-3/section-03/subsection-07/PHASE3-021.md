# PHASE3-021: Fix identified Node.js best practice issues

**Section**: 3. Node.js Best Practices
**Subsection**: 3.7
**Task ID**: PHASE3-021

## Description

Fix all identified Node.js best practice issues from the previous review tasks (PHASE3-015 through PHASE3-020). This task consolidates and addresses all issues found during the Node.js best practices review phase, ensuring the codebase adheres to Node.js and TypeScript best practices.

This task should be executed after the review tasks (PHASE3-015 through PHASE3-020) have been completed and have identified specific issues. The goal is to systematically fix all identified issues across all areas of Node.js best practices.

## Context

This task consolidates fixes for issues identified in:
- **PHASE3-015**: Node.js style guide compliance issues
- **PHASE3-016**: Error handling pattern issues
- **PHASE3-017**: Callback pattern and callback hell issues
- **PHASE3-018**: Resource cleanup issues
- **PHASE3-019**: Logging practice issues
- **PHASE3-020**: Security best practice issues

## Checklist

### Style Guide Compliance Fixes (from PHASE3-015)
- [ ] Fix ESLint warnings and errors identified in PHASE3-015
- [ ] Fix Prettier formatting issues
- [ ] Correct naming convention violations (camelCase, PascalCase)
- [ ] Fix module pattern inconsistencies (ES modules vs CommonJS)
- [ ] Replace console.log with proper logger usage
- [ ] Fix TypeScript type issues (remove `any`, add proper types)
- [ ] Fix unused variables/imports
- [ ] Standardize code formatting (semicolons, quotes, indentation)
- [ ] Update ESLint/Prettier config if needed based on findings

### Error Handling Fixes (from PHASE3-016)
- [ ] Fix non-Error values being thrown (replace with Error instances)
- [ ] Fix custom error class definitions (proper Error inheritance)
- [ ] Fix try-catch patterns (remove over-catching, add missing error handling)
- [ ] Fix empty catch blocks or silent error swallowing
- [ ] Fix error context preservation (add context when wrapping errors)
- [ ] Improve error messages (make them descriptive and actionable)
- [ ] Fix error propagation issues (remove unnecessary re-throwing)
- [ ] Fix async/await error handling (add missing error handling)
- [ ] Fix TypeScript error type usage (replace `any` with proper error types)

### Callback Pattern Fixes (from PHASE3-017)
- [ ] Convert callback hell patterns to async/await
- [ ] Promisify callback-based Node.js APIs using `util.promisify`
- [ ] Refactor deeply nested callbacks (reduce nesting to ≤ 2 levels)
- [ ] Fix callback error handling (ensure error-first convention)
- [ ] Convert callback-based functions to Promise-based or async/await
- [ ] Fix mixed callback/Promise patterns (standardize on async/await)
- [ ] Convert stream event callbacks to async iterators where appropriate
- [ ] Fix Express middleware callback patterns (convert to async handlers)

### Resource Cleanup Fixes (from PHASE3-018)
- [ ] Add missing file handle cleanup (close files, destroy streams)
- [ ] Add database connection cleanup (close connections, return to pool)
- [ ] Add Redis connection cleanup (quit/disconnect on shutdown)
- [ ] Add HTTP connection cleanup (close Axios instances, destroy streams)
- [ ] Implement graceful shutdown handlers (SIGTERM/SIGINT)
- [ ] Add Express server cleanup (close server on shutdown)
- [ ] Add BullMQ queue cleanup (close queues and workers)
- [ ] Add stream cleanup (close/destroy streams properly)
- [ ] Remove event listeners to prevent memory leaks
- [ ] Clear timers (setTimeout, setInterval) properly
- [ ] Add try-finally blocks for resource cleanup
- [ ] Fix resource cleanup in error scenarios

### Logging Practice Fixes (from PHASE3-019)
- [ ] Replace all console.log with logger.info()
- [ ] Replace all console.error with logger.error()
- [ ] Replace all console.warn with logger.warn()
- [ ] Replace all console.debug with logger.debug()
- [ ] Add missing error stack traces to error logging
- [ ] Fix incorrect log level usage (info vs error vs warn)
- [ ] Add context/metadata to log entries (request_id, operation, etc.)
- [ ] Remove or redact sensitive data from logs
- [ ] Improve log message clarity and consistency
- [ ] Fix missing error logging in catch blocks
- [ ] Ensure error logging matches Rails pattern (error class, message, stack trace)

### Security Fixes (from PHASE3-020)
- [ ] Remove hardcoded secrets and move to environment variables
- [ ] Fix insecure environment variable handling
- [ ] Add missing input validation
- [ ] Fix SQL injection risks (if applicable)
- [ ] Fix XSS vulnerabilities
- [ ] Add missing security headers
- [ ] Fix CORS configuration issues
- [ ] Fix authentication/authorization issues
- [ ] Remove sensitive data from error messages
- [ ] Fix insecure file operations
- [ ] Update dependencies with known vulnerabilities
- [ ] Fix insecure HTTP requests (ensure HTTPS)

### Verification and Testing
- [ ] Run ESLint and fix all remaining issues
- [ ] Run Prettier and ensure consistent formatting
- [ ] Run TypeScript compiler and fix all type errors
- [ ] Run all tests and ensure they pass
- [ ] Verify no new issues introduced by fixes
- [ ] Test error handling improvements
- [ ] Test resource cleanup (verify no leaks)
- [ ] Test logging improvements
- [ ] Test security fixes
- [ ] Document all fixes made

## Best Practices

1. **Fix systematically**: Address issues from each review task category before moving to the next
2. **Test after fixes**: Run tests after each category of fixes to ensure nothing breaks
3. **Maintain functionality**: Ensure fixes don't change application behavior (only improve code quality)
4. **Document changes**: Document significant refactorings and why they were made
5. **Follow patterns**: Use established patterns from the codebase when fixing similar issues
6. **Verify improvements**: Run linting, formatting, and tests after all fixes are complete

## Notes

- This task is part of Phase 3: Holistic Review and Best Practices
- Section: 3. Node.js Best Practices
- This task should be executed after PHASE3-015 through PHASE3-020 are completed
- Focus on fixing identified issues, not discovering new ones
- Document all fixes with specific file locations and line numbers
- Ensure fixes maintain application functionality while improving code quality
- Task can be completed independently by a single agent, but may require multiple passes

## Related Tasks

- Previous: PHASE3-020
- Next: PHASE3-022

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
