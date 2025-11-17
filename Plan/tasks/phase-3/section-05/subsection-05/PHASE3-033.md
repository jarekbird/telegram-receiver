# PHASE3-033: Review API response times

**Section**: 5. Performance Review
**Subsection**: 5.5
**Task ID**: PHASE3-033

## Description

Review and improve API response times in the codebase to ensure best practices. This task focuses on measuring, analyzing, and optimizing API endpoint response times, identifying performance bottlenecks, and ensuring efficient handling of requests throughout the application.

Reference the Rails implementation patterns where applicable to understand expected response time behavior and ensure the TypeScript implementation follows Node.js best practices for API performance.

## Checklist

### Response Time Measurement and Monitoring
- [ ] Set up response time measurement tools
  - Configure Express middleware for response time tracking (e.g., `response-time` middleware)
  - Set up request timing instrumentation
  - Configure logging to include response times
  - Set up performance monitoring in production (if applicable)
- [ ] Establish response time baselines
  - Measure baseline response times for all endpoints
  - Measure response times under normal load
  - Measure response times under peak load
  - Document response time percentiles (p50, p95, p99)
- [ ] Monitor response time trends
  - Track response time changes over time
  - Identify endpoints with degrading performance
  - Monitor response time spikes and their causes
  - Track response times per endpoint category

### Endpoint-Specific Analysis
- [ ] Review health check endpoint (`GET /health`)
  - Measure response time (should be < 10ms)
  - Verify no unnecessary operations
  - Check for blocking operations
  - Ensure minimal dependencies
- [ ] Review Telegram webhook endpoint (`POST /telegram/webhook`)
  - Measure end-to-end response time
  - Measure time to acknowledge request (should be < 200ms)
  - Review time spent in authentication/validation
  - Check for synchronous operations that could be async
  - Verify webhook response is sent quickly (before processing)
- [ ] Review cursor-runner callback endpoint (`POST /cursor-runner/callback`)
  - Measure response time for callback processing
  - Review time spent updating Redis state
  - Check for blocking operations in callback handler
  - Verify callback response is sent promptly
- [ ] Review admin endpoints (if any)
  - Measure response times for admin operations
  - Review authentication overhead
  - Check for unnecessary operations

### Database Query Performance
- [ ] Review Redis query patterns
  - Measure Redis operation times (GET, SET, DEL)
  - Check for Redis connection overhead
  - Review Redis query batching opportunities
  - Verify Redis connection pooling is efficient
- [ ] Review database query times (if applicable)
  - Measure query execution times
  - Identify slow queries (> 100ms)
  - Check for N+1 query problems
  - Review query optimization opportunities
- [ ] Review query caching
  - Check if frequently accessed data is cached
  - Review cache hit rates
  - Verify cache invalidation doesn't cause delays
  - Check for cache warming strategies

### External API Call Performance
- [ ] Review Telegram API call times
  - Measure time for sending messages via TelegramService
  - Measure time for downloading files
  - Review retry logic and timeout handling
  - Check for connection reuse (HTTP keep-alive)
  - Verify API calls are not blocking request handling
- [ ] Review Cursor Runner API call times
  - Measure time for execute/iterate calls
  - Review timeout configurations
  - Check for connection pooling
  - Verify async handling of long-running operations
- [ ] Review ElevenLabs API call times (if applicable)
  - Measure speech-to-text API call times
  - Measure text-to-speech API call times
  - Review timeout and retry configurations
  - Check for connection reuse

### Asynchronous Operation Review
- [ ] Review async/await patterns
  - Verify operations are properly awaited
  - Check for unnecessary sequential operations that could be parallel
  - Review Promise.all() usage for parallel operations
  - Verify no blocking synchronous operations in async handlers
- [ ] Review background job processing
  - Measure time to enqueue jobs (should be < 50ms)
  - Review job processing times (separate from API response)
  - Check for jobs that should be fire-and-forget
  - Verify long-running operations are moved to background jobs
- [ ] Review event loop blocking
  - Check for CPU-intensive operations in request handlers
  - Review synchronous file operations
  - Check for large JSON parsing/serialization
  - Verify heavy computations are offloaded to workers or jobs

### Middleware Performance
- [ ] Review middleware execution times
  - Measure authentication middleware overhead
  - Measure validation middleware overhead
  - Review logging middleware performance
  - Check for unnecessary middleware on fast paths
- [ ] Review error handling middleware
  - Measure error handling overhead
  - Verify error handling doesn't add significant latency
  - Check for error logging performance
- [ ] Review request parsing middleware
  - Measure JSON body parsing time
  - Review body size limits and their impact
  - Check for streaming vs buffering trade-offs

### Network and Connection Performance
- [ ] Review HTTP connection handling
  - Verify HTTP keep-alive is enabled
  - Check connection pooling configuration
  - Review connection timeout settings
  - Measure connection establishment overhead
- [ ] Review request/response size
  - Check for unnecessarily large request bodies
  - Review response payload sizes
  - Verify compression is enabled (gzip/brotli)
  - Check for streaming large responses

### Bottleneck Identification
- [ ] Identify slow endpoints
  - List endpoints with response time > 200ms (p95)
  - List endpoints with response time > 500ms (p95)
  - Prioritize endpoints by traffic volume and response time
  - Document slow endpoint analysis
- [ ] Identify blocking operations
  - Find synchronous file operations
  - Identify synchronous network calls
  - Check for synchronous database operations
  - Review CPU-intensive operations in request handlers
- [ ] Identify sequential operations that could be parallel
  - Review operations that don't depend on each other
  - Check for opportunities to use Promise.all()
  - Review waterfall patterns that could be parallelized
- [ ] Identify unnecessary operations
  - Check for redundant API calls
  - Review unnecessary data transformations
  - Check for over-fetching data
  - Review unnecessary logging or monitoring overhead

### Performance Optimization Opportunities
- [ ] Review caching strategies
  - Identify cacheable responses
  - Review cache key strategies
  - Check for cache invalidation overhead
  - Verify cache hit rates are optimal
- [ ] Review data processing optimization
  - Check for unnecessary data transformations
  - Review JSON parsing/serialization overhead
  - Check for inefficient data structures
  - Review string manipulation efficiency
- [ ] Review memory allocation patterns
  - Check for unnecessary object creation in hot paths
  - Review buffer allocation strategies
  - Check for memory pressure affecting GC pauses
- [ ] Review code-level optimizations
  - Check for inefficient algorithms
  - Review loop optimizations
  - Check for unnecessary function calls
  - Review regex performance

### Response Time Targets and SLAs
- [ ] Define response time targets
  - Set target response times per endpoint type
  - Define p95 and p99 targets
  - Set maximum acceptable response times
  - Document SLA requirements
- [ ] Set up response time alerts
  - Configure alerts for slow endpoints
  - Set up alerts for response time degradation
  - Configure alerts for SLA violations
  - Review alert thresholds

### Documentation and Reporting
- [ ] Document performance metrics
  - Document baseline response times for all endpoints
  - Document response time percentiles (p50, p95, p99)
  - Create performance dashboard or report
  - Document performance trends over time
- [ ] Document performance improvements
  - Document optimizations made
  - Document performance gains achieved
  - Create performance improvement recommendations
  - Document future optimization opportunities
- [ ] Document performance testing procedures
  - Document how to measure response times
  - Document performance testing tools and setup
  - Create performance regression test procedures
  - Document performance monitoring setup

## Notes

- This task is part of Phase 3: Holistic Review and Best Practices
- Section: 5. Performance Review
- Focus on identifying issues and improvements
- Document findings and decisions

- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE3-032
- Next: PHASE3-034

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
