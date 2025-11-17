# PHASE1-031: Create logger configuration module

**Section**: 8. Logging Infrastructure
**Subsection**: 8.2
**Task ID**: PHASE1-031

## Description

Create logger configuration module that replicates Rails logging patterns from jarek-va. The module must configure log levels, formats, and transports based on environment variables, matching the Rails application's logging behavior.

**Rails Logging Patterns to Replicate:**
- Production: Log level `:info` (see `jarek-va/config/environments/production.rb` line 40)
- Production: Request ID tagging (see `jarek-va/config/environments/production.rb` line 43)
- Production: Stdout logging (see `jarek-va/config/environments/production.rb` lines 66-69)
- Application: `LOG_LEVEL` environment variable support (defaults to 'info', see `jarek-va/config/application.rb` line 28)
- Error logging: Full stack traces (see `jarek-va/app/controllers/application_controller.rb` lines 10-11)
- Sidekiq: Logger::INFO level (see `jarek-va/config/initializers/sidekiq.rb` line 31)

## Checklist

- [ ] Create `src/config/logger.ts` file
- [ ] Import logging library chosen in PHASE1-030 (winston or pino)
- [ ] Create logger instance with proper configuration
- [ ] Configure log levels based on NODE_ENV and LOG_LEVEL environment variable:
  - [ ] Production: 'info' level (or value from LOG_LEVEL env var)
  - [ ] Development: 'debug' level (or value from LOG_LEVEL env var)
  - [ ] Test: 'error' level (or value from LOG_LEVEL env var)
  - [ ] Default: 'info' if LOG_LEVEL not set
- [ ] Configure log format:
  - [ ] Production: JSON format (structured logging for log aggregation)
  - [ ] Development: Pretty/human-readable format
  - [ ] Test: JSON format (for test consistency)
- [ ] Configure log transports:
  - [ ] Console transport (stdout for production, supports Docker logging)
  - [ ] Ensure stdout logging for production (matches Rails `RAILS_LOG_TO_STDOUT` behavior)
  - [ ] File transport optional (only if needed for local development)
- [ ] Configure request ID support (for production request tracing, matches Rails `config.log_tags = [:request_id]`)
- [ ] Ensure error logging includes stack traces (matches Rails error logging pattern)
- [ ] Export configured logger instance

## Notes

- This task is part of Phase 1: Basic Node.js API Infrastructure
- Section: 8. Logging Infrastructure
- Task can be completed independently by a single agent
- **Prerequisite**: PHASE1-030 must be completed first to determine which logging library (winston or pino) to use
- **Rails Reference**: The jarek-va Rails application logging configuration:
  - `jarek-va/config/application.rb` (line 28) - LOG_LEVEL environment variable support
  - `jarek-va/config/environments/production.rb` (lines 40, 43, 60, 66-69) - Production logging configuration
  - `jarek-va/app/controllers/application_controller.rb` (lines 10-11) - Error logging with backtraces
  - `jarek-va/config/initializers/sidekiq.rb` (line 31) - Sidekiq logging level
- **Environment Variables**:
  - `NODE_ENV`: Determines environment (production, development, test)
  - `LOG_LEVEL`: Overrides default log level (info, debug, warn, error)
- **Production Requirements**: Must support stdout logging for Docker/containerized environments (matches Rails `RAILS_LOG_TO_STDOUT` behavior)
- **Request ID Support**: The logger should support adding request IDs to log entries (via child loggers or context) to match Rails' `config.log_tags = [:request_id]` behavior. This will be used by PHASE1-020 (request logging middleware).

## Related Tasks

- Previous: PHASE1-030 (Choose logging library - must be completed first)
- Next: PHASE1-032 (Create logger utility wrapper)


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
