# PHASE2-016: Add queue error handling

**Section**: 3. Queue System Setup (BullMQ)
**Subsection**: 3.5
**Task ID**: PHASE2-016

## Description

Add comprehensive queue error handling for BullMQ queues and workers, converting the error handling patterns from Rails Sidekiq to TypeScript/Node.js. This includes error event listeners, retry logic configuration, job failure handling, and comprehensive logging of queue events.

**Rails Implementation Reference:**
- `jarek-va/config/initializers/sidekiq.rb` - Sidekiq error handling configuration:
  - Line 34-37: `Sidekiq.default_job_options = { retry: 3, backtrace: true }` - Default retry 3 times with backtraces
  - Line 31: `Sidekiq.logger.level = Logger::INFO` - Logging level configuration
- `jarek-va/app/jobs/application_job.rb` - Base job retry configuration:
  - Line 14: `retry_on StandardError, wait: :exponentially_longer, attempts: 3` - Retry with exponential backoff
  - Line 17: `discard_on ActiveJob::DeserializationError` - Discard deserialization errors
- `jarek-va/app/jobs/telegram_message_job.rb` - Job-level error handling:
  - Lines 32-50: Comprehensive error handling with logging and user notifications
  - Line 33-34: Error logging with backtraces
  - Line 50: Re-raising errors to mark job as failed

**Node.js Implementation:**
- Create `src/jobs/queue-error-handler.ts` to provide centralized error handling for BullMQ queues and workers
- Add error event listeners for Queue and Worker instances
- Implement retry logic configuration matching Rails behavior (3 attempts, exponential backoff)
- Add job failure handling for jobs that exhaust all retries
- Implement comprehensive logging for all queue events (errors, failures, retries, completions)
- This error handler will be used by all queue workers to ensure consistent error handling across the application

## Checklist

- [ ] Create `src/jobs/queue-error-handler.ts` file
- [ ] Implement error event listeners:
  - [ ] Add `error` event listener for Queue instances (connection errors, Redis errors)
  - [ ] Add `error` event listener for Worker instances (job processing errors)
  - [ ] Add `failed` event listener for jobs that fail after all retries
  - [ ] Add `completed` event listener for successful job completion (for logging)
  - [ ] Add `active` event listener for when jobs start processing
  - [ ] Add `stalled` event listener for stalled jobs
- [ ] Implement retry logic configuration:
  - [ ] Configure default retry attempts: 3 (matching Rails `retry: 3`)
  - [ ] Configure exponential backoff delay (matching Rails `wait: :exponentially_longer`)
  - [ ] Set retry delay strategy: exponential with initial delay (e.g., 2000ms base delay)
  - [ ] Export retry configuration for use in queue/worker setup
- [ ] Add job failure handling:
  - [ ] Handle jobs that fail after all retries are exhausted
  - [ ] Log failed jobs with full error details and backtraces (matching Rails `backtrace: true`)
  - [ ] Store failed job information for debugging/monitoring
  - [ ] Optionally send notifications for critical failures
  - [ ] Ensure error handlers never throw errors themselves (prevent cascading failures)
- [ ] Implement comprehensive logging:
  - [ ] Log all error events with job ID, queue name, error message, and stack trace
  - [ ] Log job failures with full context (attempts, error details, job data)
  - [ ] Log job completions for monitoring (optional, can be configurable)
  - [ ] Log stalled jobs for debugging
  - [ ] Use application logger utility (consistent with other modules)
  - [ ] Include timestamps and relevant context in all log messages
- [ ] Export error handler utilities:
  - [ ] Export function to attach error handlers to Queue instances
  - [ ] Export function to attach error handlers to Worker instances
  - [ ] Export retry configuration constants/helpers
  - [ ] Export types/interfaces for error handler configuration

## Notes

- This task is part of Phase 2: File-by-File Conversion
- Section: 3. Queue System Setup (BullMQ)
- **Rails Files to Reference:**
  - `jarek-va/config/initializers/sidekiq.rb` - Sidekiq error handling:
    - Line 34-37: `Sidekiq.default_job_options = { retry: 3, backtrace: true }` - Default retry 3 times, include backtraces
    - Line 31: `Sidekiq.logger.level = Logger::INFO` - Logging level
  - `jarek-va/app/jobs/application_job.rb` - Base job retry:
    - Line 14: `retry_on StandardError, wait: :exponentially_longer, attempts: 3` - Retry 3 times with exponential backoff
    - Line 17: `discard_on ActiveJob::DeserializationError` - Discard deserialization errors
  - `jarek-va/app/jobs/telegram_message_job.rb` - Job error handling example:
    - Lines 32-50: Try-catch with error logging and user notification
    - Line 33-34: `Rails.logger.error` with error message and backtrace
    - Line 50: Re-raise error to mark job as failed
- **Dependencies:**
  - Requires BullMQ to be installed (completed in PHASE2-012)
  - Requires queue connection utility (completed in PHASE2-014)
  - Requires queue configuration (completed in PHASE2-013)
  - Requires base job processor (completed in PHASE2-015)
- **Implementation Details:**
  - BullMQ provides event emitters for Queue and Worker instances
  - Queue events: `error` (connection/Redis errors)
  - Worker events: `error` (job processing errors), `failed` (job failed after retries), `completed` (job succeeded), `active` (job started), `stalled` (job stalled)
  - Retry configuration in BullMQ is set via Worker options or job options when adding to queue
  - Exponential backoff: `{ attempts: 3, backoff: { type: 'exponential', delay: 2000 } }`
  - Error handlers should be attached when creating Queue/Worker instances
  - The error handler should be a utility that can be imported and used by queue setup code
  - Logging should use the application's logger utility (not console.log)
  - Error logs should include: timestamp, job ID, queue name, error message, stack trace, job data (if available)
  - Failed job handling should log but not throw (to prevent cascading failures)
- **Key Differences from Rails:**
  - Rails: Sidekiq handles retries automatically based on job class configuration
  - Node.js: BullMQ requires explicit retry configuration in Worker/Queue options
  - Rails: Error handling is in job class `perform` method
  - Node.js: Error handling can be at both job processor level (PHASE2-015) and queue/worker level (this task)
  - Rails: Sidekiq logs errors automatically with backtraces
  - Node.js: Must explicitly listen to events and log errors
- **Usage Pattern:**
  - Import error handler: `import { attachQueueErrorHandlers, attachWorkerErrorHandlers, defaultRetryOptions } from '@/jobs/queue-error-handler'`
  - When creating Queue: `const queue = new Queue('queue-name', { connection }); attachQueueErrorHandlers(queue)`
  - When creating Worker: `const worker = new Worker('queue-name', processor, { connection, ...defaultRetryOptions }); attachWorkerErrorHandlers(worker)`
- **Testing Considerations:**
  - Test error event listeners are called on Queue errors
  - Test error event listeners are called on Worker errors
  - Test failed event handler logs failed jobs correctly
  - Test retry configuration is applied correctly
  - Test logging includes all required information
  - Test error handlers don't throw (prevent cascading failures)
- Task can be completed independently by a single agent (after PHASE2-012, PHASE2-013, PHASE2-014, and PHASE2-015 are complete)

## Related Tasks

- Previous: PHASE2-015
- Next: PHASE2-017

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
