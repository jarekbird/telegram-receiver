# PHASE2-081: Implement extract_audio_file_id utility

**Section**: 10. TelegramMessageJob Conversion
**Subsection**: 10.5
**Task ID**: PHASE2-081

## Description

Convert the `extract_audio_file_id` utility method from Rails to TypeScript/Node.js. This function extracts audio file IDs from Telegram messages, supporting voice messages, audio files, and audio documents. Reference `jarek-va/app/jobs/telegram_message_job.rb` lines 298-312.

The function checks for audio content in three ways, in this specific order:
1. **Voice messages** (most common for speech) - checks `message.voice.file_id` if `message.voice` exists
2. **Audio files** - checks `message.audio.file_id` if `message.audio` exists
3. **Documents with audio mime types** - checks `message.document.file_id` if `message.document` exists AND `message.document.mime_type` starts with `'audio/'`

**Implementation Notes:**
- The function should check these conditions in the order listed above (voice first, then audio, then document)
- Use optional chaining (`?.`) or equivalent safe navigation to handle missing properties
- Return the `file_id` string if found, or `null`/`undefined` if no audio content is detected
- The function should handle null/undefined message parameter gracefully
- For documents, only return the file_id if the mime_type starts with the string `'audio/'` (case-sensitive check)

## Checklist

- [ ] Create `extractAudioFileId` utility function with signature: `extractAudioFileId(message: TelegramMessage | null | undefined): string | null | undefined`
- [ ] Check for `message.voice.file_id` FIRST (voice messages) - return immediately if found
- [ ] Check for `message.audio.file_id` SECOND (audio files) - return immediately if found
- [ ] Check for `message.document.file_id` THIRD when `document.mime_type` starts with `'audio/'` (audio documents) - return immediately if found
- [ ] Return `file_id` string if found, or `null`/`undefined` if no audio content is detected
- [ ] Handle null/undefined message parameter gracefully (return null/undefined)
- [ ] Handle missing nested properties safely using optional chaining (`?.`) or equivalent
- [ ] Ensure checks are performed in the correct order (voice → audio → document)
- [ ] For document check, verify `mime_type` exists and starts with `'audio/'` before returning file_id

## Notes

- This task is part of Phase 2: File-by-File Conversion
- Section: 10. TelegramMessageJob Conversion
- Reference the Rails implementation for behavior

- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE2-080
- Next: PHASE2-082

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
