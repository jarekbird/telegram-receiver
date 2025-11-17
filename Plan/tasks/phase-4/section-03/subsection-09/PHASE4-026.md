# PHASE4-026: Create code quality metrics dashboard

**Section**: 3. Refactoring
**Subsection**: 3.9
**Task ID**: PHASE4-026

## Description

Create a comprehensive code quality metrics dashboard to track and visualize code quality metrics, improve code quality, and maintainability. This dashboard should aggregate metrics from various code quality tools (Jest coverage, ESLint, complexity analysis, duplication detection) and present them in a clear, actionable format.

This task implements the "Code metrics dashboard" deliverable specified in Phase 4: Code Quality Audit (CONVERSION_STEPS.md). The dashboard should provide visibility into code quality trends and help identify areas for improvement.

## Scope

This task covers:
- Setting up automated metrics collection from existing tools (Jest coverage, ESLint)
- Integrating complexity analysis tools (e.g., eslint-plugin-complexity, complexity-report)
- Integrating duplication detection tools (e.g., jscpd)
- Calculating maintainability index
- Creating a dashboard (markdown report or web-based) that aggregates all metrics
- Adding visualizations (charts, graphs, tables) for metrics
- Documenting the dashboard and how to use it
- Setting up automated generation (via npm scripts or CI/CD)

## Checklist

### Set Up Metrics Collection Infrastructure
- [ ] Review existing code quality tools:
  - Jest coverage (already configured in `jest.config.ts`)
  - ESLint (already configured in `.eslintrc.json`)
  - Prettier (already configured)
- [ ] Install complexity analysis tool:
  - Install `eslint-plugin-complexity` or `complexity-report` package
  - Configure complexity rules in ESLint (if using eslint-plugin-complexity)
  - Set up script to run complexity analysis
- [ ] Install duplication detection tool:
  - Install `jscpd` (JavaScript Copy/Paste Detector) package
  - Configure jscpd for TypeScript files
  - Set up script to run duplication detection
- [ ] Set up metrics collection script:
  - Create script to collect all metrics (coverage, complexity, duplication, ESLint)
  - Aggregate metrics into a single JSON/data structure
  - Handle errors gracefully if tools are unavailable

### Collect Code Coverage Metrics
- [ ] Extract code coverage data from Jest:
  - Use existing `npm run test:coverage` output
  - Parse coverage data (from `coverage/lcov.info` or `coverage/coverage-summary.json`)
  - Extract key metrics:
    - Overall coverage percentage
    - Line coverage
    - Statement coverage
    - Branch coverage
    - Function coverage
    - Per-file coverage breakdown
- [ ] Calculate coverage trends (if historical data available)
- [ ] Identify files with low coverage (<80% threshold)

### Collect Complexity Metrics
- [ ] Run complexity analysis on source code:
  - Analyze cyclomatic complexity per function/method
  - Identify functions with high complexity (>10 threshold)
  - Calculate average complexity per file
  - Calculate overall project complexity
- [ ] Extract complexity data:
  - Functions/methods exceeding complexity thresholds
  - Files with high average complexity
  - Complexity distribution across the codebase
- [ ] Categorize complexity levels (low, medium, high, very high)

### Collect Duplication Metrics
- [ ] Run duplication detection:
  - Execute jscpd on `src/` directory
  - Configure jscpd to detect TypeScript code duplication
  - Set appropriate similarity threshold (e.g., 80%)
- [ ] Extract duplication data:
  - Overall duplication percentage
  - Number of duplicate blocks
  - Duplicate code locations (file paths and line numbers)
  - Size of duplicate blocks
- [ ] Identify largest duplicate blocks for prioritization

### Calculate Maintainability Index
- [ ] Research maintainability index calculation:
  - Use standard formula: MI = 171 - 5.2 * ln(Halstead Volume) - 0.23 * (Cyclomatic Complexity) - 16.2 * ln(Lines of Code)
  - Or use simplified version based on available metrics
- [ ] Calculate maintainability index:
  - Per file maintainability index
  - Overall project maintainability index
  - Categorize maintainability levels (excellent, good, fair, poor)
- [ ] Identify files with low maintainability index

### Collect ESLint Metrics
- [ ] Run ESLint analysis:
  - Execute `npm run lint` and capture output
  - Parse ESLint results (errors, warnings)
  - Extract metrics:
    - Total number of errors
    - Total number of warnings
    - Errors/warnings by rule
    - Errors/warnings by file
- [ ] Categorize issues by severity and type

### Create Metrics Dashboard
- [ ] Design dashboard structure:
  - Overview section with key metrics summary
  - Detailed sections for each metric type
  - Visualizations (charts, graphs, tables)
  - File-level breakdown
  - Recommendations/action items
- [ ] Choose dashboard format:
  - Option A: Markdown report (static, version-controlled)
  - Option B: HTML dashboard (interactive, can be served)
  - Option C: Both (markdown for docs, HTML for interactive viewing)
- [ ] Implement dashboard:
  - Create dashboard template/structure
  - Populate with collected metrics
  - Add visualizations (use libraries like Chart.js, or generate static charts)
  - Format metrics clearly with appropriate units and thresholds
- [ ] Add metrics interpretation:
  - Define what each metric means
  - Set quality thresholds (e.g., coverage >80%, complexity <10)
  - Provide recommendations based on metrics

### Create Visualizations
- [ ] Coverage visualizations:
  - Overall coverage gauge/chart
  - Coverage trend over time (if historical data available)
  - Per-file coverage heatmap or bar chart
  - Coverage by file type/category
- [ ] Complexity visualizations:
  - Complexity distribution histogram
  - Top 10 most complex functions
  - Complexity heatmap per file
  - Average complexity trend
- [ ] Duplication visualizations:
  - Duplication percentage gauge
  - Duplicate blocks by size
  - Duplicate code locations map
- [ ] Maintainability visualizations:
  - Maintainability index distribution
  - Files by maintainability category
  - Maintainability trend
- [ ] ESLint visualizations:
  - Issues by severity (pie chart)
  - Issues by rule (bar chart)
  - Issues by file (table or heatmap)

### Automate Dashboard Generation
- [ ] Create npm script to generate dashboard:
  - Add script to `package.json` (e.g., `npm run metrics:dashboard`)
  - Script should:
    - Run all metric collection tools
    - Aggregate metrics
    - Generate dashboard output
- [ ] Set up CI/CD integration (optional):
  - Add dashboard generation to CI pipeline
  - Store dashboard artifacts
  - Compare metrics across builds

### Document Metrics Dashboard
- [ ] Document dashboard purpose and usage:
  - Explain what the dashboard shows
  - How to generate/update the dashboard
  - How to interpret metrics
  - Quality thresholds and targets
- [ ] Document each metric:
  - Code coverage: what it measures, how to improve
  - Complexity: what it measures, acceptable thresholds
  - Duplication: what it measures, how to reduce
  - Maintainability index: what it measures, interpretation
  - ESLint metrics: what they measure, how to fix issues
- [ ] Document tools used:
  - Jest for coverage
  - ESLint for linting
  - Complexity analysis tool
  - Duplication detection tool
- [ ] Add examples and best practices
- [ ] Save documentation to `docs/code-quality-metrics.md`

## Notes

- This task is part of Phase 4: Code Quality Audit
- Section: 3. Refactoring
- Subsection: 3.9
- This task implements the "Code metrics dashboard" deliverable specified in Phase 4 (CONVERSION_STEPS.md line 201)
- Focus on creating a comprehensive dashboard that aggregates metrics from multiple code quality tools
- The dashboard should provide actionable insights to improve code quality and maintainability
- Leverage existing infrastructure:
  - Jest coverage is already configured (`jest.config.ts`)
  - ESLint is already configured (`.eslintrc.json`)
  - Coverage reports are generated in `coverage/` directory
- Consider integration with Phase 4 tasks:
  - PHASE4-005: Code duplication detection (can reuse duplication metrics)
  - Other Phase 4 tasks that generate quality metrics
- Dashboard format considerations:
  - Markdown: Easy to version control, readable in GitHub/GitLab
  - HTML: More interactive, better for visualizations
  - Consider generating both formats
- Metrics thresholds (suggested):
  - Code coverage: >80% (aligned with jarek-va target)
  - Cyclomatic complexity: <10 per function (aligned with jarek-va RuboCop config)
  - Duplication: <3% (industry standard)
  - Maintainability index: >70 (good), >85 (excellent)
- Tools to consider:
  - `jscpd` for duplication detection (supports TypeScript)
  - `eslint-plugin-complexity` for complexity analysis
  - `complexity-report` as alternative complexity tool
  - `plato` or `jsinspect` as alternative duplication tools
- Automation is important: Dashboard should be easy to regenerate with `npm run metrics:dashboard`
- Historical tracking: Consider storing metrics over time to show trends (optional enhancement)

- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE4-025
- Next: PHASE4-027

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
