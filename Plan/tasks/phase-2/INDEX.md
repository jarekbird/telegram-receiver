# Phase 2 Tasks Index

This file provides an index of all tasks for Phase 2: File-by-File Conversion from Ruby on Rails to TypeScript/Node.js.

## Task List

### 1. TypeScript Type Definitions

- [PHASE2-001](section-01/subsection-01/PHASE2-001.md): Create Telegram API types
- [PHASE2-002](section-01/subsection-02/PHASE2-002.md): Create Cursor Runner API types
- [PHASE2-003](section-01/subsection-03/PHASE2-003.md): Create ElevenLabs API types
- [PHASE2-004](section-01/subsection-04/PHASE2-004.md): Create Redis callback data types
- [PHASE2-005](section-01/subsection-05/PHASE2-005.md): Create service error types
- [PHASE2-006](section-01/subsection-06/PHASE2-006.md): Create job payload types

### 2. Redis Integration

- [PHASE2-007](section-02/subsection-01/PHASE2-007.md): Install Redis client dependencies
- [PHASE2-008](section-02/subsection-02/PHASE2-008.md): Create Redis client configuration
- [PHASE2-009](section-02/subsection-03/PHASE2-009.md): Create Redis connection utility
- [PHASE2-010](section-02/subsection-04/PHASE2-010.md): Add Redis connection error handling
- [PHASE2-011](section-02/subsection-05/PHASE2-011.md): Test Redis connection

### 3. Queue System Setup (BullMQ)

- [PHASE2-012](section-03/subsection-01/PHASE2-012.md): Install BullMQ dependencies
- [PHASE2-013](section-03/subsection-02/PHASE2-013.md): Create queue configuration
- [PHASE2-014](section-03/subsection-03/PHASE2-014.md): Create queue connection utility
- [PHASE2-015](section-03/subsection-04/PHASE2-015.md): Create base job processor class
- [PHASE2-016](section-03/subsection-05/PHASE2-016.md): Add queue error handling
- [PHASE2-017](section-03/subsection-06/PHASE2-017.md): Test queue system

### 4. TelegramService Conversion

- [PHASE2-018](section-04/subsection-01/PHASE2-018.md): Create TelegramService class structure
- [PHASE2-019](section-04/subsection-02/PHASE2-019.md): Implement send_message method
- [PHASE2-020](section-04/subsection-03/PHASE2-020.md): Implement set_webhook method
- [PHASE2-021](section-04/subsection-04/PHASE2-021.md): Implement delete_webhook method
- [PHASE2-022](section-04/subsection-05/PHASE2-022.md): Implement webhook_info method
- [PHASE2-023](section-04/subsection-06/PHASE2-023.md): Implement send_voice method
- [PHASE2-024](section-04/subsection-07/PHASE2-024.md): Implement download_file method
- [PHASE2-025](section-04/subsection-08/PHASE2-025.md): Implement HTML entity escaping utility
- [PHASE2-026](section-04/subsection-09/PHASE2-026.md): Add error handling to TelegramService
- [PHASE2-027](section-04/subsection-10/PHASE2-027.md): Write TelegramService unit tests

### 5. CursorRunnerService Conversion

- [PHASE2-028](section-05/subsection-01/PHASE2-028.md): Create CursorRunnerService class structure
- [PHASE2-029](section-05/subsection-02/PHASE2-029.md): Implement HTTP client utilities
- [PHASE2-030](section-05/subsection-03/PHASE2-030.md): Implement execute method
- [PHASE2-031](section-05/subsection-04/PHASE2-031.md): Implement iterate method
- [PHASE2-032](section-05/subsection-05/PHASE2-032.md): Implement clone_repository method
- [PHASE2-033](section-05/subsection-06/PHASE2-033.md): Implement list_repositories method
- [PHASE2-034](section-05/subsection-07/PHASE2-034.md): Implement checkout_branch method
- [PHASE2-035](section-05/subsection-08/PHASE2-035.md): Implement push_branch method
- [PHASE2-036](section-05/subsection-09/PHASE2-036.md): Implement pull_branch method
- [PHASE2-037](section-05/subsection-10/PHASE2-037.md): Add error handling and custom error classes
- [PHASE2-038](section-05/subsection-11/PHASE2-038.md): Write CursorRunnerService unit tests

### 6. CursorRunnerCallbackService Conversion

- [PHASE2-039](section-06/subsection-01/PHASE2-039.md): Create CursorRunnerCallbackService class structure
- [PHASE2-040](section-06/subsection-02/PHASE2-040.md): Implement store_pending_request method
- [PHASE2-041](section-06/subsection-03/PHASE2-041.md): Implement get_pending_request method
- [PHASE2-042](section-06/subsection-04/PHASE2-042.md): Implement remove_pending_request method
- [PHASE2-043](section-06/subsection-05/PHASE2-043.md): Add error handling and TTL management
- [PHASE2-044](section-06/subsection-06/PHASE2-044.md): Write CursorRunnerCallbackService unit tests

### 7. ElevenLabs Services Conversion

- [PHASE2-045](section-07/subsection-01/PHASE2-045.md): Create ElevenLabsSpeechToTextService class structure
- [PHASE2-046](section-07/subsection-02/PHASE2-046.md): Implement transcribe method (file path)
- [PHASE2-047](section-07/subsection-03/PHASE2-047.md): Implement transcribe_io method
- [PHASE2-048](section-07/subsection-04/PHASE2-048.md): Add error handling to SpeechToTextService
- [PHASE2-049](section-07/subsection-05/PHASE2-049.md): Write SpeechToTextService unit tests
- [PHASE2-050](section-07/subsection-06/PHASE2-050.md): Create ElevenLabsTextToSpeechService class structure
- [PHASE2-051](section-07/subsection-07/PHASE2-051.md): Implement synthesize method
- [PHASE2-052](section-07/subsection-08/PHASE2-052.md): Implement synthesize_to_io method
- [PHASE2-053](section-07/subsection-09/PHASE2-053.md): Add error handling to TextToSpeechService
- [PHASE2-054](section-07/subsection-10/PHASE2-054.md): Write TextToSpeechService unit tests

### 8. TelegramController Conversion

- [PHASE2-055](section-08/subsection-01/PHASE2-055.md): Create TelegramController class structure
- [PHASE2-056](section-08/subsection-02/PHASE2-056.md): Implement webhook endpoint handler
- [PHASE2-057](section-08/subsection-03/PHASE2-057.md): Implement webhook authentication middleware
- [PHASE2-058](section-08/subsection-04/PHASE2-058.md): Implement set_webhook endpoint
- [PHASE2-059](section-08/subsection-05/PHASE2-059.md): Implement webhook_info endpoint
- [PHASE2-060](section-08/subsection-06/PHASE2-060.md): Implement delete_webhook endpoint
- [PHASE2-061](section-08/subsection-07/PHASE2-061.md): Implement admin authentication middleware
- [PHASE2-062](section-08/subsection-08/PHASE2-062.md): Add error handling to TelegramController
- [PHASE2-063](section-08/subsection-09/PHASE2-063.md): Create extract_chat_info utility function
- [PHASE2-064](section-08/subsection-10/PHASE2-064.md): Write TelegramController integration tests

### 9. CursorRunnerCallbackController Conversion

- [PHASE2-065](section-09/subsection-01/PHASE2-065.md): Create CursorRunnerCallbackController class structure
- [PHASE2-066](section-09/subsection-02/PHASE2-066.md): Implement callback endpoint handler
- [PHASE2-067](section-09/subsection-03/PHASE2-067.md): Implement webhook authentication
- [PHASE2-068](section-09/subsection-04/PHASE2-068.md): Implement process_callback method
- [PHASE2-069](section-09/subsection-05/PHASE2-069.md): Implement normalize_result utility
- [PHASE2-070](section-09/subsection-06/PHASE2-070.md): Implement send_response_to_telegram method
- [PHASE2-071](section-09/subsection-07/PHASE2-071.md): Implement format_success_message utility
- [PHASE2-072](section-09/subsection-08/PHASE2-072.md): Implement format_error_message utility
- [PHASE2-073](section-09/subsection-09/PHASE2-073.md): Implement clean_ansi_escape_sequences utility
- [PHASE2-074](section-09/subsection-10/PHASE2-074.md): Implement send_text_as_audio method
- [PHASE2-075](section-09/subsection-11/PHASE2-075.md): Add error handling to CallbackController
- [PHASE2-076](section-09/subsection-12/PHASE2-076.md): Write CallbackController integration tests

### 10. TelegramMessageJob Conversion

- [PHASE2-077](section-10/subsection-01/PHASE2-077.md): Create TelegramMessageJob processor class
- [PHASE2-078](section-10/subsection-02/PHASE2-078.md): Implement process method (main entry point)
- [PHASE2-079](section-10/subsection-03/PHASE2-079.md): Implement handle_message method
- [PHASE2-080](section-10/subsection-04/PHASE2-080.md): Implement handle_callback_query method
- [PHASE2-081](section-10/subsection-05/PHASE2-081.md): Implement extract_audio_file_id utility
- [PHASE2-082](section-10/subsection-06/PHASE2-082.md): Implement transcribe_audio method
- [PHASE2-083](section-10/subsection-07/PHASE2-083.md): Implement forward_to_cursor_runner method
- [PHASE2-084](section-10/subsection-08/PHASE2-084.md): Implement process_local_message method
- [PHASE2-085](section-10/subsection-09/PHASE2-085.md): Implement send_text_as_audio method
- [PHASE2-086](section-10/subsection-10/PHASE2-086.md): Add error handling to TelegramMessageJob
- [PHASE2-087](section-10/subsection-11/PHASE2-087.md): Register job processor with queue
- [PHASE2-088](section-10/subsection-12/PHASE2-088.md): Write TelegramMessageJob unit tests

### 11. Routes Configuration

- [PHASE2-089](section-11/subsection-01/PHASE2-089.md): Create routes directory structure
- [PHASE2-090](section-11/subsection-02/PHASE2-090.md): Create health routes
- [PHASE2-091](section-11/subsection-03/PHASE2-091.md): Create telegram routes
- [PHASE2-092](section-11/subsection-04/PHASE2-092.md): Create cursor-runner callback routes
- [PHASE2-093](section-11/subsection-05/PHASE2-093.md): Register all routes in main app
- [PHASE2-094](section-11/subsection-06/PHASE2-094.md): Test all routes

### 12. Middleware

- [PHASE2-095](section-12/subsection-01/PHASE2-095.md): Create authentication middleware directory
- [PHASE2-096](section-12/subsection-02/PHASE2-096.md): Create webhook authentication middleware
- [PHASE2-097](section-12/subsection-03/PHASE2-097.md): Create admin authentication middleware
- [PHASE2-098](section-12/subsection-04/PHASE2-098.md): Apply middleware to routes
- [PHASE2-099](section-12/subsection-05/PHASE2-099.md): Test middleware functionality

### 13. Testing

- [PHASE2-100](section-13/subsection-01/PHASE2-100.md): Create service test fixtures
- [PHASE2-101](section-13/subsection-02/PHASE2-101.md): Create controller test fixtures
- [PHASE2-102](section-13/subsection-03/PHASE2-102.md): Create job test fixtures
- [PHASE2-103](section-13/subsection-04/PHASE2-103.md): Write integration tests for webhook flow
- [PHASE2-104](section-13/subsection-05/PHASE2-104.md): Write integration tests for callback flow
- [PHASE2-105](section-13/subsection-06/PHASE2-105.md): Write E2E tests for complete message flow

## Summary

Total tasks: 105

## Quick Reference

This phase converts the Rails application components to TypeScript/Node.js:
- Type definitions for all external APIs
- Redis integration for callback state management
- BullMQ queue system for async job processing
- All services (Telegram, Cursor Runner, Callback, ElevenLabs)
- All controllers (Telegram, Callback)
- Message job processor
- Routes and middleware
- Comprehensive test coverage

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

