# PHASE3-039: Review secure credential handling

**Section**: 6. Security Review
**Subsection**: 6.4
**Task ID**: PHASE3-039

## Description

Review and improve secure credential handling in the codebase to ensure best practices. This task focuses on identifying and preventing credential exposure, ensuring credentials are stored securely, accessed safely, and never logged or exposed in error messages or responses.

## Rails Implementation Reference

The Rails application uses multiple credential management approaches:

1. **Rails Credentials** (`config/application.rb`):
   - Uses `Rails.application.credentials.dig()` for encrypted credential storage
   - Falls back to `ENV.fetch()` for backwards compatibility
   - Credentials include:
     - `webhook.secret` → `WEBHOOK_SECRET` env var
     - `telegram.bot_token` → `TELEGRAM_BOT_TOKEN` env var
     - `telegram.webhook_secret` → `TELEGRAM_WEBHOOK_SECRET` env var
     - `telegram.webhook_base_url` → `TELEGRAM_WEBHOOK_BASE_URL` env var
     - `elevenlabs.api_key` → `ELEVENLABS_API_KEY` env var
     - `elevenlabs.stt_model_id` → `ELEVENLABS_STT_MODEL_ID` env var
     - `elevenlabs.tts_model_id` → `ELEVENLABS_TTS_MODEL_ID` env var
     - `elevenlabs.voice_id` → `ELEVENLABS_VOICE_ID` env var

2. **GitCredential Model** (`app/models/git_credential.rb`):
   - Uses ActiveRecord encryption: `encrypts :password, :token`
   - Stores encrypted credentials in database
   - Provides `environment_variables` method for passing to cursor commands
   - Validates authentication methods (token or username/password)

3. **Environment Variables**:
   - All sensitive values should come from environment variables
   - Default values should be safe (e.g., `'changeme'` for webhook secret, not actual secrets)
   - Required credentials should fail fast if missing (no silent failures)

4. **Logging Practices**:
   - Rails services log errors but should not log credential values
   - Error messages should not expose tokens or secrets
   - Parameters logged should exclude sensitive fields
   - **Note**: In `telegram_controller.rb`, debug logging in test environment logs admin secrets (lines 122-126) - this pattern should be avoided or masked
   - **Note**: Bot token is embedded in Telegram file download URLs (Telegram API requirement) - ensure URLs are not logged or are masked in logs

## Checklist

### Environment Variable Usage

- [ ] Review all environment variable access patterns
  - [ ] Verify all credentials are read from `process.env` (not hardcoded)
  - [ ] Check that environment variables are accessed through a centralized config module
  - [ ] Verify default values are safe (e.g., empty strings, not actual secrets)
  - [ ] Check that required credentials fail fast if missing (throw error, don't silently continue)
  - [ ] Verify environment variable names match Rails conventions where applicable
  - [ ] Check for typos in environment variable names

- [ ] Review credential types used:
  - [ ] `TELEGRAM_BOT_TOKEN` - Telegram Bot API token
  - [ ] `TELEGRAM_WEBHOOK_SECRET` - Webhook secret token for Telegram
  - [ ] `TELEGRAM_WEBHOOK_BASE_URL` - Base URL for webhook (not sensitive but should be validated)
  - [ ] `WEBHOOK_SECRET` - Admin webhook secret
  - [ ] `ELEVENLABS_API_KEY` - ElevenLabs API key for speech services
  - [ ] `ELEVENLABS_STT_MODEL_ID` - Speech-to-text model ID
  - [ ] `ELEVENLABS_TTS_MODEL_ID` - Text-to-speech model ID
  - [ ] `ELEVENLABS_VOICE_ID` - Voice ID for TTS
  - [ ] `CURSOR_RUNNER_URL` - URL for cursor-runner service (not sensitive but should be validated)
  - [ ] `REDIS_URL` - Redis connection URL (may contain password)
  - [ ] `DATABASE_URL` - Database connection URL (may contain password)

### Hardcoded Secrets

- [ ] Search codebase for hardcoded secrets
  - [ ] Search for common secret patterns (tokens, keys, passwords)
  - [ ] Check for API keys in source code
  - [ ] Check for tokens in configuration files
  - [ ] Verify `.env` files are in `.gitignore` (not committed)
  - [ ] Check that `.env.example` doesn't contain real secrets
  - [ ] Verify no secrets in test files (use mock/test values)
  - [ ] Check Docker files for hardcoded secrets
  - [ ] Review any configuration files for embedded secrets

### Credential Storage

- [ ] Review how credentials are stored
  - [ ] Verify credentials are never stored in code
  - [ ] Verify credentials are never stored in version control
  - [ ] Check if database storage is needed (like GitCredential model)
  - [ ] If database storage is needed, verify encryption is used
  - [ ] Review credential access patterns (should be read-only after initialization)
  - [ ] Check for credential rotation mechanisms (if applicable)

- [ ] Review GitCredential model conversion (if applicable)
  - [ ] Verify password/token fields are encrypted at rest
  - [ ] Verify encryption keys are managed securely
  - [ ] Check that credentials are never returned in API responses
  - [ ] Verify `environment_variables` method doesn't expose secrets unnecessarily

### Credential Exposure in Logs

- [ ] Review all logging statements
  - [ ] Search for `console.log`, `logger.info`, `logger.error`, etc.
  - [ ] Verify credentials are never logged
  - [ ] Check error messages don't expose tokens or secrets
  - [ ] Verify request/response logging excludes sensitive headers
  - [ ] Check that API responses don't include credentials
  - [ ] Review stack traces for credential exposure
  - [ ] Verify debug logging doesn't expose credentials

- [ ] Review specific logging scenarios:
  - [ ] Telegram service logging (should not log bot token)
  - [ ] Cursor runner service logging (should not log API keys)
  - [ ] Error logging (should not include credentials in error messages)
  - [ ] Request logging (should mask sensitive headers like `Authorization`)
  - [ ] Configuration logging (should not log credential values)
  - [ ] Debug/test logging (should not log secrets even in test/debug mode - mask or exclude)
  - [ ] URL logging (Telegram file download URLs contain bot token - mask token in URLs if logged)
  - [ ] Authentication failure logging (should not log actual secret values, only indicate failure)

### API Key Handling

- [ ] Review API key usage patterns
  - [ ] Verify API keys are passed in headers (not URL parameters)
  - [ ] Check that API keys are never exposed in URLs
  - [ ] Verify API keys are validated before use
  - [ ] Check for API key rotation support (if applicable)
  - [ ] Review API key error handling (don't expose keys in errors)

- [ ] Review specific API integrations:
  - [ ] Telegram Bot API (bot token in headers for API calls, but required in URL for file downloads - ensure URLs are not logged or are masked)
  - [ ] ElevenLabs API (API key in headers)
  - [ ] Cursor runner API (verify no credentials in URLs)
  - [ ] Redis connection (password in URL, verify it's not logged)
  - [ ] Database connection (password in DATABASE_URL, verify it's not logged)

### Environment Variable Validation

- [ ] Review environment variable validation
  - [ ] Verify required credentials are validated at startup
  - [ ] Check that missing credentials cause clear error messages
  - [ ] Verify credential format validation (if applicable)
  - [ ] Check for credential length validation (prevent injection)
  - [ ] Review environment variable sanitization

### Configuration Management

- [ ] Review configuration module structure
  - [ ] Verify centralized configuration module exists
  - [ ] Check that config is read-only after initialization
  - [ ] Verify config values are validated on load
  - [ ] Check for config caching (credentials shouldn't be cached unsafely)
  - [ ] Review config access patterns (should be through getters, not direct env access)

### Security Issues Identification

- [ ] Identify potential security vulnerabilities
  - [ ] Check for credential exposure in error messages
  - [ ] Check for credential exposure in API responses
  - [ ] Check for credential exposure in logs
  - [ ] Check for credential exposure in stack traces
  - [ ] Check for credential exposure in debug output
  - [ ] Check for credential exposure in test/debug logging (even test logs should mask secrets)
  - [ ] Check for credential exposure in URLs (especially Telegram file download URLs)
  - [ ] Verify credentials are not passed to untrusted code
  - [ ] Check for credential leakage through side channels (timing attacks, etc.)
  - [ ] Verify authentication failure messages don't reveal secret values (only indicate success/failure)

### Documentation

- [ ] Document credential management approach
  - [ ] Document which credentials are required
  - [ ] Document where credentials should be stored (environment variables)
  - [ ] Document credential rotation procedures (if applicable)
  - [ ] Document how to securely handle credentials in development
  - [ ] Create or update security guidelines for credential handling
  - [ ] Document credential access patterns and best practices

### Implementation Recommendations

- [ ] Create credential validation utility
  - [ ] Create function to validate required credentials at startup
  - [ ] Create function to mask credentials in logs (show only first/last few chars)
  - [ ] Add TypeScript types for credential configuration

- [ ] Add credential access safeguards
  - [ ] Ensure credentials are read-only after initialization
  - [ ] Add runtime checks to prevent credential logging
  - [ ] Consider using a secrets management library (if needed)

## Notes

- This task is part of Phase 3: Holistic Review and Best Practices
- Section: 6. Security Review
- Focus on identifying issues and improvements
- Document findings and decisions

- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE3-038
- Next: PHASE3-040

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
