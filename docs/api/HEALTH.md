# Health Check Endpoint

## Overview

The health check endpoint provides basic service status information and is used for monitoring and service discovery. The endpoint returns the service status, name, and version information. Both `/health` and the root endpoint `/` serve the same health check response.

## Endpoints

### `GET /health`

Health check endpoint that returns service status information.

### `GET /`

Root endpoint that also serves the health check response. This matches the Rails implementation where the root route points to the health controller.

## Request Format

### No Request Body Required

The health endpoint does not require a request body.

### No Query Parameters Required

The health endpoint does not require any query parameters.

### No Authentication Required

The health endpoint is publicly accessible and does not require authentication. This makes it suitable for monitoring tools, load balancers, and service discovery mechanisms.

## Response Format

### Success Response

**HTTP Status Code**: `200 OK`

**Response Body** (JSON):

```json
{
  "status": "healthy",
  "service": "Virtual Assistant API",
  "version": "1.0.0"
}
```

**Response Fields**:

- `status` (string): Always `"healthy"` when the service is running. This field indicates the service is operational and responding to requests.
- `service` (string): Service name from `APP_NAME` environment variable. Defaults to `"Virtual Assistant API"` if `APP_NAME` is not set.
- `version` (string): Service version from `APP_VERSION` environment variable. Defaults to `"1.0.0"` if `APP_VERSION` is not set.

## Status Codes

- **200 OK**: Service is healthy and responding. The endpoint successfully returned health status information.
- **500 Internal Server Error**: Service error occurred. This is handled by the ApplicationController error handler and indicates an internal server issue.

## Example Request

### Using curl

```bash
# Request health endpoint
curl -X GET http://localhost:3000/health

# Request root endpoint (same response)
curl -X GET http://localhost:3000/
```

### Using HTTPie

```bash
# Request health endpoint
http GET http://localhost:3000/health

# Request root endpoint (same response)
http GET http://localhost:3000/
```

## Example Response

### Successful Response

```json
{
  "status": "healthy",
  "service": "Virtual Assistant API",
  "version": "1.0.0"
}
```

**Response Headers**:

```
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Content-Length: 65
```

## Implementation Details

### Node.js/TypeScript Implementation

- **Controller**: `src/controllers/health.controller.ts`
  - Function: `getHealth()`
  - Returns JSON response with status, service name, and version
  - Reads `APP_NAME` and `APP_VERSION` from environment variables with defaults

- **Routes**:
  - `src/routes/health.routes.ts` - Defines `GET /health` route
  - `src/app.ts` - Registers health routes and root route
  - Both `/health` and `/` endpoints use the same controller function

- **Configuration**: Environment variables are read directly from `process.env`:
  - `APP_NAME` (default: `"Virtual Assistant API"`)
  - `APP_VERSION` (default: `"1.0.0"`)

### Rails Reference Implementation

This endpoint is based on the jarek-va Rails application implementation:

- **Controller**: `jarek-va/app/controllers/health_controller.rb`
  - Simple controller that returns health status JSON
  - Uses `Rails.application.config.app_name` and `Rails.application.config.app_version`

- **Routes**: `jarek-va/config/routes.rb`
  - Defines both `GET /health` and root `GET /` routes pointing to `health#show`

- **Configuration**: `jarek-va/config/application.rb`
  - Defines `app_name` and `app_version` config values from environment variables:
    - `config.app_name = ENV.fetch('APP_NAME', 'Virtual Assistant API')`
    - `config.app_version = ENV.fetch('APP_VERSION', '1.0.0')`

## Use Cases

The health endpoint is commonly used for:

1. **Service Monitoring**: Monitoring tools can periodically check the health endpoint to verify service availability
2. **Load Balancer Health Checks**: Load balancers use health endpoints to determine if a service instance is healthy and should receive traffic
3. **Service Discovery**: Service discovery mechanisms can use health endpoints to verify service status before routing requests
4. **Container Orchestration**: Kubernetes, Docker Swarm, and other orchestration platforms use health endpoints for liveness and readiness probes
5. **CI/CD Pipelines**: Deployment pipelines can verify service health after deployment

## Notes

- The health endpoint is intentionally simple and lightweight to minimize overhead
- No authentication is required to allow monitoring tools and load balancers to access it
- The endpoint does not perform deep health checks (database connectivity, external service availability, etc.) - it only verifies the service is running and can respond
- Both `/health` and `/` endpoints return identical responses for convenience and compatibility
- The response format follows the pattern: `{ status: 'healthy', service: '...', version: '...' }`
- Error responses (500) are handled by the global error handler middleware and follow the standard error response format

## Related Documentation

- [API Documentation](../API.md) - Overview of all API endpoints
- [API Conventions](../API_CONVENTIONS.md) - API conventions and patterns
