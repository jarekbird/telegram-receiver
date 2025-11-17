# PHASE3-028: Standardize naming conventions

**Section**: 4. Code Organization
**Subsection**: 4.7
**Task ID**: PHASE3-028

## Description

Review and standardize naming conventions across the entire codebase to ensure consistency with TypeScript/Node.js best practices. This task involves auditing all files, variables, functions, classes, interfaces, types, and constants to identify inconsistencies and apply standardized naming conventions throughout the project.

## Naming Convention Standards

### Files and Directories
- **Source files**: Use `camelCase.ts` for regular files (e.g., `telegramService.ts`, `messageHandler.ts`)
- **Test files**: Use `camelCase.test.ts` or `camelCase.spec.ts` (e.g., `telegramService.test.ts`)
- **Type definition files**: Use `camelCase.ts` (types are defined within, not separate `.d.ts` files unless needed)
- **Directories**: Use `kebab-case` or `camelCase` (be consistent - prefer `camelCase` to match file naming)
- **Configuration files**: Use standard names (`tsconfig.json`, `.eslintrc.json`, `jest.config.ts`)

### Variables and Functions
- **Variables**: Use `camelCase` (e.g., `messageText`, `userId`, `requestId`)
- **Functions**: Use `camelCase` (e.g., `sendMessage()`, `processUpdate()`, `validateWebhook()`)
- **Private class methods**: Use `camelCase` (TypeScript doesn't require underscore prefix, but can use `_camelCase` if desired for clarity)
- **Arrow functions**: Use `camelCase` (e.g., `const handleMessage = () => {}`)

### Classes
- **Class names**: Use `PascalCase` (e.g., `TelegramService`, `CursorRunnerService`, `TelegramController`)
- **Class properties**: Use `camelCase` (e.g., `private httpClient: HttpClient`)
- **Class methods**: Use `camelCase` (e.g., `public async sendMessage()`)

### Types and Interfaces
- **Interfaces**: Use `PascalCase` with descriptive names (e.g., `TelegramMessage`, `WebhookUpdate`, `CursorRunnerResponse`)
- **Type aliases**: Use `PascalCase` (e.g., `type MessageHandler = (message: string) => void`)
- **Generic type parameters**: Use single uppercase letters (e.g., `T`, `K`, `V`) or descriptive PascalCase (e.g., `TResult`, `TError`)

### Constants
- **Module-level constants**: Use `UPPER_SNAKE_CASE` for true constants (e.g., `MAX_RETRY_ATTEMPTS`, `DEFAULT_TIMEOUT`)
- **Enum values**: Use `PascalCase` (e.g., `enum Status { Ready, Complete, Archived }`)
- **Config values**: Use `camelCase` if they're configurable (e.g., `const defaultTimeout = 3000`)

### Enums
- **Enum names**: Use `PascalCase` (e.g., `TaskStatus`, `MessageType`, `ErrorCode`)
- **Enum members**: Use `PascalCase` (e.g., `TaskStatus.Ready`, `MessageType.Text`)

### Exports
- **Named exports**: Use `camelCase` for functions/variables, `PascalCase` for classes/types (e.g., `export class TelegramService`, `export const sendMessage`)
- **Default exports**: Use `PascalCase` for classes, `camelCase` for functions (prefer named exports)

### Test Files
- **Test files**: Mirror source structure, use `camelCase.test.ts` (e.g., `telegramService.test.ts`)
- **Test descriptions**: Use descriptive strings (e.g., `describe('TelegramService', () => {})`)
- **Test cases**: Use `it('should do something', () => {})` or `test('should do something', () => {})`
- **Mock names**: Use `mock` prefix with camelCase (e.g., `mockTelegramApi`, `mockCursorRunner`)

### Special Cases
- **Event handlers**: Use `on` or `handle` prefix (e.g., `onMessage`, `handleWebhook`)
- **Boolean variables**: Use `is`, `has`, `should`, `can` prefix (e.g., `isValid`, `hasError`, `shouldRetry`, `canProcess`)
- **Async functions**: No special naming, but should return `Promise<T>`
- **Error classes**: Use `PascalCase` with `Error` suffix (e.g., `TelegramApiError`, `ValidationError`)

## Checklist

### Phase 1: Audit Current State
- [ ] Scan all source files (`src/**/*.ts`) and identify naming inconsistencies
- [ ] Scan all test files (`tests/**/*.ts`) and identify naming inconsistencies
- [ ] Document current naming patterns found
- [ ] Identify files that don't follow conventions
- [ ] Create a list of all items that need renaming

### Phase 2: Apply File Naming Conventions
- [ ] Rename source files to use `camelCase.ts` convention
- [ ] Rename test files to use `camelCase.test.ts` convention
- [ ] Update all imports/exports that reference renamed files
- [ ] Verify no broken imports after renaming

### Phase 3: Apply Variable and Function Naming
- [ ] Rename variables to use `camelCase`
- [ ] Rename functions to use `camelCase`
- [ ] Ensure boolean variables use appropriate prefixes (`is`, `has`, `should`, `can`)
- [ ] Update all references to renamed variables/functions
- [ ] Verify no broken references

### Phase 4: Apply Class and Type Naming
- [ ] Rename classes to use `PascalCase`
- [ ] Rename interfaces to use `PascalCase`
- [ ] Rename type aliases to use `PascalCase`
- [ ] Rename enums to use `PascalCase` with PascalCase members
- [ ] Update all references to renamed classes/types
- [ ] Verify no broken references

### Phase 5: Apply Constant Naming
- [ ] Identify true constants and rename to `UPPER_SNAKE_CASE`
- [ ] Keep configurable values in `camelCase`
- [ ] Update all references to renamed constants
- [ ] Verify no broken references

### Phase 6: Documentation and Verification
- [ ] Update inline documentation/comments that reference renamed items
- [ ] Update README or architecture docs if they reference specific names
- [ ] Run linter to verify no naming-related errors
- [ ] Run tests to ensure nothing is broken
- [ ] Create or update `docs/naming-conventions.md` with final conventions
- [ ] Verify consistency across entire codebase

### Phase 7: ESLint Configuration
- [ ] Review ESLint configuration for naming convention rules
- [ ] Add `@typescript-eslint/naming-convention` rule if not present
- [ ] Configure rules to enforce conventions:
  - Classes: `PascalCase`
  - Interfaces: `PascalCase`
  - Types: `PascalCase`
  - Variables: `camelCase`
  - Functions: `camelCase`
  - Constants: `UPPER_SNAKE_CASE` or `camelCase` (depending on type)
- [ ] Test ESLint rules work correctly

## Notes

- This task is part of Phase 3: Holistic Review and Best Practices
- Section: 4. Code Organization
- Focus on identifying naming inconsistencies and applying standardized conventions
- Document findings and decisions in `docs/naming-conventions.md`
- Task can be completed independently by a single agent

## Examples of Naming Conventions

### Good Examples
```typescript
// File: src/services/telegramService.ts
export class TelegramService {
  private readonly httpClient: HttpClient;
  private readonly config: Config;
  
  public async sendMessage(chatId: number, text: string): Promise<void> {
    // Implementation
  }
  
  private validateWebhook(secret: string): boolean {
    // Implementation
  }
}

// File: src/types/telegram.ts
export interface TelegramMessage {
  messageId: number;
  chatId: number;
  text: string;
}

export type MessageHandler = (message: TelegramMessage) => Promise<void>;

export enum TaskStatus {
  Ready = 0,
  Complete = 1,
  Archived = 2,
  Backlogged = 3
}

// Constants
export const MAX_RETRY_ATTEMPTS = 3;
export const DEFAULT_TIMEOUT = 30000;

// Config values
export const defaultTimeout = 3000;
```

### Bad Examples (to avoid)
```typescript
// ❌ Wrong file naming
telegram-service.ts  // kebab-case for files
TelegramService.ts  // PascalCase for files

// ❌ Wrong variable naming
const MessageText = "hello";  // PascalCase for variable
const message_text = "hello";  // snake_case

// ❌ Wrong function naming
function SendMessage() {}  // PascalCase for function
function send_message() {}  // snake_case

// ❌ Wrong interface naming
interface telegramMessage {}  // camelCase
interface telegram_message {}  // snake_case

// ❌ Wrong constant naming
const maxRetryAttempts = 3;  // Should be UPPER_SNAKE_CASE for true constants
```

## References

- TypeScript Style Guide: https://github.com/basarat/typescript-book/blob/master/docs/styleguide/styleguide.md
- Node.js Style Guide: https://github.com/felixge/node-style-guide
- ESLint Naming Conventions: https://typescript-eslint.io/rules/naming-convention/
- Project Architecture: `docs/architecture.md`

## Related Tasks

- Previous: PHASE3-027
- Next: PHASE3-029

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
