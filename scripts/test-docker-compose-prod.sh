#!/bin/bash
#
# Test script for docker-compose.prod.yml
# This script validates the docker-compose configuration and tests all services
#
# Usage: ./scripts/test-docker-compose-prod.sh
#

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0

# Function to print success
print_success() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

# Function to print failure
print_failure() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

# Function to print info
print_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

echo "=========================================="
echo "Testing docker-compose.prod.yml"
echo "=========================================="
echo ""

# Change to project root
cd "$(dirname "$0")/.." || exit 1

# ==========================================
# Prerequisites Check
# ==========================================
echo "1. Checking prerequisites..."
echo ""

# Check docker-compose.prod.yml exists
if [ -f "docker-compose.prod.yml" ]; then
    print_success "docker-compose.prod.yml exists"
else
    print_failure "docker-compose.prod.yml missing"
    exit 1
fi

# Check Dockerfile exists
if [ -f "Dockerfile" ]; then
    print_success "Dockerfile exists"
else
    print_failure "Dockerfile missing"
    exit 1
fi

# Check .dockerignore exists
if [ -f ".dockerignore" ]; then
    print_success ".dockerignore exists"
else
    print_failure ".dockerignore missing"
    exit 1
fi

# Check worker script exists
if [ -f "src/worker.ts" ]; then
    print_success "src/worker.ts exists"
else
    print_failure "src/worker.ts missing"
    exit 1
fi

# Check worker script in package.json
if grep -q '"worker"' package.json; then
    print_success "worker script in package.json"
else
    print_failure "worker script missing from package.json"
    exit 1
fi

# Check if docker is available
if command -v docker &> /dev/null; then
    print_success "Docker is available"
    DOCKER_AVAILABLE=true
else
    print_failure "Docker is not available - cannot run full tests"
    DOCKER_AVAILABLE=false
fi

# Check if docker-compose is available
if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
    print_success "docker-compose is available"
    COMPOSE_AVAILABLE=true
else
    print_failure "docker-compose is not available - cannot run full tests"
    COMPOSE_AVAILABLE=false
fi

echo ""

# ==========================================
# Network Check
# ==========================================
echo "2. Checking Docker network..."
echo ""

if [ "$DOCKER_AVAILABLE" = true ]; then
    if docker network ls | grep -q "virtual-assistant-network"; then
        print_success "virtual-assistant-network exists"
    else
        print_info "virtual-assistant-network does not exist - will be created"
        if docker network create virtual-assistant-network &> /dev/null; then
            print_success "virtual-assistant-network created"
        else
            print_failure "Failed to create virtual-assistant-network"
        fi
    fi
else
    print_info "Skipping network check (Docker not available)"
fi

echo ""

# ==========================================
# Environment Variables Check
# ==========================================
echo "3. Checking environment variables..."
echo ""

# Check if .env file exists or variables are set
if [ -f ".env" ]; then
    print_success ".env file exists"
    # Check for required variables
    if grep -q "DOMAIN_NAME" .env || [ -n "${DOMAIN_NAME:-}" ]; then
        print_success "DOMAIN_NAME is set"
    else
        print_info "DOMAIN_NAME not set (will use default: localhost)"
    fi
    
    if grep -q "ACME_EMAIL" .env || [ -n "${ACME_EMAIL:-}" ]; then
        print_success "ACME_EMAIL is set"
    else
        print_info "ACME_EMAIL not set (will use default: admin@example.com)"
    fi
else
    print_info ".env file does not exist (will use environment defaults)"
fi

echo ""

# ==========================================
# Docker Compose Validation
# ==========================================
echo "4. Validating docker-compose.prod.yml syntax..."
echo ""

if [ "$COMPOSE_AVAILABLE" = true ]; then
    # Use docker compose (newer) or docker-compose (older)
    if docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
    else
        COMPOSE_CMD="docker-compose"
    fi
    
    if $COMPOSE_CMD -f docker-compose.prod.yml config &> /dev/null; then
        print_success "docker-compose.prod.yml syntax is valid"
    else
        print_failure "docker-compose.prod.yml syntax is invalid"
        $COMPOSE_CMD -f docker-compose.prod.yml config
        exit 1
    fi
else
    print_info "Skipping docker-compose validation (docker-compose not available)"
fi

echo ""

# ==========================================
# Docker Build Test
# ==========================================
echo "5. Testing Docker build..."
echo ""

if [ "$DOCKER_AVAILABLE" = true ] && [ "$COMPOSE_AVAILABLE" = true ]; then
    print_info "Building Docker image (this may take a while)..."
    if $COMPOSE_CMD -f docker-compose.prod.yml build --no-cache app 2>&1 | tee /tmp/docker-build.log; then
        print_success "Docker build completed successfully"
    else
        print_failure "Docker build failed"
        echo "Build logs:"
        cat /tmp/docker-build.log
        exit 1
    fi
else
    print_info "Skipping Docker build test (Docker not available)"
fi

echo ""

# ==========================================
# Service Startup Test
# ==========================================
echo "6. Testing service startup..."
echo ""

if [ "$DOCKER_AVAILABLE" = true ] && [ "$COMPOSE_AVAILABLE" = true ]; then
    print_info "Starting services in detached mode..."
    
    # Set default environment variables if not set
    export DOMAIN_NAME="${DOMAIN_NAME:-localhost}"
    export ACME_EMAIL="${ACME_EMAIL:-admin@example.com}"
    export TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-test-token}"
    export CURSOR_RUNNER_TIMEOUT="${CURSOR_RUNNER_TIMEOUT:-300}"
    
    if $COMPOSE_CMD -f docker-compose.prod.yml up --build -d; then
        print_success "Services started successfully"
        
        # Wait for services to be ready
        print_info "Waiting for services to be ready (30 seconds)..."
        sleep 30
        
        # Check container status
        echo ""
        echo "Container status:"
        $COMPOSE_CMD -f docker-compose.prod.yml ps
        
        # Check if all containers are running
        if $COMPOSE_CMD -f docker-compose.prod.yml ps | grep -q "telegram-receiver-traefik.*Up"; then
            print_success "Traefik container is running"
        else
            print_failure "Traefik container is not running"
        fi
        
        if $COMPOSE_CMD -f docker-compose.prod.yml ps | grep -q "telegram-receiver-redis.*Up"; then
            print_success "Redis container is running"
        else
            print_failure "Redis container is not running"
        fi
        
        if $COMPOSE_CMD -f docker-compose.prod.yml ps | grep -q "telegram-receiver-app.*Up"; then
            print_success "App container is running"
        else
            print_failure "App container is not running"
        fi
        
        if $COMPOSE_CMD -f docker-compose.prod.yml ps | grep -q "telegram-receiver-worker.*Up"; then
            print_success "Worker container is running"
        else
            print_failure "Worker container is not running"
        fi
    else
        print_failure "Failed to start services"
        exit 1
    fi
else
    print_info "Skipping service startup test (Docker not available)"
fi

echo ""

# ==========================================
# Service Health Checks
# ==========================================
echo "7. Testing service health checks..."
echo ""

if [ "$DOCKER_AVAILABLE" = true ]; then
    # Check Traefik logs
    if docker logs telegram-receiver-traefik 2>&1 | grep -qi "error"; then
        print_failure "Traefik logs show errors"
        docker logs telegram-receiver-traefik | tail -20
    else
        print_success "Traefik logs show no errors"
    fi
    
    # Check Redis connectivity
    if docker exec telegram-receiver-redis redis-cli ping 2>&1 | grep -q "PONG"; then
        print_success "Redis is responding to ping"
    else
        print_failure "Redis is not responding to ping"
    fi
    
    # Check Redis healthcheck
    REDIS_HEALTH=$(docker inspect telegram-receiver-redis --format='{{.State.Health.Status}}' 2>/dev/null || echo "unknown")
    if [ "$REDIS_HEALTH" = "healthy" ]; then
        print_success "Redis healthcheck passed"
    else
        print_info "Redis healthcheck status: $REDIS_HEALTH"
    fi
    
    # Check app logs
    if docker logs telegram-receiver-app 2>&1 | grep -qi "error"; then
        print_failure "App logs show errors"
        docker logs telegram-receiver-app | tail -20
    else
        print_success "App logs show no errors"
    fi
    
    # Check app health endpoint
    if curl -f -s http://localhost:3000/health > /dev/null 2>&1; then
        print_success "App health endpoint is accessible"
        
        # Check health endpoint response
        HEALTH_RESPONSE=$(curl -s http://localhost:3000/health)
        if echo "$HEALTH_RESPONSE" | grep -q '"status":"healthy"'; then
            print_success "Health endpoint returns correct status"
        else
            print_failure "Health endpoint does not return correct status"
            echo "Response: $HEALTH_RESPONSE"
        fi
        
        if echo "$HEALTH_RESPONSE" | grep -q '"service":"telegram-receiver"'; then
            print_success "Health endpoint returns correct service name"
        else
            print_failure "Health endpoint does not return correct service name"
        fi
        
        if echo "$HEALTH_RESPONSE" | grep -q '"version"'; then
            print_success "Health endpoint returns version"
        else
            print_failure "Health endpoint does not return version"
        fi
    else
        print_failure "App health endpoint is not accessible"
    fi
    
    # Check app healthcheck
    APP_HEALTH=$(docker inspect telegram-receiver-app --format='{{.State.Health.Status}}' 2>/dev/null || echo "unknown")
    if [ "$APP_HEALTH" = "healthy" ]; then
        print_success "App healthcheck passed"
    else
        print_info "App healthcheck status: $APP_HEALTH"
    fi
    
    # Check worker logs
    if docker logs telegram-receiver-worker 2>&1 | grep -qi "error"; then
        print_failure "Worker logs show errors"
        docker logs telegram-receiver-worker | tail -20
    else
        print_success "Worker logs show no errors"
    fi
    
    # Check worker process
    if docker exec telegram-receiver-worker ps aux | grep -qE "(node|worker)"; then
        print_success "Worker process is running"
    else
        print_failure "Worker process is not running"
    fi
else
    print_info "Skipping health checks (Docker not available)"
fi

echo ""

# ==========================================
# Network Connectivity Test
# ==========================================
echo "8. Testing network connectivity..."
echo ""

if [ "$DOCKER_AVAILABLE" = true ]; then
    # Check if containers are on the network
    if docker network inspect virtual-assistant-network 2>&1 | grep -q "telegram-receiver"; then
        print_success "Containers are on virtual-assistant-network"
    else
        print_failure "Containers are not on virtual-assistant-network"
    fi
    
    # Test app can reach Redis
    if docker exec telegram-receiver-app ping -c 1 redis &> /dev/null; then
        print_success "App can reach Redis"
    else
        print_info "App cannot ping Redis (may be expected if ping is not installed)"
    fi
    
    # Check CURSOR_RUNNER_URL environment variable
    if docker exec telegram-receiver-app env | grep -q "CURSOR_RUNNER_URL=http://cursor-runner:3001"; then
        print_success "CURSOR_RUNNER_URL is set correctly in app container"
    else
        print_failure "CURSOR_RUNNER_URL is not set correctly in app container"
    fi
else
    print_info "Skipping network connectivity tests (Docker not available)"
fi

echo ""

# ==========================================
# Volume Check
# ==========================================
echo "9. Checking volumes..."
echo ""

if [ "$DOCKER_AVAILABLE" = true ]; then
    if docker volume ls | grep -q "shared_redis_data"; then
        print_success "shared_redis_data volume exists"
    else
        print_info "shared_redis_data volume does not exist (will be created)"
    fi
    
    if docker volume ls | grep -q "shared_sqlite_db"; then
        print_success "shared_sqlite_db volume exists"
    else
        print_info "shared_sqlite_db volume does not exist (will be created)"
    fi
else
    print_info "Skipping volume checks (Docker not available)"
fi

echo ""

# ==========================================
# Graceful Shutdown Test
# ==========================================
echo "10. Testing graceful shutdown..."
echo ""

if [ "$DOCKER_AVAILABLE" = true ] && [ "$COMPOSE_AVAILABLE" = true ]; then
    print_info "Stopping services gracefully..."
    if $COMPOSE_CMD -f docker-compose.prod.yml stop; then
        print_success "Services stopped gracefully"
        
        # Check if containers are stopped
        if $COMPOSE_CMD -f docker-compose.prod.yml ps | grep -q "Exited"; then
            print_success "Containers stopped successfully"
        else
            print_failure "Containers did not stop properly"
        fi
        
        # Remove containers
        print_info "Removing containers..."
        if $COMPOSE_CMD -f docker-compose.prod.yml down; then
            print_success "Containers removed successfully"
        else
            print_failure "Failed to remove containers"
        fi
    else
        print_failure "Failed to stop services gracefully"
    fi
else
    print_info "Skipping graceful shutdown test (Docker not available)"
fi

echo ""

# ==========================================
# Summary
# ==========================================
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo "Passed: $PASSED"
echo "Failed: $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed.${NC}"
    exit 1
fi
