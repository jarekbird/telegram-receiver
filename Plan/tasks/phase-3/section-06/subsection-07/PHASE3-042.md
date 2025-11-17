# PHASE3-042: Fix identified security issues

**Section**: 6. Security Review
**Subsection**: 6.7
**Task ID**: PHASE3-042

## Description

Fix all security vulnerabilities and issues identified in the security audit (PHASE3-041). This task focuses on implementing fixes for security vulnerabilities, updating vulnerable dependencies, addressing authentication issues, improving input validation, fixing credential handling, and ensuring all security best practices are implemented.

## Context

This task follows the comprehensive security audit performed in **PHASE3-041** and addresses the security issues identified in that audit. It also builds upon previous security review tasks:

- **PHASE3-036**: Authentication/authorization review (webhook secrets, admin authentication)
- **PHASE3-037**: Input validation review
- **PHASE3-038**: Redis injection vulnerability review
- **PHASE3-039**: Secure credential handling review
- **PHASE3-040**: CORS and security headers review
- **PHASE3-041**: Security audit (identifies issues to fix)

This task should fix all identified security vulnerabilities and implement security improvements based on the audit findings.

## Checklist

### Dependency Vulnerability Fixes

- [ ] **Update Vulnerable Dependencies**
  - [ ] Review `npm audit` output from PHASE3-041
  - [ ] Update all high and critical severity vulnerabilities
  - [ ] Update production dependencies with known vulnerabilities
  - [ ] Update development dependencies with security issues
  - [ ] Run `npm audit fix` (if safe) or manually update packages
  - [ ] Verify application functionality after dependency updates
  - [ ] Run full test suite to ensure no breaking changes
  - [ ] Document any breaking changes or workarounds needed

- [ ] **Review Updated Dependencies**
  - [ ] Verify `express` is updated to latest secure version
  - [ ] Verify `axios` is updated to latest secure version
  - [ ] Verify `redis` / `ioredis` is updated to latest secure version
  - [ ] Verify `bullmq` is updated to latest secure version
  - [ ] Verify `@elevenlabs/elevenlabs-js` is updated to latest secure version
  - [ ] Verify `dotenv` is updated to latest secure version
  - [ ] Check for any transitive dependency vulnerabilities

### Authentication and Authorization Fixes

- [ ] **Fix Authentication Issues** (reference PHASE3-036)
  - [ ] Fix any authentication bypass vulnerabilities identified
  - [ ] Implement secure secret comparison (prevent timing attacks)
  - [ ] Fix development mode authentication bypasses if unsafe
  - [ ] Remove or secure any hardcoded secrets or credentials
  - [ ] Fix token/session management issues (if applicable)
  - [ ] Ensure all webhook endpoints require proper authentication
  - [ ] Fix admin authentication issues
  - [ ] Fix cursor-runner callback authentication issues
  - [ ] Fix agent tools authentication issues

- [ ] **Verify Authentication Fixes**
  - [ ] Test all authentication mechanisms work correctly
  - [ ] Verify authentication failures are handled securely
  - [ ] Verify authentication errors don't leak sensitive information
  - [ ] Test authentication bypass attempts are properly rejected

### Input Validation Fixes

- [ ] **Fix Input Validation Issues** (reference PHASE3-037)
  - [ ] Add input validation to all API endpoints missing validation
  - [ ] Fix SQL injection vulnerabilities (if using raw SQL queries)
  - [ ] Fix parameter sanitization issues (prevent XSS, command injection)
  - [ ] Fix file upload handling vulnerabilities (if applicable)
  - [ ] Fix path traversal vulnerabilities
  - [ ] Fix JSON parsing DoS vulnerabilities (large payloads)
  - [ ] Add request size limits to prevent DoS attacks
  - [ ] Implement proper type checking and validation

- [ ] **Verify Input Validation Fixes**
  - [ ] Test all endpoints with invalid input
  - [ ] Test injection attack attempts are properly rejected
  - [ ] Verify error messages don't leak sensitive information
  - [ ] Test request size limits work correctly

### Credential Handling Fixes

- [ ] **Fix Credential Handling Issues** (reference PHASE3-039)
  - [ ] Remove any credentials from code, config files, or logs
  - [ ] Fix credential exposure in error messages
  - [ ] Fix credential exposure in API responses
  - [ ] Fix credential exposure in logs
  - [ ] Fix credential exposure in stack traces
  - [ ] Fix credential exposure in debug output
  - [ ] Ensure all credentials are read from environment variables
  - [ ] Implement credential masking in logs (show only first/last few chars)
  - [ ] Fix default secret values (remove 'changeme' defaults)
  - [ ] Ensure required credentials fail fast if missing

- [ ] **Verify Credential Handling Fixes**
  - [ ] Verify no credentials are logged
  - [ ] Verify no credentials are in error messages
  - [ ] Verify no credentials are in API responses
  - [ ] Test credential validation at startup

### Security Headers and CORS Fixes

- [ ] **Fix Security Headers Issues** (reference PHASE3-040)
  - [ ] Install and configure `helmet` middleware if not already installed
  - [ ] Fix missing security headers
  - [ ] Configure X-Content-Type-Options header
  - [ ] Configure X-Frame-Options header
  - [ ] Configure X-XSS-Protection header
  - [ ] Configure Strict-Transport-Security (HSTS) header
  - [ ] Configure Content-Security-Policy (CSP) if applicable
  - [ ] Fix CORS configuration issues
  - [ ] Verify security headers are applied to all routes
  - [ ] Fix middleware ordering (security headers should be early)

- [ ] **Verify Security Headers Fixes**
  - [ ] Test all endpoints return proper security headers
  - [ ] Verify CORS configuration works correctly
  - [ ] Test security headers in different environments

### Redis Injection Vulnerability Fixes

- [ ] **Fix Redis Injection Issues** (reference PHASE3-038)
  - [ ] Fix any Redis key construction vulnerabilities
  - [ ] Sanitize all user input used in Redis keys
  - [ ] Fix request_id handling to prevent injection
  - [ ] Verify all Redis operations use safe key construction
  - [ ] Add validation for Redis key patterns

- [ ] **Verify Redis Injection Fixes**
  - [ ] Test Redis key construction with special characters
  - [ ] Verify injection attempts are properly handled
  - [ ] Test Redis operations with various input types

### Error Handling and Information Disclosure Fixes

- [ ] **Fix Error Handling Issues**
  - [ ] Fix error messages that leak sensitive information
  - [ ] Ensure stack traces are not exposed in production
  - [ ] Fix error responses that reveal internal system details
  - [ ] Remove sensitive information from error logging
  - [ ] Fix error handling that exposes file paths or system information
  - [ ] Implement proper error handling middleware

- [ ] **Verify Error Handling Fixes**
  - [ ] Test error responses don't leak sensitive information
  - [ ] Verify stack traces are hidden in production
  - [ ] Test error logging doesn't expose secrets

### API Security Fixes

- [ ] **Fix API Security Issues**
  - [ ] Implement rate limiting if missing
  - [ ] Fix API endpoint enumeration vulnerabilities
  - [ ] Fix request size limits
  - [ ] Verify HTTPS enforcement in production
  - [ ] Fix missing security headers on API endpoints
  - [ ] Review and fix external API call security

- [ ] **Verify API Security Fixes**
  - [ ] Test rate limiting works correctly
  - [ ] Verify API endpoints are properly secured
  - [ ] Test request size limits

### File System Security Fixes

- [ ] **Fix File System Security Issues**
  - [ ] Fix path traversal vulnerabilities
  - [ ] Fix file permissions and access controls
  - [ ] Fix temporary file cleanup issues
  - [ ] Fix file upload validation (if applicable)
  - [ ] Verify file operations are secure

- [ ] **Verify File System Security Fixes**
  - [ ] Test path traversal attempts are blocked
  - [ ] Verify file permissions are correct
  - [ ] Test file operations with various inputs

### Network Security Fixes

- [ ] **Fix Network Security Issues**
  - [ ] Fix SSRF (Server-Side Request Forgery) vulnerabilities
  - [ ] Fix TLS/SSL certificate validation issues
  - [ ] Fix timeout configurations for external requests
  - [ ] Verify external API calls are secure

- [ ] **Verify Network Security Fixes**
  - [ ] Test SSRF attack attempts are blocked
  - [ ] Verify TLS/SSL validation works correctly
  - [ ] Test external API call security

### Logging and Monitoring Security Fixes

- [ ] **Fix Logging Security Issues**
  - [ ] Remove sensitive data from logs
  - [ ] Fix log file permissions and access controls
  - [ ] Ensure authentication tokens or secrets are not logged
  - [ ] Implement log rotation and retention policies
  - [ ] Fix logging that exposes sensitive information

- [ ] **Verify Logging Security Fixes**
  - [ ] Review logs for sensitive information
  - [ ] Verify log file permissions are secure
  - [ ] Test logging doesn't expose secrets

### Configuration Security Fixes

- [ ] **Fix Configuration Security Issues**
  - [ ] Fix insecure default configurations
  - [ ] Fix environment-specific configuration issues
  - [ ] Fix Docker configuration security issues
  - [ ] Fix exposed ports or services
  - [ ] Verify `.env` files are in `.gitignore`
  - [ ] Fix configuration that exposes sensitive information

- [ ] **Verify Configuration Security Fixes**
  - [ ] Review all configuration files for security issues
  - [ ] Verify Docker configuration is secure
  - [ ] Test configuration in different environments

### Testing and Verification

- [ ] **Comprehensive Security Testing**
  - [ ] Run full test suite to verify fixes don't break functionality
  - [ ] Run security-focused tests
  - [ ] Test all fixed vulnerabilities to ensure they're resolved
  - [ ] Perform manual security testing
  - [ ] Run `npm audit` again to verify vulnerabilities are fixed
  - [ ] Verify all security improvements are working

- [ ] **Code Review**
  - [ ] Review all security fixes
  - [ ] Verify fixes follow security best practices
  - [ ] Ensure fixes don't introduce new vulnerabilities
  - [ ] Review error handling improvements

### Documentation

- [ ] **Document Security Fixes**
  - [ ] Document all security vulnerabilities that were fixed
  - [ ] Document security improvements made
  - [ ] Update security documentation with fixes
  - [ ] Document any security decisions and trade-offs
  - [ ] Create or update `SECURITY.md` file
  - [ ] Document security testing procedures

- [ ] **Update Security Documentation**
  - [ ] Update security configuration documentation
  - [ ] Document security best practices for developers
  - [ ] Update security guidelines
  - [ ] Document dependency update process

## Notes

- This task is part of Phase 3: Holistic Review and Best Practices
- Section: 6. Security Review
- **Prerequisite**: PHASE3-041 (Security Audit) must be completed first to identify issues to fix
- Focus on fixing identified issues and implementing security improvements
- Document all fixes and improvements
- Test thoroughly after each fix to ensure no regressions

- **Security Fix Priority**: Fix critical and high severity vulnerabilities first, then address medium and low severity issues
- **Testing**: After fixing each category of issues, run tests to verify fixes work correctly and don't break functionality
- **Documentation**: All security fixes should be documented for future reference and compliance
- **Verification**: Use `npm audit` and security testing tools to verify vulnerabilities are fixed

- Task can be completed independently by a single agent, but may require coordination if multiple security issues are identified

## Related Tasks

- Previous: PHASE3-041
- Next: PHASE3-043

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
