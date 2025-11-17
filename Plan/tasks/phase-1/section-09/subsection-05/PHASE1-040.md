# PHASE1-040: Test Docker build

**Section**: 9. Docker Configuration
**Subsection**: 9.5
**Task ID**: PHASE1-040

## Description

Test the Docker build process for the telegram-receiver Node.js/TypeScript application. This task verifies that the Dockerfile created in PHASE1-036 builds successfully, produces a working container image, and that the containerized application starts correctly and responds to health checks. This ensures the Docker configuration is correct before proceeding with docker-compose testing in PHASE1-041.

## Prerequisites

- PHASE1-036 (Create Dockerfile) must be completed
- Dockerfile must exist in the project root
- `.dockerignore` file should exist (from PHASE1-037)

## Checklist

- [ ] Verify Dockerfile exists in project root
- [ ] Verify `.dockerignore` file exists (from PHASE1-037)
- [ ] Run `docker build -t telegram-receiver .` (or `telegram-receiver:latest`)
- [ ] Verify build completes without errors or warnings
- [ ] Verify image was created: `docker images telegram-receiver`
- [ ] Run container: `docker run -d -p 3000:3000 --name telegram-receiver-test telegram-receiver`
- [ ] Wait a few seconds for container to start
- [ ] Check container logs: `docker logs telegram-receiver-test` (verify no errors)
- [ ] Test health endpoint: `curl http://localhost:3000/health` (should return 200 OK)
- [ ] Verify health endpoint response contains expected JSON structure
- [ ] Check container status: `docker ps` (container should be running)
- [ ] Stop container: `docker stop telegram-receiver-test`
- [ ] Remove container: `docker rm telegram-receiver-test`
- [ ] (Optional) Remove test image: `docker rmi telegram-receiver` (if not needed for next task)

## Notes

- This task is part of Phase 1: Basic Node.js API Infrastructure
- Section: 9. Docker Configuration
- Task can be completed independently by a single agent
- **Prerequisites**: This task requires PHASE1-036 (Create Dockerfile) to be completed first
- The Docker image tag should be `telegram-receiver` (not `jarek-va`) to match the project name
- The health endpoint should be accessible at `http://localhost:3000/health` when the container is running
- Use `docker run -d` (detached mode) to run the container in the background
- Use `--name` flag to give the container a specific name for easier management
- Container should expose port 3000 (matching the PORT environment variable)
- After testing, clean up containers and optionally images to avoid cluttering Docker
- If the build fails, check:
  - Dockerfile syntax is correct
  - All required files are present (package.json, tsconfig.json, src/, etc.)
  - `.dockerignore` is not excluding necessary files
  - Node.js version matches the engines requirement in package.json

## Related Tasks

- Previous: PHASE1-039
- Next: PHASE1-041


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
