# PHASE3-003: Review and verify dependency injection patterns

**Section**: 1. Architecture Review
**Subsection**: 1.3
**Task ID**: PHASE3-003

## Description

Review and verify dependency injection patterns in the codebase to ensure best practices. This review should evaluate how services, controllers, and jobs handle dependencies, identify hard-coded dependencies or singletons, verify proper constructor injection usage, and ensure the codebase follows Node.js/TypeScript dependency injection best practices for testability and maintainability.

## Architecture Reference

Reference the planned architecture from:
- `Plan/app-description.md` - Application overview and component descriptions
- `Plan/CONVERSION_STEPS.md` - Conversion plan and architecture considerations
- `src/` directory structure - Current implementation structure

**Note on Rails vs Node.js patterns**: The Rails application uses class methods and direct service access (e.g., `TelegramService.send_message`). The Node.js/TypeScript conversion should use dependency injection to make services testable and maintainable.

## Dependency Injection Best Practices

In Node.js/TypeScript applications, dependency injection should follow these patterns:

1. **Constructor Injection**: Dependencies should be passed via constructor parameters
2. **Interface-based Design**: Services should depend on interfaces/abstract types, not concrete implementations
3. **Factory Functions**: Use factory functions or DI containers for complex dependency graphs
4. **Avoid Singletons**: Prefer dependency injection over singleton patterns
5. **Testability**: Services should be easily mockable for unit testing

## Checklist

- [ ] Review service instantiation patterns
  - [ ] Check how services are created (direct instantiation vs factory vs DI container)
  - [ ] Verify services accept dependencies via constructor
  - [ ] Identify any singleton patterns that should be converted to DI
  - [ ] Check for services that instantiate dependencies internally (violation of DI)
- [ ] Check for hard-coded dependencies
  - [ ] Identify direct imports of concrete implementations where interfaces should be used
  - [ ] Check for hard-coded configuration values in service constructors
  - [ ] Verify external API clients are injected, not created internally
  - [ ] Check for direct database access without repository pattern
  - [ ] Identify any `new` keyword usage for dependencies (should be injected)
- [ ] Review constructor injection usage
  - [ ] Verify all services use constructor injection for dependencies
  - [ ] Check that controllers inject services via constructor
  - [ ] Verify jobs inject services via constructor
  - [ ] Ensure dependencies are typed (use interfaces/types, not concrete classes)
  - [ ] Check for optional dependencies (should be clearly marked)
- [ ] Check for proper dependency management
  - [ ] Verify dependency graph is acyclic (no circular dependencies)
  - [ ] Check that dependencies are organized logically
  - [ ] Verify shared dependencies (Redis, HTTP clients) are injected consistently
  - [ ] Check for dependency injection container or factory pattern usage
  - [ ] Verify environment-specific dependencies are handled properly
- [ ] Review testability of dependencies
  - [ ] Verify all services can be easily mocked in tests
  - [ ] Check that tests use dependency injection to provide mocks
  - [ ] Verify no global state or singletons that prevent testing
  - [ ] Ensure test fixtures can inject test doubles
- [ ] Identify opportunities for better DI
  - [ ] Find services that could benefit from interface abstraction
  - [ ] Identify opportunities to reduce coupling through DI
  - [ ] Check for missing abstractions (services depending on concrete implementations)
  - [ ] Find places where a DI container would simplify dependency management
- [ ] Check for anti-patterns
  - [ ] Identify singleton patterns that should be converted to DI
  - [ ] Find services that create dependencies internally (service locator anti-pattern)
  - [ ] Check for global state or module-level singletons
  - [ ] Identify tight coupling that could be reduced with DI
- [ ] Document current patterns
  - [ ] Document the DI pattern used (constructor injection, factory functions, DI container)
  - [ ] Create examples of proper dependency injection usage
  - [ ] Document any deviations from best practices and reasoning
  - [ ] Create guidelines for adding new services with proper DI

## Notes

- This task is part of Phase 3: Holistic Review and Best Practices
- Section: 1. Architecture Review
- Focus on identifying issues and improvements
- Document findings and decisions
- Compare implemented patterns with Node.js/TypeScript best practices
- Review both existing code and planned structure to ensure proper DI patterns
- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE3-002
- Next: PHASE3-004

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
