# PHASE3-018: Review resource cleanup (file handles, connections)

**Section**: 3. Node.js Best Practices
**Subsection**: 3.4
**Task ID**: PHASE3-018

## Description

Review and improve resource cleanup (file handles, connections) in the codebase to ensure best practices. This task focuses on identifying and fixing resource leaks, ensuring proper cleanup of connections, file handles, and other resources in both success and error scenarios. Proper resource cleanup is critical for preventing memory leaks, connection exhaustion, and ensuring graceful application shutdown.

## Context

This task is distinct from:
- **PHASE3-005**: Reviews async/await and Promise patterns broadly
- **PHASE3-016**: Reviews error handling patterns (error objects, try-catch, etc.)
- **PHASE3-017**: Reviews callback patterns and callback hell
- **PHASE3-018**: Focuses specifically on **resource cleanup** and **preventing resource leaks**

Resource cleanup involves:
- Closing file handles after use
- Closing database connections properly
- Closing Redis connections on shutdown
- Cleaning up HTTP connections and request/response streams
- Ensuring cleanup happens in error scenarios (try-catch-finally)
- Implementing graceful shutdown handlers
- Cleaning up event listeners and timers

## Architecture Reference

Reference the planned architecture from:
- `Plan/app-description.md` - Application overview and component descriptions
- `Plan/CONVERSION_STEPS.md` - Conversion plan and architecture considerations
- `docs/architecture.md` - Architecture documentation and resource management patterns
- `src/` directory structure - Current implementation structure

The application uses:
- **Express.js** - HTTP server that needs graceful shutdown
- **Redis/ioredis** - Redis connections that need cleanup
- **BullMQ** - Queue system that uses Redis and needs cleanup
- **Axios** - HTTP client that may create connections
- **File system operations** - File handles that need cleanup
- **Stream operations** - Streams that need proper closing

## Node.js Resource Management

### Common Resources That Need Cleanup

1. **File Handles** - Files opened with `fs.open()`, `fs.createReadStream()`, `fs.createWriteStream()`
2. **Database Connections** - Connection pools, individual connections
3. **Redis Connections** - Redis clients, connection pools
4. **HTTP Connections** - HTTP clients, request/response streams, keep-alive connections
5. **Event Listeners** - Event emitters, timers, intervals
6. **Streams** - Readable/writable streams, transform streams
7. **Sockets** - Network sockets, WebSocket connections

### Cleanup Patterns

1. **Try-Finally Pattern**: Ensure cleanup happens even if errors occur
2. **Graceful Shutdown**: Handle SIGTERM/SIGINT signals to close connections
3. **Resource Pooling**: Properly close pooled resources
4. **Stream Cleanup**: Close streams explicitly, handle stream errors
5. **Event Listener Cleanup**: Remove event listeners to prevent memory leaks

## Checklist

- [ ] Review file handle cleanup
  - [ ] Search for `fs.open()`, `fs.createReadStream()`, `fs.createWriteStream()` usage
  - [ ] Verify file handles are closed with `fs.close()` or stream `.close()`/`.destroy()`
  - [ ] Check for file operations in try-catch-finally blocks
  - [ ] Verify file cleanup happens in error scenarios
  - [ ] Check for temporary file cleanup (downloaded Telegram files)
  - [ ] Review file stream error handling and cleanup
  - [ ] Verify file operations use async/await with proper cleanup

- [ ] Review database connection cleanup
  - [ ] Check if database connections are used (SQLite, PostgreSQL, etc.)
  - [ ] Verify connection pools are properly closed on shutdown
  - [ ] Check for connection leaks (connections not returned to pool)
  - [ ] Review connection cleanup in error scenarios
  - [ ] Verify graceful shutdown closes database connections
  - [ ] Check for transaction cleanup (rollback on errors)

- [ ] Review Redis connection cleanup
  - [ ] Find all Redis client instances (`redis`, `ioredis` clients)
  - [ ] Verify Redis clients are closed on application shutdown
  - [ ] Check for Redis connection cleanup in error scenarios
  - [ ] Review Redis client creation patterns (singleton vs multiple instances)
  - [ ] Verify Redis clients use `.quit()` or `.disconnect()` for cleanup
  - [ ] Check BullMQ Redis connection cleanup (queue and worker connections)
  - [ ] Review Redis connection error handling and reconnection cleanup
  - [ ] Verify Redis cleanup happens before process exit

- [ ] Review HTTP connection cleanup
  - [ ] Check Axios instance usage and cleanup
  - [ ] Verify HTTP request/response streams are properly handled
  - [ ] Review keep-alive connection handling
  - [ ] Check for HTTP connection leaks (unclosed requests)
  - [ ] Verify HTTP client cleanup on shutdown
  - [ ] Review timeout handling and connection cleanup
  - [ ] Check for proper error handling in HTTP requests (cleanup on errors)

- [ ] Review Express server cleanup
  - [ ] Verify Express server has graceful shutdown handler
  - [ ] Check for proper server `.close()` on shutdown signals
  - [ ] Review request cleanup (ongoing requests handled during shutdown)
  - [ ] Verify server cleanup waits for in-flight requests
  - [ ] Check for proper error handling in server shutdown

- [ ] Review BullMQ queue cleanup
  - [ ] Verify queue instances are properly closed on shutdown
  - [ ] Check worker cleanup (workers closed gracefully)
  - [ ] Review job cleanup (in-progress jobs handled during shutdown)
  - [ ] Verify Redis connection cleanup for queues
  - [ ] Check for queue cleanup in error scenarios

- [ ] Review stream cleanup
  - [ ] Find all stream usage (readable, writable, transform streams)
  - [ ] Verify streams are closed with `.close()` or `.destroy()`
  - [ ] Check for stream error handling and cleanup
  - [ ] Review stream pipe cleanup
  - [ ] Verify stream cleanup happens in error scenarios
  - [ ] Check for stream event listener cleanup

- [ ] Review event listener cleanup
  - [ ] Find all event listeners (`.on()`, `.once()`, `.addListener()`)
  - [ ] Verify event listeners are removed with `.off()` or `.removeListener()`
  - [ ] Check for memory leaks from unremoved listeners
  - [ ] Review process event listeners (SIGTERM, SIGINT, uncaughtException)
  - [ ] Verify event listener cleanup on component destruction

- [ ] Review timer cleanup
  - [ ] Find all `setTimeout()`, `setInterval()` usage
  - [ ] Verify timers are cleared with `clearTimeout()`, `clearInterval()`
  - [ ] Check for timer cleanup in error scenarios
  - [ ] Review timer cleanup on component destruction
  - [ ] Verify no orphaned timers remain

- [ ] Check for resource leaks
  - [ ] Review code for resources created but never cleaned up
  - [ ] Check for resources created in loops without cleanup
  - [ ] Verify resources are cleaned up in all code paths (success and error)
  - [ ] Review long-running processes for resource accumulation
  - [ ] Check for circular references preventing garbage collection

- [ ] Review cleanup in error scenarios
  - [ ] Verify try-catch-finally blocks properly clean up resources
  - [ ] Check that cleanup happens even when errors are thrown
  - [ ] Review error handling in async functions (cleanup in catch blocks)
  - [ ] Verify cleanup in Promise rejection handlers
  - [ ] Check for cleanup in error middleware and handlers

- [ ] Review graceful shutdown implementation
  - [ ] Check for SIGTERM/SIGINT signal handlers
  - [ ] Verify graceful shutdown closes all connections
  - [ ] Review shutdown timeout handling
  - [ ] Check for proper process exit after cleanup
  - [ ] Verify shutdown handlers are registered early in application lifecycle
  - [ ] Review shutdown order (close servers, then connections, then exit)

- [ ] Add proper cleanup where needed
  - [ ] Implement graceful shutdown handlers if missing
  - [ ] Add resource cleanup in error scenarios
  - [ ] Add cleanup for file handles, streams, connections
  - [ ] Implement proper cleanup for Redis clients
  - [ ] Add cleanup for HTTP clients and connections
  - [ ] Add cleanup for event listeners and timers
  - [ ] Ensure cleanup happens in all code paths

- [ ] Document cleanup patterns
  - [ ] Document resource cleanup best practices
  - [ ] Create examples of proper cleanup patterns
  - [ ] Document graceful shutdown implementation
  - [ ] Create guidelines for resource management
  - [ ] Document cleanup patterns for each resource type

## Best Practices

1. **Always use try-finally**: Ensure cleanup happens even if errors occur
2. **Close resources explicitly**: Don't rely on garbage collection for cleanup
3. **Implement graceful shutdown**: Handle SIGTERM/SIGINT to close connections
4. **Clean up in error handlers**: Ensure cleanup happens in catch blocks
5. **Use resource pooling**: Properly manage pooled resources
6. **Remove event listeners**: Prevent memory leaks from unremoved listeners
7. **Clear timers**: Always clear timers when components are destroyed
8. **Close streams**: Explicitly close streams, don't rely on end-of-stream
9. **Wait for cleanup**: In graceful shutdown, wait for in-flight operations
10. **Test cleanup**: Write tests to verify resources are properly cleaned up

## Examples

### Bad: Missing Cleanup
```typescript
// File handle not closed
async function downloadFile(url: string) {
  const response = await axios.get(url, { responseType: 'stream' });
  const writer = fs.createWriteStream('file.txt');
  response.data.pipe(writer);
  // Missing: writer.close(), response.data.destroy()
}

// Redis connection not closed
const redis = new Redis(redisUrl);
// Missing: redis.quit() on shutdown
```

### Good: Proper Cleanup
```typescript
// File handle properly closed
async function downloadFile(url: string) {
  const writer = fs.createWriteStream('file.txt');
  try {
    const response = await axios.get(url, { responseType: 'stream' });
    response.data.pipe(writer);
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
      response.data.on('error', reject);
    });
  } finally {
    writer.close();
    response?.data?.destroy();
  }
}

// Redis connection properly closed
const redis = new Redis(redisUrl);

// Graceful shutdown
process.on('SIGTERM', async () => {
  await redis.quit();
  process.exit(0);
});
```

### Graceful Shutdown Example
```typescript
let server: Server;
let redis: Redis;
let queue: Queue;

async function gracefulShutdown(signal: string) {
  console.log(`Received ${signal}, starting graceful shutdown...`);
  
  // Stop accepting new requests
  server.close(() => {
    console.log('HTTP server closed');
  });
  
  // Close queue and workers
  await queue.close();
  await worker.close();
  
  // Close Redis connection
  await redis.quit();
  
  // Exit process
  setTimeout(() => {
    console.log('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
  
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
```

## Notes

- This task is part of Phase 3: Holistic Review and Best Practices
- Section: 3. Node.js Best Practices
- Focus specifically on **resource cleanup** and **preventing resource leaks**
- Review actual implementation files in `src/` directory
- Compare resource cleanup patterns with Node.js best practices
- Document findings with specific file locations and line numbers
- Reference error handling patterns from PHASE3-016 and async patterns from PHASE3-005
- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE3-017
- Next: PHASE3-019

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
