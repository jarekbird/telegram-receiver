#!/bin/bash

# Script to test CI workflow locally using act tool
# This script verifies prerequisites, installs act if needed, and runs the CI workflow locally

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "=========================================="
echo "Local CI Workflow Testing with act"
echo "=========================================="
echo ""

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

# Check prerequisites
echo "Checking prerequisites..."

# Check if CI workflow file exists
if [ ! -f ".github/workflows/ci.yml" ]; then
    print_error ".github/workflows/ci.yml not found"
    exit 1
fi
print_success "CI workflow file exists"

# Check Docker
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed"
    print_info "Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi
print_success "Docker is installed: $(docker --version)"

# Check if Docker is running
if ! docker ps &> /dev/null; then
    print_error "Docker is not running"
    print_info "Please start Docker daemon"
    exit 1
fi
print_success "Docker is running"

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    exit 1
fi
NODE_VERSION=$(node --version)
print_success "Node.js is installed: $NODE_VERSION"

# Check if act is installed
if ! command -v act &> /dev/null; then
    print_info "act tool is not installed"
    echo ""
    echo "To install act:"
    echo "  macOS:   brew install act"
    echo "  Linux:   Download from https://github.com/nektos/act/releases"
    echo "  Windows: Download from https://github.com/nektos/act/releases or use WSL"
    echo ""
    read -p "Would you like to install act now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            if command -v brew &> /dev/null; then
                brew install act
            else
                print_error "Homebrew is not installed. Please install act manually."
                exit 1
            fi
        else
            print_error "Please install act manually from https://github.com/nektos/act/releases"
            exit 1
        fi
    else
        print_error "act is required to test workflows locally"
        exit 1
    fi
fi

ACT_VERSION=$(act --version)
print_success "act is installed: $ACT_VERSION"

echo ""
echo "=========================================="
echo "Testing CI Workflow"
echo "=========================================="
echo ""

# List available workflows
echo "Listing available workflows..."
act -l
echo ""

# Function to run workflow with a specific event
run_workflow() {
    local event=$1
    local description=$2
    
    echo "----------------------------------------"
    echo "Testing workflow with event: $event"
    echo "Description: $description"
    echo "----------------------------------------"
    
    if act "$event" -W .github/workflows/ci.yml; then
        print_success "Workflow completed successfully for $event event"
        return 0
    else
        print_error "Workflow failed for $event event"
        return 1
    fi
}

# Test with different events
FAILED_EVENTS=()

# Test push event
if ! run_workflow "push" "Simulates push to main branch"; then
    FAILED_EVENTS+=("push")
fi
echo ""

# Test pull_request event
if ! run_workflow "pull_request" "Simulates pull request event"; then
    FAILED_EVENTS+=("pull_request")
fi
echo ""

# Test workflow_dispatch event (manual trigger)
if ! run_workflow "workflow_dispatch" "Simulates manual trigger"; then
    FAILED_EVENTS+=("workflow_dispatch")
fi
echo ""

# Summary
echo "=========================================="
echo "Test Summary"
echo "=========================================="

if [ ${#FAILED_EVENTS[@]} -eq 0 ]; then
    print_success "All workflow tests passed!"
    echo ""
    echo "The CI workflow is ready to use. You can now push changes"
    echo "to GitHub with confidence that the workflow will run successfully."
    exit 0
else
    print_error "Some workflow tests failed:"
    for event in "${FAILED_EVENTS[@]}"; do
        echo "  - $event"
    done
    echo ""
    print_info "Please review the errors above and fix any issues in .github/workflows/ci.yml"
    exit 1
fi
