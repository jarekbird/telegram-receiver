# PHASE3-013: Fix any type-related issues

**Section**: 2. TypeScript Best Practices
**Subsection**: 2.6
**Task ID**: PHASE3-013

## Description

Review and fix any type-related issues in the codebase to ensure TypeScript best practices are followed. This task addresses specific type issues identified in previous tasks (PHASE3-010, PHASE3-011, PHASE3-012), including replacing `any` types with proper types, fixing type errors, and improving type definitions.

## Known Issues to Address

Based on previous task reviews and codebase validation, the following type issues have been identified:

1. **Test Utilities** (`tests/helpers/testUtils.ts`):
   - `createMockFn` function uses `any[]` and `any` in generic constraint (line 15)
   - Current implementation: `<T extends (...args: any[]) => any>`
   - ESLint warnings: 2 warnings for `@typescript-eslint/no-explicit-any` on line 15 (positions 15:50 and 15:60)
   - Type-check status: No TypeScript compilation errors (type-check passes)
   - Generic constraint `(...args: any[]) => any` should be improved to use `unknown[]` and `unknown` or more specific types
   - The function is currently working correctly but violates ESLint rules for type safety

## Checklist

### 1. Fix Known Type Issues
- [ ] Fix `createMockFn` in `tests/helpers/testUtils.ts` (line 15):
  - Replace the generic constraint `<T extends (...args: any[]) => any>` with a better type-safe version
  - Use TypeScript utility types: `<T extends (...args: unknown[]) => unknown>` or better yet, use `Parameters<T>` and `ReturnType<T>` if possible
  - Alternative approach: Use `<T extends (...args: never[]) => unknown>` or simply constrain to `Function` type if utility types don't work well with jest.MockedFunction
  - Ensure the function maintains type safety and all existing tests continue to pass
  - The function signature should remain: `export const createMockFn = <T extends ...>(implementation?: T): jest.MockedFunction<T>`
- [ ] Run `npm run lint` and fix all `@typescript-eslint/no-explicit-any` warnings
- [ ] Verify no ESLint type-related warnings remain (should show 0 warnings after fix)

### 2. Review and Fix Additional Type Issues
- [ ] Run `npm run type-check` to identify any TypeScript compilation errors
- [ ] Review all `any` types in the codebase and replace with proper types
- [ ] Check for unsafe type assertions (`as any`, `as unknown as any`)
- [ ] Review and fix any implicit `any` types
- [ ] Check for `@ts-ignore` or `@ts-expect-error` comments and verify they're necessary

### 3. Improve Type Definitions
- [ ] Review type definitions for clarity and correctness
- [ ] Ensure all function parameters have explicit types where needed
- [ ] Ensure all function return types are properly annotated or inferred
- [ ] Verify type definitions match actual usage patterns

### 4. Verification
- [ ] Run `npm run type-check` and verify no type errors remain
- [ ] Run `npm run lint` and verify no type-related warnings remain
- [ ] Run `npm test` to ensure all tests still pass after type fixes
- [ ] Document any type-related decisions or trade-offs made

## Notes

- This task is part of Phase 3: Holistic Review and Best Practices
- Section: 2. TypeScript Best Practices
- This task builds on the findings from PHASE3-010 (generic type usage), PHASE3-011 (type safety verification), and PHASE3-012 (type inference)
- Focus on fixing actual type issues rather than making unnecessary changes
- When replacing `any` types, prefer `unknown` with proper type guards over `any`
- Document any architectural decisions regarding type choices

- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE3-012
- Next: PHASE3-014

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
