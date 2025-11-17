# PHASE4-008: Review dependency analysis

**Section**: 1. Automated Code Smell Detection
**Subsection**: 1.8
**Task ID**: PHASE4-008

## Description

Run comprehensive dependency analysis to identify circular dependencies, unused dependencies, outdated packages, security vulnerabilities, and dependency version conflicts. This task focuses on analyzing the project's dependency graph and ensuring optimal dependency management for improved code quality, maintainability, and security.

## Current State

The project currently has:
- **package.json** with production and development dependencies
- **package-lock.json** for dependency version locking
- **TypeScript** project with module imports
- **Node.js** runtime dependencies (express, axios, redis, bullmq, ioredis, @elevenlabs/elevenlabs-js)
- **Development tools** (jest, eslint, prettier, typescript, playwright, etc.)

**Existing Dependency Management**:
- npm package manager with lock file
- TypeScript module resolution configured
- Basic dependency structure in place

**Missing**: Comprehensive dependency analysis that provides:
- Visualization of dependency graph
- Detection of circular dependencies between modules
- Identification of unused dependencies in package.json
- Detection of outdated dependencies
- Security vulnerability scanning
- Dependency version conflict detection
- Analysis of dependency size and impact
- Recommendations for dependency optimization
- Documentation of dependency relationships

## Tool Options

Consider the following options for dependency analysis:

1. **npm-check** (Recommended for unused dependencies)
   - Detects unused dependencies
   - Checks for outdated packages
   - Provides interactive update interface
   - Lightweight and easy to use
   - Command: `npx npm-check -u`

2. **depcheck** (Recommended for unused dependencies)
   - Finds unused dependencies and devDependencies
   - More accurate than npm-check for TypeScript projects
   - Command: `npx depcheck`

3. **npm audit** (Built-in security scanning)
   - Built into npm
   - Scans for known security vulnerabilities
   - Provides fix recommendations
   - Command: `npm audit` and `npm audit fix`

4. **madge** (Recommended for circular dependency detection)
   - Visualizes dependency graph
   - Detects circular dependencies
   - Supports TypeScript
   - Can generate visual graphs
   - Command: `npx madge --circular --extensions ts src`

5. **dependency-cruiser** (Comprehensive dependency analysis)
   - Detects circular dependencies
   - Validates dependency rules
   - Generates dependency graphs
   - Supports TypeScript
   - Can be configured with rules
   - Command: `npx dependency-cruiser src`

6. **npm outdated** (Built-in version checking)
   - Shows outdated packages
   - Built into npm
   - Command: `npm outdated`

7. **bundlesize** (Dependency size analysis)
   - Analyzes bundle size impact
   - Useful for production dependencies
   - Can set size budgets

8. **snyk** (Security and license scanning)
   - Comprehensive security scanning
   - License compliance checking
   - Provides fix recommendations
   - Command: `npx snyk test`

9. **license-checker** (License compliance)
   - Lists all licenses of dependencies
   - Helps with license compliance
   - Command: `npx license-checker`

10. **npm ls** (Dependency tree visualization)
    - Built into npm
    - Shows dependency tree
    - Identifies version conflicts
    - Command: `npm ls` or `npm ls --depth=0`

## Checklist

### Tool Selection and Setup
- [ ] Research and compare dependency analysis tool options
- [ ] Choose appropriate tool(s) based on project needs
- [ ] Install chosen tool(s) as dev dependencies or use via npx
- [ ] Configure tool(s) with appropriate settings and ignore patterns
- [ ] Add dependency analysis scripts to package.json
- [ ] Test tool configuration on codebase

### Unused Dependencies Detection
- [ ] Run `depcheck` to identify unused dependencies
- [ ] Run `npm-check` as a secondary check
- [ ] Review each flagged unused dependency:
  - Verify it's truly unused (check dynamic imports, config files)
  - Check if it's used in build scripts or other non-source locations
  - Document why dependencies are kept (if intentionally unused)
- [ ] Create list of unused dependencies to remove
- [ ] Test application after removing unused dependencies
- [ ] Update package.json to remove confirmed unused dependencies

### Circular Dependencies Detection
- [ ] Run `madge --circular` to detect circular dependencies
- [ ] Run `dependency-cruiser` for comprehensive circular dependency analysis
- [ ] Review each circular dependency:
  - Identify the circular path (module A → module B → module A)
  - Understand why the circular dependency exists
  - Document the circular dependency
- [ ] Create list of circular dependencies to fix
- [ ] Plan refactoring strategy to break circular dependencies:
  - Extract shared code to a common module
  - Use dependency injection
  - Restructure module boundaries
- [ ] Document circular dependencies that are acceptable (if any)

### Dependency Graph Visualization
- [ ] Generate dependency graph using `madge` or `dependency-cruiser`
- [ ] Create visual representation of dependency structure
- [ ] Identify tightly coupled modules
- [ ] Identify modules with too many dependencies (dependency hotspots)
- [ ] Identify modules with no dependencies (potential isolation)
- [ ] Document dependency architecture
- [ ] Save dependency graph visualization (SVG, PNG, or HTML)

### Outdated Dependencies Review
- [ ] Run `npm outdated` to list outdated packages
- [ ] Review each outdated dependency:
  - Check current version vs latest version
  - Review changelog for breaking changes
  - Assess update risk (major vs minor vs patch)
- [ ] Categorize outdated dependencies:
  - Safe to update (patch/minor versions)
  - Requires testing (major versions)
  - Should not update (intentional version pinning)
- [ ] Create update plan prioritizing:
  - Security patches (highest priority)
  - Patch versions (low risk)
  - Minor versions (medium risk, test required)
  - Major versions (high risk, requires thorough testing)

### Security Vulnerability Scanning
- [ ] Run `npm audit` to scan for security vulnerabilities
- [ ] Review all reported vulnerabilities:
  - Severity level (critical, high, moderate, low)
  - Affected packages
  - Vulnerability description
  - Available fixes
- [ ] Run `snyk test` for additional security scanning
- [ ] Categorize vulnerabilities:
  - Critical/High: Fix immediately
  - Moderate: Fix in next update cycle
  - Low: Monitor and fix when convenient
- [ ] Apply security fixes:
  - Run `npm audit fix` for automatic fixes
  - Manually update packages for breaking changes
  - Document any vulnerabilities that cannot be fixed immediately
- [ ] Verify fixes don't break functionality
- [ ] Document security audit results

### Dependency Version Conflicts
- [ ] Run `npm ls` to check for version conflicts
- [ ] Identify packages with conflicting version requirements
- [ ] Review peer dependency warnings
- [ ] Resolve version conflicts:
  - Update conflicting packages to compatible versions
  - Use npm overrides/resolutions if necessary
  - Document intentional version conflicts
- [ ] Verify application works with resolved conflicts

### Dependency Size Analysis
- [ ] Analyze production bundle size impact of dependencies
- [ ] Identify large dependencies that could be optimized
- [ ] Check for duplicate dependencies (same package, different versions)
- [ ] Consider alternatives for large dependencies if appropriate
- [ ] Document dependency size metrics

### License Compliance
- [ ] Run `license-checker` to list all dependency licenses
- [ ] Review licenses for compliance with project requirements
- [ ] Identify any problematic licenses (GPL, AGPL, etc.)
- [ ] Document license summary
- [ ] Create LICENSE file if needed

### Documentation
- [ ] Document all dependency analysis findings
- [ ] Create dependency analysis report including:
  - Summary of unused dependencies found and removed
  - List of circular dependencies (fixed and remaining)
  - Dependency graph visualization
  - List of outdated dependencies and update plan
  - Security vulnerabilities found and fixed
  - Version conflicts resolved
  - Dependency size analysis
  - License compliance summary
- [ ] Document dependency management best practices
- [ ] Create dependency update workflow
- [ ] Save dependency graph visualization to `docs/dependency-graph.svg` or similar
- [ ] Update project documentation with dependency information

### Integration
- [ ] Add dependency analysis scripts to package.json:
  - `depcheck` for unused dependencies
  - `madge` or `dependency-cruiser` for circular dependencies
  - `npm audit` for security scanning
  - `npm outdated` for version checking
- [ ] Integrate dependency checks into CI/CD pipeline (if applicable)
- [ ] Set up automated dependency update checks (optional)
- [ ] Configure dependency analysis to run in pre-commit hooks (optional)
- [ ] Document how to run dependency analysis locally

### Review and Validation
- [ ] Verify all dependency analysis tools run successfully
- [ ] Verify reports are generated correctly
- [ ] Review dependency analysis findings for accuracy
- [ ] Validate that all critical issues are identified
- [ ] Ensure dependency graph accurately represents code structure
- [ ] Test application after dependency changes
- [ ] Verify no functionality is broken after dependency updates
- [ ] Confirm security vulnerabilities are addressed

## Configuration Example (package.json scripts)

Add dependency analysis scripts:

```json
{
  "scripts": {
    "deps:check": "depcheck",
    "deps:unused": "depcheck --ignores='@types/*,eslint-*,prettier,*jest*,*playwright*'",
    "deps:circular": "madge --circular --extensions ts src",
    "deps:graph": "madge --image docs/dependency-graph.svg --extensions ts src",
    "deps:outdated": "npm outdated",
    "deps:audit": "npm audit",
    "deps:audit:fix": "npm audit fix",
    "deps:security": "snyk test",
    "deps:licenses": "license-checker --summary",
    "deps:tree": "npm ls --depth=0",
    "deps:analyze": "npm run deps:check && npm run deps:circular && npm run deps:outdated && npm run deps:audit"
  }
}
```

## Configuration Example (dependency-cruiser)

Create `.dependency-cruiser.js`:

```javascript
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Circular dependencies are not allowed',
      from: {},
      to: {
        circular: true
      }
    },
    {
      name: 'no-orphans',
      severity: 'warn',
      comment: 'Modules without dependencies or dependents',
      from: {
        orphan: true,
        pathNot: [
          '^(src/index\\.ts|src/types/.*)$'
        ]
      },
      to: {}
    }
  ],
  options: {
    doNotFollow: {
      path: 'node_modules'
    }
  }
};
```

## Notes

- This task is part of Phase 4: Code Quality Audit
- Section: 1. Automated Code Smell Detection
- Focus on identifying and fixing code quality issues
- Document all findings and improvements
- Dependency analysis should be performed regularly to maintain code quality
- Start with built-in npm tools (audit, outdated, ls) before adding external tools
- Circular dependencies can cause runtime issues and make code harder to maintain
- Unused dependencies increase bundle size and security surface area
- Security vulnerabilities should be addressed immediately, especially critical/high severity
- Keep dependencies up to date but test thoroughly before updating major versions
- Document any intentional dependency choices (e.g., version pinning for compatibility)
- Consider using automated dependency update tools (Dependabot, Renovate) for ongoing maintenance
- Dependency graph visualization helps understand application architecture
- Some circular dependencies may be acceptable in specific contexts (e.g., type definitions)
- Always test the application after removing or updating dependencies
- Task can be completed independently by a single agent

## Related Tasks

- Previous: PHASE4-007
- Next: PHASE4-009

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
