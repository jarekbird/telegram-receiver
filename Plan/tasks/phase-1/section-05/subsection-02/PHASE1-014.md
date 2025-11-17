# PHASE1-014: Create health check route

**Section**: 5. Health Check Endpoint
**Subsection**: 5.2
**Task ID**: PHASE1-014

## Description

Create Express route file for health check endpoint that maps GET `/health` to the health controller function. This route file will be registered in the main app in a subsequent task.

**Rails Reference**: `jarek-va/config/routes.rb` (lines 4-5, 8)

## Checklist

- [ ] Create `src/routes/health.routes.ts` file
- [ ] Import Express Router from `express`
- [ ] Import `getHealth` function from `src/controllers/health.controller.ts`
- [ ] Create router instance using `express.Router()`
- [ ] Add GET route: `router.get('/health', getHealth)`
- [ ] Export router as default export

## Validation Report

### Task Review: PHASE1-014

#### Task Information
- **Task ID**: PHASE1-014
- **Task Title**: Create health check route
- **Rails File**: `jarek-va/config/routes.rb` (lines 4-5, 8)

#### Validation Results

##### ✓ Correct
- Task correctly identifies the need for a health check route file
- File path structure (`src/routes/health.routes.ts`) is appropriate for Express.js structure
- Checklist includes essential steps: create file, import router, import controller, create route, export router
- Route path `/health` matches Rails implementation (`get 'health'`)
- Task scope is appropriate - focused on route definition only

##### ⚠️ Issues Found

1. **Missing Controller Function Reference**
   - **Issue**: Task says "Import health controller" but doesn't specify which function to import
   - **Location**: Checklist item 3
   - **Impact**: Developer may not know to import `getHealth` function from `health.controller.ts`
   - **Fix Required**: Specify importing `getHealth` function from `src/controllers/health.controller.ts`

2. **Missing Route Handler Specification**
   - **Issue**: Task says "Add GET route for `/health` that calls controller" but doesn't specify how to call it
   - **Location**: Checklist item 5
   - **Impact**: Unclear whether to use `router.get('/health', getHealth)` or similar pattern
   - **Fix Required**: Specify the route handler pattern: `router.get('/health', getHealth)`

3. **Missing Rails Reference**
   - **Issue**: Task doesn't reference the Rails routes file for comparison
   - **Location**: Missing from description
   - **Impact**: Less context for developers to understand the conversion
   - **Fix Required**: Add Rails reference: `jarek-va/config/routes.rb`

4. **Incomplete Description**
   - **Issue**: Description is very brief ("Create health check route")
   - **Location**: Description section
   - **Impact**: Doesn't provide enough context about what this route does
   - **Fix Required**: Expand description to mention it creates the Express route that maps `/health` to the health controller

5. **Missing Root Route Note**
   - **Issue**: Rails implementation also has `root 'health#show'` which maps `/` to the same controller
   - **Location**: Missing from notes
   - **Impact**: May need clarification that root route is handled separately (in PHASE1-015)
   - **Note**: This is acceptable since PHASE1-015 handles route registration, but should be documented

##### 📝 Recommendations

1. **Update Checklist Item 3**: Change from "Import health controller" to:
   - "Import `getHealth` function from `src/controllers/health.controller.ts`"

2. **Update Checklist Item 5**: Change from "Add GET route for `/health` that calls controller" to:
   - "Add GET route: `router.get('/health', getHealth)`"

3. **Add Rails Reference**: Add to description:
   - **Rails Reference**: `jarek-va/config/routes.rb` (lines 4-5)

4. **Expand Description**: Update to:
   - "Create Express route file for health check endpoint that maps GET `/health` to the health controller function. This route file will be registered in the main app in a subsequent task."

5. **Add Note About Root Route**: Add to notes:
   - "Note: In Rails, the health endpoint also serves as the root route (`GET /`). Root route registration will be handled in PHASE1-015 when registering routes in the main app."

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
- Create route file with GET `/health` route
- Import controller function
- Export router

**Comparison**:
- ✓ Route path `/health` matches Rails `'health'`
- ✓ HTTP method GET matches Rails `get`
- ⚠️ Task doesn't specify controller function name (should be `getHealth` based on PHASE1-013)
- ⚠️ Task doesn't mention root route (handled separately in PHASE1-015)

##### Dependencies
- **Express Router**: Required for route definition
- **Health Controller**: `getHealth` function from `src/controllers/health.controller.ts` (created in PHASE1-013)
- **Task Coverage**: Partially mentioned - needs specific function name

##### Route Structure
- **Rails**: Route defined in `routes.rb` using `get 'health', to: 'health#show'`
- **Express**: Route defined in separate route file using `router.get('/health', getHealth)`
- **Task Coverage**: Structure is correct, but needs explicit handler specification

##### Related Components
- **Controller**: Created in PHASE1-013 (`health.controller.ts` with `getHealth` function)
- **Route Registration**: Handled in PHASE1-015 (registering route in main app)
- **Task Coverage**: Task correctly focuses only on route definition

## Notes

- This task is part of Phase 1: Basic Node.js API Infrastructure
- Section: 5. Health Check Endpoint
- Task can be completed independently by a single agent
- **Rails Reference**: `jarek-va/config/routes.rb` (lines 4-5, 8)
- **Controller Reference**: Uses `getHealth` function from `src/controllers/health.controller.ts` (created in PHASE1-013)
- **Note**: In Rails, the health endpoint also serves as the root route (`GET /`). Root route registration will be handled in PHASE1-015 when registering routes in the main app.

## Related Tasks

- Previous: PHASE1-013 (Create health check controller)
- Next: PHASE1-015 (Register health route in app)


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
