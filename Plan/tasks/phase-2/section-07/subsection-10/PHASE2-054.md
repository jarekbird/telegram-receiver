# PHASE2-054: Write TextToSpeechService unit tests

**Section**: 7. ElevenLabs Services Conversion
**Subsection**: 7.10
**Task ID**: PHASE2-054

## Description

Write comprehensive unit tests for the ElevenLabsTextToSpeechService TypeScript implementation. The tests should cover all public methods, error handling scenarios, and edge cases. Reference `jarek-va/app/services/eleven_labs_text_to_speech_service.rb` for the complete implementation details and behavior to test.

The service includes the following methods to test:
- Constructor/initialization (lines 23-30)
- `voiceIdConfigured` method (lines 32-34)
- `synthesize` method (lines 41-76)
- `synthesizeToIo` method (lines 82-110)

Error classes to test:
- `ElevenLabsTextToSpeechServiceError` (base error)
- `ConnectionError`
- `TimeoutError`
- `InvalidResponseError`
- `SynthesisError`

## Checklist

### Test File Setup
- [ ] Create `tests/unit/services/elevenlabs-text-to-speech-service.test.ts`
- [ ] Set up test suite with proper imports
- [ ] Mock HTTP client (axios or fetch) using nock or similar
- [ ] Mock file system operations (fs module) for `synthesize` method
- [ ] Set up test fixtures for API responses

### Constructor/Initialization Tests
- [ ] Test successful initialization with all parameters (apiKey, timeout, modelId, voiceId)
- [ ] Test initialization with default values (uses config values)
- [ ] Test initialization throws error when API key is missing/blank
- [ ] Test initialization with custom timeout value
- [ ] Test initialization with custom modelId value
- [ ] Test initialization with custom voiceId value

### voiceIdConfigured Method Tests
- [ ] Test returns true when voiceId is configured
- [ ] Test returns false when voiceId is not configured/blank

### synthesize Method Tests - Success Cases
- [ ] Test successful synthesis with required text parameter
- [ ] Test successful synthesis saves audio file to specified output_path
- [ ] Test successful synthesis generates temp file path when output_path not provided
- [ ] Test successful synthesis with voice_settings parameter
- [ ] Test successful synthesis without voice_settings parameter
- [ ] Test request body includes correct fields (text, model_id, output_format)
- [ ] Test request headers include correct values (xi-api-key, Content-Type, Accept)
- [ ] Test request URL includes voice_id in path
- [ ] Test response audio data is written to file correctly
- [ ] Test method returns file path string

### synthesize Method Tests - Error Cases
- [ ] Test throws error when text is blank/empty
- [ ] Test throws error when voice_id is not configured
- [ ] Test throws ConnectionError on connection failures (ECONNREFUSED, EHOSTUNREACH, ENOTFOUND)
- [ ] Test throws TimeoutError on timeout failures (ETIMEDOUT)
- [ ] Test throws SynthesisError on HTTP error responses (4xx, 5xx)
- [ ] Test SynthesisError extracts error message from array error response format
- [ ] Test SynthesisError extracts error message from hash error response format (detail field)
- [ ] Test SynthesisError extracts error message from hash error response format (error field)
- [ ] Test SynthesisError extracts error message from hash error response format (message field)
- [ ] Test SynthesisError handles nested array in detail field
- [ ] Test SynthesisError joins multiple error messages with '; ' separator
- [ ] Test SynthesisError falls back to default message when JSON parsing fails
- [ ] Test InvalidResponseError on JSON parsing failures
- [ ] Test error logging for API errors (logs response code and body)

### synthesizeToIo Method Tests - Success Cases
- [ ] Test successful synthesis with required text parameter
- [ ] Test successful synthesis returns Buffer (not file path)
- [ ] Test successful synthesis with voice_settings parameter
- [ ] Test successful synthesis without voice_settings parameter
- [ ] Test request body includes correct fields (text, model_id, output_format)
- [ ] Test request headers include correct values (xi-api-key, Content-Type, Accept)
- [ ] Test request URL includes voice_id in path
- [ ] Test response audio data is returned as Buffer

### synthesizeToIo Method Tests - Error Cases
- [ ] Test throws error when text is blank/empty
- [ ] Test throws error when voice_id is not configured
- [ ] Test throws ConnectionError on connection failures
- [ ] Test throws TimeoutError on timeout failures
- [ ] Test throws SynthesisError on HTTP error responses
- [ ] Test SynthesisError extracts error message from various response formats
- [ ] Test InvalidResponseError on JSON parsing failures

### Error Response Format Tests
- [ ] Test error response parsing with array format: `[{msg: "error1"}, {msg: "error2"}]`
- [ ] Test error response parsing with hash format: `{detail: "error message"}`
- [ ] Test error response parsing with hash format: `{error: "error message"}`
- [ ] Test error response parsing with hash format: `{message: "error message"}`
- [ ] Test error response parsing with nested array in detail: `{detail: [{msg: "error1"}]}`
- [ ] Test error response parsing falls back when JSON parsing fails
- [ ] Test error response parsing handles missing error fields gracefully

### Coverage Requirements
- [ ] Achieve >80% code coverage
- [ ] All public methods are tested
- [ ] All error paths are tested
- [ ] All edge cases are tested

## Notes

- This task is part of Phase 2: File-by-File Conversion
- Section: 7. ElevenLabs Services Conversion
- **Rails Reference**: `jarek-va/app/services/eleven_labs_text_to_speech_service.rb`

### Implementation Details from Rails:

1. **Service Structure**:
   - Constructor validates API key is present (raises error if blank)
   - Uses default values from config or constants
   - Default timeout: 60 seconds
   - Default model_id: 'eleven_turbo_v2_5'
   - Default voice_id: 'vfaqCOvlrKi4Zp7C2IAm'
   - Default output_format: 'mp3_44100_128'

2. **synthesize Method** (lines 41-76):
   - Validates text is not blank
   - Validates voice_id is configured
   - Builds URI with voice_id in path
   - Creates temp file path if output_path not provided
   - Saves audio file to disk
   - Returns file path string
   - Logs request and file generation info

3. **synthesizeToIo Method** (lines 82-110):
   - Validates text is not blank
   - Validates voice_id is configured
   - Builds URI with voice_id in path
   - Returns Buffer (Node.js equivalent of StringIO)
   - Does not save file to disk
   - Logs request info

4. **Error Handling** (see PHASE2-053 for details):
   - Connection errors: ECONNREFUSED, EHOSTUNREACH, ENOTFOUND
   - Timeout errors: ETIMEDOUT
   - HTTP errors: Non-200 status codes → SynthesisError
   - JSON parsing errors: InvalidResponseError
   - Error response parsing handles multiple formats

5. **Testing Tools**:
   - Use `nock` for HTTP request mocking (already in devDependencies)
   - Use `jest` mocking for file system operations
   - Use `fs` module mocking for file write operations
   - Mock logger to verify log calls

6. **Test File Location**:
   - Should be in `tests/unit/services/` directory (not `tests/services/`)
   - Follow Jest test naming convention: `*.test.ts`

- Task can be completed independently by a single agent
- This task assumes the service implementation from PHASE2-050, PHASE2-051, PHASE2-052, and PHASE2-053 is already in place

## Related Tasks

- Previous: PHASE2-053
- Next: PHASE2-055

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
