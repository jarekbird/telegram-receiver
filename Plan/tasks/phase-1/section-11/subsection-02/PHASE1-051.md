# PHASE1-051: Create CI workflow file

**Section**: 11. CI/CD Pipeline Configuration
**Subsection**: 11.2
**Task ID**: PHASE1-051

## Description

Create a comprehensive CI workflow file for the telegram-receiver Node.js/TypeScript application. The workflow should mirror the functionality of the Rails CI workflow (`jarek-va/.github/workflows/test.yml`) but adapted for Node.js/TypeScript tooling. The workflow should run on pushes and pull requests to main branch, performing code quality checks, linting, type checking, and running tests.

## Reference Implementation

The Rails application (`jarek-va`) has a CI workflow at `.github/workflows/test.yml` that includes:
- Checkout code with full git history
- Set up Ruby environment (version 3.1.2)
- Install dependencies (bundle install)
- Detect changed files (Ruby files)
- Run RuboCop linter (on changed files or all files)
- Set up test database
- Run RSpec tests with smart test selection based on changed files

## Checklist

### Workflow Configuration
- [ ] Create `.github/workflows/ci.yml` file
- [ ] Set workflow name to "CI" or "Run Automated Tests"
- [ ] Configure trigger on push to main branch
- [ ] Configure trigger on pull requests to main branch
- [ ] Add workflow_dispatch for manual trigger from GitHub UI

### Job Setup
- [ ] Create a test job that runs on ubuntu-latest
- [ ] Add checkout step with fetch-depth: 0 to get full git history for diff comparison
- [ ] Set up Node.js environment (use actions/setup-node@v4, version >=18.0.0 per package.json engines)
- [ ] Install dependencies using `npm ci` (preferred for CI) or `npm install`

### Changed Files Detection
- [ ] Add step to detect changed TypeScript files (.ts files only - this is a backend API, no .tsx files)
- [ ] For pull requests: compare against base branch (github.event.pull_request.base.sha)
- [ ] For pushes: compare against previous commit (HEAD~1)
- [ ] Use git diff with filter for .ts files: `git diff --name-only --diff-filter=ACMR $BASE_SHA..$HEAD_SHA | grep -E '\.ts$'`
- [ ] Output changed files to GITHUB_OUTPUT for use in subsequent steps
- [ ] Handle case when no files are changed (fallback to all files)

### Code Quality Checks
- [ ] Run ESLint linter on changed TypeScript files (or all files if none changed)
- [ ] Filter out test files (`tests/**/*.ts`) from linting - only lint source files (`src/**/*.ts`) when changed files are detected
- [ ] Run Prettier format check on changed TypeScript files (or all files if none changed)
- [ ] Run TypeScript type checking using `npm run type-check` or `tsc --noEmit`

### Testing
- [ ] Run Jest tests with smart test selection based on changed files (mirror Rails workflow logic)
- [ ] For changed source files (`src/**/*.ts`), find and run related test files:
  - Map `src/services/telegram_service.ts` → `tests/services/telegram_service.test.ts` or `tests/services/telegram_service.spec.ts`
  - Use bash/sed to transform: `src/**/*.ts` → `tests/**/*.test.ts` or `tests/**/*.spec.ts`
  - Check if mapped test file exists before adding to test list
- [ ] For changed test files (`tests/**/*.test.ts` or `tests/**/*.spec.ts`), run those tests directly
- [ ] Collect all test files to run (changed tests + related tests for changed sources)
- [ ] Remove duplicates and empty entries from test file list
- [ ] If no changed files detected or no test files found, run all tests
- [ ] Use `npm run test` or `jest` command with specific test files when available
- [ ] Set appropriate test timeout and environment variables if needed

### Optional Enhancements
- [ ] Add test coverage reporting (if coverage is configured in jest.config.ts)
- [ ] Add step to run E2E tests with Playwright (if applicable)
- [ ] Add caching for node_modules to speed up CI runs
- [ ] Add step to build the TypeScript project to ensure it compiles successfully

## Implementation Details

### File Structure
- Source files: `src/**/*.ts`
- Test files: `tests/**/*.ts` (matches pattern `**/__tests__/**/*.ts` or `**/?(*.)+(spec|test).ts` per jest.config.ts)
- Test files are located in `tests/` directory (not `src/`)

### NPM Scripts Available
- `npm run lint` - Run ESLint on src and tests directories
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run format:check` - Check Prettier formatting
- `npm run format` - Format files with Prettier
- `npm run type-check` - Run TypeScript type checking (tsc --noEmit)
- `npm run test` - Run Jest tests
- `npm run test:coverage` - Run tests with coverage
- `npm run build` - Build TypeScript project (tsc)

### Test File Mapping
- Source file: `src/services/telegram_service.ts`
- Related test file: `tests/services/telegram_service.test.ts` or `tests/services/telegram_service.spec.ts`
- The mapping follows: `src/**/*.ts` → `tests/**/*.test.ts` or `tests/**/*.spec.ts`
- Implementation pattern (similar to Rails workflow):
  - For each changed source file in `src/`, check for corresponding test file in `tests/` with same relative path
  - Transform path: `src/services/telegram_service.ts` → `tests/services/telegram_service.test.ts`
  - Also check for `.spec.ts` variant: `tests/services/telegram_service.spec.ts`
  - Use bash script to map paths and check file existence before adding to test list

### Expected Workflow Structure
The workflow should follow this general structure (mirroring Rails workflow pattern):
1. Checkout code with `fetch-depth: 0` for full git history
2. Set up Node.js (version >=18.0.0)
3. Install dependencies (`npm ci` preferred for CI)
4. Detect changed files (`.ts` files only, compare against base branch for PRs or HEAD~1 for pushes)
5. Run linting (ESLint on source files only, filter out test files)
6. Run formatting check (Prettier on changed files or all files)
7. Run type checking (TypeScript `tsc --noEmit`)
8. Run tests (Jest) with smart selection:
   - Find changed test files
   - Find related test files for changed source files
   - Run collected test files or all tests if none found
9. Optionally: Build project, run E2E tests, generate coverage

### Implementation Notes
- Reference the Rails workflow (`jarek-va/.github/workflows/test.yml`) for the exact bash script patterns
- The changed file detection and test file mapping logic should closely mirror the Rails implementation
- Use `GITHUB_OUTPUT` to pass changed files between steps
- Handle edge cases: no changed files, no test files found, etc.

## Notes

- This task is part of Phase 1: Basic Node.js API Infrastructure
- Section: 11. CI/CD Pipeline Configuration
- Task can be completed independently by a single agent
- The workflow should be similar in structure to `jarek-va/.github/workflows/test.yml` but adapted for Node.js/TypeScript
- Reference the Rails CI workflow for the pattern of changed file detection and smart test selection

## Related Tasks

- Previous: PHASE1-050
- Next: PHASE1-052


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
