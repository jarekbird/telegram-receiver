# PHASE3-011: Verify type safety in all modules

**Section**: 2. TypeScript Best Practices
**Subsection**: 2.4
**Task ID**: PHASE3-011

## Description

Review and verify type safety in all modules in the codebase to ensure TypeScript best practices are followed. This includes checking for proper type annotations, avoiding unsafe type operations, ensuring strict mode compliance, and documenting the type safety status of the codebase.

## Current State Analysis

### TypeScript Configuration:

1. **tsconfig.json**:
   - `strict: true` is enabled ✓
   - Additional strict flags enabled:
     - `noUnusedLocals: true` ✓
     - `noUnusedParameters: true` ✓
     - `noImplicitReturns: true` ✓
     - `noFallthroughCasesInSwitch: true` ✓
   - Type checking passes with no errors ✓

### Current Type Safety Status:

1. **Type Assertions Found**:
   - `tests/helpers/testUtils.ts`: One type assertion `as jest.MockedFunction<T>` - This is acceptable for test utilities
   - No unsafe type assertions found in source code

2. **Type Safety Issues**:
   - No `@ts-ignore` or `@ts-expect-error` comments found
   - No implicit `any` types found in source code
   - No unsafe `unknown` usage without proper guards

3. **Areas to Review**:
   - Type guards usage (verify proper narrowing)
   - Test files type safety (ensure test utilities are properly typed)
   - Future code additions (ensure type safety standards are maintained)

## Checklist

### 1. Verify TypeScript Configuration
- [ ] Verify `strict: true` is enabled in `tsconfig.json`
- [ ] Verify additional strict flags are enabled:
  - [ ] `noUnusedLocals: true`
  - [ ] `noUnusedParameters: true`
  - [ ] `noImplicitReturns: true`
  - [ ] `noFallthroughCasesInSwitch: true`
- [ ] Verify `noImplicitAny` is enabled (part of strict mode)
- [ ] Verify `strictNullChecks` is enabled (part of strict mode)
- [ ] Verify `strictFunctionTypes` is enabled (part of strict mode)
- [ ] Verify `strictPropertyInitialization` is enabled (part of strict mode)
- [ ] Document any deviations from strict mode and rationale

### 2. Run Type Checking
- [ ] Run `npm run type-check` to identify all type errors
- [ ] Review all type errors reported by the compiler
- [ ] Fix all type errors found by the compiler
- [ ] Verify type checking passes with zero errors
- [ ] Document any type errors that cannot be fixed immediately and rationale

### 3. Review Type Assertions
- [ ] Search for all type assertions (`as`, `!`, `as unknown as`) in source code
- [ ] Review each type assertion:
  - [ ] Verify the assertion is necessary (cannot be avoided with better typing)
  - [ ] Verify the assertion is safe (type is actually what is asserted)
  - [ ] Document rationale for each assertion
- [ ] Review non-null assertions (`!`):
  - [ ] Verify value is guaranteed to be non-null
  - [ ] Consider using optional chaining or null checks instead
- [ ] Review `as unknown as` patterns:
  - [ ] Verify this is the only way to achieve the type conversion
  - [ ] Consider if a type guard would be safer
- [ ] Update code to remove unsafe assertions where possible
- [ ] Document remaining assertions and their rationale

### 4. Check for Unsafe Type Operations
- [ ] Search for `any` type usage:
  - [ ] Identify all uses of `any`
  - [ ] Verify each use is necessary
  - [ ] Replace with specific types or `unknown` where possible
- [ ] Search for `unknown` type usage:
  - [ ] Verify proper type guards are used before accessing properties
  - [ ] Ensure narrowing is performed correctly
  - [ ] Check that `unknown` is not used as a workaround for `any`
- [ ] Review type guards:
  - [ ] Verify type guards properly narrow types
  - [ ] Ensure type guards are used before accessing properties on `unknown`
  - [ ] Check for missing type guards where `unknown` is used

### 5. Review Type Guards Usage
- [ ] Identify all type guard functions in the codebase
- [ ] Verify type guards follow the pattern: `(value: unknown): value is Type`
- [ ] Review type guard implementations:
  - [ ] Verify guards properly check type at runtime
  - [ ] Ensure guards handle edge cases (null, undefined, etc.)
  - [ ] Check that guards are comprehensive enough
- [ ] Review usage of type guards:
  - [ ] Verify guards are used before accessing properties
  - [ ] Ensure narrowing is effective (TypeScript recognizes the narrowing)
  - [ ] Check for missing type guards where needed

### 6. Check for Implicit `any` Types
- [ ] Review function parameters:
  - [ ] Verify all parameters have explicit types
  - [ ] Check for untyped parameters that might infer `any`
- [ ] Review variable declarations:
  - [ ] Verify variables have explicit types or can be inferred safely
  - [ ] Check for variables that might infer `any`
- [ ] Review object properties:
  - [ ] Verify object properties have types
  - [ ] Check for untyped object literals
- [ ] Review function return types:
  - [ ] Verify return types are explicit or can be inferred
  - [ ] Check for functions that might return `any`

### 7. Review Test Files for Type Safety
- [ ] Review test utilities (`tests/helpers/testUtils.ts`):
  - [ ] Verify all test utilities are properly typed
  - [ ] Check type assertions in test utilities (e.g., `as jest.MockedFunction<T>`)
  - [ ] Ensure test utilities don't use unsafe types
- [ ] Review test files:
  - [ ] Verify test functions are properly typed
  - [ ] Check mock functions are properly typed
  - [ ] Ensure test fixtures have proper types
- [ ] Review test configuration files:
  - [ ] Verify `jest.config.ts` is properly typed
  - [ ] Verify `playwright.config.ts` is properly typed
  - [ ] Check for any type issues in configuration

### 8. Check for Type Suppression Comments
- [ ] Search for `@ts-ignore` comments:
  - [ ] Review each `@ts-ignore` comment
  - [ ] Verify the suppression is necessary
  - [ ] Consider if the issue can be fixed instead
  - [ ] Replace with `@ts-expect-error` if suppression is necessary (more explicit)
- [ ] Search for `@ts-expect-error` comments:
  - [ ] Review each `@ts-expect-error` comment
  - [ ] Verify the suppression is necessary
  - [ ] Add comments explaining why suppression is needed
  - [ ] Consider if the issue can be fixed instead
- [ ] Remove unnecessary suppressions
- [ ] Document remaining suppressions and their rationale

### 9. Review Type Safety in External Dependencies
- [ ] Review type definitions for external dependencies:
  - [ ] Verify `@types/*` packages are installed where needed
  - [ ] Check for missing type definitions
  - [ ] Review custom type definitions if any
- [ ] Review usage of external libraries:
  - [ ] Verify external library APIs are properly typed
  - [ ] Check for any `any` types leaking from external libraries
  - [ ] Document any type safety concerns with external dependencies

### 10. Document Type Safety Status
- [ ] Create or update type safety documentation:
  - [ ] Document current type safety status
  - [ ] List any remaining type safety issues
  - [ ] Document decisions made regarding type safety
  - [ ] Create guidelines for maintaining type safety
- [ ] Document type safety best practices:
  - [ ] When to use type assertions
  - [ ] When to use `unknown` vs `any`
  - [ ] How to write effective type guards
  - [ ] How to avoid implicit `any`
- [ ] Update project documentation with type safety guidelines

## Implementation Guidelines

### Type Assertions Best Practices:

1. **Avoid Type Assertions When Possible**:
   ```typescript
   // Bad: Unnecessary type assertion
   const value = getValue() as string;
   
   // Good: Let TypeScript infer or use proper typing
   const value: string = getValue();
   ```

2. **Use Type Guards Instead of Assertions**:
   ```typescript
   // Bad: Type assertion without runtime check
   function processValue(value: unknown) {
     const str = value as string;
     return str.toUpperCase();
   }
   
   // Good: Type guard with runtime check
   function isString(value: unknown): value is string {
     return typeof value === 'string';
   }
   
   function processValue(value: unknown) {
     if (isString(value)) {
       return value.toUpperCase(); // TypeScript knows value is string
     }
     throw new Error('Expected string');
   }
   ```

3. **Non-null Assertions Should Be Rare**:
   ```typescript
   // Bad: Non-null assertion when value might be null
   const element = document.getElementById('myId')!;
   
   // Good: Proper null check
   const element = document.getElementById('myId');
   if (!element) {
     throw new Error('Element not found');
   }
   // Now TypeScript knows element is not null
   ```

### Type Safety Best Practices:

1. **Prefer `unknown` Over `any`**:
   ```typescript
   // Bad: Using `any` loses type safety
   function processData(data: any) {
     return data.value; // No type checking
   }
   
   // Good: Using `unknown` requires type checking
   function processData(data: unknown) {
     if (typeof data === 'object' && data !== null && 'value' in data) {
       return (data as { value: string }).value; // Type guard needed
     }
     throw new Error('Invalid data');
   }
   ```

2. **Use Type Guards for Runtime Safety**:
   ```typescript
   // Good: Type guard function
   function isApiResponse(value: unknown): value is ApiResponse {
     return (
       typeof value === 'object' &&
       value !== null &&
       'success' in value &&
       'data' in value
     );
   }
   
   // Usage
   if (isApiResponse(response)) {
     // TypeScript knows response is ApiResponse
     console.log(response.data);
   }
   ```

3. **Avoid Implicit `any`**:
   ```typescript
   // Bad: Parameter without type (implicit any)
   function process(value) {
     return value.toString();
   }
   
   // Good: Explicit type
   function process(value: unknown) {
     if (typeof value === 'object' && value !== null) {
       return String(value);
     }
     return String(value);
   }
   ```

### Type Suppression Comments:

1. **Prefer `@ts-expect-error` Over `@ts-ignore`**:
   ```typescript
   // Bad: @ts-ignore doesn't fail if error is fixed
   // @ts-ignore
   const value = someFunction();
   
   // Good: @ts-expect-error fails if error is fixed (better for maintenance)
   // @ts-expect-error - Library has incorrect type definition
   const value = someFunction();
   ```

2. **Always Document Why Suppression is Needed**:
   ```typescript
   // Good: Documented suppression
   // @ts-expect-error - External library type definition is incorrect, see issue #123
   const result = externalLibrary.function();
   ```

### Testing Type Safety:

1. **Test Utilities Should Be Properly Typed**:
   ```typescript
   // Good: Generic test utility with proper typing
   export const createMockFn = <T extends (...args: any[]) => any>(
     implementation?: T
   ): jest.MockedFunction<T> => {
     return jest.fn(implementation) as jest.MockedFunction<T>;
   };
   ```

2. **Test Fixtures Should Have Types**:
   ```typescript
   // Good: Typed test fixture
   interface TestUser {
     id: string;
     name: string;
     email: string;
   }
   
   export const createTestUser = (overrides?: Partial<TestUser>): TestUser => ({
     id: '1',
     name: 'Test User',
     email: 'test@example.com',
     ...overrides,
   });
   ```

## Notes

- This task is part of Phase 3: Holistic Review and Best Practices
- Section: 2. TypeScript Best Practices
- Focus on identifying issues and improvements
- Document findings and decisions
- Current codebase has good type safety - this task ensures standards are maintained as codebase grows
- All type safety issues should be documented with rationale for any exceptions

- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE3-010
- Next: PHASE3-012

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
