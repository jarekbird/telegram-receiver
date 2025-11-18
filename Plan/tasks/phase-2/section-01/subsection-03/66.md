# PHASE2-003: Create ElevenLabs API types

**Section**: 1. TypeScript Type Definitions
**Subsection**: 1.3
**Task ID**: PHASE2-003

## Description

Create TypeScript type definitions for ElevenLabs API. These types will be used for speech-to-text and text-to-speech operations. The types must accurately reflect the API request/response structures used in the Rails services.

## Checklist

- [ ] Create `src/types/elevenlabs.ts` file
- [ ] Define `ElevenLabsTranscribeRequest` interface for STT requests
  - [ ] Include `file` field (Buffer or Readable stream for multipart/form-data in Node.js)
  - [ ] Include `filename` field (string, optional - filename for the audio file in multipart form)
  - [ ] Include `model_id` field (string, default: 'scribe_v1')
  - [ ] Include optional `language` field (string, e.g., 'en', 'es', 'fr')
- [ ] Define `ElevenLabsTranscribeResponse` interface for STT responses
  - [ ] Include `text` field (string, required - the transcribed text)
- [ ] Define `ElevenLabsSynthesizeRequest` interface for TTS requests
  - [ ] Include `text` field (string, required)
  - [ ] Include `model_id` field (string, default: 'eleven_turbo_v2_5')
  - [ ] Include `output_format` field (string, default: 'mp3_44100_128')
  - [ ] Include optional `voice_settings` field (ElevenLabsVoiceSettings)
- [ ] Define `ElevenLabsSynthesizeResponse` type for TTS responses
  - [ ] Note: TTS returns binary audio data (Buffer), not JSON
  - [ ] Type should be `Buffer` or `ArrayBuffer` for audio/mpeg content
- [ ] Define `ElevenLabsVoiceSettings` interface for voice configuration
  - [ ] Include optional `stability` field (number, typically 0-1)
  - [ ] Include optional `similarity_boost` field (number, typically 0-1)
  - [ ] Include other voice settings as needed (style, use_speaker_boost, etc.)
- [ ] Define `ElevenLabsErrorResponse` interface for API error responses
  - [ ] Support error responses that can be objects or arrays (TTS handles both, STT typically returns objects)
  - [ ] For array format: `Array<{msg?: string}>` (array of objects with optional `msg` field)
  - [ ] For object format: Include `detail` field (string | string[] | Array<{msg?: string}>)
  - [ ] Include optional `error` field (string)
  - [ ] Include optional `message` field (string)
  - [ ] Note: When `detail` is an array, extract `msg` fields from each item
- [ ] Define error classes matching Rails service errors (extend Error class)
  - [ ] `ElevenLabsError` (base error class extending Error)
  - [ ] `ElevenLabsConnectionError` (extends ElevenLabsError)
  - [ ] `ElevenLabsTimeoutError` (extends ElevenLabsError)
  - [ ] `ElevenLabsInvalidResponseError` (extends ElevenLabsError)
  - [ ] `ElevenLabsTranscriptionError` (extends ElevenLabsError, for STT)
  - [ ] `ElevenLabsSynthesisError` (extends ElevenLabsError, for TTS)
- [ ] Export all types and interfaces

## Notes

- This task is part of Phase 2: File-by-File Conversion
- Section: 1. TypeScript Type Definitions
- Reference `jarek-va/app/services/eleven_labs_speech_to_text_service.rb` and `eleven_labs_text_to_speech_service.rb`
- Types should match the ElevenLabs API structure as implemented in the Rails services

### Implementation Details from Rails Services

**Speech-to-Text (STT) Service:**
- Uses `multipart/form-data` format (not JSON)
- Request fields: `file` (audio file content as binary), `model_id` (string), `language` (optional string)
- In Rails: Uses `File.binread()` or `IO.read()` to get file content, includes filename in multipart form
- Response is JSON with `text` field containing transcribed text
- Default model_id: `'scribe_v1'`
- Endpoint: `/v1/speech-to-text`
- Error responses are typically objects (not arrays) with `detail`, `error`, or `message` fields

**Text-to-Speech (TTS) Service:**
- Uses JSON format for request body
- Request fields: `text` (required), `model_id` (string), `output_format` (string), `voice_settings` (optional object)
- Response is binary audio data (`audio/mpeg`), NOT JSON
- Default model_id: `'eleven_turbo_v2_5'`
- Default output_format: `'mp3_44100_128'`
- Default voice_id: `'vfaqCOvlrKi4Zp7C2IAm'` (used in URL path, not request body)
- Endpoint: `/v1/text-to-speech/{voice_id}`
- Error responses can be arrays or objects:
  - Array format: `[{msg: string}, ...]`
  - Object format: `{detail: string | string[] | Array<{msg?: string}>, error?: string, message?: string}`
  - When detail is an array, extract `msg` fields from each item

**Voice Settings:**
- Optional hash/object passed to TTS requests
- Common fields: `stability`, `similarity_boost` (based on service comments)
- Should be flexible to accommodate other ElevenLabs voice settings

**Error Handling:**
- Both services define custom error classes inheriting from base Error
- Connection errors, timeout errors, invalid response errors, and operation-specific errors
- STT error parsing handles JSON object responses (with `detail`, `error`, or `message` fields)
- TTS error parsing handles both JSON object and array responses (arrays have `msg` fields, objects can have `detail` as array)
- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE2-002
- Next: PHASE2-004

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

