# PHASE4-025: Consolidate duplicate code

**Section**: 3. Refactoring
**Subsection**: 3.8
**Task ID**: PHASE4-025

## Description

Consolidate duplicate code identified during Phase 4 code duplication detection (PHASE4-005) to improve code quality and maintainability. This task focuses on systematically extracting duplicate code blocks, patterns, and structures into reusable functions, utilities, and shared components, following a prioritized approach to minimize risk and ensure no breaking changes.

This task builds on the code duplication detection work completed in PHASE4-005 and addresses the consolidation of duplicate code as part of the Phase 4 code quality audit refactoring efforts.

## Scope

This task covers:
- Reviewing code duplication findings from PHASE4-005
- Extracting exact duplicate code blocks into shared functions
- Consolidating similar code patterns into reusable utilities
- Creating shared components for common functionality
- Refactoring duplicate error handling patterns
- Consolidating duplicate validation logic
- Extracting duplicate data transformation patterns
- Creating shared constants and configuration
- Updating all duplicate locations to use consolidated code
- Verifying no breaking changes after consolidation
- Documenting all consolidations and their impact

**Note**: This task focuses on consolidating duplicate code identified in PHASE4-005. For comprehensive code duplication detection, refer to PHASE4-005 (Detect code duplication).

## Context from PHASE4-005

PHASE4-005 identified duplicate code in:
- Exact duplicate code blocks (100% similarity)
- Near-duplicate code blocks (80-99% similarity)
- Similar code patterns across different files
- Duplicate error handling logic
- Duplicate validation logic
- Duplicate data transformation patterns
- Duplicate configuration patterns

This task addresses the consolidation of these findings following a safe, prioritized approach.

## Checklist

### Review PHASE4-005 Findings
- [ ] Review code duplication report from PHASE4-005
- [ ] Review jscpd report (if jscpd was used in PHASE4-005)
- [ ] Review SonarQube duplication findings (if SonarQube was used)
- [ ] Review duplication report JSON/HTML output
- [ ] Identify all duplicate code blocks:
  - Exact duplicates (100% similarity)
  - Near-duplicates (80-99% similarity)
- [ ] Categorize duplicates by type:
  - Duplicate functions/methods
  - Duplicate error handling patterns
  - Duplicate validation logic
  - Duplicate data transformation patterns
  - Duplicate configuration/constants
  - Duplicate API request/response handling
- [ ] Prioritize duplicates for consolidation:
  - Critical: Large exact duplicates (>100 lines, 100% similarity)
  - High: Medium exact duplicates (50-100 lines, 100% similarity)
  - Medium: Large near-duplicates (>100 lines, 80-99% similarity)
  - Low: Small duplicates (<50 lines)
- [ ] Identify false positives that should not be consolidated:
  - Intentionally similar but distinct implementations
  - Performance-critical code that benefits from duplication
  - Code with different contexts that shouldn't be shared

### Extract Duplicate Functions/Methods
- [ ] Identify duplicate function/method implementations
- [ ] Analyze differences between duplicate functions
- [ ] Design shared function signature that accommodates all use cases
- [ ] Extract common logic into shared function
- [ ] Parameterize differences using function parameters
- [ ] Create shared function in appropriate utility module
- [ ] Update all duplicate locations to use shared function
- [ ] Verify function handles all original use cases
- [ ] Run tests to ensure functionality is preserved
- [ ] Verify no breaking changes

### Consolidate Error Handling Patterns
- [ ] Identify duplicate error handling patterns
- [ ] Create shared error handling utilities:
  - Error wrapper functions
  - Error formatting functions
  - Error logging utilities
  - Error response formatters
- [ ] Extract common error handling logic
- [ ] Create error handling middleware (if applicable)
- [ ] Update all duplicate error handling locations
- [ ] Verify error handling behavior is preserved
- [ ] Run tests to ensure error handling works correctly
- [ ] Verify no breaking changes

### Consolidate Validation Logic
- [ ] Identify duplicate validation patterns
- [ ] Create shared validation utilities:
  - Validation functions
  - Validation schemas (if using validation libraries)
  - Validation error formatters
- [ ] Extract common validation logic
- [ ] Create reusable validation functions
- [ ] Update all duplicate validation locations
- [ ] Verify validation behavior is preserved
- [ ] Run tests to ensure validation works correctly
- [ ] Verify no breaking changes

### Consolidate Data Transformation Patterns
- [ ] Identify duplicate data transformation patterns
- [ ] Create shared transformation utilities:
  - Data mapping functions
  - Data formatting functions
  - Data normalization functions
- [ ] Extract common transformation logic
- [ ] Create reusable transformation functions
- [ ] Update all duplicate transformation locations
- [ ] Verify transformation behavior is preserved
- [ ] Run tests to ensure transformations work correctly
- [ ] Verify no breaking changes

### Create Shared Constants and Configuration
- [ ] Identify duplicate constants and configuration values
- [ ] Create shared constants file/module
- [ ] Create shared configuration utilities
- [ ] Extract common configuration patterns
- [ ] Update all duplicate constant/configuration locations
- [ ] Verify configuration behavior is preserved
- [ ] Run tests to ensure configuration works correctly
- [ ] Verify no breaking changes

### Consolidate API Request/Response Handling
- [ ] Identify duplicate API request/response handling patterns
- [ ] Create shared API utilities:
  - Request builders
  - Response formatters
  - Error response handlers
  - Request/response interceptors
- [ ] Extract common API handling logic
- [ ] Create reusable API utilities
- [ ] Update all duplicate API handling locations
- [ ] Verify API behavior is preserved
- [ ] Run tests to ensure API handling works correctly
- [ ] Verify no breaking changes

### Create Shared Utilities Module Structure
- [ ] Organize shared utilities into logical modules:
  - `src/utils/errors.ts` - Error handling utilities
  - `src/utils/validation.ts` - Validation utilities
  - `src/utils/transform.ts` - Data transformation utilities
  - `src/utils/api.ts` - API handling utilities
  - `src/utils/constants.ts` - Shared constants
  - `src/utils/helpers.ts` - General helper functions
- [ ] Ensure utilities are properly exported
- [ ] Add JSDoc comments to shared utilities
- [ ] Document usage examples for shared utilities
- [ ] Verify utilities follow project conventions

### Update All Duplicate Locations
- [ ] Replace exact duplicates with shared function calls
- [ ] Replace near-duplicates with parameterized shared functions
- [ ] Update imports to use shared utilities
- [ ] Remove duplicate code blocks
- [ ] Verify all duplicate locations are updated
- [ ] Run tests to ensure functionality is preserved
- [ ] Verify no breaking changes

### Verification and Testing
- [ ] Run TypeScript compiler: `npm run type-check`
- [ ] Run ESLint: `npm run lint`
- [ ] Run all unit tests: `npm run test:unit`
- [ ] Run all integration tests: `npm run test:integration`
- [ ] Run all tests: `npm run test`
- [ ] Run end-to-end tests: `npm run test:e2e` (if applicable)
- [ ] Verify application builds successfully: `npm run build`
- [ ] Verify application starts successfully: `npm start` (test run)
- [ ] Check for any runtime errors or warnings
- [ ] Verify no breaking changes in functionality
- [ ] Run duplication detection again to verify reduction:
  - Compare duplication percentage before/after
  - Verify duplicate blocks are reduced
  - Document improvement metrics

### Documentation
- [ ] Document all consolidated code:
  - List consolidated duplicate functions
  - List created shared utilities
  - List updated file locations
  - Document consolidation approach for each duplicate
- [ ] Document consolidation rationale for significant consolidations
- [ ] Document any breaking changes (if any)
- [ ] Update code quality metrics:
  - Duplication percentage before/after
  - Number of duplicate blocks removed
  - Number of shared utilities created
  - Total lines of code consolidated
  - Files affected by consolidation
- [ ] Update CHANGELOG or similar documentation (if applicable)
- [ ] Add JSDoc comments to all shared utilities
- [ ] Document usage examples for shared utilities

## Notes

- This task is part of Phase 4: Code Quality Audit
- Section: 3. Refactoring
- Focus on consolidating duplicate code identified in PHASE4-005 to improve code quality
- This task builds on PHASE4-005 code duplication detection findings
- Follow a prioritized approach: start with critical duplicates, then high, then medium, then low
- Always verify no breaking changes after each consolidation
- Some "duplicate" code may be intentionally kept separate (e.g., performance-critical code, different contexts)
- Be careful with false positives - verify that code can be safely consolidated before refactoring
- Consider the impact of consolidating code (may affect performance, readability, or maintainability)
- Document all consolidations for traceability
- Verify improvements through testing and re-running duplication detection
- When consolidating near-duplicates, ensure the shared function handles all variations correctly
- Use appropriate abstraction levels - don't over-abstract simple code
- Consider creating utility modules that group related functionality together

- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE4-024
- Next: PHASE4-026
- Depends on: PHASE4-005 (Detect code duplication)

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
