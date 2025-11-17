# PHASE4-021: Improve naming conventions

**Section**: 3. Refactoring
**Subsection**: 3.4
**Task ID**: PHASE4-021

## Description

Improve naming conventions throughout the telegram-receiver codebase to enhance code quality, readability, and maintainability. This task involves reviewing all source code files, identifying naming inconsistencies, and ensuring adherence to TypeScript/Node.js naming conventions.

## Scope

This task covers:
- All source files in `src/` directory (controllers, services, models, routes, middleware, utils, types, config)
- All test files in `tests/` directory
- Configuration files (TypeScript config, ESLint config, etc.)
- Documentation files that reference code elements

## TypeScript/Node.js Naming Conventions to Follow

### Variables and Functions
- Use **camelCase** for variables, functions, and methods
- Use descriptive names that clearly indicate purpose
- Avoid abbreviations unless they're widely understood
- Use verb-noun pattern for functions (e.g., `sendMessage`, `processUpdate`)
- Use noun pattern for variables (e.g., `messageId`, `userId`)

### Classes and Interfaces
- Use **PascalCase** for classes, interfaces, types, and enums
- Use descriptive names that indicate what they represent
- Interfaces should typically be nouns (e.g., `TelegramMessage`, `WebhookUpdate`)
- Classes should be nouns (e.g., `TelegramService`, `CursorRunnerClient`)

### Constants
- Use **UPPER_SNAKE_CASE** for module-level constants
- Use **camelCase** for constants within classes/functions if they're not exported
- Examples: `HTTP_STATUS`, `MAX_RETRY_ATTEMPTS`, `DEFAULT_TIMEOUT`

### File Names
- Use **camelCase** for TypeScript files (e.g., `telegramService.ts`, `webhookController.ts`)
- Use **kebab-case** for configuration files (e.g., `tsconfig.json`, `.eslintrc.json`)
- Test files should match source file names with `.test.ts` or `.spec.ts` suffix

### Private Members
- Prefix private class members with underscore if needed (though TypeScript `private` keyword is preferred)
- Use `_` prefix for intentionally unused parameters (e.g., `_unusedParam`)

### Boolean Variables/Functions
- Use `is`, `has`, `should`, `can`, `will` prefixes for boolean values
- Examples: `isValid`, `hasPermission`, `shouldRetry`, `canProcess`, `willExpire`

### Event Handlers/Callbacks
- Use `on` or `handle` prefix for event handlers
- Examples: `onMessage`, `handleWebhook`, `onError`

## Checklist

- [ ] Review all source files in `src/` directory for naming inconsistencies
- [ ] Review all test files in `tests/` directory for naming consistency
- [ ] Identify variables that don't follow camelCase convention
- [ ] Identify functions that don't follow camelCase convention or verb-noun pattern
- [ ] Identify classes/interfaces that don't follow PascalCase convention
- [ ] Identify constants that don't follow UPPER_SNAKE_CASE convention
- [ ] Check for abbreviations that should be spelled out
- [ ] Check for unclear or ambiguous names
- [ ] Check for boolean variables missing `is`/`has`/`should` prefixes
- [ ] Check for event handlers missing `on`/`handle` prefixes
- [ ] Rename all identified inconsistencies
- [ ] Update all references to renamed elements
- [ ] Verify no broken imports or references
- [ ] Run linter to ensure no naming-related errors
- [ ] Run tests to ensure all functionality still works
- [ ] Document naming standards in `docs/naming-conventions.md`
- [ ] Update ESLint configuration if needed to enforce naming conventions
- [ ] Update code style guide documentation

## Common Issues to Look For

1. **Inconsistent Case Usage**
   - Mixing camelCase and snake_case
   - Mixing PascalCase and camelCase for classes
   - Inconsistent constant naming

2. **Unclear Names**
   - Single-letter variables (except loop counters)
   - Abbreviations without context
   - Generic names like `data`, `item`, `obj`, `temp`

3. **Missing Prefixes**
   - Boolean variables without `is`/`has`/`should` prefixes
   - Event handlers without `on`/`handle` prefixes
   - Private members without proper visibility modifiers

4. **Inconsistent Patterns**
   - Functions that don't follow verb-noun pattern
   - Variables that don't clearly indicate their type or purpose
   - Classes that don't clearly indicate their responsibility

5. **File Naming Issues**
   - Inconsistent file naming conventions
   - Test files that don't match source file names

## Documentation Requirements

Create or update `docs/naming-conventions.md` with:
- Overview of naming conventions used in the project
- Examples of correct naming for each type (variables, functions, classes, constants)
- Examples of incorrect naming to avoid
- Guidelines for specific scenarios (event handlers, boolean values, etc.)
- References to TypeScript/Node.js style guides

## Notes

- This task is part of Phase 4: Code Quality Audit
- Section: 3. Refactoring
- Focus on identifying and fixing code quality issues
- Document all findings and improvements
- Ensure all changes maintain backward compatibility where possible
- Update imports and references when renaming exported elements
- Run full test suite after making changes to ensure nothing is broken

- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE4-020
- Next: PHASE4-022

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
