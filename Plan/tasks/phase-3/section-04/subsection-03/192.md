# PHASE3-024: Review module boundaries

**Section**: 4. Code Organization
**Subsection**: 4.3
**Task ID**: PHASE3-024

## Description

Review and improve module boundaries in the codebase to ensure best practices. This task focuses on validating that the layered architecture boundaries are properly maintained, dependencies flow in the correct direction, and modules are properly encapsulated according to the architecture defined in `docs/architecture.md`.

## Architecture Context

The application follows a layered architecture with the following layers (from top to bottom):
1. **Routes Layer** (`src/routes/`) - HTTP endpoints and middleware
2. **Controllers Layer** (`src/controllers/`) - Request/response handling
3. **Services Layer** (`src/services/`) - Business logic and integrations
4. **Models Layer** (`src/models/`) - Data structures and persistence
5. **Middleware Layer** (`src/middleware/`) - Cross-cutting concerns
6. **Jobs Layer** (`src/jobs/`) - Background job processing (BullMQ)
7. **Utils Layer** (`src/utils/`) - Pure utility functions
8. **Types Layer** (`src/types/`) - TypeScript type definitions

## Checklist

### Layer Boundary Validation

- [ ] Verify Routes layer only depends on Controllers and Middleware (no direct service access)
- [ ] Verify Controllers layer only depends on Services and Models (no direct database/external API access)
- [ ] Verify Services layer is framework-agnostic (no Express dependencies)
- [ ] Verify Services layer doesn't depend on Controllers or Routes
- [ ] Verify Models layer doesn't contain business logic (only data structures)
- [ ] Verify Middleware layer is reusable and doesn't depend on business logic
- [ ] Verify Utils layer is stateless and has no dependencies on other layers
- [ ] Verify Types layer has no runtime dependencies (type-only imports)

### Dependency Direction Validation

- [ ] Verify dependencies flow downward only (Routes → Controllers → Services → Models)
- [ ] Check for upward dependencies (Services depending on Controllers, etc.)
- [ ] Verify no circular dependencies between modules
- [ ] Check that external dependencies (axios, redis, etc.) are only used in Services layer
- [ ] Verify Express types are only used in Routes, Controllers, and Middleware layers

### Module Encapsulation

- [ ] Review module exports - verify only public APIs are exported
- [ ] Check for proper encapsulation - internal implementation details are not exported
- [ ] Verify each module has a clear, single responsibility
- [ ] Check that modules don't expose implementation details unnecessarily
- [ ] Review barrel exports (`index.ts` files) - ensure they only export public APIs

### Cross-Layer Boundary Violations

- [ ] Check for Routes directly calling Services (should go through Controllers)
- [ ] Check for Controllers directly accessing Redis/database (should use Services)
- [ ] Check for Services accessing Express request/response objects (should be passed as data)
- [ ] Check for Models containing business logic (should be in Services)
- [ ] Check for Utils depending on Services or Controllers (should be pure functions)
- [ ] Check for Types importing runtime code (should be type-only)

### Dependency Injection Boundaries

- [ ] Verify Services use constructor injection for dependencies
- [ ] Verify Controllers use constructor injection for Services
- [ ] Check that dependencies are explicit (not hidden via module-level imports)
- [ ] Verify testability through dependency injection (can mock dependencies)

### Module Coupling Analysis

- [ ] Identify tightly coupled modules (high number of imports between modules)
- [ ] Review coupling between Services (should be minimal)
- [ ] Check for shared state between modules (should use dependency injection)
- [ ] Verify modules can be tested independently

### External Dependencies Boundaries

- [ ] Verify external API clients (Telegram, Cursor Runner) are encapsulated in Services
- [ ] Check that Redis access is only in Services layer (not Controllers or Routes)
- [ ] Verify BullMQ job definitions are in appropriate layer (Jobs/Workers)
- [ ] Check that HTTP clients (axios) are only used in Services layer

### Documentation and Boundaries

- [ ] Document layer boundaries in `docs/architecture.md` if not already documented
- [ ] Document allowed dependencies between layers
- [ ] Document boundary violations found and how they were resolved
- [ ] Create a dependency graph or diagram showing module boundaries
- [ ] Document any exceptions to layer boundaries and their rationale

### Tools and Analysis

- [ ] Use TypeScript compiler to detect circular dependencies
- [ ] Use dependency analysis tools (e.g., `madge`, `dependency-cruiser`) if available
- [ ] Review import statements across all modules
- [ ] Check for unused exports (modules exporting more than necessary)

## Expected Layer Dependencies

Based on the architecture, the following dependencies are allowed:

**Routes Layer** can depend on:
- Controllers
- Middleware
- Types
- Utils (for request parsing, etc.)

**Controllers Layer** can depend on:
- Services
- Models
- Types
- Utils (for response formatting, etc.)
- Middleware (for error handling)

**Services Layer** can depend on:
- Models
- Types
- Utils
- External libraries (axios, redis, bullmq, etc.)

**Models Layer** can depend on:
- Types
- Utils (for validation, etc.)

**Middleware Layer** can depend on:
- Types
- Utils

**Jobs Layer** can depend on:
- Services
- Models
- Types
- Utils
- External libraries (bullmq, redis, etc.)

**Utils Layer** can depend on:
- Types (only)
- Standard library only

**Types Layer** can depend on:
- Nothing (type-only definitions)

## Common Boundary Violations to Watch For

1. **Routes calling Services directly** - Should use Controllers
2. **Controllers accessing Redis/database** - Should use Services
3. **Services importing Express types** - Should be framework-agnostic
4. **Models containing business logic** - Should be in Services
5. **Circular dependencies** - Services depending on Controllers that depend on Services
6. **Utils depending on Services** - Utils should be pure functions
7. **Types importing runtime code** - Types should be type-only
8. **Jobs accessing Controllers or Routes** - Jobs should only depend on Services
9. **Services depending on Jobs** - Services should not depend on job definitions (jobs depend on services)

## Evaluation Findings

### Current Codebase State

Based on review of the existing codebase:

**Source Files (`src/` directory):**
- ⚠️ No source files exist yet - directory structure is empty
- ✅ Directory structure matches architecture: `routes/`, `controllers/`, `services/`, `models/`, `middleware/`, `jobs/`, `utils/`, `types/`
- 📝 Module boundaries cannot be validated until source files are added

**Test Files (`tests/` directory):**
- ✅ Test utilities (`testUtils.ts`) are stateless and have no dependencies on other layers
- ✅ Test mocks (`telegramApi.ts`, `cursorRunnerApi.ts`, `redis.ts`) are properly isolated
- ✅ Test fixtures (`telegramMessages.ts`, `apiResponses.ts`) contain only data structures
- ✅ Test helpers (`apiHelpers.ts`) use proper imports (supertest, Express types)
- 📝 Test files follow proper boundaries - no violations detected

**Architecture Documentation:**
- ✅ `docs/architecture.md` clearly documents layered architecture
- ✅ Layer responsibilities are well-defined
- ✅ Dependency injection pattern is documented
- ✅ Expected dependencies between layers are documented

### Task Validation

**Task Description:**
- ✅ Accurately describes the scope of reviewing module boundaries
- ✅ Correctly references `docs/architecture.md`
- ✅ Notes that codebase is in early stages

**Checklist Completeness:**
- ✅ Comprehensive checklist covering all layer boundary aspects
- ✅ Includes dependency direction validation
- ✅ Includes module encapsulation checks
- ✅ Includes cross-layer boundary violation checks
- ✅ Includes dependency injection boundaries
- ✅ Includes external dependencies boundaries
- ✅ Includes documentation requirements
- ✅ Includes tools and analysis recommendations

**Architecture Alignment:**
- ✅ Task aligns with architecture documentation
- ✅ Expected layer dependencies match `docs/architecture.md`
- ⚠️ Jobs Layer was missing from Architecture Context section (now added)
- ✅ Common boundary violations are appropriate

### Issues Identified

1. **Missing Jobs Layer in Architecture Context**: The Architecture Context section didn't include the Jobs Layer, but it's mentioned in the External Dependencies Boundaries section and exists in `docs/architecture.md`. **Fixed**: Added Jobs Layer to Architecture Context.

2. **Missing Jobs Layer in Expected Dependencies**: The Expected Layer Dependencies section didn't specify what Jobs Layer can depend on. **Fixed**: Added Jobs Layer dependencies section.

3. **No Current Violations**: Since no source files exist, no boundary violations can be detected yet. The task should focus on establishing guidelines and validation tools.

### Recommendations

1. **Establish Validation Tools**: Since the codebase is empty, focus on:
   - Creating scripts to detect boundary violations (e.g., using `madge` or `dependency-cruiser`)
   - Setting up ESLint rules to prevent common violations
   - Creating TypeScript path mappings to enforce layer boundaries

2. **Document Guidelines**: Add to `docs/architecture.md`:
   - Specific examples of allowed vs. disallowed imports
   - How to structure barrel exports (`index.ts` files)
   - Guidelines for dependency injection patterns

3. **Create Validation Script**: Consider creating a script in `/cursor/scripts` to:
   - Analyze import statements across all modules
   - Detect circular dependencies
   - Validate layer boundaries
   - Report violations

4. **ESLint Configuration**: Add ESLint rules to enforce:
   - No imports from higher layers to lower layers
   - Type-only imports where appropriate
   - Proper use of `import type` for type-only imports

### Current Boundaries Status

**Validated**: ✅ 2025-01-17

**Validation Summary**:
- Task description accurately reflects the scope of work
- Checklist is comprehensive and covers all module boundary aspects
- Architecture context now includes all layers (Jobs Layer added)
- Expected dependencies section now includes Jobs Layer
- Common boundary violations are appropriate
- No source files exist yet - boundaries will need validation as code is added
- Test files follow proper boundaries - no violations detected
- Architecture documentation is clear and comprehensive
- Task is ready for execution, with focus on establishing guidelines and validation tools

**Files Verified**:
- `docs/architecture.md` - Architecture is well-documented ✅
- `src/` directory structure - Matches architecture ✅
- `tests/` directory - Test files follow proper boundaries ✅
- No source files exist yet - Cannot validate source boundaries ⚠️

## Notes

- This task is part of Phase 3: Holistic Review and Best Practices
- Section: 4. Code Organization
- Focus on identifying issues and improvements
- Document findings and decisions
- Reference `docs/architecture.md` for the defined architecture
- Current codebase is in early stages - validate boundaries as code is added
- Fix boundary violations immediately when found
- Document any exceptions to layer boundaries with clear rationale

- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE3-023
- Next: PHASE3-025

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
