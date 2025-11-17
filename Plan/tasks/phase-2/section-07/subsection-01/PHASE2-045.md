# PHASE2-045: Create ElevenLabsSpeechToTextService class structure

**Section**: 7. ElevenLabs Services Conversion
**Subsection**: 7.1
**Task ID**: PHASE2-045

## Description

Create the ElevenLabsSpeechToTextService class structure from Rails to TypeScript/Node.js. This task focuses on setting up the class skeleton including error classes, constants, constructor, and private properties. Reference `jarek-va/app/services/eleven_labs_speech_to_text_service.rb` for the complete implementation.

## Checklist

- [ ] Create `src/services/elevenlabs-speech-to-text-service.ts` file
- [ ] Define `ElevenLabsSpeechToTextService` class structure
- [ ] Add custom error classes (5 total):
  - [ ] `Error` (base error class extending Error)
  - [ ] `ConnectionError` (extends Error)
  - [ ] `TimeoutError` (extends Error)
  - [ ] `InvalidResponseError` (extends Error)
  - [ ] `TranscriptionError` (extends Error)
- [ ] Define API constants (4 total):
  - [ ] `API_BASE_URL = 'https://api.elevenlabs.io'`
  - [ ] `TRANSCRIPTION_ENDPOINT = '/v1/speech-to-text'`
  - [ ] `DEFAULT_TIMEOUT = 60` (seconds)
  - [ ] `DEFAULT_MODEL_ID = 'scribe_v1'`
- [ ] Add constructor with parameters:
  - [ ] `api_key?: string` (optional, should read from config if not provided)
  - [ ] `timeout?: number` (optional, defaults to DEFAULT_TIMEOUT)
  - [ ] `model_id?: string` (optional, should read from config or default to DEFAULT_MODEL_ID)
  - [ ] Validate that `api_key` is not blank/empty (throw Error if missing)
- [ ] Add private properties:
  - [ ] `private readonly apiKey: string`
  - [ ] `private readonly timeout: number`
  - [ ] `private readonly modelId: string`
- [ ] Add getter methods or accessors for private properties (if needed)

## Notes

- This task is part of Phase 2: File-by-File Conversion
- Section: 7. ElevenLabs Services Conversion
- Reference the Rails implementation at `jarek-va/app/services/eleven_labs_speech_to_text_service.rb` for behavior
- The constructor should read configuration values from the application config (similar to `Rails.application.config.elevenlabs_api_key` in Rails)
- In TypeScript/Node.js, use environment variables or a config service for API key and model ID
- This task only creates the class structure - method implementations will be added in subsequent tasks (PHASE2-046, PHASE2-047, etc.)
- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE2-044
- Next: PHASE2-046

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
