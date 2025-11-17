# PHASE3-025: Review import/export patterns

**Section**: 4. Code Organization
**Subsection**: 4.4
**Task ID**: PHASE3-025

## Description

Review and improve import/export patterns in the codebase to ensure best practices and consistency across all TypeScript files.

## Checklist

- [ ] Review import statements across all TypeScript files (src/, tests/, config files)
  - [ ] Check for consistent use of `import type` vs regular `import` for type-only imports
  - [ ] Verify proper use of default vs named imports
  - [ ] Check for correct use of path aliases (`@/` as configured in jest.config.ts)
  - [ ] Verify relative import paths are correct and consistent
- [ ] Check for unused imports
  - [ ] Run ESLint to identify unused imports
  - [ ] Remove any unused imports found
- [ ] Review export patterns
  - [ ] Check consistency between `export default` and named exports
  - [ ] Verify exports match their usage patterns
  - [ ] Review if default exports are appropriate or should be named exports
- [ ] Check for barrel exports (index.ts files that re-export from multiple modules)
  - [ ] Identify if barrel exports exist or should be created
  - [ ] Evaluate if barrel exports improve or complicate the import structure
- [ ] Review import order and grouping
  - [ ] Check if imports follow a consistent order (external packages, internal modules, types)
  - [ ] Verify grouping of imports (external, internal, relative, type-only)
  - [ ] Consider adding ESLint rules for import ordering if needed
- [ ] Check for consistent patterns across different file types
  - [ ] Test files (tests/**/*.ts)
  - [ ] Configuration files (jest.config.ts, playwright.config.ts)
  - [ ] Source files (src/**/*.ts) - when they exist
- [ ] Review path alias usage
  - [ ] Verify `@/` alias is used consistently where configured
  - [ ] Check if path aliases should be extended to tsconfig.json for runtime use
- [ ] Identify improvements and document recommendations
  - [ ] Document any inconsistencies found
  - [ ] Propose standard patterns for the codebase
  - [ ] Consider adding ESLint plugins for import organization (e.g., eslint-plugin-import)

## Notes

- This task is part of Phase 3: Holistic Review and Best Practices
- Section: 4. Code Organization
- Focus on identifying issues and improvements
- Document findings and decisions
- Current codebase state: Most TypeScript files are in `tests/` directory; `src/` directory is mostly empty but structure exists
- Path aliases: Jest config uses `@/` mapping to `src/` - verify if this should be extended to tsconfig.json
- ESLint configuration: Currently doesn't include import-specific rules - consider adding eslint-plugin-import

- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE3-024
- Next: PHASE3-026

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
