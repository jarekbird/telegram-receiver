# PHASE1-039: Create docker-compose.prod.yml for production

**Section**: 9. Docker Configuration
**Subsection**: 9.4
**Task ID**: PHASE1-039

## Description

Create a production docker-compose.prod.yml file for the telegram-receiver Node.js/TypeScript application. The docker-compose.prod.yml should configure all services needed for production deployment, including the application service, Redis service (for BullMQ job queue), Traefik reverse proxy for SSL termination, worker service for background jobs, shared volumes, and production-specific settings. Reference the jarek-va docker-compose.yml (`/cursor/repositories/jarek-va/docker-compose.yml`) for patterns, but adapt for Node.js/TypeScript production needs.

## Checklist

- [ ] Create `docker-compose.prod.yml` file in project root
- [ ] Define `traefik` service (reverse proxy for SSL termination):
  - [ ] Use `traefik:v2.11` image (matching jarek-va)
  - [ ] Set container name to `telegram-receiver-traefik` (or similar)
  - [ ] Configure SSL/TLS with Let's Encrypt ACME challenge
  - [ ] Set up HTTP to HTTPS redirect
  - [ ] Configure entrypoints (web:80, websecure:443)
  - [ ] Mount Docker socket for service discovery
  - [ ] Mount letsencrypt volume for certificate storage
  - [ ] Set restart policy to `unless-stopped`
  - [ ] Add to `virtual-assistant-network` network
  - [ ] Expose ports 80, 443, and 8080 (dashboard)
- [ ] Define `redis` service:
  - [ ] Use `redis:7-alpine` image (matching jarek-va)
  - [ ] Set container name to `telegram-receiver-redis` (or similar)
  - [ ] Configure Redis persistence with `--appendonly yes`
  - [ ] Add volume for Redis data persistence (`shared_redis_data:/data`)
  - [ ] Set restart policy to `unless-stopped`
  - [ ] Add healthcheck using `redis-cli ping`
  - [ ] Add to `virtual-assistant-network` network
- [ ] Define `app` service:
  - [ ] Set build context to current directory (`.`)
  - [ ] Set dockerfile path to `Dockerfile`
  - [ ] Set container name to `telegram-receiver-app` (or similar)
  - [ ] **Do NOT expose ports directly** - Traefik will route traffic
  - [ ] Set `NODE_ENV` environment variable to `production`
  - [ ] Set `PORT` environment variable to `3000`
  - [ ] Set `REDIS_URL` to `redis://redis:6379` (using Redis service name)
  - [ ] Set `CURSOR_RUNNER_URL` to `http://cursor-runner:3001`
  - [ ] Set `CURSOR_RUNNER_TIMEOUT` to `${CURSOR_RUNNER_TIMEOUT:-300}`
  - [ ] Set other production environment variables (TELEGRAM_BOT_TOKEN, LOG_LEVEL=info, etc.)
  - [ ] Add volume mount for shared SQLite database (`shared_sqlite_db:/app/shared_db`)
  - [ ] Add volume mount for logs (`./log:/app/log`) if needed
  - [ ] Set restart policy to `unless-stopped`
  - [ ] Add depends_on for `redis` and `traefik` services
  - [ ] Add to `virtual-assistant-network` network
  - [ ] Add Traefik labels for routing:
    - [ ] `traefik.enable=true`
    - [ ] Router rule: `Host(\`${DOMAIN_NAME:-localhost}\`) && !PathPrefix(\`/agents\`)`
    - [ ] Entrypoint: `websecure` (HTTPS)
    - [ ] TLS cert resolver: `letsencrypt`
    - [ ] Service port: `3000`
    - [ ] Security headers middleware (SSL redirect, HSTS, etc.)
  - [ ] Add healthcheck: `curl -f http://localhost:3000/health`
- [ ] Define `worker` service (BullMQ worker for background jobs):
  - [ ] Set build context to current directory (`.`)
  - [ ] Set dockerfile path to `Dockerfile`
  - [ ] Set container name to `telegram-receiver-worker` (or similar)
  - [ ] Set command to run BullMQ worker (e.g., `npm run worker` or `node dist/worker.js`)
  - [ ] Set `NODE_ENV` environment variable to `production`
  - [ ] Set `REDIS_URL` to `redis://redis:6379`
  - [ ] Set `CURSOR_RUNNER_URL` to `http://cursor-runner:3001`
  - [ ] Set other production environment variables matching `app` service
  - [ ] Add volume mount for shared SQLite database (`shared_sqlite_db:/app/shared_db`)
  - [ ] Add volume mount for logs (`./log:/app/log`) if needed
  - [ ] Set restart policy to `unless-stopped`
  - [ ] Add depends_on for `redis` and `app` services
  - [ ] Add to `virtual-assistant-network` network
- [ ] Define volumes:
  - [ ] `shared_redis_data` volume (driver: local, name: shared_redis_data)
  - [ ] `shared_sqlite_db` volume (driver: local, name: shared_sqlite_db)
- [ ] Define networks:
  - [ ] Reference `virtual-assistant-network` as external network (matching jarek-va)
  - [ ] Network name: `virtual-assistant-network`
- [ ] Add production-specific configurations:
  - [ ] Ensure no source code volume mounts (production uses built image)
  - [ ] Configure logging to stdout for Docker logging
  - [ ] Set appropriate healthcheck intervals and timeouts
  - [ ] Ensure security headers are configured via Traefik middleware

## Notes

- This task is part of Phase 1: Basic Node.js API Infrastructure
- Section: 9. Docker Configuration
- Task can be completed independently by a single agent
- Reference the jarek-va docker-compose.yml (`/cursor/repositories/jarek-va/docker-compose.yml`) for patterns:
  - Traefik reverse proxy configuration
  - Redis service configuration
  - Shared volume setup (Redis data, SQLite database)
  - Network configuration
  - Healthcheck patterns
  - Traefik labels for routing and SSL
  - Security headers middleware
- The production docker-compose.prod.yml should:
  - Use Traefik for SSL termination and routing (no direct port exposure)
  - Include Redis for BullMQ job queue
  - Include worker service for background job processing
  - Use shared volumes for Redis data and SQLite database
  - Connect to `virtual-assistant-network` for service communication
  - Configure production environment variables (NODE_ENV=production, LOG_LEVEL=info)
  - Include healthchecks for all services
  - Set restart policies to `unless-stopped` for production reliability
- Environment variables should match those defined in `.env.example`:
  - `NODE_ENV=production`
  - `PORT=3000`
  - `REDIS_URL=redis://redis:6379`
  - `CURSOR_RUNNER_URL=http://cursor-runner:3001`
  - `CURSOR_RUNNER_TIMEOUT=300`
  - `TELEGRAM_BOT_TOKEN` (from environment)
  - `LOG_LEVEL=info` (for production)
- The app service should NOT expose ports directly - Traefik handles routing
- The worker service runs background jobs using BullMQ (equivalent to Sidekiq in Rails)
- Shared volumes enable cross-service access to Redis data and SQLite database
- Traefik labels configure HTTPS routing, SSL certificates, and security headers

## Related Tasks

- Previous: PHASE1-038
- Next: PHASE1-040


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
