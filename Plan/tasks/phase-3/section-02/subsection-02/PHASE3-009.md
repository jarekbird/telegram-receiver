# PHASE3-009: Review interface/type usage patterns

**Section**: 2. TypeScript Best Practices
**Subsection**: 2.2
**Task ID**: PHASE3-009

## Description

Review and improve interface/type usage patterns in the codebase to ensure best practices. Establish consistent patterns for when to use `interface` vs `type`, create missing type definitions for API responses and test fixtures, and ensure type safety throughout the codebase.

## Current State Analysis

### Issues Found:
1. **Missing Type Definitions**: Test fixtures (`telegramMessages.ts`, `apiResponses.ts`) use plain objects without type definitions
2. **No API Response Types**: Telegram API and Cursor Runner API responses lack type definitions
3. **Missing Interface Definitions**: Mock objects (`telegramApi.ts`, `cursorRunnerApi.ts`, `redis.ts`) lack proper interface definitions
4. **Inconsistent Patterns**: Some files use generics (`testUtils.ts`), some use `as const` (`apiHelpers.ts`), but no consistent pattern
5. **No Type Safety**: Test fixtures can have any shape, making refactoring risky

### Existing Patterns:
- Generic types used in `testUtils.ts` for mock functions: `<T extends (...args: any[]) => any>`
- `as const` used in `apiHelpers.ts` for HTTP_STATUS constant
- No interfaces or type aliases currently defined in the codebase

## Checklist

### 1. Establish Interface vs Type Guidelines
- [ ] Document when to use `interface` vs `type`:
  - Use `interface` for object shapes that may be extended or implemented
  - Use `type` for unions, intersections, primitives, and computed types
  - Use `interface` for public APIs and contracts
  - Use `type` for internal type aliases and complex compositions
- [ ] Create a style guide document in `docs/typescript-patterns.md`

### 2. Create Missing Type Definitions
- [ ] Create Telegram API types in `src/types/telegram.ts`:
  - `TelegramUpdate`, `TelegramMessage`, `TelegramUser`, `TelegramChat`, `TelegramCallbackQuery`
  - `TelegramApiResponse<T>`, `TelegramSendMessageResponse`
- [ ] Create Cursor Runner API types in `src/types/cursorRunner.ts`:
  - `CursorRunnerResponse<T>`, `CursorRunnerIterateResponse`, `CursorRunnerAsyncResponse`
- [ ] Create Redis client types in `src/types/redis.ts`:
  - `RedisClient` interface extending the Redis client methods
- [ ] Create HTTP/API types in `src/types/api.ts`:
  - `ApiResponse<T>`, `ApiError`, `HttpStatusCode`

### 3. Update Test Fixtures with Types
- [ ] Update `tests/fixtures/telegramMessages.ts` to use proper types:
  - Replace plain objects with typed constants
  - Use `satisfies` operator for type checking without widening
- [ ] Update `tests/fixtures/apiResponses.ts` to use proper types
- [ ] Update `tests/mocks/telegramApi.ts` to implement `TelegramApi` interface
- [ ] Update `tests/mocks/cursorRunnerApi.ts` to implement `CursorRunnerApi` interface
- [ ] Update `tests/mocks/redis.ts` to implement `RedisClient` interface

### 4. Review and Improve Existing Patterns
- [ ] Review generic usage in `testUtils.ts`:
  - Ensure generic constraints are appropriate
  - Consider if utility types (`Parameters`, `ReturnType`) could be used
- [ ] Review `as const` usage in `apiHelpers.ts`:
  - Verify that `as const` is used appropriately for readonly constants
  - Consider if `satisfies` operator would be better in some cases
- [ ] Check for any `any` types and replace with proper types
- [ ] Review type inference opportunities

### 5. Establish Naming Conventions
- [ ] Document naming conventions:
  - Interfaces: PascalCase, descriptive names (e.g., `TelegramMessage`, `ApiResponse`)
  - Types: PascalCase, descriptive names (e.g., `HttpMethod`, `ApiErrorCode`)
  - Generic parameters: Single uppercase letters (e.g., `T`, `K`, `V`)
- [ ] Ensure all type definitions follow conventions

### 6. Review Type Composition Patterns
- [ ] Check for opportunities to use utility types:
  - `Partial<T>`, `Required<T>`, `Pick<T, K>`, `Omit<T, K>`
  - `Record<K, V>`, `Readonly<T>`, `NonNullable<T>`
- [ ] Review union and intersection types for appropriateness
- [ ] Check for type guards and discriminated unions where applicable

### 7. Documentation and Examples
- [ ] Document type patterns in `docs/typescript-patterns.md`
- [ ] Add JSDoc comments to all public type definitions
- [ ] Create examples showing proper usage of interfaces vs types
- [ ] Document any architectural decisions regarding type definitions

## Implementation Guidelines

### When to Use `interface`:
- Object shapes that represent contracts or APIs
- Types that may be extended or implemented
- Public API definitions
- Example: `interface TelegramMessage { ... }`

### When to Use `type`:
- Union types: `type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'`
- Intersection types: `type A & B`
- Mapped types and utility type compositions
- Type aliases for complex types
- Example: `type ApiResponse<T> = { success: boolean; data: T }`

### Best Practices:
- Prefer `interface` for object shapes that may be extended
- Use `type` for unions, intersections, and computed types
- Use `satisfies` operator for type checking without type widening
- Avoid `any` - use `unknown` and type guards instead
- Use generic constraints appropriately
- Document complex types with JSDoc comments

## Notes

- This task is part of Phase 3: Holistic Review and Best Practices
- Section: 2. TypeScript Best Practices
- Focus on establishing patterns early before more code is written
- All type definitions should be placed in `src/types/` directory
- Test fixtures should use proper types for better refactoring safety
- Document all decisions and patterns for future reference

- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE3-008
- Next: PHASE3-010

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
