# PHASE3-020: Review security best practices

**Section**: 3. Node.js Best Practices
**Subsection**: 3.6
**Task ID**: PHASE3-020

## Description

Review and improve security best practices in the telegram-receiver codebase. This task focuses on identifying security vulnerabilities, ensuring proper security measures are in place, and documenting security practices. Review all source code, configuration files, and dependencies for security issues.

## Checklist

### Environment Variables and Secrets
- [ ] Verify all secrets are stored in environment variables (no hardcoded values)
- [ ] Check that `.env` files are in `.gitignore` and not committed
- [ ] Review `.env.example` file to ensure no actual secrets are present
- [ ] Verify environment variables are loaded securely (using `dotenv` properly)
- [ ] Check that sensitive environment variables are not logged or exposed in error messages
- [ ] Verify environment variable validation and defaults are secure

### Hardcoded Secrets
- [ ] Search codebase for hardcoded API keys, tokens, passwords, or secrets
- [ ] Check for hardcoded credentials in source files, config files, and test files
- [ ] Verify no secrets in comments or documentation
- [ ] Check that test fixtures use mock/placeholder values, not real secrets

### Dependency Security
- [ ] Run `npm audit` to identify known vulnerabilities in dependencies
- [ ] Review `package.json` for outdated or unmaintained packages
- [ ] Check for dependencies with known security issues
- [ ] Verify all dependencies are from trusted sources
- [ ] Review dependency versions for security patches
- [ ] Document any security-related dependency choices

### Security Headers
- [ ] Review Express middleware for security headers (helmet.js or custom headers)
- [ ] Verify HTTP security headers are set (X-Content-Type-Options, X-Frame-Options, etc.)
- [ ] Check CORS configuration is properly restricted
- [ ] Verify HTTPS enforcement in production
- [ ] Review response headers for information leakage

### Input Validation and Sanitization
- [ ] Review all API endpoints for input validation
- [ ] Check that user input is sanitized before processing
- [ ] Verify request body validation (using validation libraries or manual checks)
- [ ] Check for SQL injection risks (if database queries exist)
- [ ] Review file upload handling (if applicable) for security
- [ ] Verify Telegram webhook payload validation
- [ ] Check for XSS vulnerabilities in responses

### Authentication and Authorization
- [ ] Review webhook authentication middleware (`X-Telegram-Bot-Api-Secret-Token`)
- [ ] Review admin authentication middleware (`X-Admin-Secret`)
- [ ] Review callback authentication middleware (`X-Webhook-Secret`, `X-Cursor-Runner-Secret`)
- [ ] Verify authentication secrets are properly validated
- [ ] Check that failed authentication attempts are logged appropriately
- [ ] Verify development mode authentication behavior is secure

### Error Handling and Information Disclosure
- [ ] Review error messages to ensure no sensitive information is exposed
- [ ] Check that stack traces are not exposed in production
- [ ] Verify error logging doesn't include secrets or sensitive data
- [ ] Review error response format for information leakage

### Network Security
- [ ] Review external API calls for proper timeout configuration
- [ ] Verify HTTPS is used for all external API calls
- [ ] Check for proper certificate validation
- [ ] Review rate limiting implementation (if applicable)

### Code Security Practices
- [ ] Review for unsafe eval() or Function() usage
- [ ] Check for unsafe file system operations
- [ ] Verify proper handling of user-controlled data
- [ ] Review Redis connection security
- [ ] Check for proper session management (if applicable)

### Documentation
- [ ] Document security measures implemented
- [ ] Create or update security guidelines
- [ ] Document any security-related configuration requirements
- [ ] Document known security limitations or trade-offs

## Notes

- This task is part of Phase 3: Holistic Review and Best Practices
- Section: 3. Node.js Best Practices
- Focus on identifying issues and improvements
- Document findings and decisions

- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE3-019
- Next: PHASE3-021

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
