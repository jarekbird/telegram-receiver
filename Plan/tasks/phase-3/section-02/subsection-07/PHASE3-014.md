# PHASE3-014: Add missing type annotations

**Section**: 2. TypeScript Best Practices
**Subsection**: 2.7
**Task ID**: PHASE3-014

## Description

Review and add missing type annotations throughout the codebase to ensure TypeScript best practices are followed. This task focuses on identifying functions, objects, and exports that lack explicit type annotations and adding them where they improve code clarity, type safety, and developer experience.

## Files Requiring Type Annotation Review

Based on codebase review, the following files need type annotation improvements:

1. **Test Mocks** (`tests/mocks/`):
   - `tests/mocks/telegramApi.ts` - Missing return types for `resetTelegramApiMocks()`, missing type definitions for mock objects
   - `tests/mocks/cursorRunnerApi.ts` - Missing return types for `resetCursorRunnerApiMocks()`, missing type definitions for mock objects
   - `tests/mocks/redis.ts` - Missing return types for `resetRedisMocks()`, missing type definitions for mock Redis client

2. **Test Fixtures** (`tests/fixtures/`):
   - `tests/fixtures/apiResponses.ts` - Missing return type for `createCursorRunnerResponse()`, missing type definitions for response objects
   - `tests/fixtures/telegramMessages.ts` - Missing return type for `createTelegramMessage()`, missing type definitions for Telegram message objects

3. **Test Helpers** (`tests/helpers/`):
   - `tests/helpers/testUtils.ts` - Already reviewed in PHASE3-013, verify all type annotations are complete
   - `tests/helpers/apiHelpers.ts` - Review for any missing type annotations

4. **Configuration Files**:
   - `playwright.config.ts` - Verify all configuration options are properly typed
   - `jest.config.ts` - Verify configuration is properly typed (already uses `Config` type)

5. **Source Files** (`src/`):
   - `src/index.ts` - Currently empty, but when implemented, ensure all exports are properly typed

## Checklist

### 1. Review Function Return Types
- [ ] Review all functions in test mocks and add explicit return types where missing
- [ ] Review all helper functions and add explicit return types
- [ ] Review all fixture factory functions and add explicit return types
- [ ] Ensure functions that return `void` are explicitly annotated
- [ ] Ensure async functions have proper `Promise<T>` return types

### 2. Review Function Parameter Types
- [ ] Verify all function parameters have explicit types
- [ ] Review optional parameters and ensure they're properly typed
- [ ] Check for `any` types in function parameters and replace with proper types
- [ ] Ensure default parameter values are compatible with their types

### 3. Add Type Definitions for Objects
- [ ] Create type definitions for Telegram API mock objects (`tests/mocks/telegramApi.ts`)
- [ ] Create type definitions for Cursor Runner API mock objects (`tests/mocks/cursorRunnerApi.ts`)
- [ ] Create type definitions for Redis mock client (`tests/mocks/redis.ts`)
- [ ] Create type definitions for API response fixtures (`tests/fixtures/apiResponses.ts`)
- [ ] Create type definitions for Telegram message fixtures (`tests/fixtures/telegramMessages.ts`)

### 4. Review Exported Types and Interfaces
- [ ] Ensure all exported types and interfaces are properly documented
- [ ] Verify exported types match their actual usage
- [ ] Check for missing type exports that should be public

### 5. Add JSDoc Type Annotations
- [ ] Add JSDoc comments with `@param` and `@returns` tags where helpful
- [ ] Add JSDoc `@type` annotations for complex types where TypeScript types might not be sufficient
- [ ] Ensure JSDoc comments match TypeScript type annotations

### 6. Verify Public APIs Are Typed
- [ ] Review all exported functions and ensure they have proper type annotations
- [ ] Review all exported constants and ensure they have proper types
- [ ] Review all exported objects and ensure they have type definitions

### 7. Type Annotation Strategy Documentation
- [ ] Document when explicit return types are required vs when inference is preferred
- [ ] Document type annotation patterns used in the codebase
- [ ] Create or update `docs/typescript-patterns.md` with type annotation guidelines

### 8. Verification
- [ ] Run `npm run type-check` and verify no type errors
- [ ] Run `npm run lint` and verify no type-related warnings
- [ ] Run `npm test` to ensure all tests still pass after adding type annotations
- [ ] Verify TypeScript compiler strict mode compliance

## Notes

- This task is part of Phase 3: Holistic Review and Best Practices
- Section: 2. TypeScript Best Practices
- Focus on identifying issues and improvements
- Document findings and decisions

- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE3-013
- Next: PHASE3-015

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
