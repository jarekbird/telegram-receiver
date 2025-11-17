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

The jarek-va Rails application implements several security mechanisms that should be reviewed in the converted TypeScript/Node.js application. Reference the following Rails files for security implementation details:

### Rails Files to Review

- `app/controllers/telegram_controller.rb` - Telegram webhook authentication (`authenticate_webhook`), admin authentication (`authenticate_admin`), error handling
- `app/controllers/cursor_runner_callback_controller.rb` - Cursor-runner callback authentication (`authenticate_webhook`), error handling, IP logging
- `app/controllers/agent_tools_controller.rb` - Agent tools authentication (`authenticate_webhook`), input validation (`validate_request_params`)
- `app/controllers/application_controller.rb` - Base error handling (`handle_error`), generic error responses
- `config/application.rb` - Secret configuration (webhook_secret, telegram_webhook_secret), default values ('changeme'), environment variable precedence

### Security Mechanisms in Rails

1. **Webhook Authentication**: Multiple authentication mechanisms using secret tokens
   - Telegram webhook: `X-Telegram-Bot-Api-Secret-Token` header (uses `telegram_webhook_secret`)
   - Admin endpoints: `X-Admin-Secret` header or `admin_secret` param (uses `webhook_secret`)
   - Cursor-runner callback: `X-Webhook-Secret` or `X-Cursor-Runner-Secret` headers, or `secret` query param (uses `webhook_secret`)
   - Agent tools: `X-EL-Secret` header or `Authorization: Bearer <token>` (uses `webhook_secret`)
   - Development mode bypasses: Some endpoints allow blank secrets when `expected_secret.blank?`

2. **Input Validation**: Parameter filtering using `params.permit()` and validation methods
   - Example: `CursorRunnerCallbackController#create` uses `params.permit()` to filter allowed parameters
   - Example: `AgentToolsController#validate_request_params` checks for required parameters

3. **Error Handling**: Careful error messages that don't leak sensitive information
   - Generic error messages: "Sorry, I encountered an error processing your request."
   - Error responses don't expose stack traces or internal details
   - Logging includes IP addresses and secret presence (`[present]`/`[missing]`) but not actual secret values

4. **Secret Management**: Environment-based secret configuration with safe defaults
   - Secrets loaded from Rails credentials first, then ENV variables, then defaults
   - Default secrets: `'changeme'` for `webhook_secret` and `telegram_webhook_secret` (security risk if used in production)
   - Configuration in `config/application.rb` lines 24-25, 44-45

5. **Development Mode Bypasses**: Some authentication allows blank secrets in development
   - `TelegramController#authenticate_webhook`: Allows blank secret if `expected_secret.blank?`
   - `CursorRunnerCallbackController#authenticate_webhook`: Allows blank secret if `expected_secret.blank?`
   - This is a security concern - verify Node.js implementation handles this appropriately

### Security Concerns Found in Rails Implementation

1. **Timing Attack Vulnerabilities**: Rails uses simple `==` comparison for secrets (vulnerable to timing attacks)
   - Example: `TelegramController#authenticate_webhook` line 139: `secret_token == expected_secret`
   - Example: `TelegramController#authenticate_admin` line 118: `admin_secret == expected_secret`
   - **Node.js Fix Required**: Use `crypto.timingSafeEqual()` for constant-time comparison

2. **Default Secrets**: Default 'changeme' values are used when secrets are not configured
   - `config/application.rb` lines 24-25, 44-45 use `ENV.fetch('WEBHOOK_SECRET', 'changeme')`
   - **Node.js Fix Required**: Require explicit secret configuration in production or fail securely

3. **Multiple Secret Sources**: Secrets can be passed via headers, query params, or body params
   - This flexibility may create security vulnerabilities
   - **Review Required**: Determine if this flexibility is necessary or should be restricted

4. **Inconsistent Secret Usage**: Different endpoints use different secret configurations
   - `webhook_secret` vs `telegram_webhook_secret` - verify if this is intentional or should be standardized

5. **Error Message Information Leakage**: Some error messages may expose too much information
   - Review error messages in controllers to ensure they don't leak sensitive information
   - Verify stack traces are not exposed in production responses

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
    - [ ] Verify all endpoints use parameter filtering/validation (similar to Rails `params.permit()`)
    - [ ] Check `CursorRunnerCallbackController` pattern: uses `params.permit()` to filter allowed parameters
    - [ ] Check `AgentToolsController` pattern: uses `validate_request_params` to check required parameters
  - [ ] Check for SQL injection vulnerabilities (if using raw SQL queries)
  - [ ] Verify parameter sanitization (prevent XSS, command injection)
  - [ ] Review file upload handling (if applicable)
  - [ ] Check for path traversal vulnerabilities
  - [ ] Review JSON parsing for DoS vulnerabilities (large payloads)
    - [ ] Check Express body parser limits (prevent large payload DoS attacks)
    - [ ] Verify request size limits are configured appropriately

- [ ] **Authentication and Authorization**
  - [ ] Verify all webhook endpoints require authentication (reference PHASE3-036)
  - [ ] Check for authentication bypass vulnerabilities
  - [ ] Review secret comparison for timing attack vulnerabilities
    - [ ] **CRITICAL**: Verify all secret comparisons use `crypto.timingSafeEqual()` instead of `==` (Rails uses vulnerable `==` comparison)
    - [ ] Check Telegram webhook authentication uses timing-safe comparison
    - [ ] Check admin authentication uses timing-safe comparison
    - [ ] Check cursor-runner callback authentication uses timing-safe comparison
    - [ ] Check agent tools authentication uses timing-safe comparison
  - [ ] Verify development mode authentication bypasses are safe
    - [ ] Review blank secret handling (Rails allows blank secrets when `expected_secret.blank?`)
    - [ ] Ensure production mode requires explicit secret configuration
    - [ ] Verify development bypasses don't accidentally work in production
  - [ ] Check for hardcoded secrets or credentials in code
  - [ ] Review token/session management (if applicable)
  - [ ] Verify multiple secret sources (headers, query params, body params) are handled securely
    - [ ] Review if multiple secret sources are necessary or should be restricted
    - [ ] Check for security implications of accepting secrets from multiple sources

- [ ] **Error Handling and Information Disclosure**
  - [ ] Review error messages for information leakage
    - [ ] Verify error messages are generic (e.g., "Sorry, I encountered an error processing your request." as in Rails)
    - [ ] Check that authentication errors don't reveal which secret failed or why
    - [ ] Verify error messages match Rails implementation patterns
  - [ ] Verify stack traces are not exposed in production
    - [ ] Check that production error responses don't include stack traces
    - [ ] Verify error handling middleware filters stack traces in production
  - [ ] Check that error responses don't reveal internal system details
    - [ ] Verify error responses don't expose file paths, system paths, or internal URLs
    - [ ] Check that error responses don't reveal database structure or query details
  - [ ] Review logging for sensitive information (secrets, passwords, tokens)
    - [ ] Verify logs don't contain actual secret values
    - [ ] Check that logs indicate secret presence (`[present]`/`[missing]`) but not values (as in Rails)
    - [ ] Verify IP addresses are logged for security monitoring (as in Rails)
  - [ ] Verify error handling doesn't expose file paths or system information
    - [ ] Review all error handlers to ensure they don't leak paths or system details
    - [ ] Check that error messages match Rails `ApplicationController#handle_error` pattern

- [ ] **Secret and Credential Management**
  - [ ] Review environment variable handling
    - [ ] Verify secret loading precedence matches Rails (credentials → ENV → default)
    - [ ] Check that default 'changeme' secrets are not used in production (Rails uses `ENV.fetch('WEBHOOK_SECRET', 'changeme')`)
    - [ ] Verify production mode requires explicit secret configuration or fails securely
  - [ ] Check for secrets in code, config files, or logs
  - [ ] Verify default secrets are not used in production
    - [ ] **CRITICAL**: Check that `webhook_secret` default 'changeme' is not used in production
    - [ ] **CRITICAL**: Check that `telegram_webhook_secret` default 'changeme' is not used in production
  - [ ] Review secret rotation capabilities
  - [ ] Check for secrets exposed in error messages or logs
    - [ ] Verify logs indicate secret presence (`[present]`/`[missing]`) but not actual secret values (as in Rails)
    - [ ] Verify IP addresses are logged for security monitoring (as in Rails `CursorRunnerCallbackController`)
  - [ ] Verify `.env` files are in `.gitignore`
  - [ ] Review inconsistent secret usage
    - [ ] Check if `webhook_secret` vs `telegram_webhook_secret` distinction is intentional or should be standardized

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
  - **Critical**: Rails has timing attack vulnerabilities in secret comparison - Node.js implementation MUST use `crypto.timingSafeEqual()`
  - **Critical**: Rails uses default 'changeme' secrets - Node.js implementation MUST require explicit secrets in production
  - Review all Rails security patterns and ensure Node.js implementation improves upon them where possible
- **Production vs Development**: Pay special attention to differences between development and production security configurations
  - Rails allows blank secrets in development mode - verify Node.js implementation handles this appropriately
  - Ensure development bypasses don't accidentally work in production
- **Documentation**: All security findings should be documented for future reference and compliance
- **Rails Security Concerns**: The audit should specifically address the security concerns found in Rails:
  1. Timing attack vulnerabilities (use `crypto.timingSafeEqual()`)
  2. Default 'changeme' secrets (require explicit configuration)
  3. Multiple secret sources (review if necessary)
  4. Inconsistent secret usage (verify if intentional)
  5. Error message information leakage (ensure generic messages)

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
