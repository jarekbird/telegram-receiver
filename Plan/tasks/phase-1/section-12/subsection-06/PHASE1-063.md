# PHASE1-063: Update main README

**Section**: 12. API Structure Documentation
**Subsection**: 12.6
**Task ID**: PHASE1-063

## Description

Create or update the main `README.md` file in the telegram-receiver project root. The README should provide comprehensive documentation for developers working on the project, including project overview, setup instructions, development guidelines, API information, and testing procedures.

**Reference**: Use `Plan/app-description.md` for project description details and `package.json` for project metadata, dependencies, and available scripts.

## Checklist

- [ ] Create `README.md` in project root (if it doesn't exist)
- [ ] Add project title and brief description
  - Reference `Plan/app-description.md` for detailed project overview
  - Mention that this is a Node.js/TypeScript conversion of the jarek-va Rails application
  - Describe core functionality: Telegram webhook handling, Cursor Runner integration, message processing
- [ ] Add project structure section
  - Document the `src/` directory structure (controllers, services, routes, models, middleware, utils, types, config)
  - Mention `tests/` directory for test files
  - Reference `Plan/` directory for conversion planning documents
- [ ] Add requirements/prerequisites section
  - Node.js version (check `package.json` engines field, currently >=18.0.0)
  - npm version (check `package.json` engines field, currently >=9.0.0)
  - Redis (required for BullMQ job queues and callback state management)
  - Environment variables needed (see Environment Variables section)
- [ ] Add installation instructions
  - `npm install` command
  - Note about Node.js and npm version requirements
- [ ] Add environment variables section
  - List all required environment variables (from `Plan/app-description.md`):
    - `TELEGRAM_BOT_TOKEN` - Telegram bot token from BotFather
    - `TELEGRAM_WEBHOOK_SECRET` - Secret token for webhook authentication
    - `TELEGRAM_WEBHOOK_BASE_URL` - Base URL for webhook registration
    - `CURSOR_RUNNER_URL` - URL of the Cursor Runner service
    - `CURSOR_RUNNER_TIMEOUT` - Request timeout in seconds (default: 300)
    - `REDIS_URL` - Redis connection URL
    - `ELEVENLABS_API_KEY` - API key for ElevenLabs services (optional)
    - `WEBHOOK_SECRET` - Admin secret for management endpoints
  - Mention `.env` file setup (create from `.env.example` if it exists)
- [ ] Add development setup instructions
  - Redis setup (local installation or Docker)
  - Running the development server (`npm run dev`)
  - Building the project (`npm run build`)
  - Running the production server (`npm start`)
- [ ] Add available scripts section
  - Document all npm scripts from `package.json`:
    - Build scripts (`build`, `build:watch`)
    - Development (`dev`)
    - Testing (`test`, `test:watch`, `test:coverage`, `test:unit`, `test:integration`, `test:e2e`, `test:all`)
    - Code quality (`lint`, `lint:fix`, `format`, `format:check`, `type-check`)
  - Explain what each script does
- [ ] Add testing instructions
  - Unit tests: `npm run test:unit`
  - Integration tests: `npm run test:integration`
  - E2E tests: `npm run test:e2e`
  - Coverage: `npm run test:coverage`
  - All tests: `npm run test:all`
- [ ] Add API endpoints section
  - Public endpoints:
    - `POST /telegram/webhook` - Receives Telegram updates (authenticated via secret token)
  - Admin endpoints (require `X-Admin-Secret` header):
    - `POST /telegram/set_webhook` - Set webhook URL
    - `GET /telegram/webhook_info` - Get webhook information
    - `DELETE /telegram/webhook` - Delete webhook
  - Callback endpoints:
    - `POST /cursor-runner/callback` - Receives callbacks from Cursor Runner
  - Health check endpoint (if implemented):
    - `GET /health` - Health check endpoint
- [ ] Add code quality section
  - Linting: `npm run lint` and `npm run lint:fix`
  - Formatting: `npm run format` and `npm run format:check`
  - Type checking: `npm run type-check`
- [ ] Add deployment section
  - Mention `deploy.sh` script for automated deployment
  - Note that deploy script runs tests, linting, commits, and pushes
- [ ] Add Docker instructions (if Dockerfile exists)
  - Docker build command
  - Docker run command
  - Docker Compose setup (if docker-compose.yml exists)
  - Note: Skip this section if Docker configuration doesn't exist yet
- [ ] Add CI/CD status badge (if CI/CD is configured)
  - Add badge for CI/CD status if GitHub Actions or similar is set up
  - Note: Skip this section if CI/CD is not configured yet
- [ ] Add project status section
  - Mention this is Phase 1 of the conversion project
  - Reference `Plan/CONVERSION_STEPS.md` for conversion progress
- [ ] Add related documentation links
  - Link to `Plan/app-description.md` for detailed application description
  - Link to `Plan/CONVERSION_STEPS.md` for conversion plan
  - Link to API documentation if it exists
- [ ] Add license section (check `package.json` for license, currently MIT)
- [ ] Add contributing guidelines (if applicable)
- [ ] Ensure README follows markdown best practices and is well-formatted

## Notes

- This task is part of Phase 1: Basic Node.js API Infrastructure
- Section: 12. API Structure Documentation
- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE1-062
- Next: None (This is the last task in Phase 1)


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
