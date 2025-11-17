# PHASE2-013: Create queue configuration

**Section**: 3. Queue System Setup (BullMQ)
**Subsection**: 3.2
**Task ID**: PHASE2-013

## Description

Convert Sidekiq queue configuration from Rails to BullMQ queue configuration in TypeScript/Node.js. This task creates the queue configuration file that sets up Redis connection, default job options, and environment-specific settings for BullMQ, matching the functionality provided by Sidekiq in the Rails application.

**Rails Implementation Reference:**
- `jarek-va/config/initializers/sidekiq.rb` - Sidekiq initialization with Redis connection, default job options, and logging configuration
- `jarek-va/config/sidekiq.yml` - Environment-specific queue names and concurrency settings
- `jarek-va/config/application.rb` - ActiveJob adapter configuration (line 31: `config.active_job.queue_adapter = :sidekiq`)

**Node.js Implementation:**
- Create `src/config/queue.ts` to configure BullMQ queue system
- Configure Redis connection using ioredis (matching Sidekiq's Redis setup)
- Set default job options (retry, backtrace equivalent)
- Export queue configuration for use by workers and job processors
- Support environment-specific configuration (development, test, production)

## Checklist

- [ ] Create `src/config/queue.ts` file
- [ ] Configure Redis connection:
  - [ ] Use `REDIS_URL` environment variable (defaults to `redis://localhost:6379/0`)
  - [ ] Create Redis connection instance using `ioredis`
  - [ ] Support both server and client configurations (similar to Sidekiq's `configure_server` and `configure_client`)
- [ ] Set default job options:
  - [ ] Configure default retry attempts (3 retries, matching Sidekiq's `retry: 3`)
  - [ ] Configure backtrace/error handling (equivalent to Sidekiq's `backtrace: true`)
  - [ ] Export default job options for use when creating queues
- [ ] Configure environment-specific settings:
  - [ ] Development: concurrency 2, queues: `['default']`
  - [ ] Test: concurrency 1, queues: `['default']`
  - [ ] Production: concurrency 10, queues: `['critical', 'default', 'high_priority', 'low_priority']`
  - [ ] Load settings based on `NODE_ENV` environment variable
- [ ] Configure logging:
  - [ ] Set appropriate log level (INFO level, matching Sidekiq's `Logger::INFO`)
  - [ ] Ensure queue operations are logged appropriately
- [ ] Export configuration:
  - [ ] Export Redis connection instance
  - [ ] Export default job options
  - [ ] Export environment-specific queue configuration
  - [ ] Export helper functions for creating queues with proper configuration
- [ ] Add TypeScript types for queue configuration

## Notes

- This task is part of Phase 2: File-by-File Conversion
- Section: 3. Queue System Setup (BullMQ)
- **Rails Files to Reference:**
  - `jarek-va/config/initializers/sidekiq.rb` - Main Sidekiq configuration:
    - Redis connection configuration (server and client)
    - Default job options: `retry: 3, backtrace: true`
    - Logging level: `Logger::INFO`
    - Environment variable: `REDIS_URL` (defaults to `redis://localhost:6379/0`)
    - Loads `sidekiq.yml` for concurrency settings
  - `jarek-va/config/sidekiq.yml` - Environment-specific configuration:
    - Development: concurrency 2, queues: `['default']`
    - Test: concurrency 1, queues: `['default']`
    - Production: concurrency 10, queues: `['critical', 'default', 'high_priority', 'low_priority']`
  - `jarek-va/config/application.rb` - ActiveJob adapter set to `:sidekiq` (line 31)
- **Dependencies:**
  - Requires BullMQ and ioredis to be installed (completed in PHASE2-012)
  - Requires Redis connection setup (completed in Section 2: Redis Integration)
  - Uses `REDIS_URL` environment variable (should be set in Docker: `redis://redis:6379/0`)
- **Implementation Details:**
  - BullMQ uses `Connection` class for Redis connection (similar to Sidekiq's Redis config)
  - Default job options in BullMQ are set via `JobOptions` interface
  - BullMQ's `Worker` class accepts `concurrency` option (equivalent to Sidekiq's concurrency)
  - Queue names are defined when creating `Queue` instances (not in a separate config file)
  - Environment-specific settings should be loaded based on `NODE_ENV`
  - The configuration should export a Redis connection instance that can be reused
  - Default job options should match Sidekiq's: `{ attempts: 3, removeOnComplete: true, removeOnFail: false }`
  - Consider creating helper functions like `createQueue(name: string, options?: JobOptions)` that apply default options
- **Key Differences from Rails:**
  - Rails: Sidekiq uses `Sidekiq.configure_server` and `Sidekiq.configure_client` blocks
  - Node.js: BullMQ uses `Connection` class and passes connection to `Queue` and `Worker` constructors
  - Rails: Queue names and concurrency are in `sidekiq.yml` file
  - Node.js: Queue names are specified when creating `Queue` instances; concurrency is set on `Worker`
  - Rails: Default job options are set globally via `Sidekiq.default_job_options`
  - Node.js: Default job options should be applied when creating queues or jobs
- **Testing Considerations:**
  - Test that Redis connection is created correctly
  - Test that default job options are applied
  - Test environment-specific configuration loading
  - Test that configuration exports are available for import
- Task can be completed independently by a single agent (after PHASE2-012 is complete)

## Related Tasks

- Previous: PHASE2-012
- Next: PHASE2-014

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
