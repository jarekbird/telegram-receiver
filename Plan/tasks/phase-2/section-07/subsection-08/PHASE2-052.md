# PHASE2-052: Implement synthesize_to_io method

**Section**: 7. ElevenLabs Services Conversion
**Subsection**: 7.8
**Task ID**: PHASE2-052

## Description

Convert the `synthesize_to_io` method from Rails to TypeScript/Node.js. This method converts text to speech using the ElevenLabs API and returns the generated audio as a Buffer (Node.js equivalent of Ruby's StringIO). Reference `jarek-va/app/services/eleven_labs_text_to_speech_service.rb` for the complete implementation.

The `synthesize_to_io` method is located in `jarek-va/app/services/eleven_labs_text_to_speech_service.rb` (lines 82-110).

## Checklist

- [ ] Implement `synthesizeToIo` method signature: `synthesizeToIo(text: string, options?: { voiceSettings?: object }): Promise<Buffer>`
- [ ] Validate text input is not blank (throw error if blank)
- [ ] Validate voice_id is configured (throw error if not configured)
- [ ] Build URI with voice_id in path: `https://api.elevenlabs.io/v1/text-to-speech/{voice_id}`
- [ ] Build HTTP client with SSL and timeout settings (use private `buildHttp` method)
- [ ] Build request body JSON with:
  - `text` (required)
  - `model_id` (use instance `modelId` property)
  - `output_format` (use `DEFAULT_OUTPUT_FORMAT = 'mp3_44100_128'`)
  - `voice_settings` (only if provided in options)
- [ ] Create POST request with headers:
  - `xi-api-key`: API key
  - `Content-Type`: `application/json`
  - `Accept`: `audio/mpeg`
- [ ] Log request info: "Sending text to ElevenLabs for synthesis: {text[0..50]}..."
- [ ] Execute HTTP request (use private `executeRequest` method)
- [ ] Return audio as Buffer (Node.js equivalent of StringIO): `Buffer.from(response.body)`
- [ ] Add error handling:
  - Catch JSON parsing errors and raise `InvalidResponseError`
  - Connection/timeout errors are handled in `executeRequest` method
  - HTTP error responses are handled in `executeRequest` method (raises `SynthesisError`)

## Notes

- This task is part of Phase 2: File-by-File Conversion
- Section: 7. ElevenLabs Services Conversion
- **Rails Reference**: `jarek-va/app/services/eleven_labs_text_to_speech_service.rb` (lines 82-110)

### Implementation Details from Rails:

1. **Method signature**:
   - Parameters: `text` (required), `voice_settings` (optional)
   - Returns: StringIO object containing audio data (Buffer in Node.js)

2. **Validation**:
   - Raises error if `text` is blank
   - Raises error if `voice_id` is not configured

3. **Request body structure**:
   ```json
   {
     "text": "text to synthesize",
     "model_id": "eleven_turbo_v2_5",
     "output_format": "mp3_44100_128",
     "voice_settings": { ... } // optional
   }
   ```

4. **API endpoint**:
   - URL: `POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}`
   - Voice ID is included in the URL path, not the request body

5. **Response handling**:
   - Response is binary audio data (MP3 format)
   - Return as Buffer (Node.js equivalent of Ruby's StringIO)
   - No file is written to disk (unlike `synthesize` method)

6. **Error handling**:
   - JSON parsing errors are caught and wrapped in `InvalidResponseError`
   - HTTP errors, connection errors, and timeout errors are handled in `executeRequest` method
   - See PHASE2-053 for complete error handling implementation details

7. **Dependencies**:
   - Uses private `buildHttp` method for HTTP client setup
   - Uses private `executeRequest` method for request execution with error handling
   - Requires Buffer for returning audio data

8. **Key differences from `synthesize` method**:
   - Does not save audio to file
   - Returns Buffer instead of file path string
   - Does not generate temp file path
   - Does not log file path or file size

- Task can be completed independently by a single agent
- This task assumes the class structure from PHASE2-050 and PHASE2-051 is already in place

## Related Tasks

- Previous: PHASE2-051
- Next: PHASE2-053

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
