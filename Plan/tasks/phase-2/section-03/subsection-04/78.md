# PHASE2-015: Create base job processor class

**Section**: 3. Queue System Setup (BullMQ)
**Subsection**: 3.4
**Task ID**: PHASE2-015

## Description

Convert the base job processor class from Rails `ApplicationJob` to TypeScript/Node.js. This abstract base class provides common functionality for all BullMQ job processors, including default queue configuration, retry logic with exponential backoff, and error handling patterns that match the Rails Sidekiq implementation.

**Rails Implementation Reference:**
- `jarek-va/app/jobs/application_job.rb` - Base job class using ActiveJob with Sidekiq adapter
  - Queue configuration: `queue_as :default` (line 11)
  - Retry configuration: `retry_on StandardError, wait: :exponentially_longer, attempts: 3` (line 14)
  - Discard configuration: `discard_on ActiveJob::DeserializationError` (line 17)
  - All jobs extend this base class (e.g., `TelegramMessageJob < ApplicationJob`)

**Node.js Implementation:**
- Create `src/jobs/base-job-processor.ts` as an abstract base class
- Define default queue name ("default") matching Rails `queue_as :default`
- Implement retry configuration with exponential backoff (3 attempts) matching Rails behavior
- Add error handling for deserialization errors (equivalent to `discard_on ActiveJob::DeserializationError`)
- Define abstract `process` method that child classes must implement
- Add logging infrastructure for job processing
- This base class will be extended by specific job processors (e.g., `TelegramMessageJob`)

## Checklist

- [ ] Create `src/jobs/base-job-processor.ts` file
- [ ] Define abstract base class `BaseJobProcessor`:
  - [ ] Abstract `process` method signature: `abstract process(job: Job): Promise<void>`
  - [ ] Accept BullMQ `Job` type from `bullmq` package
  - [ ] Return `Promise<void>` for async processing
- [ ] Add default queue configuration:
  - [ ] Define default queue name as "default" (matching Rails `queue_as :default`)
  - [ ] Allow child classes to override queue name
  - [ ] Export queue name constant or getter method
- [ ] Implement retry configuration:
  - [ ] Configure retry attempts: 3 attempts (matching Rails `attempts: 3`)
  - [ ] Configure exponential backoff delay (matching Rails `wait: :exponentially_longer`)
  - [ ] Retry on StandardError/Error (matching Rails `retry_on StandardError`)
  - [ ] Use BullMQ job options for retry configuration
  - [ ] Provide static method or property that returns default job options (including retry configuration) for use when creating Workers or enqueuing jobs
- [ ] Add error handling:
  - [ ] Handle deserialization errors (discard, don't retry) - matching Rails `discard_on ActiveJob::DeserializationError`
  - [ ] Implement try-catch wrapper around process method
  - [ ] Log errors appropriately before re-throwing or discarding
- [ ] Add logging:
  - [ ] Import logger utility
  - [ ] Log job start/complete/failure events
  - [ ] Include job ID and queue name in log messages
- [ ] Export base class:
  - [ ] Export `BaseJobProcessor` class for use by child job processors
  - [ ] Export any related types or interfaces

## Notes

- This task is part of Phase 2: File-by-File Conversion
- Section: 3. Queue System Setup (BullMQ)
- **Rails Files to Reference:**
  - `jarek-va/app/jobs/application_job.rb` - Base job class:
    - Line 11: `queue_as :default` - Default queue configuration
    - Line 14: `retry_on StandardError, wait: :exponentially_longer, attempts: 3` - Retry with exponential backoff, 3 attempts
    - Line 17: `discard_on ActiveJob::DeserializationError` - Discard deserialization errors without retry
    - Extends `ActiveJob::Base` which provides the job processing infrastructure
  - `jarek-va/app/jobs/telegram_message_job.rb` - Example job extending ApplicationJob:
    - Line 10: `class TelegramMessageJob < ApplicationJob` - Extends base class
    - Line 11: `queue_as :default` - Uses default queue (inherited from base, but can override)
    - Line 15: `def perform(update)` - Implements the job processing logic
- **Dependencies:**
  - Requires BullMQ to be installed (completed in PHASE2-012)
  - Requires queue connection utility (completed in PHASE2-014)
  - Requires queue configuration (completed in PHASE2-013)
- **Implementation Details:**
  - In BullMQ, job processors are functions passed to `Worker` constructor, not classes
  - However, we can create an abstract base class pattern that provides:
    - Common retry/error handling logic
    - Default queue configuration
    - Logging infrastructure
    - Type safety for job payloads
  - Child job processors will extend this base class and implement the `process` method
  - The `process` method will be called by BullMQ Worker with a `Job` object
  - Retry configuration should be set in BullMQ job options (when adding jobs to queue) or Worker options
  - The base class should provide a static method or property that returns default job options (including retry configuration) that can be used when creating Workers or enqueuing jobs
  - Exponential backoff in BullMQ: Use `backoff` option with exponential strategy
  - Example: `{ attempts: 3, backoff: { type: 'exponential', delay: 2000 } }`
  - For deserialization errors, check for specific error types and discard (don't retry)
  - The base class should provide a consistent interface for all job processors
  - Note: Sidekiq default job options include `retry: 3, backtrace: true` (from `config/initializers/sidekiq.rb`), but since `ApplicationJob` explicitly sets retry configuration, the base class should match the explicit `ApplicationJob` retry settings (3 attempts with exponential backoff)
- **Key Differences from Rails:**
  - Rails: `ApplicationJob` extends `ActiveJob::Base` which handles job execution automatically
  - Node.js: BullMQ uses Worker functions, but we can wrap them in a class pattern for consistency
  - Rails: Retry configuration is in the job class definition
  - Node.js: Retry configuration is in job options when adding to queue or Worker options
  - Rails: `perform` method is the entry point
  - Node.js: `process` method will be the entry point (wrapped by Worker)
- **Usage Pattern:**
  - Child classes will extend: `class TelegramMessageJob extends BaseJobProcessor`
  - Child classes will implement: `async process(job: Job): Promise<void> { ... }`
  - Child classes can override queue name if needed
  - The base class provides common error handling and logging
- **Testing Considerations:**
  - Test that abstract class cannot be instantiated directly
  - Test that child classes must implement `process` method
  - Test retry configuration is applied correctly
  - Test error handling for deserialization errors
  - Test logging functionality
- Task can be completed independently by a single agent (after PHASE2-012, PHASE2-013, and PHASE2-014 are complete)

## Related Tasks

- Previous: PHASE2-014
- Next: PHASE2-016

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
