# PHASE3-001: Review overall application architecture

**Section**: 1. Architecture Review
**Subsection**: 1.1
**Task ID**: PHASE3-001

## Description

Review and improve overall application architecture in the codebase to ensure best practices. This review should evaluate the current implementation against the planned architecture, identify architectural patterns in use, verify proper layer separation, and document any improvements needed.

**Current State Note**: The codebase currently has comprehensive architecture documentation (`docs/architecture.md`, `docs/API.md`, `docs/API_CONVENTIONS.md`) but minimal actual implementation code. The directory structure exists but most directories are empty. This review should focus on:
1. Validating that the documented architecture aligns with the planned architecture
2. Ensuring the documented patterns are appropriate for the conversion
3. Identifying any gaps or inconsistencies in the architecture documentation
4. Verifying that the planned structure will support the conversion goals
5. Documenting findings and recommendations for when implementation begins

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

### Documentation Review (Current Focus)

- [ ] Review existing architecture documentation
  - [ ] Validate `docs/architecture.md` against planned architecture from `Plan/app-description.md`
  - [ ] Verify `docs/API.md` accurately describes planned endpoints
  - [ ] Check `docs/API_CONVENTIONS.md` for consistency with Rails patterns
  - [ ] Ensure documentation covers all planned components
  - [ ] Verify documentation aligns with conversion plan in `Plan/CONVERSION_STEPS.md`
- [ ] Review planned architectural patterns
  - [ ] Service layer pattern (documented in architecture.md)
  - [ ] Dependency injection pattern (constructor injection documented)
  - [ ] Middleware pattern (Express middleware documented)
  - [ ] Job queue pattern (BullMQ documented)
  - [ ] Repository pattern (noted as future consideration)
- [ ] Validate directory structure
  - [ ] Verify `src/` directory structure matches documented architecture
  - [ ] Check that all planned directories exist (controllers, services, models, routes, middleware, utils, types, config)
  - [ ] Ensure directory organization follows documented patterns
  - [ ] Verify naming conventions are consistent
- [ ] Review planned layer separation
  - [ ] Controllers: HTTP concerns only (documented)
  - [ ] Services: Business logic (documented)
  - [ ] Models: Data access and validation (documented)
  - [ ] Jobs: Async/background processing (documented)
  - [ ] Middleware: Cross-cutting concerns (documented)
- [ ] Check for architectural concerns in documentation
  - [ ] Verify documented patterns avoid common anti-patterns
  - [ ] Check for potential circular dependencies in planned structure
  - [ ] Review planned dependency injection approach
  - [ ] Validate error handling strategy
- [ ] Review dependency management approach
  - [ ] Verify constructor injection pattern is documented
  - [ ] Check that testability is addressed in documentation
  - [ ] Review planned module boundaries
- [ ] Validate architecture documentation completeness
  - [ ] Architecture diagram or clear documentation exists (`docs/architecture.md`)
  - [ ] Layer responsibilities are documented
  - [ ] Data flow between layers is documented
  - [ ] External dependencies are documented
  - [ ] Technology stack is documented
- [ ] Identify documentation improvements
  - [ ] Areas where documentation can be enhanced
  - [ ] Missing architectural decisions that should be documented
  - [ ] Opportunities to clarify patterns before implementation
  - [ ] Performance considerations that should be documented

### Implementation Review (Future - When Code Exists)

- [ ] Review actual implementation code (when available)
  - [ ] Verify implementation matches documented architecture
  - [ ] Check for proper separation of concerns in actual code
  - [ ] Verify no business logic in controllers
  - [ ] Verify no HTTP concerns in services
  - [ ] Check for architectural anti-patterns in code
  - [ ] Review actual dependency injection usage
  - [ ] Verify module boundaries are respected

## Notes

- This task is part of Phase 3: Holistic Review and Best Practices
- Section: 1. Architecture Review
- **Current State**: The codebase has comprehensive architecture documentation but minimal implementation code. Focus should be on validating documentation against planned architecture and identifying any gaps or inconsistencies.
- Focus on identifying issues and improvements in documentation and planned architecture
- Document findings and decisions
- Compare documented architecture with planned architecture from `Plan/app-description.md`
- Review both existing documentation and planned structure to ensure consistency
- When implementation code exists, review actual code against documented patterns
- Task can be completed independently by a single agent

## Current Implementation Status

**Documentation**: ✅ Comprehensive
- `docs/architecture.md` - Detailed architecture documentation
- `docs/API.md` - API endpoint documentation
- `docs/API_CONVENTIONS.md` - API conventions and patterns

**Implementation**: ⚠️ Minimal
- Directory structure exists but directories are empty
- `src/index.ts` is empty
- No controllers, services, models, or routes implemented yet
- Configuration files exist (package.json, tsconfig.json)
- Test structure exists but minimal test files

**Recommendation**: Focus this review on validating documentation and ensuring the planned architecture is sound before implementation begins.

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
