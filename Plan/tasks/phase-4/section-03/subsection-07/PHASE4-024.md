# PHASE4-024: Remove dead code

**Section**: 3. Refactoring
**Subsection**: 3.7
**Task ID**: PHASE4-024

## Description

Remove dead code identified during Phase 4 unused code detection (PHASE4-006) to improve code quality and maintainability. This task focuses on systematically removing unused imports, functions, variables, types, files, and dependencies that were identified in PHASE4-006, following a prioritized approach to minimize risk and ensure no breaking changes.

This task builds on the unused code detection work completed in PHASE4-006 and addresses the removal of dead code as part of the Phase 4 code quality audit refactoring efforts.

## Scope

This task covers:
- Reviewing unused code findings from PHASE4-006
- Removing unused imports across the codebase
- Removing unused functions and exports
- Removing unused variables and parameters
- Removing unused types, interfaces, and type definitions
- Removing unused files and modules
- Removing unused dependencies from package.json
- Removing commented-out code
- Verifying no breaking changes after removals
- Documenting all removed code and the impact

**Note**: This task focuses on removing dead code identified in PHASE4-006. For comprehensive unused code detection, refer to PHASE4-006 (Identify unused code/dead code).

## Context from PHASE4-006

PHASE4-006 identified unused code in:
- Unused exports (functions, types, constants)
- Unused imports
- Unused files and modules
- Unused dependencies in package.json
- Unused types/interfaces
- Dead code paths (unreachable code)

This task addresses the removal of these findings following a safe, prioritized approach.

## Checklist

### Review PHASE4-006 Findings
- [ ] Review unused code report from PHASE4-006
- [ ] Review unused exports findings (ts-prune output)
- [ ] Review unused files findings (unimported output)
- [ ] Review unused imports findings (ESLint output)
- [ ] Review unused dependencies findings (depcheck output)
- [ ] Review unused types/interfaces findings
- [ ] Categorize findings by removal priority:
  - Safe removals (unused imports, unused local variables)
  - Medium-risk removals (unused exports, unused types)
  - High-risk removals (unused files, unused dependencies)
- [ ] Identify false positives that should not be removed:
  - Public API exports that may be used externally
  - Test utilities that are intentionally kept
  - Code used via dynamic imports or reflection
  - Framework-specific usage patterns

### Remove Unused Imports
- [ ] Run ESLint with unused-imports plugin: `npm run unused:imports` (if configured)
- [ ] Review each unused import finding
- [ ] Verify imports are truly unused (check for dynamic imports, string references)
- [ ] Remove unused imports from source files
- [ ] Remove unused default imports
- [ ] Remove unused namespace imports
- [ ] Remove unused named imports
- [ ] Verify no breaking changes after import removal
- [ ] Run tests to ensure functionality is preserved

### Remove Unused Exports
- [ ] Review unused exports from ts-prune report
- [ ] Verify exports are truly unused (check for external usage, dynamic imports)
- [ ] Remove unused exported functions
- [ ] Remove unused exported types/interfaces
- [ ] Remove unused exported constants
- [ ] Remove unused exported classes
- [ ] Verify no breaking changes (check if exports are used externally)
- [ ] Run tests to ensure functionality is preserved
- [ ] Update documentation if public API changes

### Remove Unused Variables and Parameters
- [ ] Review unused variables flagged by TypeScript compiler
- [ ] Review unused parameters flagged by ESLint
- [ ] Remove unused local variables
- [ ] Remove or prefix unused function parameters with `_` (if intentionally unused)
- [ ] Remove unused class properties
- [ ] Remove unused enum values (if safe)
- [ ] Verify no breaking changes
- [ ] Run tests to ensure functionality is preserved

### Remove Unused Types and Interfaces
- [ ] Review unused type definitions
- [ ] Review unused interfaces
- [ ] Review unused type aliases
- [ ] Verify types are truly unused (check for type-only imports, generics)
- [ ] Remove unused type definitions
- [ ] Remove unused interfaces
- [ ] Remove unused type aliases
- [ ] Remove unused generic type parameters (if safe)
- [ ] Verify no breaking changes
- [ ] Run tests to ensure functionality is preserved

### Remove Unused Files
- [ ] Review unused files from unimported report
- [ ] Verify files are truly unused (check for dynamic imports, config references)
- [ ] Check if files are entry points or used by build tools
- [ ] Remove unused source files
- [ ] Remove unused test files (if they test non-existent code)
- [ ] Remove unused configuration files (if truly unused)
- [ ] Verify no breaking changes (check build process, imports)
- [ ] Run tests to ensure functionality is preserved
- [ ] Update documentation if files are removed

### Remove Unused Dependencies
- [ ] Review unused dependencies from depcheck report
- [ ] Verify dependencies are truly unused:
  - Check for dynamic imports
  - Check for usage in config files
  - Check for usage in scripts
  - Check for peer dependencies
- [ ] Remove unused dependencies from package.json
- [ ] Remove unused devDependencies from package.json
- [ ] Run `npm install` to update package-lock.json
- [ ] Verify application still builds and runs
- [ ] Run tests to ensure functionality is preserved
- [ ] Verify no runtime errors from missing dependencies

### Remove Commented-Out Code
- [ ] Search for commented-out code blocks
- [ ] Review commented-out code for relevance
- [ ] Remove commented-out code that is no longer needed
- [ ] Preserve commented-out code if it documents important decisions
- [ ] Replace commented-out code with proper documentation if needed
- [ ] Verify no breaking changes

### Remove Dead Code Paths
- [ ] Review unreachable code after return statements
- [ ] Review unreachable code after throw statements
- [ ] Review unreachable code in conditionals
- [ ] Remove unreachable code blocks
- [ ] Verify no breaking changes
- [ ] Run tests to ensure functionality is preserved

### Verification and Testing
- [ ] Run TypeScript compiler: `npm run type-check`
- [ ] Run ESLint: `npm run lint`
- [ ] Run all unit tests: `npm run test:unit`
- [ ] Run all integration tests: `npm run test:integration`
- [ ] Run all tests: `npm run test`
- [ ] Run end-to-end tests: `npm run test:e2e` (if applicable)
- [ ] Verify application builds successfully: `npm run build`
- [ ] Verify application starts successfully: `npm start` (test run)
- [ ] Check for any runtime errors or warnings
- [ ] Verify no breaking changes in functionality

### Documentation
- [ ] Document all removed code:
  - List removed unused imports
  - List removed unused exports
  - List removed unused variables
  - List removed unused types/interfaces
  - List removed unused files
  - List removed unused dependencies
  - List removed commented-out code
- [ ] Document removal rationale for significant removals
- [ ] Document any breaking changes (if any)
- [ ] Update code quality metrics:
  - Count of removed unused imports
  - Count of removed unused exports
  - Count of removed unused files
  - Count of removed unused dependencies
  - Total lines of code removed
- [ ] Update CHANGELOG or similar documentation (if applicable)

## Notes

- This task is part of Phase 4: Code Quality Audit
- Section: 3. Refactoring
- Focus on removing dead code identified in PHASE4-006 to improve code quality
- This task builds on PHASE4-006 unused code detection findings
- Follow a prioritized approach: start with safe removals, then medium-risk, then high-risk
- Always verify no breaking changes after each category of removals
- Some "unused" code may be intentionally kept (e.g., public API exports, test utilities)
- Be careful with false positives - verify that code is truly unused before removal
- Consider the impact of removing unused exports (may break external consumers)
- Document all removals for traceability
- Verify improvements through testing

- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE4-023
- Next: PHASE4-025
- Depends on: PHASE4-006 (Identify unused code/dead code)

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
