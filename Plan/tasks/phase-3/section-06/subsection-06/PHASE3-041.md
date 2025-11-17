# PHASE3-041: Perform security audit

**Section**: 6. Security Review
**Subsection**: 6.6
**Task ID**: PHASE3-041

## Description

Perform a comprehensive security audit of the telegram-receiver codebase to identify vulnerabilities, security misconfigurations, and areas for improvement. This task focuses on using automated security scanning tools, reviewing dependency vulnerabilities, and performing manual code security reviews to ensure the application follows security best practices.

## Context

This security audit builds upon previous security review tasks:
- **PHASE3-036**: Authentication/authorization review (webhook secrets, admin authentication)
- **PHASE3-040**: CORS and security headers review

This audit should identify any remaining security issues and verify that security best practices are followed throughout the codebase.

## Rails Security Implementation Reference

The jarek-va Rails application implements several security mechanisms that should be reviewed in the converted TypeScript/Node.js application:

1. **Webhook Authentication**: Multiple authentication mechanisms using secret tokens
2. **Input Validation**: Parameter filtering and validation
3. **Error Handling**: Careful error messages that don't leak sensitive information
4. **Secret Management**: Environment-based secret configuration with safe defaults
5. **Development Mode Bypasses**: Some authentication allows blank secrets in development

## Checklist

### Automated Security Scanning

- [ ] Run `npm audit` to identify dependency vulnerabilities
  - [ ] Review all high and critical severity vulnerabilities
  - [ ] Check for vulnerabilities in production dependencies
  - [ ] Check for vulnerabilities in development dependencies
  - [ ] Document any vulnerabilities that cannot be immediately fixed
  - [ ] Create plan for addressing identified vulnerabilities

- [ ] Run `npm audit fix` (if safe) or manually update vulnerable packages
  - [ ] Verify application still works after dependency updates
  - [ ] Run tests to ensure no breaking changes
  - [ ] Document any breaking changes or workarounds needed

- [ ] Consider additional security scanning tools (if available)
  - [ ] Snyk (`npm install -g snyk && snyk test`)
  - [ ] OWASP Dependency-Check
  - [ ] GitHub Dependabot (if using GitHub)
  - [ ] Review security advisories from package maintainers

### Dependency Vulnerability Review

- [ ] Review all production dependencies for known vulnerabilities
  - [ ] `express` - Check for security advisories
  - [ ] `axios` - Check for security advisories
  - [ ] `redis` / `ioredis` - Check for security advisories
  - [ ] `bullmq` - Check for security advisories
  - [ ] `@elevenlabs/elevenlabs-js` - Check for security advisories
  - [ ] `dotenv` - Check for security advisories

- [ ] Review all development dependencies for vulnerabilities
  - [ ] Check if dev dependencies expose security risks
  - [ ] Verify dev dependencies are not included in production builds

- [ ] Check for outdated packages
  - [ ] Review `package.json` for packages with major version updates available
  - [ ] Consider updating packages to latest secure versions
  - [ ] Document any packages that should not be updated (with rationale)

### Code Security Pattern Review

- [ ] **Input Validation and Sanitization**
  - [ ] Review all API endpoints for input validation
  - [ ] Check for SQL injection vulnerabilities (if using raw SQL queries)
  - [ ] Verify parameter sanitization (prevent XSS, command injection)
  - [ ] Review file upload handling (if applicable)
  - [ ] Check for path traversal vulnerabilities
  - [ ] Review JSON parsing for DoS vulnerabilities (large payloads)

- [ ] **Authentication and Authorization**
  - [ ] Verify all webhook endpoints require authentication (reference PHASE3-036)
  - [ ] Check for authentication bypass vulnerabilities
  - [ ] Review secret comparison for timing attack vulnerabilities
  - [ ] Verify development mode authentication bypasses are safe
  - [ ] Check for hardcoded secrets or credentials in code
  - [ ] Review token/session management (if applicable)

- [ ] **Error Handling and Information Disclosure**
  - [ ] Review error messages for information leakage
  - [ ] Verify stack traces are not exposed in production
  - [ ] Check that error responses don't reveal internal system details
  - [ ] Review logging for sensitive information (secrets, passwords, tokens)
  - [ ] Verify error handling doesn't expose file paths or system information

- [ ] **Secret and Credential Management**
  - [ ] Review environment variable handling
  - [ ] Check for secrets in code, config files, or logs
  - [ ] Verify default secrets are not used in production
  - [ ] Review secret rotation capabilities
  - [ ] Check for secrets exposed in error messages or logs
  - [ ] Verify `.env` files are in `.gitignore`

- [ ] **API Security**
  - [ ] Review rate limiting implementation (if any)
  - [ ] Check for API endpoint enumeration vulnerabilities
  - [ ] Verify CORS configuration is secure (reference PHASE3-040)
  - [ ] Review request size limits to prevent DoS
  - [ ] Check for missing security headers (reference PHASE3-040)
  - [ ] Verify HTTPS enforcement in production

- [ ] **File System Security**
  - [ ] Review file operations for path traversal vulnerabilities
  - [ ] Check file permissions and access controls
  - [ ] Verify temporary file cleanup
  - [ ] Review file upload validation (if applicable)

- [ ] **Network Security**
  - [ ] Review external API calls for proper error handling
  - [ ] Check for SSRF (Server-Side Request Forgery) vulnerabilities
  - [ ] Verify TLS/SSL certificate validation
  - [ ] Review timeout configurations for external requests

- [ ] **Logging and Monitoring**
  - [ ] Review logging for sensitive data exposure
  - [ ] Check log file permissions and access controls
  - [ ] Verify logging doesn't expose authentication tokens or secrets
  - [ ] Review log rotation and retention policies

### Manual Security Review

- [ ] **Code Review for Security Issues**
  - [ ] Review all controllers for security vulnerabilities
  - [ ] Review all services for security vulnerabilities
  - [ ] Review all middleware for security vulnerabilities
  - [ ] Review database queries for injection vulnerabilities
  - [ ] Review Redis operations for security issues
  - [ ] Review external API integrations for security

- [ ] **Configuration Security**
  - [ ] Review application configuration files
  - [ ] Check for insecure default configurations
  - [ ] Verify environment-specific configurations are secure
  - [ ] Review Docker configuration for security issues
  - [ ] Check for exposed ports or services

- [ ] **Dependency Security**
  - [ ] Review transitive dependencies for vulnerabilities
  - [ ] Check for packages with known security issues
  - [ ] Verify package lock file is committed and up to date
  - [ ] Review package.json for unnecessary or risky dependencies

### Security Best Practices Verification

- [ ] **OWASP Top 10 Review**
  - [ ] A01:2021 – Broken Access Control
  - [ ] A02:2021 – Cryptographic Failures
  - [ ] A03:2021 – Injection
  - [ ] A04:2021 – Insecure Design
  - [ ] A05:2021 – Security Misconfiguration
  - [ ] A06:2021 – Vulnerable and Outdated Components
  - [ ] A07:2021 – Identification and Authentication Failures
  - [ ] A08:2021 – Software and Data Integrity Failures
  - [ ] A09:2021 – Security Logging and Monitoring Failures
  - [ ] A10:2021 – Server-Side Request Forgery (SSRF)

- [ ] **Node.js Security Best Practices**
  - [ ] Verify use of `helmet` middleware for security headers
  - [ ] Check for proper error handling middleware
  - [ ] Review use of `express-validator` or similar for input validation
  - [ ] Verify secure cookie settings (if cookies are used)
  - [ ] Check for proper session management (if sessions are used)

### Documentation and Reporting

- [ ] **Document Security Findings**
  - [ ] Create security audit report
  - [ ] Document all identified vulnerabilities (severity, impact, remediation)
  - [ ] Document security recommendations
  - [ ] Create prioritized list of security improvements
  - [ ] Document any security decisions and trade-offs

- [ ] **Create Security Checklist**
  - [ ] Create ongoing security checklist for future development
  - [ ] Document security review process
  - [ ] Create security testing guidelines
  - [ ] Document dependency update process

- [ ] **Update Security Documentation**
  - [ ] Update or create `SECURITY.md` file
  - [ ] Document security configuration requirements
  - [ ] Document security best practices for developers
  - [ ] Document incident response procedures (if applicable)

## Notes

- This task is part of Phase 3: Holistic Review and Best Practices
- Section: 6. Security Review
- Focus on identifying issues and improvements
- Document findings and decisions

- **Security Scanning Tools**: Use `npm audit` as the primary tool, but consider additional tools like Snyk for more comprehensive scanning
- **Dependency Updates**: Be cautious when updating dependencies - test thoroughly to ensure no breaking changes
- **OWASP Top 10**: Reference the OWASP Top 10 2021 list as a comprehensive security checklist
- **Rails Comparison**: Compare security implementation with jarek-va Rails application to ensure feature parity
- **Production vs Development**: Pay special attention to differences between development and production security configurations
- **Documentation**: All security findings should be documented for future reference and compliance

- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE3-040
- Next: PHASE3-042

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
