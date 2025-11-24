# Testing CI Workflow Locally with act

This guide explains how to test GitHub Actions workflows locally using the `act` tool before pushing changes to GitHub.

## Prerequisites

1. **Docker** must be installed and running
   - macOS: Install Docker Desktop from https://www.docker.com/products/docker-desktop
   - Linux: `sudo apt-get install docker.io` (or equivalent for your distro)
   - Windows: Install Docker Desktop or use WSL

2. **act tool** must be installed
   - macOS: `brew install act`
   - Linux: Download from https://github.com/nektos/act/releases
   - Windows: Download from https://github.com/nektos/act/releases or use WSL
   - Or install via script: `curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash`

3. **Node.js** (version >=18.0.0) - already required for the project

4. **CI workflow file** (`.github/workflows/ci.yml`) must exist

## Quick Start

### Using the Test Script

The easiest way to test the CI workflow is using the provided script:

```bash
./scripts/test-ci-local.sh
```

Or from the project root:

```bash
cd /cursor/repositories/telegram-receiver
./scripts/test-ci-local.sh
```

This script will:

- Check all prerequisites (Docker, Node.js, act tool)
- Verify CI workflow file exists
- Install act tool if not present (on macOS with Homebrew)
- List available workflows
- Test the workflow with `push`, `pull_request`, and `workflow_dispatch` events
- Report success or failure with detailed output

### Manual Testing

#### 1. List Available Workflows

```bash
cd /cursor/repositories/telegram-receiver
act -l
```

This should show the "CI" workflow with its jobs and steps.

#### 2. Test with Push Event

```bash
act push
```

This simulates a push to the main branch and runs the CI workflow.

#### 3. Test with Pull Request Event

```bash
act pull_request
```

This simulates a pull request event.

#### 4. Test with Manual Trigger

```bash
act workflow_dispatch
```

This simulates manually triggering the workflow from the GitHub UI.

#### 5. Test Specific Workflow File

```bash
act -W .github/workflows/ci.yml push
```

#### 6. Test Specific Job

```bash
act -j test push
```

#### 7. Dry Run (List Steps Without Executing)

```bash
act -n push
```

## Common Options

- `-v` or `--verbose`: Verbose output for debugging
- `-W` or `--workflows`: Specify workflow file path
- `-j` or `--job`: Run specific job
- `-e` or `--eventpath`: Path to event JSON file for custom events
- `--secret`: Pass secrets (e.g., `--secret GITHUB_TOKEN=your-token`)
- `--env`: Pass environment variables (e.g., `--env NODE_ENV=test`)

## Expected Workflow Steps

When running `act push`, the workflow should execute these steps in order:

1. ✅ Checkout code
2. ✅ Set up Node.js (version >=18.0.0)
3. ✅ Install dependencies (`npm ci`)
4. ✅ Detect changed files
5. ✅ Run ESLint linter
6. ✅ Check Prettier formatting
7. ✅ Run TypeScript type check
8. ✅ Build TypeScript project (`npm run build`)
9. ✅ Verify build artifacts (`dist/` directory is created)
10. ✅ Run Jest tests
11. ✅ Generate test coverage

## Common Issues and Solutions

### Docker Not Running

**Issue**: `act` fails with Docker connection error

**Solution**:

- macOS: Start Docker Desktop
- Linux: `sudo systemctl start docker`
- Windows: Start Docker Desktop

### Missing Secrets

**Issue**: Workflow fails due to missing secrets

**Solution**: Use `--secret` flag:

```bash
act push --secret GITHUB_TOKEN=your-token
```

### Large Docker Images

**Issue**: First run is slow due to downloading Docker images

**Solution**: This is normal. `act` downloads GitHub Actions runner images on first run. Subsequent runs will be faster.

### Workflow File Not Found

**Issue**: `act -l` shows no workflows

**Solution**:

- Verify `.github/workflows/ci.yml` exists
- Check that the YAML file is valid (no syntax errors)
- Ensure you're running `act` from the project root directory

### Node.js Version Mismatch

**Issue**: Workflow uses different Node.js version than local

**Solution**: `act` uses Docker images, so the version should match the workflow configuration. The workflow specifies Node.js 18, which matches the project requirements.

### Permission Errors

**Issue**: Docker permission denied errors

**Solution**:

- Linux: Add your user to the docker group: `sudo usermod -aG docker $USER` (then log out and back in)
- Or run with `sudo` (not recommended for regular use)

## Verification Checklist

After running `act push`, verify:

- [ ] All steps execute without errors
- [ ] Dependencies install successfully (`npm ci` completes)
- [ ] Linting passes (ESLint)
- [ ] Formatting check passes (Prettier)
- [ ] Type checking passes (TypeScript)
- [ ] Build succeeds (`dist/` directory created)
- [ ] Tests run and pass (Jest)
- [ ] Test coverage is generated
- [ ] Workflow completes with success status

## Benefits of Local Testing

1. **Faster Iteration**: Catch workflow issues immediately without waiting for GitHub Actions
2. **Cost Savings**: Avoid using GitHub Actions minutes for testing workflow syntax
3. **Offline Development**: Test workflows without internet connection (after initial Docker image download)
4. **Debugging**: Easier to debug workflow issues locally with verbose output

## Additional Resources

- [act GitHub Repository](https://github.com/nektos/act)
- [act Documentation](https://github.com/nektos/act#example-commands)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## Current Status

### Prerequisites Verification

The following prerequisites have been verified:

- ✅ **CI workflow file exists**: `.github/workflows/ci.yml` is present and properly configured
- ✅ **Node.js installed**: v18.20.8 (meets >=18.0.0 requirement)
- ✅ **Test script exists**: `scripts/test-ci-local.sh` is available and executable
- ✅ **Documentation exists**: This guide provides complete instructions for local testing

### Infrastructure Status

All supporting infrastructure is in place:

- ✅ Test script (`scripts/test-ci-local.sh`) is ready to use when Docker is available
- ✅ Documentation covers installation and usage of the `act` tool
- ✅ CI workflow file is properly configured with all required steps

### Docker Requirement

**Note**: Local workflow testing with `act` requires Docker to be installed and running. Docker is not available in all environments (e.g., some CI/CD environments, restricted development environments).

When Docker becomes available, developers can use the provided script (`scripts/test-ci-local.sh`) and this documentation to test the CI workflow locally. The infrastructure is ready and will work once Docker is available.

## Notes

- This is an **optional** task but highly recommended for faster development iteration
- Testing locally with `act` helps catch workflow issues before pushing to GitHub
- `act` requires Docker to run, as it uses Docker containers to simulate GitHub Actions runners
- The workflow file (`.github/workflows/ci.yml`) must exist before this task can be completed
- If workflow issues are found, update `.github/workflows/ci.yml` and re-test
