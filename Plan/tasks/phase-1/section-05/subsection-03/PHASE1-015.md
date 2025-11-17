# PHASE1-015: Register health route in app

**Section**: 5. Health Check Endpoint
**Subsection**: 5.3
**Task ID**: PHASE1-015

## Description

Register health route in the main Express application. This task registers the health check route file created in PHASE1-014 into the main Express app, making the `/health` endpoint accessible. In Rails, this corresponds to registering routes in `config/routes.rb`.

**Rails Reference**: `jarek-va/config/routes.rb` (lines 4-5, 8)

## Checklist

- [ ] Open `src/app.ts` (create if it doesn't exist)
- [ ] Import Express and create Express app instance (if app doesn't exist)
- [ ] Import health routes from `src/routes/health.routes.ts`
- [ ] Import `getHealth` function from `src/controllers/health.controller.ts` (for root route)
- [ ] Register health routes with `app.use('/', healthRoutes)` for `/health` endpoint (route file already defines `/health` path)
- [ ] Register root route with `app.get('/', getHealth)` for root `/` endpoint (to match Rails `root 'health#show'`)
- [ ] Export Express app instance
- [ ] Verify route registration (check that both `/health` and `/` routes are registered; manual testing will be done in PHASE1-016)

## Validation Report

### Task Review: PHASE1-015

#### Task Information
- **Task ID**: PHASE1-015
- **Task Title**: Register health route in app
- **Rails File**: `jarek-va/config/routes.rb` (lines 4-5, 8)

#### Validation Results

##### ✓ Correct
- Task correctly identifies the need to register routes in the main app
- File path structure (`src/app.ts`) is appropriate for Express.js applications
- Task scope is appropriate - focused on route registration only
- Task follows logical sequence (after creating route file in PHASE1-014)

##### ⚠️ Issues Found

1. **Missing Rails Reference**
   - **Issue**: Task doesn't reference the Rails routes file for comparison
   - **Location**: Missing from description
   - **Impact**: Less context for developers to understand the conversion
   - **Fix Required**: Add Rails reference: `jarek-va/config/routes.rb` (lines 4-5, 8)

2. **Incomplete Description**
   - **Issue**: Description is very brief ("Register health route in app")
   - **Location**: Description section
   - **Impact**: Doesn't provide enough context about what this task does
   - **Fix Required**: Expand description to mention registering the health route file into the main Express app

3. **Unclear Route Registration Pattern**
   - **Issue**: Task says "Use health routes with app.use() at path `/`" but doesn't specify the exact pattern
   - **Location**: Checklist item 3
   - **Impact**: Ambiguous - should it be `app.use('/', healthRoutes)` or `app.use('/health', healthRoutes)`?
   - **Fix Required**: Clarify that if the route file defines `/health`, then:
     - `app.use('/health', healthRoutes)` would create `/health/health` (incorrect)
     - `app.use('/', healthRoutes)` would create `/health` (correct, since route file already has `/health`)
   - **Alternative**: If route file exports routes without prefix, then `app.use('/health', healthRoutes)` is correct

4. **Missing Root Route Registration**
   - **Issue**: Rails implementation has both `get 'health'` and `root 'health#show'` (lines 5 and 8), but task only mentions registering at `/`
   - **Location**: Missing from checklist
   - **Impact**: Root route (`GET /`) won't be registered, breaking Rails API contract
   - **Fix Required**: Add checklist item to register health routes at both `/health` and `/` (root)

5. **Missing Express App Setup**
   - **Issue**: Task assumes `src/app.ts` exists, but it may not exist yet
   - **Location**: Checklist item 1
   - **Impact**: Developer may not know to create the file if it doesn't exist
   - **Fix Required**: Add note that file should be created if it doesn't exist, and include Express app setup steps

6. **Missing Import Specification**
   - **Issue**: Task says "Import health routes" but doesn't specify the exact import statement
   - **Location**: Checklist item 2
   - **Impact**: Unclear what to import (default export vs named export)
   - **Fix Required**: Specify: `import healthRoutes from './routes/health.routes'` (assuming default export from PHASE1-014)

7. **Missing App Export**
   - **Issue**: Task doesn't mention exporting the Express app instance
   - **Location**: Missing from checklist
   - **Impact**: Other files (like `index.ts`) won't be able to import and use the app
   - **Fix Required**: Add checklist item to export the Express app instance

8. **Missing Verification Details**
   - **Issue**: Task says "Verify route registration" but doesn't specify how
   - **Location**: Checklist item 4
   - **Impact**: Unclear what verification means
   - **Fix Required**: Specify verification method (e.g., check that routes are registered, or note that manual testing is in PHASE1-016)

##### 📝 Recommendations

1. **Add Rails Reference**: Add to description:
   - **Rails Reference**: `jarek-va/config/routes.rb` (lines 4-5, 8)

2. **Expand Description**: Update to:
   - "Register health route in the main Express application. This task registers the health check route file created in PHASE1-014 into the main Express app, making the `/health` endpoint accessible. In Rails, this corresponds to registering routes in `config/routes.rb`."

3. **Clarify Route Registration**: Update checklist items to specify:
   - "Register health routes with `app.use('/', healthRoutes)` for `/health` endpoint (route file already defines `/health` path)"
   - "Register root route with `app.get('/', getHealth)` for root `/` endpoint (to match Rails `root 'health#show'`)"
   - Note: Since route file from PHASE1-014 defines `router.get('/health', getHealth)`, registering with `app.use('/', healthRoutes)` creates `/health`. For root route, directly register `app.get('/', getHealth)`.

4. **Add Express App Setup**: Update checklist item 1 to:
   - "Open `src/app.ts` (create if it doesn't exist)"
   - Add new item: "Import Express and create Express app instance (if app doesn't exist)"

5. **Specify Import Statement**: Update checklist item 2 to:
   - "Import health routes from `src/routes/health.routes.ts`"
   - Add example: `import healthRoutes from './routes/health.routes'`

6. **Add Root Route**: Add checklist item for registering root route:
   - "Register health routes with `app.use('/', healthRoutes)` for root `/` endpoint (to match Rails `root 'health#show'`)"

7. **Add App Export**: Add checklist item:
   - "Export Express app instance"

8. **Clarify Verification**: Update verification item to note that manual testing is handled in PHASE1-016

#### Detailed Comparison

##### Routes in Rails File

**Rails Implementation** (`routes.rb:4-5, 8`):
```ruby
# Health check endpoint
get 'health', to: 'health#show'

# Root endpoint
root 'health#show'
```

**Task Specification**:
- Register health routes in main app
- Use `app.use()` at path `/`

**Comparison**:
- ✓ Task correctly identifies need to register routes
- ⚠️ Task doesn't specify both `/health` and `/` routes (Rails has both)
- ⚠️ Task doesn't clarify Express route registration pattern
- ⚠️ Task doesn't mention Express app setup if file doesn't exist

##### Express Route Registration Pattern

**Expected Express Implementation**:
```typescript
import express from 'express';
import healthRoutes from './routes/health.routes';
import { getHealth } from './controllers/health.controller';

const app = express();

// Register health routes
// Route file has router.get('/health', getHealth), so register at root to get /health
app.use('/', healthRoutes);  // Creates /health endpoint

// Register root route to match Rails root 'health#show'
app.get('/', getHealth);     // Creates / endpoint

export default app;
```

**Task Coverage**: Partially covered - needs clarification on exact pattern

##### Dependencies
- **Express**: Required for app setup and route registration
- **Health Routes**: Route file from `src/routes/health.routes.ts` (created in PHASE1-014)
- **Task Coverage**: Partially mentioned - needs specific import statement

##### Related Components
- **Route File**: Created in PHASE1-014 (`health.routes.ts`)
- **Controller**: Created in PHASE1-013 (`health.controller.ts` with `getHealth` function)
- **App Entry Point**: `src/index.ts` (should import app from `app.ts`)
- **Task Coverage**: Task correctly focuses only on route registration

##### Express App Structure
- **Rails**: Routes defined in `config/routes.rb` using `Rails.application.routes.draw`
- **Express**: Routes registered in main app file using `app.use()`
- **Task Coverage**: Structure is correct, but needs clarification on app setup

## Notes

- This task is part of Phase 1: Basic Node.js API Infrastructure
- Section: 5. Health Check Endpoint
- Task can be completed independently by a single agent
- **Rails Reference**: `jarek-va/config/routes.rb` (lines 4-5, 8)
- **Route File Reference**: Uses health routes from `src/routes/health.routes.ts` (created in PHASE1-014)
- **Express App Setup**: If `src/app.ts` doesn't exist, create it with Express app instance. Export the app for use in `src/index.ts`.
- **Route Registration**: In Rails, both `/health` and `/` (root) routes point to the same controller. In Express:
  - Since the route file from PHASE1-014 defines `router.get('/health', getHealth)`, register it with `app.use('/', healthRoutes)` to create the `/health` endpoint
  - For the root route, directly register `app.get('/', getHealth)` to match Rails `root 'health#show'`
- **Route Pattern**: The route file already includes the `/health` path, so registering the router at root (`app.use('/', healthRoutes)`) creates the `/health` endpoint. The root route is registered separately using the controller function directly.

## Related Tasks

- Previous: PHASE1-014
- Next: PHASE1-016


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
