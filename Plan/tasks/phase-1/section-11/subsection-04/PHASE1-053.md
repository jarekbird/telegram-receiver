# PHASE1-053: Configure CI job - Linting

**Section**: 11. CI/CD Pipeline Configuration
**Subsection**: 11.4
**Task ID**: PHASE1-053

## Description

Configure the linting and type checking steps for the CI test job in the GitHub Actions workflow. This task focuses on adding code quality checks including ESLint linting, Prettier format checking, and TypeScript type checking, mirroring the Rails CI workflow linting step (`jarek-va/.github/workflows/test.yml` lines 60-75) but adapted for Node.js/TypeScript tooling. The linting steps should use changed file detection to only lint changed files when possible, falling back to linting all files when no changes are detected.

## Reference Implementation

The Rails application (`jarek-va`) has a linting step in its CI workflow that includes:
- Changed file detection (from previous step)
- Run RuboCop linter on changed source files (excluding spec files)
- Filter out test files for linting (only lint source files)
- Fallback to linting all files if no changes detected
- Conditional execution based on changed files detection

## Checklist

### ESLint Linting
- [ ] Add step to run ESLint linter using `npm run lint`
- [ ] Use changed file detection from previous step (if available)
- [ ] For changed files: run ESLint only on changed TypeScript files (filter to `.ts` files)
- [ ] Filter out test files from linting if only source files should be linted (optional, depends on project preference)
- [ ] If no changed files detected: run ESLint on all files (`npm run lint`)
- [ ] Handle case when no source files changed (skip or run on all files)

### Prettier Format Checking
- [ ] Add step to run Prettier format check using `npm run format:check`
- [ ] Use changed file detection from previous step (if available)
- [ ] For changed files: run Prettier check only on changed TypeScript files
- [ ] If no changed files detected: run Prettier check on all files
- [ ] Prettier should check both source and test files (as configured in package.json)

### TypeScript Type Checking
- [ ] Add step to run TypeScript type checking using `npm run type-check` (preferred) or `tsc --noEmit`
- [ ] Type checking should run on all files (not just changed files) as TypeScript needs full project context
- [ ] This step validates that the entire codebase has no type errors

## Implementation Details

### NPM Scripts Available
- `npm run lint` - Run ESLint on src and tests directories (defined in package.json)
- `npm run lint:fix` - Run ESLint with auto-fix (not used in CI)
- `npm run format:check` - Check Prettier formatting on src and tests directories
- `npm run format` - Format files with Prettier (not used in CI)
- `npm run type-check` - Run TypeScript type checking (tsc --noEmit)

### Changed File Detection
- The changed file detection step should be added in a previous task (PHASE1-051 or PHASE1-052)
- Changed files output should be available as `steps.changed-files.outputs.changed_files`
- Changed files detection should filter for `.ts` files
- For pull requests: compare against `github.event.pull_request.base.sha`
- For pushes: compare against `HEAD~1`

### ESLint Configuration
- ESLint is configured in `.eslintrc.json`
- ESLint lints both `src/` and `tests/` directories (as per package.json script)
- ESLint uses TypeScript parser and type-aware rules

### Prettier Configuration
- Prettier checks formatting on `src/**/*.ts` and `tests/**/*.ts` (as per package.json script)
- Prettier is integrated with ESLint via `eslint-config-prettier` and `eslint-plugin-prettier`

### TypeScript Type Checking
- Type checking uses `tsc --noEmit` which compiles without emitting files
- Type checking validates the entire project (needs full project context)
- TypeScript configuration is in `tsconfig.json`
- Type checking should always run on all files, not just changed files

### Expected Workflow Structure
The linting steps should appear in this order (after setup and changed file detection):
1. Run ESLint linter (on changed files or all files)
2. Run Prettier format check (on changed files or all files)
3. Run TypeScript type checking (on all files)

### Step Naming
- Use descriptive step names like:
  - "Run ESLint linter"
  - "Check Prettier formatting"
  - "Run TypeScript type check"

## Notes

- This task is part of Phase 1: Basic Node.js API Infrastructure
- Section: 11. CI/CD Pipeline Configuration
- Task can be completed independently by a single agent
- This task adds linting steps to the workflow file created in PHASE1-051 and configured in PHASE1-052
- The workflow should mirror the Rails CI workflow structure but use Node.js/TypeScript tooling
- ESLint and Prettier are already configured in the project (see `.eslintrc.json` and `package.json`)
- Type checking should run on all files as TypeScript requires full project context for accurate type checking

## Related Tasks

- Previous: PHASE1-052
- Next: PHASE1-054


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
