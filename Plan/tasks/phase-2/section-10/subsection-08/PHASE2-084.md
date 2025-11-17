# PHASE2-084: Implement process_local_message method

**Section**: 10. TelegramMessageJob Conversion
**Subsection**: 10.8
**Task ID**: PHASE2-084

## Description

Convert the `process_local_message` method from Rails to TypeScript/Node.js. This method processes local commands that are not forwarded to cursor-runner, handling /start, /help, /status commands and unknown messages. Reference `jarek-va/app/jobs/telegram_message_job.rb` lines 253-277.

The method:
- Accepts message text, chat_id, and message_id as parameters
- Uses regex pattern matching (case-insensitive, trimmed) to identify commands
- Returns a response object with `ok` and `say` properties
- Handles /start and /help commands with the same response
- Handles /status command with a status message
- Returns a friendly response for unknown commands (not an error)

## Checklist

### Method Signature
- [ ] Create `processLocalMessage` method with signature: `processLocalMessage(text: string, chatId: number, messageId: number)`
- [ ] Method should return `{ ok: boolean, say: string }` object

### Command Handling
- [ ] Use regex pattern matching (case-insensitive) to match commands
- [ ] Trim and lowercase text before matching
- [ ] Handle /start command (matches `/^\/start/i`)
- [ ] Handle /help command (matches `/^\/help/i`)
- [ ] **Important**: /start and /help should return the same response message
- [ ] Handle /status command (matches `/^\/status/i`)
- [ ] Handle unknown commands (else clause) - should return a friendly response, not an error

### Response Format
- [ ] Return object with `ok: true` property
- [ ] Return object with `say` property containing the response text
- [ ] /start and /help response should include:
  - Greeting: "Hello! I'm your Virtual Assistant. Send me a message and I'll help you out."
  - Available commands list: "/help - Show this message" and "/status - Check my status"
- [ ] /status response should be: "✅ I'm online and ready to help!"
- [ ] Unknown commands response should include:
  - Echo of received message: "I received your message: {text}"
  - Learning message: "I'm still learning how to process messages. More features coming soon!"

## Notes

- This task is part of Phase 2: File-by-File Conversion
- Section: 10. TelegramMessageJob Conversion
- Reference the Rails implementation at `jarek-va/app/jobs/telegram_message_job.rb` lines 253-277

### Implementation Details

- The method uses a case statement (or switch statement in TypeScript) with regex patterns
- Commands are matched using regex patterns: `/^\/start/i`, `/^\/help/i`, `/^\/status/i`
- Text is normalized (downcased and stripped) before matching
- `/start` and `/help` commands are grouped together and return the same response
- Unknown commands (anything that doesn't match the above patterns) return a friendly response, not an error
- The return format is always `{ ok: true, say: string }` - the `ok` property is always `true`
- The `say` property contains the message text to be sent to the user
- This method is called from `handleMessage` when a message is not forwarded to cursor-runner
- **Note**: The `chatId` and `messageId` parameters are part of the method signature for consistency with the calling code, but they are not used within the method body in the Rails implementation

### Related Methods

- Called by: `handleMessage` method (when message is not forwarded to cursor-runner)
- The response object is used by `handleMessage` to send messages via `TelegramService.sendMessage` or `sendTextAsAudio`

- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE2-083
- Next: PHASE2-085

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
