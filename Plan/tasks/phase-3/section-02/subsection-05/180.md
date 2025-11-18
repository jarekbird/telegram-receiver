# PHASE3-012: Review and improve type inference

**Section**: 2. TypeScript Best Practices
**Subsection**: 2.5
**Task ID**: PHASE3-012

## Description

Review and improve type inference in the codebase to ensure TypeScript best practices are followed. This includes identifying where explicit types are needed versus where type inference can be leveraged, removing unnecessary type annotations, optimizing return type annotations, and documenting the type inference strategy used throughout the codebase.

## Current State Analysis

### Type Inference Patterns Found:

1. **Test Utilities** (`tests/helpers/testUtils.ts`):
   - Functions like `randomString`, `randomEmail`, `randomInt` have explicit return type annotations (`: string`, `: number`)
   - These explicit return types may be unnecessary if the return type is clear from the implementation
   - `createMockFn` uses generic type constraints with `any[]` - type inference could be improved here

2. **Test Fixtures** (`tests/fixtures/telegramMessages.ts`):
   - Object literals like `sampleTextMessage`, `sampleCallbackQuery` rely on type inference
   - `createTelegramMessage` function parameter uses `overrides = {}` without explicit type - could benefit from proper typing
   - Return type of `createTelegramMessage` is inferred from object spread

3. **Mock Files** (`tests/mocks/*.ts`):
   - Mock objects use type inference for their structure
   - Mock functions use `jest.fn()` with inferred types from `mockResolvedValue`
   - Reset functions have inferred return types (`void`)

4. **Configuration Files**:
   - `jest.config.ts` uses explicit type annotation `const config: Config = {...}` - appropriate for configuration objects
   - Type inference is used for the exported default value

### Areas to Review:

1. **Function Return Types**: Determine if explicit return types add value or if inference is sufficient
2. **Object Literals**: Check if complex object literals need explicit types for better IntelliSense and error detection
3. **Generic Functions**: Review type inference in generic functions, especially test utilities
4. **Async Functions**: Verify type inference works correctly with Promise return types
5. **Destructuring**: Check type inference with destructured parameters and return values

## Checklist

### 1. Review Function Parameters
- [ ] Review all function parameters and identify where explicit types improve clarity
- [ ] Check for parameters with default values that could benefit from explicit types
- [ ] Review destructured parameters and verify type inference works correctly
- [ ] Check for parameters that use `any` or `unknown` where more specific types could be inferred
- [ ] Verify that optional parameters are properly typed
- [ ] Review rest parameters and verify they're properly typed

### 2. Review Function Return Types
- [ ] Review all function return types and determine if explicit annotations are needed
- [ ] Identify functions where explicit return types improve code clarity
- [ ] Identify functions where explicit return types help catch errors early
- [ ] Check for functions with complex inferred return types that should be explicitly typed
- [ ] Review async functions and verify Promise return types are properly inferred
- [ ] Check for functions that return `any` or `unknown` unintentionally

### 3. Identify Unnecessary Type Annotations
- [ ] Check for unnecessary type annotations that don't add value (e.g., `const x: string = "hello"`)
- [ ] Review variable declarations with obvious types that could use inference
- [ ] Check for redundant type annotations in object literals
- [ ] Review array/object destructuring with unnecessary type annotations
- [ ] Identify places where type inference provides the same safety as explicit types

### 4. Review Return Type Annotations
- [ ] Review return type annotations and ensure they're only added when they improve code clarity or catch errors
- [ ] Check for return type annotations that match inferred types exactly (may be redundant)
- [ ] Verify return type annotations are more specific than inferred types when needed
- [ ] Review public API functions and ensure they have explicit return types for better documentation
- [ ] Check for return type annotations that help with error messages

### 5. Review Complex Inferred Types
- [ ] Check for complex inferred types that should be explicitly typed for readability
- [ ] Review functions that return complex object types or union types
- [ ] Check for inferred types that are hard to understand without explicit annotation
- [ ] Review generic functions with complex inferred return types
- [ ] Identify types that would benefit from type aliases or interfaces

### 6. Review Generic Functions
- [ ] Review type inference in generic functions and ensure proper type constraints
- [ ] Check for generic functions where type inference could be improved
- [ ] Review generic constraints and verify they allow proper type inference
- [ ] Check for generic functions that return `any` due to poor type constraints
- [ ] Verify that generic type parameters are properly inferred from usage

### 7. Review Async/Await Patterns
- [ ] Verify that type inference works correctly with async/await patterns
- [ ] Check for async functions where Promise types are properly inferred
- [ ] Review error handling in async functions and verify types are correct
- [ ] Check for Promise chains where type inference flows correctly
- [ ] Verify that async function return types are properly inferred as `Promise<T>`

### 8. Review Destructuring and Object Literals
- [ ] Check for type inference issues with destructuring and object literals
- [ ] Review object destructuring in function parameters
- [ ] Check for array destructuring where types are properly inferred
- [ ] Review object literal return types and verify inference works correctly
- [ ] Check for spread operators where type inference may be complex

### 9. Review Test Files Specifically
- [ ] Review test utilities (`tests/helpers/testUtils.ts`) for type inference opportunities
- [ ] Check test fixtures (`tests/fixtures/*.ts`) for proper type inference
- [ ] Review mock files (`tests/mocks/*.ts`) and verify type inference is appropriate
- [ ] Check test functions and verify return types are properly inferred
- [ ] Review test configuration files for type inference patterns

### 10. Document Type Inference Strategy
- [ ] Document the type inference strategy and guidelines for the codebase
- [ ] Create guidelines for when to use explicit types vs. type inference
- [ ] Document examples of good type inference usage
- [ ] Document examples of when explicit types are preferred
- [ ] Update project documentation with type inference best practices

## Implementation Guidelines

### When to Use Type Inference:

1. **Simple Variable Declarations**:
   ```typescript
   // Good: Type inference is clear and sufficient
   const message = 'Hello, world!';
   const count = 42;
   const isActive = true;
   
   // Unnecessary: Explicit type adds no value
   const message: string = 'Hello, world!';
   ```

2. **Function Return Types (when clear)**:
   ```typescript
   // Good: Return type is obvious from implementation
   function add(a: number, b: number) {
     return a + b; // TypeScript infers number
   }
   
   // Consider explicit return type for public APIs or complex functions
   export function processData(input: string): ProcessedData {
     // Complex logic...
   }
   ```

3. **Object Literals (when structure is clear)**:
   ```typescript
   // Good: Type inference works well for simple objects
   const config = {
     host: 'localhost',
     port: 3000,
     timeout: 5000,
   };
   ```

### When to Use Explicit Types:

1. **Public API Functions**:
   ```typescript
   // Good: Explicit return type documents the API
   export function getUser(id: string): Promise<User> {
     return fetchUser(id);
   }
   ```

2. **Complex Inferred Types**:
   ```typescript
   // Good: Explicit type improves readability
   function processItems(items: Item[]): Map<string, ProcessedItem[]> {
     // Complex processing logic
   }
   ```

3. **Function Parameters**:
   ```typescript
   // Good: Always use explicit types for parameters
   function process(data: UserData, options: ProcessOptions) {
     // Implementation
   }
   ```

4. **Object Literals with Complex Types**:
   ```typescript
   // Good: Explicit type helps with IntelliSense and error detection
   const config: AppConfig = {
     host: 'localhost',
     port: 3000,
     features: {
       enabled: true,
       // TypeScript will catch missing or incorrect properties
     },
   };
   ```

### Type Inference Best Practices:

1. **Avoid Redundant Type Annotations**:
   ```typescript
   // Bad: Redundant type annotation
   const result: string = getStringValue();
   
   // Good: Let TypeScript infer
   const result = getStringValue();
   ```

2. **Use Explicit Types for Clarity**:
   ```typescript
   // Bad: Inferred type might be unclear
   function createConfig() {
     return {
       host: 'localhost',
       port: 3000,
       // ... many properties
     };
   }
   
   // Good: Explicit return type clarifies intent
   function createConfig(): AppConfig {
     return {
       host: 'localhost',
       port: 3000,
       // ... many properties
     };
   }
   ```

3. **Generic Functions**:
   ```typescript
   // Good: Type inference works well with generics
   function identity<T>(value: T): T {
     return value;
   }
   
   const result = identity('hello'); // TypeScript infers string
   ```

4. **Async Functions**:
   ```typescript
   // Good: Return type is inferred as Promise<string>
   async function fetchData(): Promise<string> {
     const response = await fetch('/api/data');
     return response.text();
   }
   
   // Consider explicit return type for complex Promise types
   async function processUser(id: string): Promise<ProcessedUser> {
     // Complex async logic
   }
   ```

5. **Destructuring**:
   ```typescript
   // Good: Type inference works with destructuring
   const { name, age } = getUser();
   
   // Good: Explicit type when needed for clarity
   const { name, age }: { name: string; age: number } = getUser();
   ```

### Common Patterns to Review:

1. **Test Utilities**:
   ```typescript
   // Review: Are explicit return types needed?
   export const randomString = (length = 10): string => {
     return Math.random().toString(36).substring(2, length + 2);
   };
   
   // Consider: Could inference work here?
   export const randomString = (length = 10) => {
     return Math.random().toString(36).substring(2, length + 2);
   };
   ```

2. **Test Fixtures**:
   ```typescript
   // Review: Should this have an explicit type?
   export const createTelegramMessage = (overrides = {}) => ({
     ...sampleTextMessage,
     ...overrides,
   });
   
   // Consider: Explicit type for better type safety
   export const createTelegramMessage = (
     overrides: Partial<TelegramMessage> = {}
   ): TelegramMessage => ({
     ...sampleTextMessage,
     ...overrides,
   });
   ```

3. **Mock Functions**:
   ```typescript
   // Review: Type inference from mockResolvedValue
   export const mockApi = {
     sendMessage: jest.fn().mockResolvedValue({ success: true }),
   };
   
   // Consider: Explicit type for better IntelliSense
   export const mockApi: MockApi = {
     sendMessage: jest.fn().mockResolvedValue({ success: true }),
   };
   ```

## Notes

- This task is part of Phase 3: Holistic Review and Best Practices
- Section: 2. TypeScript Best Practices
- Focus on identifying issues and improvements
- Document findings and decisions
- Current codebase has good type safety (from PHASE3-011) - this task focuses on optimizing type inference usage
- Balance between explicit types (for clarity/documentation) and type inference (for conciseness)
- When in doubt, prefer explicit types for public APIs and complex functions
- Use type inference for simple, obvious cases to reduce verbosity

- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE3-011
- Next: PHASE3-013

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
