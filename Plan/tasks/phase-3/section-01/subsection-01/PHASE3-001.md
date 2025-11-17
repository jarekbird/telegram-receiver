# PHASE3-001: Review overall application architecture

**Section**: 1. Architecture Review
**Subsection**: 1.1
**Task ID**: PHASE3-001

## Description

Review and improve overall application architecture in the codebase to ensure best practices. This review should evaluate the current implementation against the planned architecture, identify architectural patterns in use, verify proper layer separation, and document any improvements needed.

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

## Checklist

- [ ] Review application structure and directory organization
  - [ ] Verify proper separation of concerns across layers
  - [ ] Check that files are organized logically
  - [ ] Ensure consistent naming conventions
- [ ] Identify architectural patterns used
  - [ ] Service layer pattern (business logic separation)
  - [ ] Repository pattern (if used for data access)
  - [ ] Dependency injection patterns
  - [ ] Middleware pattern usage
  - [ ] Job queue pattern (BullMQ)
- [ ] Review layer separation (controllers, services, jobs, models)
  - [ ] Controllers should only handle HTTP concerns (request/response)
  - [ ] Services should contain business logic
  - [ ] Models should handle data access and validation
  - [ ] Jobs should handle async/background processing
  - [ ] Verify no business logic in controllers
  - [ ] Verify no HTTP concerns in services
- [ ] Check for architectural anti-patterns
  - [ ] God objects (classes/modules doing too much)
  - [ ] Circular dependencies
  - [ ] Tight coupling between layers
  - [ ] Business logic in controllers
  - [ ] Database queries in controllers
  - [ ] Missing error handling layers
- [ ] Review dependency management
  - [ ] Check for proper dependency injection
  - [ ] Verify services are testable (can be mocked)
  - [ ] Review module boundaries and imports
- [ ] Document current architecture
  - [ ] Create architecture diagram or documentation
  - [ ] Document layer responsibilities
  - [ ] Document data flow between layers
  - [ ] Document external dependencies
- [ ] Identify improvement opportunities
  - [ ] Areas where separation of concerns can be improved
  - [ ] Opportunities for better abstraction
  - [ ] Missing architectural patterns that would benefit the codebase
  - [ ] Performance optimization opportunities at architectural level

## Notes

- This task is part of Phase 3: Holistic Review and Best Practices
- Section: 1. Architecture Review
- Focus on identifying issues and improvements
- Document findings and decisions
- Compare implemented architecture with planned architecture from `Plan/app-description.md`
- Review both existing code and planned structure to ensure consistency
- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE2-105
- Next: PHASE3-002

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
