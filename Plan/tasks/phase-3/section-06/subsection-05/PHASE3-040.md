# PHASE3-040: Review CORS and security headers

**Section**: 6. Security Review
**Subsection**: 6.5
**Task ID**: PHASE3-040

## Description

Review and improve CORS configuration and security headers in the codebase to ensure best practices. This task focuses on ensuring proper CORS policies are configured and essential security headers are set to protect the application from common web vulnerabilities.

## Rails Implementation Reference

The Rails application has minimal security header configuration:

1. **CORS Configuration** (`config/initializers/cors.rb`):
   - CORS is commented out (not configured)
   - Example configuration shows allowing specific origins with `Rack::Cors`
   - Default would allow all origins if uncommented (not secure)

2. **HTTPS Enforcement** (`config/environments/production.rb`):
   - `config.force_ssl = true` is commented out (not enforced)
   - This would enable HSTS (HTTP Strict Transport Security) if enabled

3. **Security Headers**:
   - No explicit security headers configured in Rails
   - Rails provides some default headers but not comprehensive security headers

## Checklist

### CORS Configuration Review

- [ ] Review current CORS implementation
  - [ ] Check if CORS middleware is installed (`cors` package)
  - [ ] Review CORS configuration in application setup
  - [ ] Verify CORS is configured with appropriate options (not allowing all origins)
  - [ ] Check if CORS is needed for this API (Telegram webhook receiver typically doesn't need CORS)
  - [ ] If CORS is not needed, verify it's disabled or not configured
  - [ ] If CORS is needed, verify it's restricted to specific origins
  - [ ] Check allowed methods (should be minimal: GET, POST, OPTIONS if needed)
  - [ ] Check allowed headers (should be minimal)
  - [ ] Verify credentials handling (if applicable)
  - [ ] Review CORS error handling

- [ ] CORS Best Practices
  - [ ] Verify CORS doesn't allow `*` origin in production
  - [ ] Check that CORS configuration is environment-specific (stricter in production)
  - [ ] Verify preflight OPTIONS requests are handled correctly
  - [ ] Check CORS headers are not exposed unnecessarily
  - [ ] Review CORS configuration for potential security issues

### Security Headers Review

- [ ] Review security headers middleware
  - [ ] Check if `helmet` package is installed (recommended Express security middleware)
  - [ ] Review current security headers configuration
  - [ ] Verify security headers are applied to all routes
  - [ ] Check middleware ordering (security headers should be early in middleware chain)

- [ ] Essential Security Headers
  - [ ] **X-Content-Type-Options**: Set to `nosniff` to prevent MIME type sniffing
  - [ ] **X-Frame-Options**: Set to `DENY` or `SAMEORIGIN` to prevent clickjacking
  - [ ] **X-XSS-Protection**: Set to `1; mode=block` (legacy but still useful)
  - [ ] **Strict-Transport-Security (HSTS)**: Configure for HTTPS enforcement
    - [ ] Set `max-age` (e.g., 31536000 for 1 year)
    - [ ] Include `includeSubDomains` if applicable
    - [ ] Include `preload` if applicable
  - [ ] **Content-Security-Policy (CSP)**: Configure if serving HTML (may not be needed for API-only)
  - [ ] **Referrer-Policy**: Set appropriate policy (e.g., `strict-origin-when-cross-origin`)
  - [ ] **Permissions-Policy**: Configure to restrict browser features (if applicable)

- [ ] HTTPS Enforcement
  - [ ] Review HTTPS enforcement mechanism
  - [ ] Check if application enforces HTTPS in production
  - [ ] Verify HSTS header is set correctly
  - [ ] Check for HTTP to HTTPS redirects (if applicable)
  - [ ] Review trust proxy configuration (needed behind reverse proxy)
  - [ ] Verify secure cookie settings (if cookies are used)

- [ ] Header Configuration Review
  - [ ] Check that security headers are set consistently across all routes
  - [ ] Verify headers are not overridden incorrectly
  - [ ] Review custom headers for security implications
  - [ ] Check for unnecessary headers that expose information
  - [ ] Verify server header is not exposing version information

### Security Header Implementation

- [ ] Review helmet.js usage (if implemented)
  - [ ] Check helmet configuration
  - [ ] Review which helmet features are enabled
  - [ ] Verify helmet is configured appropriately for API-only application
  - [ ] Check for any helmet features that should be disabled for API

- [ ] Review custom security headers (if any)
  - [ ] Check for custom security header middleware
  - [ ] Verify custom headers follow security best practices
  - [ ] Review header values for correctness

### Environment-Specific Configuration

- [ ] Review security configuration per environment
  - [ ] Check development environment configuration (may be more permissive)
  - [ ] Check production environment configuration (should be strict)
  - [ ] Verify test environment configuration (should not expose sensitive info)
  - [ ] Review environment variable usage for security settings

### Security Issues Identification

- [ ] Identify potential security vulnerabilities
  - [ ] Check for missing security headers
  - [ ] Check for overly permissive CORS configuration
  - [ ] Check for missing HTTPS enforcement
  - [ ] Check for information disclosure through headers
  - [ ] Review for common security misconfigurations

### Documentation

- [ ] Document security headers configuration
  - [ ] Document which security headers are configured
  - [ ] Document CORS configuration and rationale
  - [ ] Document HTTPS enforcement approach
  - [ ] Create or update security documentation
  - [ ] Document any security header decisions and trade-offs

### Implementation Recommendations

- [ ] Recommend security improvements
  - [ ] Recommend installing `helmet` if not already installed
  - [ ] Recommend specific security header configurations
  - [ ] Recommend CORS configuration improvements (if needed)
  - [ ] Recommend HTTPS enforcement improvements
  - [ ] Provide specific code examples for improvements

## Notes

- This task is part of Phase 3: Holistic Review and Best Practices
- Section: 6. Security Review
- Focus on identifying issues and improvements
- Document findings and decisions

- **Important**: For an API-only application (like telegram-receiver), CORS may not be needed if the API is only accessed server-to-server. However, if the API needs to be accessed from web browsers, proper CORS configuration is essential.

- **Security Headers**: The `helmet` package is the standard Express middleware for setting security headers. It provides sensible defaults but should be configured appropriately for the application's needs.

- **HTTPS Enforcement**: In production, HTTPS should be enforced. This can be done through:
  - Reverse proxy (nginx, Apache) configuration
  - Application-level redirects
  - HSTS header configuration

- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE3-039
- Next: PHASE3-041

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
