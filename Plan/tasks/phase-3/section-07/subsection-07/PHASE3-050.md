# PHASE3-050: Improve test quality

**Section**: 7. Testing Review
**Subsection**: 7.7
**Task ID**: PHASE3-050

## Description

Review and improve test quality in the codebase to ensure best practices. This includes reviewing and enhancing the test infrastructure (mocks, fixtures, helpers, utilities), establishing test quality standards, and creating guidelines for future test development.

## Current State

- Test infrastructure exists: mocks, fixtures, helpers, and utilities
- Test directory structure is established (unit, integration, e2e)
- No actual test files exist yet (`.test.ts` or `.spec.ts` files)
- Jest configuration is set up
- Test utilities and helpers are in place

## Checklist

### Test Infrastructure Review
- [ ] Review and improve test utilities (`tests/helpers/testUtils.ts`)
  - Ensure all utility functions are well-documented
  - Add type safety improvements where needed
  - Verify error handling in utility functions
  - Add missing utility functions if needed
- [ ] Review and improve API helpers (`tests/helpers/apiHelpers.ts`)
  - Ensure HTTP status codes are complete
  - Verify helper functions are reusable
  - Add missing helper functions for common test scenarios
- [ ] Review and improve mock implementations
  - Review `tests/mocks/telegramApi.ts` - ensure all Telegram API methods are mocked
  - Review `tests/mocks/cursorRunnerApi.ts` - verify cursor-runner API coverage
  - Review `tests/mocks/redis.ts` - ensure Redis operations are properly mocked
  - Add reset/cleanup functions if missing
  - Ensure mocks return realistic data structures
- [ ] Review and improve test fixtures
  - Review `tests/fixtures/telegramMessages.ts` - ensure fixtures cover all message types
  - Review `tests/fixtures/apiResponses.ts` - verify response fixtures are complete
  - Add missing fixture types (error responses, edge cases)
  - Ensure fixtures are well-documented

### Test Quality Standards
- [ ] Review test setup (`tests/setup.ts`)
  - Ensure environment variables are properly configured
  - Verify timeout settings are appropriate
  - Add global test utilities if needed
- [ ] Review Jest configuration (`jest.config.ts`)
  - Verify coverage settings are appropriate
  - Ensure test patterns match project structure
  - Review module name mappings
- [ ] Establish test quality guidelines
  - Document test naming conventions
  - Create guidelines for test structure (AAA pattern)
  - Document mock usage best practices
  - Create guidelines for fixture usage
  - Document test coverage expectations

### Code Quality Improvements
- [ ] Improve code documentation
  - Add JSDoc comments to all test utilities
  - Document mock functions and their usage
  - Add examples in fixture files
- [ ] Improve type safety
  - Add proper TypeScript types to all test utilities
  - Ensure mocks have correct return types
  - Add type guards where needed
- [ ] Refactor for maintainability
  - Remove any duplicate code in test utilities
  - Consolidate similar helper functions
  - Improve code organization

### Documentation
- [ ] Update test README (`tests/README.md`)
  - Ensure all test utilities are documented
  - Add examples of using mocks and fixtures
  - Document test quality standards
- [ ] Document test improvements made
  - Create a summary of improvements
  - Document any new utilities or helpers added
  - Note any breaking changes or deprecations

## Notes

- This task is part of Phase 3: Holistic Review and Best Practices
- Section: 7. Testing Review
- Focus on improving test infrastructure and establishing quality standards
- Since no actual test files exist yet, focus on improving the foundation for future tests
- Document all findings and improvements
- Ensure all improvements follow TypeScript and Jest best practices

- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE3-049
- Next: PHASE4-001

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
