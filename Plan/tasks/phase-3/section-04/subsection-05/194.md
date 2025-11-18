# PHASE3-026: Review code reusability

**Section**: 4. Code Organization
**Subsection**: 4.5
**Task ID**: PHASE3-026

## Description

Review and improve code reusability in the codebase to ensure best practices and adherence to DRY (Don't Repeat Yourself) principles. This task focuses on identifying duplicate code, consolidating shared functionality, and establishing reusable components and utilities that can be used across the application.

## Checklist

### Duplicate Code Identification

- [ ] Scan all TypeScript files in `src/` directory (when files exist) for duplicate code patterns
- [ ] Review test files in `tests/` directory for duplicate test utilities or patterns
  - [ ] **SPECIFIC ISSUE**: Review mock reset functions in `tests/mocks/` - `resetTelegramApiMocks()`, `resetCursorRunnerApiMocks()`, and `resetRedisMocks()` all follow identical patterns and should be abstracted into a reusable utility
  - [ ] Check for duplicate fixture creation patterns (e.g., `createTelegramMessage`, `createCursorRunnerResponse` follow similar override patterns)
- [ ] Check for repeated logic across services, controllers, and middleware
- [ ] Identify similar error handling patterns that could be unified
- [ ] Look for duplicate validation logic that could be extracted
- [ ] Check for repeated API call patterns that could be abstracted

### Utility Functions Review

- [ ] Review existing utility functions in `src/utils/` directory (currently empty)
- [ ] Review test utilities in `tests/helpers/` (testUtils.ts, apiHelpers.ts)
  - [ ] Check if test utilities could be shared or improved
  - [ ] Verify test utilities follow DRY principles
  - [ ] **SPECIFIC OPPORTUNITY**: Create a generic `resetMockObject()` utility function to replace duplicate mock reset functions in `tests/mocks/`
  - [ ] **SPECIFIC OPPORTUNITY**: Consider creating a generic `createFixture()` utility to replace duplicate fixture creation patterns
  - [ ] Identify if any test utilities should be moved to `src/utils/` for production use
    - [ ] Review if `HTTP_STATUS` constants from `apiHelpers.ts` should be moved to `src/utils/` for production use
- [ ] Verify utility functions are properly exported and documented
- [ ] Check if utility functions are being reused appropriately
- [ ] Identify missing utility functions that should be created

### Shared Code Opportunities

- [ ] Identify code that could be shared across multiple modules
- [ ] Review common patterns in API request/response handling
- [ ] Check for shared authentication/authorization logic
- [ ] Review common data transformation patterns
- [ ] Identify shared error handling patterns
- [ ] Check for common logging patterns that could be abstracted
- [ ] Review shared configuration access patterns

### Abstraction Opportunities

- [ ] Identify opportunities to create base classes or interfaces
- [ ] Review if service classes share common patterns that could be abstracted
- [ ] Check if controllers share common middleware or handlers
- [ ] Identify if models share common functionality that could be abstracted
- [ ] Review if jobs share common patterns that could be abstracted
- [ ] Consider creating shared interfaces for common data structures

### DRY Violations

- [ ] Check for repeated string literals that should be constants
- [ ] Identify repeated magic numbers that should be named constants
- [ ] Review repeated type definitions that could be shared
- [ ] Check for duplicate type guards or validation functions
- [ ] Identify repeated async/await patterns that could be abstracted
- [ ] Review repeated error creation patterns

### Refactoring Opportunities

- [ ] Document code that should be extracted into utility functions
- [ ] Identify functions that should be moved to shared modules
- [ ] List opportunities to create shared base classes or interfaces
- [ ] Document patterns that should be standardized across the codebase
- [ ] Identify opportunities to create shared middleware
- [ ] List opportunities to consolidate similar services

### Reusable Components Documentation

- [ ] Document all reusable utility functions and their purposes
- [ ] Create or update documentation for shared components
- [ ] Document patterns for creating reusable code
- [ ] Update architecture documentation with reusable component guidelines
- [ ] Ensure reusable components are properly exported from appropriate modules
- [ ] Verify reusable components have proper TypeScript types/interfaces

### Code Organization for Reusability

- [ ] Verify `src/utils/` directory structure supports reusable utilities
- [ ] Check if shared types are properly organized in `src/types/`
- [ ] Review if shared interfaces should be in a dedicated location
- [ ] Verify reusable components follow consistent naming conventions
- [ ] Check if barrel exports (index.ts) should be used for utilities

## Notes

- This task is part of Phase 3: Holistic Review and Best Practices
- Section: 4. Code Organization
- Focus on identifying issues and improvements
- Document findings and decisions
- Current codebase state: `src/` directory is mostly empty but structure exists; test utilities exist in `tests/helpers/` (testUtils.ts, apiHelpers.ts); test mocks exist in `tests/mocks/` (telegramApi.ts, cursorRunnerApi.ts, redis.ts); test fixtures exist in `tests/fixtures/` (telegramMessages.ts, apiResponses.ts)
- **Known DRY Violations Identified**:
  - Mock reset functions: `resetTelegramApiMocks()`, `resetCursorRunnerApiMocks()`, and `resetRedisMocks()` in `tests/mocks/` all follow identical patterns - should be abstracted into a reusable utility
  - Fixture creation patterns: `createTelegramMessage()` and `createCursorRunnerResponse()` follow similar override patterns that could be abstracted
- When reviewing, consider both existing code and patterns that should be established for future code
- Pay special attention to test utilities - ensure they follow DRY principles and are reusable
- Consider creating shared utilities early to establish patterns for future development
- Focus on test code reusability first since that's where most code currently exists

- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE3-025
- Next: PHASE3-027

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
