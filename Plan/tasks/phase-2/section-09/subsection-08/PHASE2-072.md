# PHASE2-072: Implement format_error_message utility

**Section**: 9. CursorRunnerCallbackController Conversion
**Subsection**: 9.8
**Task ID**: PHASE2-072

## Description

Convert and implement the `format_error_message` utility function from Rails to TypeScript/Node.js. This utility function formats error messages for cursor-runner callback results, including ANSI escape sequence cleaning and conditional debug formatting.

**Rails Reference**: `jarek-va/app/controllers/cursor_runner_callback_controller.rb` (lines 269-272)

## Checklist

- [ ] Create `formatErrorMessage` utility function with signature: `(result: NormalizedResult, cursorDebug: boolean): string`
- [ ] Extract error message from `result.error` with fallback to `'Unknown error occurred'` if error is missing/empty
- [ ] Use `cleanAnsiEscapeSequences` utility (PHASE2-073) to clean ANSI escape sequences from the error message
- [ ] Format error message based on `cursorDebug` flag:
  - If `cursorDebug` is `true`: return `'❌ Cursor command failed\n\nError: {error_msg}'`
  - If `cursorDebug` is `false`: return `'❌ {error_msg}'`
- [ ] Return formatted string
- [ ] Handle edge cases:
  - Empty/undefined error should use fallback `'Unknown error occurred'`
  - Null/undefined result should handle gracefully

## Notes

- This task is part of Phase 2: File-by-File Conversion
- Section: 9. CursorRunnerCallbackController Conversion
- **Rails Implementation**: `jarek-va/app/controllers/cursor_runner_callback_controller.rb` (lines 269-272)
- The function is called from `sendResponseToTelegram` method (PHASE2-070) when `result.success` is false
- The `result` parameter is a `NormalizedResult` object (from `normalizeResult` utility - PHASE2-069) with the following structure:
  - `success: boolean` - indicates if cursor command succeeded
  - `request_id: string` - request identifier
  - `repository?: string` - repository name
  - `branch_name?: string` - branch name
  - `iterations: number` - number of iterations (defaults to 0)
  - `max_iterations: number` - max iterations (defaults to 25)
  - `output?: string` - command output (defaults to empty string)
  - `error?: string` - error message if failed
  - `exit_code: number` - exit code (defaults to 0)
  - `duration?: string` - execution duration
  - `timestamp?: string` - timestamp
- The `cursorDebug` parameter determines:
  - Whether to include additional context ("Cursor command failed" header) in the error message
  - The format of the error message (with or without debug header)
- **Dependencies**:
  - `cleanAnsiEscapeSequences` utility (PHASE2-073) - used to clean ANSI escape codes from error messages
  - `NormalizedResult` type (from PHASE2-069)
- The function returns a string that will be sent to Telegram via `TelegramService.sendMessage()`
- Task can be completed independently by a single agent (after PHASE2-073 is complete for `cleanAnsiEscapeSequences` dependency)

## Related Tasks

- Previous: PHASE2-071
- Next: PHASE2-073

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
