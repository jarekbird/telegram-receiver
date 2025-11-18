# PHASE1-052: Configure CI job - Setup

**Section**: 11. CI/CD Pipeline Configuration
**Subsection**: 11.3
**Task ID**: PHASE1-052

## Description

Configure the setup steps for the CI test job in the GitHub Actions workflow. This task focuses on the initial job configuration and environment setup steps, mirroring the Rails CI workflow setup (`jarek-va/.github/workflows/test.yml`) but adapted for Node.js/TypeScript. The setup includes defining the job, checking out code with full git history, setting up the Node.js environment, configuring caching, and installing dependencies.

## Reference Implementation

The Rails application (`jarek-va`) has a CI workflow setup that includes:
- Job definition: `test` job running on `ubuntu-latest`
- Checkout code with `fetch-depth: 0` for full git history (needed for changed file detection)
- Set up Ruby environment (version 3.1.2) with bundler cache
- Install dependencies using `bundle install`

## Checklist

- [ ] Define `test` job in the workflow file
- [ ] Set `runs-on` to `ubuntu-latest`
- [ ] Add step to checkout code using `actions/checkout@v4` with `fetch-depth: 0` (for full git history needed by changed file detection)
- [ ] Add step to setup Node.js using `actions/setup-node@v4` with version 18 (matching package.json engines requirement: >=18.0.0)
- [ ] Configure Node.js cache for npm dependencies using `actions/setup-node@v4` cache option (speeds up CI runs)
- [ ] Add step to install dependencies using `npm ci` (preferred over `npm install` for CI as it provides deterministic, reproducible builds)

## Implementation Details

### Node.js Setup
- Use `actions/setup-node@v4` (or latest version)
- Specify Node.js version: `18` or `18.x` (matches package.json engines requirement: >=18.0.0)
- Enable caching by setting `cache: 'npm'` in the setup-node action's `with` block (caches node_modules based on package-lock.json)
- Example YAML structure:
  ```yaml
  - name: Set up Node.js
    uses: actions/setup-node@v4
    with:
      node-version: '18'
      cache: 'npm'
  ```

### Checkout Configuration
- Use `actions/checkout@v4` (or latest version)
- Set `fetch-depth: 0` to fetch full git history (required for changed file detection in subsequent steps, as mentioned in PHASE1-051)

### Dependency Installation
- Use `npm ci` instead of `npm install` for CI environments
- `npm ci` provides deterministic installs by reading from package-lock.json
- `npm ci` is faster and fails if package-lock.json is out of sync with package.json
- This matches the Rails workflow's use of `bundle install` which also provides deterministic installs

### Expected Workflow Structure
The setup steps should appear in this order:
1. Checkout code (with fetch-depth: 0)
2. Set up Node.js (with version and cache configuration)
3. Install dependencies (npm ci)

## Notes

- This task is part of Phase 1: Basic Node.js API Infrastructure
- Section: 11. CI/CD Pipeline Configuration
- Task can be completed independently by a single agent
- This task adds setup steps to the workflow file created in PHASE1-051
- The workflow should mirror the Rails CI workflow structure but use Node.js tooling

## Related Tasks

- Previous: PHASE1-051
- Next: PHASE1-053


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
