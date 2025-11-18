# PHASE1-056: Test CI workflow locally (optional)

**Section**: 11. CI/CD Pipeline Configuration
**Subsection**: 11.7
**Task ID**: PHASE1-056

## Description

Test the CI workflow locally using the `act` tool to verify that the GitHub Actions workflow (`.github/workflows/ci.yml`) works correctly before pushing changes. This optional task allows developers to catch workflow issues early and iterate faster without waiting for GitHub Actions to run. The `act` tool runs GitHub Actions workflows locally using Docker, simulating the GitHub Actions environment.

**Prerequisites**: This task requires:
- The CI workflow file (`.github/workflows/ci.yml`) must exist (created in PHASE1-051)
- Docker must be installed and running (required by `act`)
- Node.js environment must be available locally

**Reference Implementation**: While the Rails application (`jarek-va`) doesn't have specific documentation for local workflow testing, this task adds a valuable development workflow improvement for faster iteration.

## Checklist

### Prerequisites
- [ ] Verify that `.github/workflows/ci.yml` exists (created in PHASE1-051)
- [ ] Verify Docker is installed and running (`docker --version` and `docker ps`)
- [ ] Verify Node.js is installed locally (`node --version`)

### Install act Tool
- [ ] Install `act` tool for local GitHub Actions testing
  - **macOS**: `brew install act` or download from GitHub releases
  - **Linux**: Download from GitHub releases or use package manager
  - **Windows**: Download from GitHub releases or use WSL
- [ ] Verify installation: `act --version`

### Test Workflow Locally
- [ ] List available workflows: `act -l` (should show the CI workflow)
- [ ] Run workflow with `push` event simulation: `act push`
- [ ] Run workflow with `pull_request` event simulation: `act pull_request`
- [ ] Run workflow with `workflow_dispatch` (manual trigger): `act workflow_dispatch`
- [ ] Verify all workflow steps execute successfully:
  - Checkout code
  - Set up Node.js
  - Install dependencies (`npm ci`)
  - Detect changed files
  - Run linting (ESLint)
  - Run formatting check (Prettier)
  - Run type checking (TypeScript)
  - Build project (`npm run build`)
  - Run tests (Jest)

### Verify Workflow Output
- [ ] Verify workflow completes without errors
- [ ] Verify all steps show expected output
- [ ] Verify build artifacts are created (`dist/` directory)
- [ ] Verify tests run and pass
- [ ] Verify linting and type checking pass

### Fix Issues (if any)
- [ ] Document any issues encountered
- [ ] Fix workflow file issues (update `.github/workflows/ci.yml` if needed)
- [ ] Fix environment/Docker issues (if any)
- [ ] Re-run workflow to verify fixes
- [ ] Update workflow file if changes are needed

## Implementation Details

### Workflow File Location
- **CI Workflow**: `.github/workflows/ci.yml` (created in PHASE1-051)
- The workflow should be named "CI" or "Run Automated Tests"

### act Tool Usage

#### Basic Commands
- List workflows: `act -l`
- Run push event: `act push`
- Run pull request event: `act pull_request`
- Run specific workflow: `act -W .github/workflows/ci.yml push`
- Run specific job: `act -j test push`
- Dry run (list steps): `act -n push`

#### Common Options
- `-v` or `--verbose`: Verbose output
- `-W` or `--workflows`: Specify workflow file path
- `-j` or `--job`: Run specific job
- `-e` or `--eventpath`: Path to event JSON file
- `--secret`: Pass secrets (e.g., `--secret GITHUB_TOKEN=your-token`)
- `--env`: Pass environment variables

#### Event Simulation
- **Push event**: `act push` (simulates push to main branch)
- **Pull request**: `act pull_request` (simulates PR event)
- **Manual trigger**: `act workflow_dispatch`

### Expected Workflow Steps
When running `act push`, the workflow should execute these steps in order:
1. Checkout code
2. Set up Node.js (version >=18.0.0)
3. Install dependencies (`npm ci`)
4. Detect changed files
5. Run ESLint linter
6. Run Prettier format check
7. Run TypeScript type checking
8. Build TypeScript project (`npm run build`)
9. Verify build artifacts (`dist/` directory is created with compiled JavaScript files)
10. Run Jest tests

### Common Issues and Solutions

#### Docker Not Running
- **Issue**: `act` fails with Docker connection error
- **Solution**: Start Docker daemon (`sudo systemctl start docker` on Linux, or start Docker Desktop)

#### Missing Secrets
- **Issue**: Workflow fails due to missing secrets
- **Solution**: Use `--secret` flag: `act push --secret GITHUB_TOKEN=your-token`

#### Large Docker Images
- **Issue**: First run is slow due to downloading Docker images
- **Solution**: This is normal; subsequent runs will be faster

#### Workflow File Not Found
- **Issue**: `act -l` shows no workflows
- **Solution**: Verify `.github/workflows/ci.yml` exists and is valid YAML

#### Node.js Version Mismatch
- **Issue**: Workflow uses different Node.js version than local
- **Solution**: `act` uses Docker images, so version should match workflow configuration

### Verification Checklist
After running `act push`, verify:
- [ ] All steps execute without errors
- [ ] Dependencies install successfully (`npm ci` completes)
- [ ] Linting passes (ESLint)
- [ ] Formatting check passes (Prettier)
- [ ] Type checking passes (TypeScript)
- [ ] Build succeeds (`dist/` directory created)
- [ ] Tests run and pass (Jest)
- [ ] Workflow completes with success status

## Notes

- This task is part of Phase 1: Basic Node.js API Infrastructure
- Section: 11. CI/CD Pipeline Configuration
- Task can be completed independently by a single agent
- This is an **optional** task but highly recommended for faster development iteration
- Testing locally with `act` helps catch workflow issues before pushing to GitHub
- `act` requires Docker to run, as it uses Docker containers to simulate GitHub Actions runners
- The workflow file (`.github/workflows/ci.yml`) must exist before this task can be completed (created in PHASE1-051)
- This task validates that the CI workflow works correctly locally before relying on GitHub Actions
- If workflow issues are found, update `.github/workflows/ci.yml` and re-test

## Related Tasks

- Previous: PHASE1-055
- Next: PHASE1-057


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
