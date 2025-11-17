# PHASE4-013: Review logging statements

**Section**: 2. Manual Code Review
**Subsection**: 2.4
**Task ID**: PHASE4-013

## Description

Review logging statements throughout the codebase to improve code quality and maintainability. This task focuses on auditing actual logging implementation in the source code, verifying logging best practices are followed, identifying inconsistencies, and ensuring logging statements meet quality standards. This complements PHASE3-019 (which reviewed logging practices during Phase 3) by performing a focused audit of logging statements in the implemented codebase.

## Context

This task is distinct from:
- **PHASE3-019**: Reviewed logging practices and best practices during Phase 3 (holistic review)
- **PHASE1-030 through PHASE1-035**: Created the logging infrastructure (logger configuration, wrapper, integration)
- **PHASE3-015**: Reviewed code style (including console.log usage)

**PHASE4-013** focuses specifically on:
- Auditing actual logging statements in implemented source code
- Verifying logging statements follow established patterns
- Identifying inconsistencies and quality issues in logging
- Ensuring logging statements meet production quality standards

## Architecture Reference

The application should use:
- **Logger utility wrapper** (`src/utils/logger.ts`) - Provides consistent `logger.info()`, `logger.error()`, `logger.warn()`, `logger.debug()` interface
- **Structured logging** - JSON format for production, human-readable for development
- **Log levels** - debug, info, warn, error matching Rails.logger patterns
- **Error logging** - Full stack traces for errors (matching Rails `Rails.logger.error(e.backtrace.join("\n"))` pattern)

Reference files:
- `src/utils/logger.ts` - Logger utility wrapper (should exist after PHASE1-032)
- `src/config/logger.ts` - Logger configuration (should exist after PHASE1-031)
- `docs/architecture.md` - Architecture documentation with logging patterns
- `Plan/tasks/phase-3/section-03/subsection-05/PHASE3-019.md` - Logging practices review

## Checklist

- [ ] Review logging infrastructure implementation
  - [ ] Verify `src/utils/logger.ts` exists and is properly implemented
  - [ ] Verify `src/config/logger.ts` exists and is properly configured
  - [ ] Check logger is imported and used correctly throughout codebase
  - [ ] Verify logger wrapper methods match expected interface (info, error, warn, debug)

- [ ] Review logging levels usage
  - [ ] Search for all `logger.info()` calls and verify appropriate usage
  - [ ] Search for all `logger.error()` calls and verify error logging includes stack traces
  - [ ] Search for all `logger.warn()` calls and verify warnings are appropriate
  - [ ] Search for all `logger.debug()` calls and verify debug logging is not excessive
  - [ ] Check for incorrect log level usage (e.g., using info for errors, error for warnings)
  - [ ] Verify log levels match the severity of the logged event

- [ ] Check for consistent logging format
  - [ ] Review log message format consistency across the codebase
  - [ ] Verify log messages are clear and descriptive
  - [ ] Check for inconsistent logging patterns (some using strings, some using objects)
  - [ ] Verify log messages follow a consistent pattern (e.g., "Action: description" or "Component: action: result")
  - [ ] Check for proper context inclusion in log messages (request_id, operation, etc.)

- [ ] Review structured logging
  - [ ] Check if structured logging (JSON format) is used in production
  - [ ] Verify log entries include relevant context (request_id, user_id, etc.)
  - [ ] Review log format consistency across the codebase
  - [ ] Check for proper metadata in log entries
  - [ ] Verify structured logging includes timestamps, log levels, and context

- [ ] Check for sensitive data in logs
  - [ ] Search for potential sensitive data in log messages (passwords, tokens, API keys)
  - [ ] Review request/response logging for sensitive headers or body content
  - [ ] Check for user personal information in logs (PII)
  - [ ] Verify authentication tokens are not logged
  - [ ] Review error messages for sensitive information exposure
  - [ ] Check for database connection strings or credentials in logs
  - [ ] Verify sensitive data is redacted or masked in logs

- [ ] Review log message quality
  - [ ] Verify log messages are clear and actionable
  - [ ] Check for vague or unclear log messages
  - [ ] Review log messages for proper context (what, where, when)
  - [ ] Verify log messages include relevant identifiers (request_id, user_id, etc.)
  - [ ] Check for spelling and grammar errors in log messages

- [ ] Check for appropriate log levels
  - [ ] Verify info level is used for normal operations
  - [ ] Verify error level is used for errors and exceptions
  - [ ] Verify warn level is used for warnings and deprecations
  - [ ] Verify debug level is used for debug information (and disabled in production)
  - [ ] Check for over-logging (too many log statements)
  - [ ] Check for under-logging (missing important log statements)

- [ ] Review error logging practices
  - [ ] Verify all error logging includes error messages
  - [ ] Verify all error logging includes stack traces (matching Rails pattern)
  - [ ] Check error logging in try-catch blocks includes full error context
  - [ ] Review error logging in middleware, services, and controllers
  - [ ] Verify error objects are properly logged (not just error messages)

- [ ] Review console.log usage
  - [ ] Search for all `console.log()` calls (should be replaced with logger.info())
  - [ ] Search for all `console.error()` calls (should be replaced with logger.error())
  - [ ] Search for all `console.warn()` calls (should be replaced with logger.warn())
  - [ ] Search for all `console.debug()` calls (should be replaced with logger.debug())
  - [ ] Verify no console.log statements remain in production code
  - [ ] Check test files for appropriate console usage (may be acceptable in tests)

- [ ] Identify logging improvements
  - [ ] Document logging issues found with specific file locations and line numbers
  - [ ] Propose fixes for identified issues
  - [ ] Identify missing logging in critical paths
  - [ ] Identify excessive logging in hot paths
  - [ ] Document recommendations for logging improvements

- [ ] Document logging standards
  - [ ] Create or update logging style guide
  - [ ] Document logging patterns and conventions
  - [ ] Create examples of proper logging usage
  - [ ] Document logging best practices specific to this codebase
  - [ ] Update architecture documentation if needed

## Notes

- This task is part of Phase 4: Code Quality Audit
- Section: 2. Manual Code Review
- Focus on identifying and fixing code quality issues
- Document all findings and improvements

- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE4-012
- Next: PHASE4-014

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
