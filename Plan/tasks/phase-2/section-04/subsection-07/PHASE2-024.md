# PHASE2-024: Implement download_file method

**Section**: 4. TelegramService Conversion
**Subsection**: 4.7
**Task ID**: PHASE2-024

## Description

Convert and implement the `downloadFile` method from Rails to TypeScript/Node.js. Reference `jarek-va/app/services/telegram_service.rb`.

The Rails implementation (`download_file`) downloads files from Telegram by:
1. Getting file information from Telegram Bot API using `get_file` endpoint
2. Extracting the file path from the API response
3. Constructing the download URL using the bot token and file path
4. Downloading the file from Telegram's file server
5. Saving to a specified destination path or temporary directory if not provided
6. Returning the path to the downloaded file

## Checklist

- [ ] Implement `downloadFile(fileId: string, destinationPath?: string): Promise<string | undefined>` method
  - Return type should be `Promise<string | undefined>` to account for early return when bot token is blank (matching Rails `return` behavior which returns `nil`)
- [ ] Add early return if bot token is blank (similar to other methods in TelegramService)
  - If bot token is blank/invalid, return `undefined` immediately (matching Rails `return` behavior which returns `nil`)
- [ ] Call Telegram Bot API `getFile` endpoint with the file_id
- [ ] Extract `file_path` from the API response (`result.file_path`)
- [ ] Construct download URL: `https://api.telegram.org/file/bot${botToken}/${file_path}`
- [ ] Handle optional `destinationPath` parameter:
  - If provided, use it as-is
  - If not provided (undefined), create temp path using `path.join(os.tmpdir(), "telegram_${fileId}_${filename}")` where filename is extracted from `file_path` using `path.basename(file_path)` (matches Rails `File.join(Dir.tmpdir, "telegram_#{file_id}_#{filename}")`)
- [ ] Implement private helper method `downloadFileFromUrl(url: string, destinationPath: string): Promise<void>`
  - Use `axios` or `node:https`/`node:http` to download the file
  - Ensure parent directory exists using `fs.mkdir` with `path.dirname(destinationPath)` and `{ recursive: true }` option (matches Rails `FileUtils.mkdir_p(File.dirname(destination_path))`)
  - Write file using `fs.writeFile` or `fs.promises.writeFile` with binary mode
  - Log success message with file size (similar to Rails: "Downloaded file to {path} ({size} bytes)")
  - Raise/throw error if HTTP request fails with format: "Failed to download file: HTTP {statusCode} {statusMessage}" (check status code, similar to Rails `Net::HTTPSuccess`)
- [ ] Call `downloadFileFromUrl` helper method to perform the actual download
- [ ] Return the `destinationPath` string
- [ ] Add comprehensive error handling:
  - Wrap in try-catch block
  - Log errors with context (file_id, error message)
  - Log error stack trace
  - Re-throw errors after logging
- [ ] Add logging for download start: "Downloading Telegram file {fileId} to {destinationPath}"
- [ ] Ensure method signature matches TypeScript conventions (camelCase, Promise return type)

## Notes

- This task is part of Phase 2: File-by-File Conversion
- Section: 4. TelegramService Conversion
- Reference the Rails implementation (`jarek-va/app/services/telegram_service.rb`) for behavior
- The Rails implementation uses a private helper method `download_file_from_url` - this should be implemented as `downloadFileFromUrl` in TypeScript
- Rails uses `Net::HTTP` for downloading - in TypeScript, use `axios` (already in dependencies) or Node.js built-in `https`/`http` modules
  - If using `axios`, set `responseType: 'arraybuffer'` or `responseType: 'stream'` to handle binary file data correctly
  - If using Node.js `https`/`http`, handle the response stream appropriately for binary data
- Rails uses `File.binwrite` for binary file writing - use `fs.writeFile` or `fs.promises.writeFile` in Node.js (no encoding specified, writes binary)
- Rails uses `Dir.tmpdir` for temp directory - use `os.tmpdir()` in Node.js
- Rails uses `FileUtils.mkdir_p` for directory creation - use `fs.mkdir` with `{ recursive: true }` in Node.js
- Rails uses `File.join` and `File.basename` and `File.dirname` - use Node.js `path.join`, `path.basename`, and `path.dirname` respectively
- The method should return the destination path string (same as Rails), or `undefined` if bot token is blank (early return)
- Return type should be `Promise<string | undefined>` to account for early return when bot token is blank (matching Rails `return` behavior which returns `nil`)
- Error handling pattern should match other TelegramService methods (early return if token blank, try-catch with logging, re-throw)
- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE2-023
- Next: PHASE2-025

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
