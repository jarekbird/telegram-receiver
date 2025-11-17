# PHASE2-094: Test all routes

**Section**: 11. Routes Configuration
**Subsection**: 11.6
**Task ID**: PHASE2-094

## Description

Create comprehensive route tests for all API endpoints, converting from Rails route tests to TypeScript/Node.js. This task creates route tests that verify all routes are properly registered and route to the correct controllers/handlers.

Reference:
- `jarek-va/config/routes.rb` - Complete route definitions
- `jarek-va/spec/routes/telegram_routes_spec.rb` - Telegram route tests
- `jarek-va/spec/routes/cursor_runner_routes_spec.rb` - Cursor runner route tests
- `jarek-va/spec/routes/sidekiq_routes_spec.rb` - Sidekiq route tests

## Rails Routes Reference

From `jarek-va/config/routes.rb`, the application defines the following routes:

1. **Health routes**:
   - `GET /health` → `health#show`
   - `GET /` (root) → `health#show`

2. **Agent tools route**:
   - `POST /agent-tools` → `agent_tools#create`

3. **Cursor-runner routes** (scoped under `/cursor-runner`):
   - `POST /cursor-runner/cursor/execute` → `cursor_runner#execute`
   - `POST /cursor-runner/cursor/iterate` → `cursor_runner#iterate`
   - `POST /cursor-runner/callback` → `cursor_runner_callback#create`
   - `POST /cursor-runner/git/clone` → `cursor_runner#clone`
   - `GET /cursor-runner/git/repositories` → `cursor_runner#repositories`
   - `POST /cursor-runner/git/checkout` → `cursor_runner#checkout`
   - `POST /cursor-runner/git/push` → `cursor_runner#push`
   - `POST /cursor-runner/git/pull` → `cursor_runner#pull`

4. **Telegram routes** (scoped under `/telegram`):
   - `POST /telegram/webhook` → `telegram#webhook`
   - `POST /telegram/set_webhook` → `telegram#set_webhook`
   - `GET /telegram/webhook_info` → `telegram#webhook_info`
   - `DELETE /telegram/webhook` → `telegram#delete_webhook`

5. **Sidekiq route**:
   - `/sidekiq` → Sidekiq::Web (mounted Rack app)

## Checklist

### Health Routes Tests
- [ ] Create `tests/unit/routes/health.routes.test.ts`
- [ ] Test `GET /health` routes to health controller
- [ ] Test `GET /` (root) routes to health controller

### Agent Tools Routes Tests
- [ ] Create `tests/unit/routes/agent-tools.routes.test.ts`
- [ ] Test `POST /agent-tools` routes to agent tools controller

### Cursor Runner Routes Tests
- [ ] Create `tests/unit/routes/cursor-runner.routes.test.ts`
- [ ] Test `POST /cursor-runner/cursor/execute` routes to cursor runner controller
- [ ] Test `POST /cursor-runner/cursor/iterate` routes to cursor runner controller
- [ ] Test `POST /cursor-runner/callback` routes to cursor runner callback controller
- [ ] Test `POST /cursor-runner/git/clone` routes to cursor runner controller
- [ ] Test `GET /cursor-runner/git/repositories` routes to cursor runner controller
- [ ] Test `POST /cursor-runner/git/checkout` routes to cursor runner controller
- [ ] Test `POST /cursor-runner/git/push` routes to cursor runner controller
- [ ] Test `POST /cursor-runner/git/pull` routes to cursor runner controller

### Telegram Routes Tests
- [ ] Create `tests/unit/routes/telegram.routes.test.ts`
- [ ] Test `POST /telegram/webhook` routes to telegram controller
- [ ] Test `POST /telegram/set_webhook` routes to telegram controller
- [ ] Test `GET /telegram/webhook_info` routes to telegram controller
- [ ] Test `DELETE /telegram/webhook` routes to telegram controller

### Sidekiq Routes Tests
- [ ] Create `tests/unit/routes/sidekiq.routes.test.ts`
- [ ] Test that `/sidekiq` route is mounted (if applicable in Express/Node.js context)

### Route Test Structure
- [ ] Use Jest/Supertest for route testing
- [ ] Test that routes exist and route to correct handlers
- [ ] Verify route path matching (exact paths, path prefixes)
- [ ] Verify HTTP method matching (GET, POST, DELETE, etc.)
- [ ] Test route parameter extraction (if applicable)

## Implementation Notes

### Route Testing Pattern

Route tests should verify that routes are properly registered and route to the correct handlers. In Express.js, this can be done using Supertest:

```typescript
import request from 'supertest';
import app from '../../src/app';

describe('Health Routes', () => {
  describe('GET /health', () => {
    it('routes to health controller', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      // Verify it routes to health controller by checking response
    });
  });

  describe('GET /', () => {
    it('routes to health controller', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
    });
  });
});
```

### Reference Rails Route Tests

The Rails route tests (`jarek-va/spec/routes/*_routes_spec.rb`) use RSpec routing tests that verify routes map to controllers:

```ruby
expect(post: '/telegram/webhook').to route_to('telegram#webhook')
```

In Express/TypeScript, we verify routes by making actual HTTP requests and verifying they reach the correct handlers.

### Route Test Organization

- Create separate test files for each route group (health, agent-tools, cursor-runner, telegram, sidekiq)
- Place tests in `tests/unit/routes/` directory
- Follow naming convention: `{route-group}.routes.test.ts`

### Missing Routes in Rails Tests

Note: The Rails route test suite (`jarek-va/spec/routes/`) is incomplete:

1. **Health routes**: No route test file exists. Health routes are only tested via controller tests (`health_controller_spec.rb`). This task should create route tests for `GET /health` and `GET /` (root).

2. **Agent tools routes**: No route test file exists. Agent tools routes are only tested via controller tests. This task should create route tests for `POST /agent-tools`.

3. **Cursor runner git routes**: The Rails `cursor_runner_routes_spec.rb` only tests callback, iterate, and execute routes. It does NOT test the git routes (clone, repositories, checkout, push, pull). This task should include tests for ALL routes defined in `routes.rb`, including the git routes.

This task should create comprehensive route tests for ALL routes defined in `routes.rb`, including those that don't have Rails route tests.

## Notes

- This task is part of Phase 2: File-by-File Conversion
- Section: 11. Routes Configuration
- Route tests verify routing configuration, not controller functionality (controller tests are separate)
- Reference the Rails route test files for test structure and coverage
- Ensure all routes from `routes.rb` are tested, including git routes that may not have Rails route tests

- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE2-093
- Next: PHASE2-095

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
