# PHASE3-019: Review logging practices

**Section**: 3. Node.js Best Practices
**Subsection**: 3.5
**Task ID**: PHASE3-019

## Description

Review and improve logging practices in the codebase to ensure best practices. This task focuses on reviewing the logging infrastructure, logging patterns, log levels, structured logging, and ensuring consistent logging practices throughout the codebase. Proper logging is critical for debugging, monitoring, and operational visibility.

## Context

This task is distinct from:
- **PHASE1-030 through PHASE1-035**: Created the logging infrastructure (logger configuration, wrapper, integration)
- **PHASE3-015**: Reviews code style (including console.log usage)
- **PHASE3-016**: Reviews error handling patterns (which may include error logging)
- **PHASE3-019**: Focuses specifically on **logging practices** and **logging best practices**

Logging practices involve:
- Consistent use of log levels (debug, info, warn, error)
- Structured logging format
- Proper error logging with stack traces
- Avoiding sensitive data in logs
- Appropriate log level selection
- Logging context and metadata
- Performance considerations for logging

## Architecture Reference

Reference the planned logging infrastructure from:
- `Plan/tasks/phase-1/section-08/subsection-01/PHASE1-030.md` - Logging library selection (winston or pino)
- `Plan/tasks/phase-1/section-08/subsection-02/PHASE1-031.md` - Logger configuration (`src/config/logger.ts`)
- `Plan/tasks/phase-1/section-08/subsection-03/PHASE1-032.md` - Logger utility wrapper (`src/utils/logger.ts`)
- `Plan/tasks/phase-1/section-08/subsection-04/PHASE1-033.md` - Logger integration in entry point
- `Plan/tasks/phase-1/section-08/subsection-05/PHASE1-034.md` - Logger integration in request middleware
- `Plan/tasks/phase-1/section-08/subsection-06/PHASE1-035.md` - Logger integration in error middleware
- `src/config/logger.ts` - Logger configuration implementation
- `src/utils/logger.ts` - Logger utility wrapper implementation
- `Plan/app-description.md` - Application overview and logging requirements

The application should use:
- **Logger utility wrapper** (`src/utils/logger.ts`) - Provides consistent `logger.info()`, `logger.error()`, `logger.warn()`, `logger.debug()` interface
- **Structured logging** - JSON format for production, human-readable for development
- **Log levels** - debug, info, warn, error matching Rails.logger patterns
- **Error logging** - Full stack traces for errors (matching Rails `Rails.logger.error(e.backtrace.join("\n"))` pattern)

## Rails Logging Patterns to Match

The jarek-va Rails application uses:
- `Rails.logger.info()` - For informational messages (request logging, operation start/end)
- `Rails.logger.error()` - For errors with full stack traces:
  - Error message: `Rails.logger.error("#{exception.class}: #{exception.message}")`
  - Stack trace: `Rails.logger.error(exception.backtrace.join("\n"))`
- `Rails.logger.warn()` - For warnings (unknown tools, deprecated features)
- `Rails.logger.debug()` - For debug information

Reference files:
- `jarek-va/app/controllers/application_controller.rb` (lines 10-11) - Error logging pattern
- `jarek-va/app/services/telegram_service.rb` (lines 33-34, 47-48) - Error logging with backtraces
- `jarek-va/app/services/tool_router.rb` - Info, warn, and error logging examples

## Checklist

- [ ] Review logging infrastructure implementation
  - [ ] Verify `src/config/logger.ts` exists and is properly configured
  - [ ] Verify `src/utils/logger.ts` exists and provides consistent interface
  - [ ] Check logger configuration matches environment (development vs production)
  - [ ] Verify logger is properly initialized and exported
  - [ ] Check logger wrapper methods match Rails.logger interface (info, error, warn, debug)
  - [ ] Review logger configuration for structured logging (JSON format)

- [ ] Review logging levels usage
  - [ ] Search for all `logger.info()` calls and verify appropriate usage
  - [ ] Search for all `logger.error()` calls and verify error logging includes stack traces
  - [ ] Search for all `logger.warn()` calls and verify warnings are appropriate
  - [ ] Search for all `logger.debug()` calls and verify debug logging is not excessive
  - [ ] Check for incorrect log level usage (e.g., using info for errors, error for warnings)
  - [ ] Verify log levels match the severity of the logged event
  - [ ] Review log level usage in different environments (debug should be disabled in production)

- [ ] Review error logging practices
  - [ ] Verify all error logging includes error messages (matching Rails pattern: `"#{exception.class}: #{exception.message}"`)
  - [ ] Verify all error logging includes stack traces (matching Rails pattern: `exception.backtrace.join("\n")`)
  - [ ] Check error logging in try-catch blocks includes full error context
  - [ ] Review error logging in middleware (error-handler.middleware.ts)
  - [ ] Review error logging in services and controllers
  - [ ] Verify error objects are properly logged (not just error messages)
  - [ ] Check for missing error logging in error handlers

- [ ] Review structured logging
  - [ ] Check if structured logging (JSON format) is used in production
  - [ ] Verify log entries include relevant context (request_id, user_id, etc.)
  - [ ] Review log format consistency across the codebase
  - [ ] Check for proper metadata in log entries
  - [ ] Verify structured logging includes timestamps, log levels, and context

- [ ] Review logging format consistency
  - [ ] Check for consistent log message format across the codebase
  - [ ] Verify log messages are clear and descriptive
  - [ ] Review log message structure (should include context)
  - [ ] Check for inconsistent logging patterns (some using strings, some using objects)
  - [ ] Verify log messages follow a consistent pattern (e.g., "Action: description" or "Component: action: result")

- [ ] Check for sensitive data in logs
  - [ ] Search for potential sensitive data in log messages (passwords, tokens, API keys)
  - [ ] Review request/response logging for sensitive headers or body content
  - [ ] Check for user personal information in logs (PII)
  - [ ] Verify authentication tokens are not logged
  - [ ] Review error messages for sensitive information exposure
  - [ ] Check for database connection strings or credentials in logs
  - [ ] Verify sensitive data is redacted or masked in logs

- [ ] Review console.log usage
  - [ ] Search for all `console.log()` calls (should be replaced with logger.info())
  - [ ] Search for all `console.error()` calls (should be replaced with logger.error())
  - [ ] Search for all `console.warn()` calls (should be replaced with logger.warn())
  - [ ] Search for all `console.debug()` calls (should be replaced with logger.debug())
  - [ ] Verify no console.log statements remain in production code
  - [ ] Check test files for appropriate console usage (may be acceptable in tests)

- [ ] Review logging in different components
  - [ ] Review logging in controllers (request handling, response logging)
  - [ ] Review logging in services (business logic operations)
  - [ ] Review logging in middleware (request/response logging, error handling)
  - [ ] Review logging in jobs/workers (background job processing)
  - [ ] Review logging in utilities and helpers
  - [ ] Check logging coverage across all components

- [ ] Review request/response logging
  - [ ] Verify request logging includes method, URL, IP, request_id
  - [ ] Verify response logging includes status code, duration, request_id
  - [ ] Check request/response logging format consistency
  - [ ] Review request logging middleware implementation
  - [ ] Verify request_id is included in all related log entries

- [ ] Review logging performance
  - [ ] Check for excessive logging in hot paths (high-frequency operations)
  - [ ] Verify debug logging is disabled in production
  - [ ] Review logging overhead in critical paths
  - [ ] Check for synchronous logging blocking event loop
  - [ ] Verify async logging is used where appropriate

- [ ] Review logging configuration
  - [ ] Check environment-based log level configuration
  - [ ] Verify log output destinations (console, file, etc.)
  - [ ] Review log rotation and retention policies
  - [ ] Check logging configuration for different environments
  - [ ] Verify log level can be adjusted without code changes

- [ ] Identify improvements
  - [ ] Document logging issues found with specific file locations and line numbers
  - [ ] Propose fixes for identified issues
  - [ ] Create logging best practices guidelines
  - [ ] Document logging patterns and conventions
  - [ ] Create examples of proper logging usage

- [ ] Fix logging issues
  - [ ] Replace console.log with logger.info() where appropriate
  - [ ] Replace console.error with logger.error() with proper error handling
  - [ ] Add missing error logging with stack traces
  - [ ] Fix incorrect log level usage
  - [ ] Add context/metadata to log entries where missing
  - [ ] Remove or redact sensitive data from logs
  - [ ] Improve log message clarity and consistency

## Best Practices

1. **Use appropriate log levels**: debug for development, info for normal operations, warn for warnings, error for errors
2. **Always include stack traces**: Error logging should include both error message and full stack trace (matching Rails pattern)
3. **Structured logging**: Use structured logging (JSON) in production for better log analysis
4. **Include context**: Log entries should include relevant context (request_id, user_id, operation, etc.)
5. **Avoid sensitive data**: Never log passwords, tokens, API keys, or personal information
6. **Consistent format**: Use consistent log message format across the codebase
7. **Performance aware**: Avoid excessive logging in hot paths, disable debug logging in production
8. **Error details**: Always log full error details (class, message, stack trace) for debugging
9. **Request correlation**: Include request_id in all log entries related to a request
10. **Environment appropriate**: Use appropriate log levels and formats for each environment

## Examples

### Bad: Missing Stack Trace
```typescript
// Missing stack trace
try {
  await someOperation();
} catch (error) {
  logger.error('Operation failed'); // Missing error details and stack trace
}
```

### Good: Proper Error Logging
```typescript
// Proper error logging with stack trace (matching Rails pattern)
try {
  await someOperation();
} catch (error) {
  logger.error(`${error.constructor.name}: ${error.message}`);
  logger.error(error.stack);
  // or if logger.error handles Error objects automatically:
  logger.error('Operation failed', error);
}
```

### Bad: Console.log Usage
```typescript
// Using console.log instead of logger
console.log('Processing request');
console.error('Error occurred');
```

### Good: Logger Usage
```typescript
// Using logger utility wrapper
import logger from '@/utils/logger';

logger.info('Processing request');
logger.error('Error occurred', error);
```

### Bad: Missing Context
```typescript
// Log message without context
logger.info('Request processed');
```

### Good: Logging with Context
```typescript
// Log message with context (request_id, operation, etc.)
logger.info(`[${requestId}] Request processed: ${method} ${url} - ${statusCode} ${duration}ms`);
```

### Bad: Sensitive Data in Logs
```typescript
// Logging sensitive data
logger.info(`User login: ${username}, password: ${password}`);
logger.info(`API request with token: ${apiToken}`);
```

### Good: Redacted Sensitive Data
```typescript
// Redacting sensitive data
logger.info(`User login: ${username}`);
logger.info(`API request with token: ${maskToken(apiToken)}`);
```

### Bad: Inconsistent Log Levels
```typescript
// Using wrong log level
logger.error('User logged in'); // Should be info
logger.info('Database connection failed'); // Should be error
```

### Good: Appropriate Log Levels
```typescript
// Using appropriate log levels
logger.info('User logged in');
logger.error('Database connection failed', error);
logger.warn('Deprecated API endpoint used');
logger.debug('Cache hit for key: user:123');
```

## Notes

- This task is part of Phase 3: Holistic Review and Best Practices
- Section: 3. Node.js Best Practices
- Focus specifically on **logging practices** and **logging best practices**
- Review actual implementation files in `src/` directory
- Compare logging patterns with Rails logging patterns from jarek-va
- Verify logging infrastructure from Phase 1 tasks is properly implemented
- Document findings with specific file locations and line numbers
- Reference error handling patterns from PHASE3-016
- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE3-018
- Next: PHASE3-020

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
