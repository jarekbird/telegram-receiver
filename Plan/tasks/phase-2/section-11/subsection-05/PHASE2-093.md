# PHASE2-093: Register all routes in main app

**Section**: 11. Routes Configuration
**Subsection**: 11.5
**Task ID**: PHASE2-093

## Description

Register all routes in the main Express.js application, converting from Rails routes configuration. This task updates `src/index.ts` to import and mount all route modules that were created in previous tasks (PHASE2-089 through PHASE2-092).

Reference `jarek-va/config/routes.rb` for the complete route structure. The Rails application defines the following route groups that must all be registered:

1. **Health routes**: `GET /health` and `GET /` (root) - from `src/routes/health.routes.ts`
2. **Agent tools route**: `POST /agent-tools` - from `src/routes/agent-tools.routes.ts`
3. **Cursor-runner routes**: Multiple endpoints under `/cursor-runner` scope - from `src/routes/cursor-runner.routes.ts`
   - `POST /cursor-runner/cursor/execute`
   - `POST /cursor-runner/cursor/iterate`
   - `POST /cursor-runner/callback`
   - `POST /cursor-runner/git/clone`
   - `GET /cursor-runner/git/repositories`
   - `POST /cursor-runner/git/checkout`
   - `POST /cursor-runner/git/push`
   - `POST /cursor-runner/git/pull`
4. **Telegram routes**: Multiple endpoints under `/telegram` scope - from `src/routes/telegram.routes.ts`
   - `POST /telegram/webhook`
   - `POST /telegram/set_webhook`
   - `GET /telegram/webhook_info`
   - `DELETE /telegram/webhook`

## Rails Implementation Reference

From `jarek-va/config/routes.rb`:
```ruby
Rails.application.routes.draw do
  # Health check endpoint
  get 'health', to: 'health#show'
  root 'health#show'

  # Agent tools webhook endpoint
  post 'agent-tools', to: 'agent_tools#create'

  # cursor-runner API endpoints
  scope path: 'cursor-runner', as: 'cursor_runner' do
    # Cursor execution endpoints
    post 'cursor/execute', to: 'cursor_runner#execute'
    post 'cursor/iterate', to: 'cursor_runner#iterate'

    # Webhook callback endpoint (receives callbacks from cursor-runner)
    post 'callback', to: 'cursor_runner_callback#create'

    # Git operation endpoints
    post 'git/clone', to: 'cursor_runner#clone'
    get 'git/repositories', to: 'cursor_runner#repositories'
    post 'git/checkout', to: 'cursor_runner#checkout'
    post 'git/push', to: 'cursor_runner#push'
    post 'git/pull', to: 'cursor_runner#pull'
  end

  # Telegram webhook endpoints
  scope path: 'telegram', as: 'telegram' do
    post 'webhook', to: 'telegram#webhook'
    post 'set_webhook', to: 'telegram#set_webhook'
    get 'webhook_info', to: 'telegram#webhook_info'
    delete 'webhook', to: 'telegram#delete_webhook'
  end
end
```

## Checklist

- [ ] Update `src/index.ts` (main application entry point)
- [ ] Import Express and create Express app instance
- [ ] Import all route modules:
  - [ ] Import health routes from `./routes/health.routes`
  - [ ] Import agent-tools routes from `./routes/agent-tools.routes`
  - [ ] Import cursor-runner routes from `./routes/cursor-runner.routes`
  - [ ] Import telegram routes from `./routes/telegram.routes`
- [ ] Register/mount all routes with correct path prefixes:
  - [ ] Mount health routes at root (`/`) - handles both `/health` and `/`
  - [ ] Mount agent-tools routes at `/agent-tools`
  - [ ] Mount cursor-runner routes at `/cursor-runner`
  - [ ] Mount telegram routes at `/telegram`
- [ ] Apply global middleware (if any):
  - [ ] JSON body parser middleware
  - [ ] Error handling middleware
  - [ ] Request logging middleware (if needed)
- [ ] Start Express server on configured port
- [ ] Handle server startup errors appropriately
- [ ] Export Express app instance for testing purposes

## Implementation Notes

### Express App Setup Pattern
The `src/index.ts` file should follow this pattern:

```typescript
import express, { Express } from 'express';
import healthRoutes from './routes/health.routes';
import agentToolsRoutes from './routes/agent-tools.routes';
import cursorRunnerRoutes from './routes/cursor-runner.routes';
import telegramRoutes from './routes/telegram.routes';

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Global middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount routes
app.use('/', healthRoutes);
app.use('/agent-tools', agentToolsRoutes);
app.use('/cursor-runner', cursorRunnerRoutes);
app.use('/telegram', telegramRoutes);

// Error handling middleware (if needed)
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
```

### Route Mounting Order
Routes should be mounted in this order:
1. Health routes first (at root `/`) - for health checks
2. Agent tools routes (at `/agent-tools`)
3. Cursor-runner routes (at `/cursor-runner`)
4. Telegram routes (at `/telegram`)

### Environment Configuration
- Port should be configurable via `process.env.PORT` (defaults to 3000)
- Other environment variables may be needed for route handlers (handled in controllers)

### Route File Naming
- Health routes: `health.routes.ts` (note: dot notation, not hyphen)
- Agent tools routes: `agent-tools.routes.ts` (hyphen notation)
- Cursor-runner routes: `cursor-runner.routes.ts` (hyphen notation)
- Telegram routes: `telegram.routes.ts` (dot notation)

## Notes

- This task is part of Phase 2: File-by-File Conversion
- Section: 11. Routes Configuration
- Subsection: 11.5
- This task assumes route files have been created in previous tasks (PHASE2-089 through PHASE2-092)
- Route files should already exist:
  - `src/routes/health.routes.ts` (created in PHASE2-090)
  - `src/routes/agent-tools.routes.ts` (should exist from PHASE2-089 structure)
  - `src/routes/cursor-runner.routes.ts` (should exist from PHASE2-089 structure, callback route added in PHASE2-092)
  - `src/routes/telegram.routes.ts` (created in PHASE2-091)
- Reference the Rails implementation (`jarek-va/config/routes.rb`) for exact route structure
- The main application entry point (`src/index.ts`) is currently empty and needs to be fully implemented
- Global middleware (JSON parser, error handling) should be applied before route mounting
- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE2-092
- Next: PHASE2-094

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
