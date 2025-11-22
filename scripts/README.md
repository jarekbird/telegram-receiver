# Scripts Directory

This directory contains utility scripts for development and testing.

## Available Scripts

### `test-ci-local.sh`

Tests the CI workflow locally using the `act` tool before pushing changes to GitHub.

**Usage:**

```bash
./scripts/test-ci-local.sh
```

**What it does:**

- Checks prerequisites (Docker, Node.js, act tool)
- Verifies CI workflow file exists
- Lists available workflows
- Tests workflow with `push`, `pull_request`, and `workflow_dispatch` events
- Reports success or failure

**Prerequisites:**

- Docker must be installed and running
- Node.js >=18.0.0
- `act` tool (script can help install on macOS)

**See also:** [ACT_TESTING.md](../docs/ACT_TESTING.md) for detailed documentation.
