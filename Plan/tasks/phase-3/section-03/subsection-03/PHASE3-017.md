# PHASE3-017: Review callback patterns and avoid callback hell

**Section**: 3. Node.js Best Practices
**Subsection**: 3.3
**Task ID**: PHASE3-017

## Description

Review and improve callback-based async patterns in the codebase to identify and eliminate callback hell. This task focuses specifically on Node.js callback conventions (error-first callbacks), nested callback patterns, and converting callback-based APIs to Promises or async/await. This complements PHASE3-005 (async/await and Promise patterns) and PHASE3-016 (error handling) by focusing on the specific anti-pattern of callback hell.

## Context

This task is distinct from:
- **PHASE3-005**: Reviews async/await and Promise patterns broadly (already converted code)
- **PHASE3-016**: Reviews error handling patterns (error objects, try-catch, etc.)
- **PHASE3-017**: Focuses specifically on **callback-based patterns** and **callback hell**

Callback hell occurs when callbacks are nested deeply, making code hard to read and maintain:
```typescript
// Bad: Callback hell
fs.readFile('file1.txt', (err1, data1) => {
  if (err1) throw err1;
  fs.readFile('file2.txt', (err2, data2) => {
    if (err2) throw err2;
    fs.readFile('file3.txt', (err3, data3) => {
      if (err3) throw err3;
      // Process all three files...
    });
  });
});
```

## Architecture Reference

Reference the planned architecture from:
- `Plan/app-description.md` - Application overview and component descriptions
- `Plan/CONVERSION_STEPS.md` - Conversion plan and architecture considerations
- `docs/architecture.md` - Architecture documentation and async patterns
- `src/` directory structure - Current implementation structure

The application uses:
- **Express.js** - May use callback-based middleware patterns
- **Redis/ioredis** - May have callback-based methods
- **BullMQ** - Queue system that uses Promises/async-await
- **Axios** - Promise-based HTTP client
- **File system operations** - May use fs callbacks
- **Stream operations** - May use event-based callbacks

## Node.js Callback Patterns

### Error-First Callback Convention

Node.js follows the error-first callback convention:
```typescript
function callback(error: Error | null, result?: T): void {
  if (error) {
    // Handle error
  } else {
    // Handle result
  }
}
```

### Common Callback-Based APIs

1. **fs module** - File system operations (fs.readFile, fs.writeFile, etc.)
2. **Stream operations** - Event-based callbacks (on('data'), on('error'))
3. **Legacy Redis clients** - Callback-based methods
4. **Express middleware** - Some middleware uses callbacks
5. **Database drivers** - Some older drivers use callbacks

## Checklist

- [ ] Identify callback-based patterns in the codebase
  - [ ] Search for error-first callback patterns `(err, result) => {}`
  - [ ] Find callback-based function calls (functions that take callbacks as last parameter)
  - [ ] Identify Node.js built-in APIs using callbacks (fs, stream, etc.)
  - [ ] Check for third-party libraries using callback patterns
  - [ ] Review Express middleware for callback patterns
  - [ ] Check Redis/ioredis usage for callback methods
  - [ ] Review file system operations for callback usage
  - [ ] Check stream operations for event-based callbacks
  - [ ] Review utility/helper functions for callback patterns

- [ ] Identify callback hell patterns
  - [ ] Find deeply nested callbacks (3+ levels of nesting)
  - [ ] Identify sequential callback chains that could be parallelized
  - [ ] Check for callback pyramids (increasing indentation)
  - [ ] Find callbacks within callbacks within callbacks
  - [ ] Identify callback chains that mix error handling inconsistently
  - [ ] Review callback nesting depth (should be ≤ 2 levels)

- [ ] Review callback error handling
  - [ ] Verify error-first callback convention is followed consistently
  - [ ] Check for missing error handling in callbacks
  - [ ] Verify error propagation in nested callbacks
  - [ ] Check for inconsistent error handling patterns
  - [ ] Review error handling in callback chains
  - [ ] Verify errors are not swallowed in callbacks

- [ ] Identify promisification opportunities
  - [ ] Find callback-based functions that should be promisified
  - [ ] Check if Node.js util.promisify can be used
  - [ ] Identify custom callback functions that need Promise wrappers
  - [ ] Review callback-based APIs that have Promise alternatives
  - [ ] Check for callback functions that could use async/await

- [ ] Review callback-to-Promise conversions
  - [ ] Verify proper use of util.promisify for Node.js APIs
  - [ ] Check for custom Promise wrappers around callbacks
  - [ ] Verify Promise wrappers handle errors correctly
  - [ ] Review converted code for proper async/await usage
  - [ ] Check that converted code maintains same functionality

- [ ] Review stream and event-based callbacks
  - [ ] Check for stream event handlers (on('data'), on('error'))
  - [ ] Identify stream patterns that could use async iterators
  - [ ] Review event emitter patterns for callback usage
  - [ ] Check for proper stream error handling
  - [ ] Verify stream cleanup in callbacks

- [ ] Review Express middleware callback patterns
  - [ ] Check route handlers for callback patterns
  - [ ] Verify async route handlers are properly wrapped
  - [ ] Review error middleware for callback patterns
  - [ ] Check for callback-based middleware that should be async
  - [ ] Verify Express async error handling patterns

- [ ] Check for mixed patterns
  - [ ] Identify code mixing callbacks with Promises
  - [ ] Find code mixing callbacks with async/await
  - [ ] Review for inconsistent async patterns
  - [ ] Check for unnecessary callback wrapping of Promises
  - [ ] Verify consistent async pattern usage

- [ ] Identify refactoring opportunities
  - [ ] List specific files/functions with callback hell
  - [ ] Document callback patterns that should be converted
  - [ ] Identify callback-based APIs that should be promisified
  - [ ] Propose refactoring strategies for nested callbacks
  - [ ] Create examples of before/after refactoring

- [ ] Document patterns and guidelines
  - [ ] Document when to use callbacks vs Promises vs async/await
  - [ ] Create guidelines for promisifying callback-based APIs
  - [ ] Document callback hell anti-patterns to avoid
  - [ ] Create examples of proper callback usage (when necessary)
  - [ ] Document conversion patterns from callbacks to async/await
  - [ ] Create examples of refactoring callback hell

## Best Practices

1. **Prefer Promises/async-await**: Use Promises or async/await instead of callbacks when possible
2. **Use util.promisify**: For Node.js built-in APIs, use `util.promisify()` to convert callbacks to Promises
3. **Avoid deep nesting**: Keep callback nesting to ≤ 2 levels
4. **Consistent error handling**: Follow error-first callback convention when callbacks are necessary
5. **Parallelize independent operations**: Use Promise.all() instead of sequential callbacks
6. **Stream handling**: Consider async iterators for stream operations instead of event callbacks

## Examples

### Bad: Callback Hell
```typescript
// Deeply nested callbacks
fs.readFile('config.json', (err1, config) => {
  if (err1) throw err1;
  const settings = JSON.parse(config);
  db.connect(settings.db, (err2, connection) => {
    if (err2) throw err2;
    connection.query('SELECT * FROM users', (err3, users) => {
      if (err3) throw err3;
      processUsers(users, (err4, result) => {
        if (err4) throw err4;
        // Finally done...
      });
    });
  });
});
```

### Good: Async/Await
```typescript
// Converted to async/await
async function processData() {
  try {
    const config = await fs.promises.readFile('config.json', 'utf-8');
    const settings = JSON.parse(config);
    const connection = await db.connect(settings.db);
    const users = await connection.query('SELECT * FROM users');
    const result = await processUsers(users);
    return result;
  } catch (error) {
    // Handle error
    throw error;
  }
}
```

### Promisification Example
```typescript
import { promisify } from 'util';
import * as fs from 'fs';

// Convert callback-based API to Promise
const readFile = promisify(fs.readFile);

// Now can use with async/await
const data = await readFile('file.txt', 'utf-8');
```

## Notes

- This task is part of Phase 3: Holistic Review and Best Practices
- Section: 3. Node.js Best Practices
- Focus specifically on **callback patterns** and **callback hell**, not general async/await patterns (see PHASE3-005)
- Review actual implementation files in `src/` directory
- Compare callback patterns with Node.js best practices
- Document findings with specific file locations and line numbers
- Reference async/await patterns from PHASE3-005 and error handling from PHASE3-016
- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE3-016
- Next: PHASE3-018

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
