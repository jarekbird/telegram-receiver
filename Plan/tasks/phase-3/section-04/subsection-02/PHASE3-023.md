# PHASE3-023: Review naming conventions consistency

**Section**: 4. Code Organization
**Subsection**: 4.2
**Task ID**: PHASE3-023

## Description

Review and improve naming conventions consistency in the codebase to ensure best practices. This task focuses on validating that all code follows consistent naming patterns across files, variables, classes, constants, interfaces, and types.

## Checklist

### File Naming Conventions

- [ ] Verify TypeScript source files use kebab-case (e.g., `telegram-service.ts`, `cursor-runner-api.ts`)
- [ ] Verify test files follow naming pattern: `*.test.ts` or `*.spec.ts` (e.g., `telegram-service.test.ts`)
- [ ] Check that utility files use kebab-case (e.g., `test-utils.ts`, `api-helpers.ts`)
- [ ] Verify mock files use kebab-case (e.g., `telegram-api.ts`, `cursor-runner-api.ts`)
- [ ] Verify fixture files use kebab-case (e.g., `telegram-messages.ts`, `api-responses.ts`)
- [ ] Check that configuration files follow standard naming (`.eslintrc.json`, `.prettierrc.json`, `tsconfig.json`)
- [ ] Verify index files are named `index.ts` where appropriate
- [ ] Check for any inconsistencies in file naming patterns

### Variable Naming Conventions

- [ ] Verify variables use camelCase (e.g., `mockRedisClient`, `waitFor`, `createMockFn`)
- [ ] Check that function parameters use camelCase (e.g., `ms: number`, `overrides = {}`)
- [ ] Verify object properties use camelCase (e.g., `message_id`, `update_id` - note: these may follow API conventions)
- [ ] Check that local variables consistently use camelCase
- [ ] Verify no snake_case variables (except where required by external APIs)

### Class Naming Conventions

- [ ] Verify classes use PascalCase (e.g., `TelegramService`, `TelegramController`, `HealthController`)
- [ ] Check that class names are descriptive and follow the pattern: `[Purpose][Type]` (e.g., `TelegramService`, not `Telegram`)
- [ ] Verify abstract classes use PascalCase with appropriate naming
- [ ] Check for consistency in class naming across the codebase

### Constant Naming Conventions

- [ ] Verify true constants use UPPER_SNAKE_CASE (e.g., `HTTP_STATUS`, `MAX_RETRIES`)
- [ ] Check that constant objects use camelCase if they're mutable exports (e.g., `mockTelegramApi`)
- [ ] Verify enum values follow appropriate conventions (UPPER_SNAKE_CASE for enum members)
- [ ] Distinguish between true constants (UPPER_SNAKE_CASE) and exported objects/functions (camelCase)

### Interface and Type Naming Conventions

- [ ] Verify interfaces use PascalCase (e.g., `TelegramMessage`, `CursorRunnerResponse`)
- [ ] Check that type aliases use PascalCase (e.g., `UserConfig`, `ApiResponse`)
- [ ] Verify generic type parameters use PascalCase (e.g., `T`, `K`, `V` for simple generics)
- [ ] Check that interface names are descriptive and follow the pattern: `[Purpose]` or `I[Purpose]` (prefer without `I` prefix)
- [ ] Verify type unions and intersections follow naming conventions

### Function Naming Conventions

- [ ] Verify functions use camelCase (e.g., `waitFor`, `createMockFn`, `resetRedisMocks`)
- [ ] Check that async functions follow camelCase (e.g., `processMessage`, `sendTelegramMessage`)
- [ ] Verify factory functions use `create` prefix where appropriate (e.g., `createTestRequest`, `createTelegramMessage`)
- [ ] Check that reset/clear functions use appropriate verbs (e.g., `resetRedisMocks`, `clearCache`)
- [ ] Verify getter functions use appropriate naming (e.g., `getHealth`, `getUserById`)

### Export Naming Conventions

- [ ] Verify exported functions use camelCase (e.g., `export const waitFor`, `export function processMessage`)
- [ ] Check that exported classes use PascalCase (e.g., `export class TelegramService`)
- [ ] Verify exported constants use appropriate case (UPPER_SNAKE_CASE for true constants, camelCase for objects)
- [ ] Check that default exports follow naming conventions
- [ ] Verify named exports are consistent with their declaration names

### Consistency Checks

- [ ] Review all files in `src/` directory for naming consistency
- [ ] Review all files in `tests/` directory for naming consistency
- [ ] Check for any deviations from established patterns
- [ ] Verify naming conventions align with TypeScript/Node.js best practices
- [ ] Check that naming conventions are consistent with ESLint configuration
- [ ] Verify no mixing of naming styles (e.g., camelCase and snake_case in same context)

### Documentation

- [ ] Document naming conventions in `docs/architecture.md` or create `docs/naming-conventions.md`
- [ ] Include examples for each naming convention type
- [ ] Document any exceptions or special cases (e.g., API response properties following external API conventions)
- [ ] Add naming convention guidelines to project documentation
- [ ] Ensure documentation is clear and actionable for developers

## Evaluation Findings

### Current Naming Conventions Status

Based on review of the existing codebase (primarily test files and configuration):

**File Naming:**
- ⚠️ Test files currently use camelCase: `testUtils.ts`, `cursorRunnerApi.ts`, `telegramApi.ts`, `apiHelpers.ts`, `telegramMessages.ts`, `apiResponses.ts`
- ✅ Configuration files follow standard naming: `.eslintrc.json`, `.prettierrc.json`, `tsconfig.json`, `jest.config.ts`, `playwright.config.ts`
- 📝 Recommendation: Standardize on kebab-case for all file names to align with TypeScript/Node.js best practices (e.g., `test-utils.ts`, `cursor-runner-api.ts`, `telegram-api.ts`)

**Variable Naming:**
- ✅ Variables consistently use camelCase: `mockRedisClient`, `mockTelegramApi`, `waitFor`, `createMockFn`, `randomString`, `sampleTextMessage`
- ✅ Function parameters use camelCase: `ms: number`, `overrides = {}`, `length = 10`
- ✅ Object properties follow API conventions where needed (e.g., `message_id`, `update_id` from Telegram API)
- ✅ Local variables use camelCase consistently

**Class Naming:**
- ✅ Classes use PascalCase in architecture documentation: `TelegramService`, `TelegramController`, `HealthController`
- 📝 Note: No actual class implementations found in current codebase (codebase appears to be in early stages)

**Constant Naming:**
- ✅ True constants use UPPER_SNAKE_CASE: `HTTP_STATUS` (with properties like `OK: 200`, `CREATED: 201`)
- ✅ Exported mock objects use camelCase: `mockTelegramApi`, `mockRedisClient`, `mockCursorRunnerApi`
- ✅ Proper distinction between constants and mutable exports

**Interface/Type Naming:**
- 📝 Note: Limited TypeScript type definitions found in current codebase
- ✅ Type imports use PascalCase: `SuperTest`, `Test`, `Express`, `Config`
- 📝 Recommendation: Ensure all interfaces and types use PascalCase when implemented

**Function Naming:**
- ✅ Functions use camelCase: `waitFor`, `createMockFn`, `resetRedisMocks`, `createTestRequest`
- ✅ Factory functions use `create` prefix: `createTestRequest`, `createTelegramMessage`, `createCursorRunnerResponse`
- ✅ Reset functions use `reset` prefix: `resetRedisMocks`, `resetTelegramApiMocks`, `resetCursorRunnerApiMocks`
- ✅ Async functions follow camelCase: `waitFor` (returns Promise)

**Export Naming:**
- ✅ Exported functions use camelCase: `export const waitFor`, `export const createMockFn`
- ✅ Exported objects use camelCase: `export const mockTelegramApi`
- ✅ Exported constants use appropriate case: `export const HTTP_STATUS` (UPPER_SNAKE_CASE)
- ✅ Default exports follow conventions: `export default config`

### Issues Identified

1. **File Naming Inconsistency**: Test files use camelCase (`testUtils.ts`, `cursorRunnerApi.ts`) instead of kebab-case (`test-utils.ts`, `cursor-runner-api.ts`). This should be standardized to kebab-case for consistency with TypeScript/Node.js conventions.

2. **Missing Source Files**: The `src/` directory structure exists but contains no implementation files yet. Naming conventions should be validated once source files are added.

3. **Documentation Gap**: No dedicated naming conventions documentation exists. Should be added to `docs/architecture.md` or as a separate `docs/naming-conventions.md` file.

### Recommendations

1. **Standardize File Naming**: Rename test files to use kebab-case:
   - `testUtils.ts` → `test-utils.ts`
   - `cursorRunnerApi.ts` → `cursor-runner-api.ts`
   - `telegramApi.ts` → `telegram-api.ts`
   - `apiHelpers.ts` → `api-helpers.ts`
   - `telegramMessages.ts` → `telegram-messages.ts`
   - `apiResponses.ts` → `api-responses.ts`

2. **Create Naming Conventions Documentation**: Add a section to `docs/architecture.md` or create `docs/naming-conventions.md` with:
   - File naming conventions (kebab-case)
   - Variable naming conventions (camelCase)
   - Class naming conventions (PascalCase)
   - Constant naming conventions (UPPER_SNAKE_CASE for true constants)
   - Interface/Type naming conventions (PascalCase)
   - Function naming conventions (camelCase)
   - Export naming conventions
   - Examples for each convention type
   - Exceptions (e.g., API response properties following external API conventions)

3. **ESLint Configuration**: Verify that ESLint rules enforce naming conventions (currently no explicit naming rules found in `.eslintrc.json`)

4. **Validation**: Once source files are added, validate that all naming conventions are followed consistently

### Current Conventions Summary

Based on codebase review, the following conventions are currently followed:

- **Files**: camelCase (should be kebab-case)
- **Variables**: camelCase ✅
- **Classes**: PascalCase ✅
- **Constants**: UPPER_SNAKE_CASE ✅
- **Interfaces/Types**: PascalCase ✅
- **Functions**: camelCase ✅
- **Exports**: Follow declaration naming ✅

## Notes

- This task is part of Phase 3: Holistic Review and Best Practices
- Section: 4. Code Organization
- Focus on identifying issues and improvements
- Document findings and decisions
- Current codebase is in early stages - most source files are not yet implemented
- Primary focus should be on documenting conventions and ensuring consistency as code is added

- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE3-022
- Next: PHASE3-024

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
