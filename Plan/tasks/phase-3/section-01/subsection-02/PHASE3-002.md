# PHASE3-002: Review separation of concerns

**Section**: 1. Architecture Review
**Subsection**: 1.2
**Task ID**: PHASE3-002

## Description

Review and improve separation of concerns in the codebase to ensure best practices. This review should evaluate how well the codebase adheres to the Single Responsibility Principle, verify that each layer (controllers, services, jobs, models) has clearly defined responsibilities, and identify any violations where components are handling multiple concerns that should be separated.

**Current State Note**: The codebase currently has comprehensive architecture documentation (`docs/architecture.md`, `docs/API.md`, `docs/API_CONVENTIONS.md`) but minimal actual implementation code. The directory structure exists but most directories are empty. This review should focus on:
1. Validating that documented separation of concerns aligns with best practices
2. Ensuring the documented layer responsibilities are appropriate and clear
3. Identifying any gaps or inconsistencies in separation of concerns documentation
4. Verifying that the planned structure will support proper separation of concerns
5. Documenting findings and recommendations for when implementation begins
6. When implementation code exists, reviewing actual code against documented patterns

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

- [ ] Review documented layer responsibilities
  - [ ] Validate `docs/architecture.md` clearly defines each layer's responsibilities
  - [ ] Verify documented separation of concerns aligns with Single Responsibility Principle
  - [ ] Check that `docs/API_CONVENTIONS.md` enforces proper separation (controllers thin, services contain logic)
  - [ ] Ensure documentation clearly distinguishes between layers (controllers vs services vs models)
  - [ ] Verify documentation covers all planned layers (controllers, services, models, jobs, middleware, utils)
- [ ] Review documented service layer responsibilities
  - [ ] Documentation states services should contain business logic only
  - [ ] Documentation states services should not handle HTTP request/response concerns
  - [ ] Documentation states services should not contain database query logic (should use models/repositories)
  - [ ] Documentation states services should be focused on a single domain or feature area
  - [ ] Documentation indicates services are testable without HTTP context
  - [ ] Documentation addresses avoiding god objects (services doing too much)
  - [ ] Documentation provides guidance on when to split services
- [ ] Review documented controller responsibilities
  - [ ] Documentation states controllers should only handle HTTP concerns (request parsing, response formatting)
  - [ ] Documentation states controllers should delegate business logic to services
  - [ ] Documentation states controllers should not contain database queries
  - [ ] Documentation states controllers should not contain complex business logic
  - [ ] Documentation states controllers should handle authentication/authorization at the request level
  - [ ] Documentation emphasizes controllers should be thin and focused on routing/coordination
  - [ ] Documentation provides examples of proper controller patterns
- [ ] Review documented job processor responsibilities
  - [ ] Documentation states jobs should handle async/background processing only
  - [ ] Documentation states jobs should delegate business logic to services
  - [ ] Documentation states jobs should not contain HTTP request/response logic
  - [ ] Documentation states jobs should be focused on a single task or workflow
  - [ ] Documentation mentions idempotency considerations
  - [ ] Documentation addresses when jobs should be split
  - [ ] Documentation emphasizes jobs should use services for business logic
- [ ] Review documented model responsibilities
  - [ ] Documentation states models should handle data access and validation only
  - [ ] Documentation states models should not contain business logic
  - [ ] Documentation states models should not handle HTTP concerns
  - [ ] Documentation states models should be focused on data representation and persistence
  - [ ] Documentation distinguishes models from services
- [ ] Review documented patterns for avoiding mixed concerns
  - [ ] Documentation warns against mixing HTTP, business logic, and data access
  - [ ] Documentation addresses components handling multiple unrelated responsibilities
  - [ ] Documentation distinguishes utility functions from business logic
  - [ ] Documentation separates configuration logic from business logic
  - [ ] Documentation addresses error handling separation
- [ ] Review documented single responsibility principle guidance
  - [ ] Documentation addresses identifying classes/modules with multiple reasons to change
  - [ ] Documentation addresses testability concerns from mixed responsibilities
  - [ ] Documentation addresses reusability concerns
  - [ ] Documentation addresses tight coupling between unrelated concerns
- [ ] Review documented middleware responsibilities
  - [ ] Documentation states middleware should handle cross-cutting concerns (auth, logging, error handling)
  - [ ] Documentation states middleware should not contain business logic
  - [ ] Documentation emphasizes middleware should be focused and reusable
- [ ] Review documented utility function responsibilities
  - [ ] Documentation states utils should be pure functions or stateless helpers
  - [ ] Documentation states utils should not contain business logic
  - [ ] Documentation states utils should be focused on a single utility purpose
- [ ] Validate documentation completeness for separation of concerns
  - [ ] Documentation provides clear examples of proper separation
  - [ ] Documentation identifies common anti-patterns to avoid
  - [ ] Documentation provides guidance for maintaining separation
  - [ ] Documentation covers all layers and their boundaries
  - [ ] Documentation addresses edge cases and gray areas

### Implementation Review (Future - When Code Exists)

- [ ] Review actual implementation code (when available)
  - [ ] Verify implementation matches documented separation of concerns
  - [ ] Check for proper separation of concerns in actual code
  - [ ] Verify no business logic in controllers
  - [ ] Verify no HTTP concerns in services
  - [ ] Check for architectural anti-patterns in code
  - [ ] Review actual layer boundaries
  - [ ] Verify module boundaries are respected
  - [ ] Identify actual violations of single responsibility principle
  - [ ] Find classes/modules with multiple reasons to change
  - [ ] Identify components that are hard to test due to mixed concerns
  - [ ] Find components that are difficult to reuse
  - [ ] Check for tight coupling between unrelated concerns
  - [ ] Identify files that mix HTTP, business logic, and data access
  - [ ] Find components that handle multiple unrelated responsibilities
  - [ ] Check for utility functions mixed with business logic
  - [ ] Identify configuration logic mixed with business logic
  - [ ] Find error handling mixed with business logic (should be separate)
  - [ ] Check for services that are doing too much (god objects)
  - [ ] Identify services that should be split into multiple focused services
  - [ ] Check for controllers that contain business logic that should be in services
  - [ ] Check for jobs that are doing too much (should be split)
  - [ ] Identify jobs that contain business logic that should be in services
  - [ ] Verify models are not acting as services
- [ ] Document findings
  - [ ] Create a list of identified separation of concerns violations
  - [ ] Document recommended refactorings
  - [ ] Prioritize issues by severity and impact
  - [ ] Document examples of good separation of concerns
  - [ ] Create guidelines for maintaining separation of concerns

## Notes

- This task is part of Phase 3: Holistic Review and Best Practices
- Section: 1. Architecture Review
- **Current State**: The codebase has comprehensive architecture documentation but minimal implementation code. Focus should be on validating documentation against separation of concerns best practices and identifying any gaps or inconsistencies.
- Focus on identifying issues and improvements in documentation and planned architecture
- Document findings and decisions
- Compare documented architecture with planned architecture from `Plan/app-description.md`
- Review both existing documentation and planned structure to ensure proper separation
- When implementation code exists, review actual code against documented patterns
- Task can be completed independently by a single agent

## Current Implementation Status

**Documentation**: ✅ Comprehensive
- `docs/architecture.md` - Detailed architecture documentation with layer responsibilities
- `docs/API.md` - API endpoint documentation
- `docs/API_CONVENTIONS.md` - API conventions and patterns with separation guidance

**Implementation**: ⚠️ Minimal
- Directory structure exists but directories are empty
- `src/index.ts` is empty
- No controllers, services, models, or routes implemented yet
- Configuration files exist (package.json, tsconfig.json)
- Test structure exists but minimal test files

**Recommendation**: Focus this review on validating documentation and ensuring the planned separation of concerns is sound before implementation begins. When code is implemented, revisit this task to review actual implementation against documented patterns.

## Related Tasks

- Previous: PHASE3-001
- Next: PHASE3-003

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
