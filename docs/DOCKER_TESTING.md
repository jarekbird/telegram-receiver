# Docker Build Testing Documentation

This document describes the Docker build testing process for the telegram-receiver application, as specified in PHASE1-040.

## Prerequisites

- Docker must be installed and running
- The project must be built successfully (`npm run build` should work)
- All required files must be present (Dockerfile, .dockerignore, docker-entrypoint.sh, etc.)

## Automated Testing Script

A comprehensive test script is available at `/cursor/scripts/test-docker-build.sh` that automates all the testing steps specified in PHASE1-040.

### Running the Test Script

From the telegram-receiver project root:

```bash
/cursor/scripts/test-docker-build.sh
```

Or copy the script to the project root and run:

```bash
cp /cursor/scripts/test-docker-build.sh ./test-docker-build.sh
chmod +x ./test-docker-build.sh
./test-docker-build.sh
```

### What the Script Tests

The script performs the following checks (matching PHASE1-040 checklist):

1. ✅ Verifies Dockerfile exists
2. ✅ Verifies .dockerignore exists
3. ✅ Builds Docker image (`docker build -t telegram-receiver:latest .`)
4. ✅ Verifies image was created
5. ✅ Runs container (`docker run -d -p 3000:3000 --name telegram-receiver-test telegram-receiver`)
6. ✅ Checks container logs for errors
7. ✅ Verifies environment variables (NODE_ENV=production, PORT=3000)
8. ✅ Verifies shared_db directory exists with proper permissions
9. ✅ Tests health endpoint (`curl http://localhost:3000/health`)
10. ✅ Verifies health endpoint response structure:
    - `status: "healthy"`
    - `service: "telegram-receiver"`
    - `version: "1.0.0"`
11. ✅ Verifies HEALTHCHECK configuration
12. ✅ Checks container status
13. ✅ Verifies container health status
14. ✅ Cleans up test container and optionally image

## Manual Testing Steps

If you prefer to test manually, follow these steps:

### 1. Build the Docker Image

```bash
docker build -t telegram-receiver:latest .
```

Expected: Build completes without errors or warnings.

### 2. Verify Image Creation

```bash
docker images telegram-receiver
```

Expected: Image `telegram-receiver:latest` is listed.

### 3. Run the Container

```bash
docker run -d -p 3000:3000 --name telegram-receiver-test telegram-receiver
```

Expected: Container starts and runs in detached mode.

### 4. Check Container Logs

```bash
docker logs telegram-receiver-test
```

Expected: No errors in logs. Should see startup messages indicating the server is running.

### 5. Verify Environment Variables

```bash
docker exec telegram-receiver-test env | grep -E "(NODE_ENV|PORT)"
```

Expected:
- `NODE_ENV=production`
- `PORT=3000`

### 6. Verify Shared Database Directory

```bash
docker exec telegram-receiver-test ls -la /app/shared_db
```

Expected: Directory exists with proper permissions (drwxrwxrwx).

### 7. Test Health Endpoint

```bash
curl http://localhost:3000/health
```

Expected: Returns 200 OK with JSON response:
```json
{
  "status": "healthy",
  "service": "telegram-receiver",
  "version": "1.0.0"
}
```

### 8. Verify HEALTHCHECK Configuration

```bash
docker inspect telegram-receiver-test | grep -A 5 Healthcheck
```

Expected: Shows HEALTHCHECK directive configuration.

### 9. Check Container Health Status

```bash
# Wait a few seconds for healthcheck to run
sleep 15
docker inspect telegram-receiver-test --format='{{.State.Health.Status}}'
```

Expected: Returns `healthy` (or `starting` if healthcheck hasn't completed yet).

### 10. Clean Up

```bash
docker stop telegram-receiver-test
docker rm telegram-receiver-test
# Optionally remove the test image
docker rmi telegram-receiver:latest
```

## Expected Results

### Health Endpoint Response

The health endpoint should return:
```json
{
  "status": "healthy",
  "service": "telegram-receiver",
  "version": "1.0.0"
}
```

The service name and version are read from `package.json` to ensure accuracy.

### Container Configuration

- **Image**: `telegram-receiver:latest`
- **Port**: 3000 (exposed and mapped to host)
- **Environment**: `NODE_ENV=production`, `PORT=3000`
- **Health Check**: Configured to check `/health` endpoint every 30 seconds
- **Shared DB**: Directory `/app/shared_db` created with proper permissions

## Troubleshooting

### Build Fails

- Check Dockerfile syntax
- Verify all required files are present (package.json, tsconfig.json, src/, etc.)
- Check `.dockerignore` is not excluding necessary files
- Verify Node.js version matches engines requirement (node >=18.0.0)

### Container Fails to Start

- Verify application code compiles (`npm run build` works locally)
- Check entrypoint script (`docker-entrypoint.sh`) has execute permissions
- Verify required directories are created with proper permissions
- Check port 3000 is not already in use on the host
- Review container logs: `docker logs telegram-receiver-test`

### Health Endpoint Returns Wrong Values

- Verify `package.json` contains correct `name` and `version` fields
- Check that `src/controllers/health.controller.ts` reads from package.json correctly
- Environment variables `APP_NAME` and `APP_VERSION` can override defaults if set

### Health Check Not Working

- Verify HEALTHCHECK directive is in Dockerfile
- Check that curl is installed in the container (should be included in Dockerfile)
- Verify health endpoint is accessible: `docker exec telegram-receiver-test curl http://localhost:3000/health`

## Related Tasks

- **PHASE1-036**: Create Dockerfile
- **PHASE1-037**: Create .dockerignore
- **PHASE1-040**: Test Docker build (this task)
- **PHASE1-041**: Test docker-compose (next task)

## Notes

- The Docker image tag should be `telegram-receiver` (not `jarek-va`) to match the project name
- The health endpoint should be accessible at `http://localhost:3000/health` when the container is running
- Container should expose port 3000 (matching the PORT environment variable)
- The shared database directory `/app/shared_db` is required for shared SQLite database access
- After testing, clean up containers and optionally images to avoid cluttering Docker
