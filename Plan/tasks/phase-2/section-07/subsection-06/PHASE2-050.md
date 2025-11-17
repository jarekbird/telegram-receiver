# PHASE2-050: Create ElevenLabsTextToSpeechService class structure

**Section**: 7. ElevenLabs Services Conversion
**Subsection**: 7.6
**Task ID**: PHASE2-050

## Description

Create the ElevenLabsTextToSpeechService class structure from Rails to TypeScript/Node.js. This service converts text to speech using the ElevenLabs API. Reference `jarek-va/app/services/eleven_labs_text_to_speech_service.rb` for the complete implementation.

The service handles:
- Text-to-speech synthesis via ElevenLabs API
- Saving synthesized audio to files
- Returning synthesized audio as streams/IO objects
- Error handling for connection, timeout, and API errors

## Checklist

- [ ] Create `src/services/elevenlabs-text-to-speech-service.ts` file
- [ ] Define class structure `ElevenLabsTextToSpeechService`
- [ ] Add constructor with optional parameters: `api_key`, `timeout`, `model_id`, `voice_id`
  - Constructor should read from config/environment if parameters not provided
  - Constructor should validate that api_key is present (throw error if missing)
- [ ] Define API constants:
  - `API_BASE_URL = 'https://api.elevenlabs.io'`
  - `TEXT_TO_SPEECH_ENDPOINT = '/v1/text-to-speech'`
  - `DEFAULT_TIMEOUT = 60` (seconds)
  - `DEFAULT_MODEL_ID = 'eleven_turbo_v2_5'`
  - `DEFAULT_VOICE_ID = 'vfaqCOvlrKi4Zp7C2IAm'`
  - `DEFAULT_OUTPUT_FORMAT = 'mp3_44100_128'` (MP3 format, 44.1kHz, 128kbps)
- [ ] Add custom error classes (extending Error):
  - `ElevenLabsTextToSpeechServiceError` (base error class)
  - `ConnectionError` (connection failures)
  - `TimeoutError` (request timeouts)
  - `InvalidResponseError` (invalid API responses)
  - `SynthesisError` (synthesis failures)
- [ ] Add private properties: `apiKey`, `timeout`, `modelId`, `voiceId`
- [ ] Add public method signature: `voiceIdConfigured(): boolean` (checks if voice_id is configured)
- [ ] Add public method signature: `synthesize(text: string, options?: { outputPath?: string, voiceSettings?: object }): Promise<string>` (returns path to audio file)
- [ ] Add public method signature: `synthesizeToStream(text: string, options?: { voiceSettings?: object }): Promise<ReadableStream>` (returns audio stream)
- [ ] Add private method signature: `buildHttp(uri: URL): HttpClient` (builds HTTP client with SSL and timeout)
- [ ] Add private method signature: `executeRequest(http: HttpClient, request: HttpRequest, uri: URL): Promise<HttpResponse>` (executes request with error handling)

## Notes

- This task is part of Phase 2: File-by-File Conversion
- Section: 7. ElevenLabs Services Conversion
- Reference the Rails implementation at `jarek-va/app/services/eleven_labs_text_to_speech_service.rb` for complete behavior details

### Implementation Details from Rails:

1. **Constructor behavior**:
   - All parameters are optional and have defaults from config/environment
   - Validates `api_key` is present, throws error if missing
   - Uses Rails config values: `elevenlabs_api_key`, `elevenlabs_tts_model_id`, `elevenlabs_voice_id`

2. **Error handling**:
   - `build_http` catches connection errors (ECONNREFUSED, EHOSTUNREACH, SocketError) and raises `ConnectionError`
   - `build_http` catches timeout errors (Net::OpenTimeout, Net::ReadTimeout) and raises `TimeoutError`
   - `execute_request` handles HTTP error responses, parsing JSON error bodies and extracting error messages
   - Error response parsing handles both array and hash formats from ElevenLabs API
   - Raises `SynthesisError` for non-success HTTP responses
   - Raises `InvalidResponseError` for JSON parsing failures

3. **API request details**:
   - Endpoint: `POST /v1/text-to-speech/{voice_id}`
   - Headers: `xi-api-key`, `Content-Type: application/json`, `Accept: audio/mpeg`
   - Request body includes: `text`, `model_id`, `output_format`, optional `voice_settings`
   - Response is binary audio data (MP3 format)

4. **File handling**:
   - `synthesize` saves audio to file (uses temp directory with random filename if `output_path` not provided)
   - `synthesize_to_io` returns audio as IO/stream object
   - Uses `SecureRandom.hex(8)` for generating temp filenames in Rails

5. **Dependencies**:
   - HTTP client (Net::HTTP in Rails, use Node.js http/https or fetch/axios in TypeScript)
   - File system operations (fs module in Node.js)
   - JSON parsing
   - Random string generation for temp filenames (crypto.randomBytes in Node.js)

- Task can be completed independently by a single agent
- This task focuses on class structure only - full method implementations will be in subsequent tasks

## Related Tasks

- Previous: PHASE2-049
- Next: PHASE2-051

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
