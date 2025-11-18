# PHASE4-006: Identify unused code/dead code

**Section**: 1. Automated Code Smell Detection
**Subsection**: 1.6
**Task ID**: PHASE4-006

## Description

Run comprehensive unused code and dead code detection to identify unused imports, functions, variables, types, and interfaces that impact code quality and maintainability. This task focuses on detecting code that is no longer referenced or used anywhere in the codebase, helping to reduce technical debt and improve code clarity.

## Current State

The project currently has:
- **TypeScript compiler** configured with `noUnusedLocals` and `noUnusedParameters` enabled in tsconfig.json
- **ESLint** configured with `@typescript-eslint/no-unused-vars` rule (PHASE4-001)
- **Prettier** configured for code formatting (PHASE4-002)
- Basic linting and formatting scripts in package.json

**Existing Unused Code Detection**:
- TypeScript compiler flags unused local variables and parameters at compile time
- ESLint catches unused variables with the `@typescript-eslint/no-unused-vars` rule
- Both tools provide basic detection but may miss:
  - Unused exports (functions/types exported but never imported)
  - Unused files/modules
  - Unused dependencies in package.json
  - Dead code paths (unreachable code)
  - Unused type definitions and interfaces

**Missing**: Comprehensive unused code detection that provides:
- Identification of unused exports across the entire codebase
- Detection of unused files and modules
- Analysis of unused dependencies
- Detection of dead code paths
- Integration with existing tooling (TypeScript, ESLint)
- Automated unused code reporting
- Prioritization of unused code by impact

## Tool Options

Consider the following options for unused code detection:

1. **ts-prune** (Recommended for TypeScript)
   - Finds unused exports in TypeScript projects
   - Fast and lightweight
   - Can be integrated into npm scripts
   - Free and actively maintained
   - Supports ignore patterns
   - Provides JSON output for automation

2. **unimported** (Recommended for comprehensive analysis)
   - Finds unused files, dependencies, and exports
   - Analyzes both TypeScript and JavaScript
   - Detects unused npm dependencies
   - Can auto-fix some issues
   - Free and actively maintained
   - Provides detailed reports

3. **depcheck** (For dependency analysis)
   - Finds unused npm dependencies
   - Detects missing dependencies
   - Can be integrated into CI/CD
   - Free and actively maintained
   - Works well with other tools

4. **eslint-plugin-unused-imports** (ESLint plugin)
   - Detects unused imports
   - Can auto-fix unused imports
   - Integrates with existing ESLint setup
   - Free and actively maintained
   - Works alongside existing ESLint rules

5. **knip** (Comprehensive TypeScript/JavaScript analyzer)
   - Finds unused files, dependencies, exports, and types
   - Very comprehensive analysis
   - Supports monorepos
   - Can detect dead code paths
   - Free and actively maintained
   - More complex setup but very thorough

6. **TypeScript compiler analysis**
   - Use `tsc --noUnusedLocals --noUnusedParameters` for basic detection
   - Already configured in tsconfig.json
   - Limited to local scope analysis

## Detection Scope

Unused code detection should cover:

1. **Unused Imports**
   - Imported modules/functions/types that are never used
   - Default imports that are unused
   - Namespace imports that are unused

2. **Unused Exports**
   - Exported functions that are never imported elsewhere
   - Exported types/interfaces that are never used
   - Exported constants that are never referenced
   - Exported classes that are never instantiated

3. **Unused Variables**
   - Local variables declared but never used
   - Function parameters that are never referenced
   - Class properties that are never accessed
   - Enum values that are never used

4. **Unused Types/Interfaces**
   - Type definitions that are never referenced
   - Interfaces that are never implemented or used
   - Type aliases that are never used
   - Generic type parameters that are unused

5. **Unused Files**
   - Source files that are never imported
   - Test files for non-existent source files
   - Configuration files that are not referenced

6. **Unused Dependencies**
   - npm packages in package.json that are never imported
   - Dev dependencies that are not used
   - Peer dependencies that are not needed

7. **Dead Code Paths**
   - Unreachable code after return statements
   - Code after throw statements
   - Unreachable code in conditionals

## Checklist

### Tool Selection and Setup
- [ ] Research and compare unused code detection tool options
- [ ] Choose appropriate tool(s) based on project needs and existing setup
- [ ] Install chosen tool(s) as dev dependencies (if npm packages)
- [ ] Configure tool with appropriate ignore patterns
- [ ] Add unused code detection script to package.json
- [ ] Configure ignore patterns (node_modules, dist, coverage, tests if desired)
- [ ] Test tool configuration on codebase

### ts-prune Configuration (Recommended)
- [ ] Install ts-prune: `npm install --save-dev ts-prune`
- [ ] Create ts-prune configuration (if needed)
- [ ] Configure ignore patterns:
  - `node_modules/**`
  - `dist/**`
  - `coverage/**`
  - `tests/**` (optional, depending on whether test code should be analyzed)
  - `*.test.ts` (optional)
- [ ] Configure entry points (main files that should be considered as entry points)
- [ ] Test ts-prune configuration on codebase
- [ ] Add script to package.json: `"unused:exports": "ts-prune"`

### unimported Configuration (Recommended for comprehensive analysis)
- [ ] Install unimported: `npm install --save-dev unimported`
- [ ] Create `.unimportedrc.json` configuration file
- [ ] Configure entry points (main source files)
- [ ] Configure ignore patterns:
  - `node_modules/**`
  - `dist/**`
  - `coverage/**`
  - `tests/**` (optional)
- [ ] Configure dependency analysis settings
- [ ] Test unimported configuration on codebase
- [ ] Add script to package.json: `"unused:all": "unimported"`

### ESLint Plugin Configuration (For unused imports)
- [ ] Install eslint-plugin-unused-imports: `npm install --save-dev eslint-plugin-unused-imports`
- [ ] Update `.eslintrc.json` to include the plugin
- [ ] Configure rules:
  - `unused-imports/no-unused-imports`: "error"
  - `unused-imports/no-unused-vars`: "warn" (or use existing rule)
- [ ] Test ESLint configuration
- [ ] Add script to package.json: `"unused:imports": "eslint --fix src"`

### depcheck Configuration (For dependency analysis)
- [ ] Install depcheck: `npm install --save-dev depcheck`
- [ ] Create `.depcheckrc.json` configuration file (if needed)
- [ ] Configure ignore patterns for dependencies that are used but not detected
- [ ] Test depcheck configuration
- [ ] Add script to package.json: `"unused:deps": "depcheck"`

### Running Unused Code Detection
- [ ] Run ts-prune to identify unused exports
- [ ] Run unimported to identify unused files and dependencies
- [ ] Run ESLint with unused-imports plugin to identify unused imports
- [ ] Run depcheck to identify unused npm dependencies
- [ ] Run TypeScript compiler with strict unused checks: `tsc --noEmit` (unused locals/parameters checks are already enabled in tsconfig.json)
- [ ] Generate comprehensive unused code report
- [ ] Identify all unused exports
- [ ] Identify all unused imports
- [ ] Identify all unused files
- [ ] Identify all unused dependencies
- [ ] Identify all unused types/interfaces
- [ ] Count total unused code items found

### Analysis and Documentation
- [ ] Review unused code findings and categorize:
  - Unused exports (functions, types, constants)
  - Unused imports
  - Unused files
  - Unused dependencies
  - Unused types/interfaces
  - Dead code paths
- [ ] Document all significant unused code:
  - File locations and line numbers
  - Type of unused code (export, import, variable, type, etc.)
  - Reason for being unused (if apparent)
  - Impact of removal (breaking changes, dependencies, etc.)
  - Suggested removal approach
- [ ] Create prioritized list of unused code issues:
  - Critical: Unused dependencies (bloat package.json)
  - High: Unused exports (public API bloat)
  - Medium: Unused imports (code clarity)
  - Low: Unused local variables (already caught by TypeScript/ESLint)
- [ ] Document unused code baseline metrics:
  - Total unused exports found
  - Total unused imports found
  - Total unused files found
  - Total unused dependencies found
  - Total unused types/interfaces found
  - Most unused files (top 10)
- [ ] Create unused code report document (markdown or HTML)
- [ ] Identify false positives (code that appears unused but is actually used):
  - Dynamic imports
  - Reflection-based usage
  - Framework-specific usage patterns
  - Test-only code

### Cleanup Plan
- [ ] Create cleanup plan prioritizing:
  - Safe removals (unused imports, unused local variables)
  - Medium-risk removals (unused exports, unused types)
  - High-risk removals (unused files, unused dependencies)
- [ ] Document removal strategy for each category
- [ ] Identify dependencies between unused code items
- [ ] Plan removal order to avoid breaking changes
- [ ] Document testing requirements after cleanup

### Integration
- [ ] Integrate unused code checks into CI/CD pipeline (if applicable)
- [ ] Add unused code detection to pre-commit hooks (optional)
- [ ] Configure unused code gates (warn/fail build if unused code exceeds threshold)
- [ ] Set up automated unused code reporting
- [ ] Document how to run unused code detection locally

### Review and Validation
- [ ] Verify unused code detection runs successfully
- [ ] Verify reports are generated correctly
- [ ] Review unused code findings for accuracy
- [ ] Validate that all significant unused code is identified
- [ ] Ensure unused code metrics align with code review findings
- [ ] Test CI/CD integration (if configured)
- [ ] Verify ignore patterns work correctly
- [ ] Verify false positives are properly handled

## Configuration Example (ts-prune)

Add to package.json:

```json
{
  "scripts": {
    "unused:exports": "ts-prune",
    "unused:exports:json": "ts-prune --json > reports/unused-exports.json"
  }
}
```

Run with entry points:

```bash
ts-prune --project tsconfig.json
```

## Configuration Example (unimported)

Create `.unimportedrc.json`:

```json
{
  "entry": [
    "src/index.ts",
    "src/**/*.ts"
  ],
  "ignorePatterns": [
    "node_modules",
    "dist",
    "coverage",
    "*.test.ts",
    "*.spec.ts"
  ],
  "ignoreUnusedDependencies": [
    "@types/node",
    "@types/jest"
  ]
}
```

Add to package.json:

```json
{
  "scripts": {
    "unused:all": "unimported",
    "unused:files": "unimported --init"
  }
}
```

## Configuration Example (eslint-plugin-unused-imports)

Update `.eslintrc.json`:

```json
{
  "plugins": ["@typescript-eslint", "prettier", "unused-imports"],
  "rules": {
    "unused-imports/no-unused-imports": "error",
    "unused-imports/no-unused-vars": [
      "warn",
      {
        "vars": "all",
        "varsIgnorePattern": "^_",
        "args": "after-used",
        "argsIgnorePattern": "^_"
      }
    ]
  }
}
```

## Configuration Example (depcheck)

Create `.depcheckrc.json`:

```json
{
  "ignoreMatches": [
    "@types/*",
    "eslint-*",
    "prettier",
    "typescript",
    "ts-node",
    "nodemon"
  ],
  "ignorePatterns": [
    "dist",
    "coverage",
    "*.test.ts"
  ]
}
```

Add to package.json:

```json
{
  "scripts": {
    "unused:deps": "depcheck"
  }
}
```

## Notes

- This task is part of Phase 4: Code Quality Audit
- Section: 1. Automated Code Smell Detection
- Focus on identifying and fixing code quality issues
- Document all findings and improvements
- Unused code detection should complement, not replace, code reviews
- Some "unused" code may be intentionally kept (e.g., public API exports, test utilities)
- Be careful with false positives - verify that code is truly unused before removal
- Consider the impact of removing unused exports (may break external consumers)
- Start with safe removals (unused imports, unused local variables)
- Use multiple tools for comprehensive coverage (ts-prune + unimported + ESLint)
- Integration with existing TypeScript and ESLint configuration provides the most comprehensive analysis
- Consider both development and production code when analyzing unused dependencies
- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE4-005
- Next: PHASE4-007

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
