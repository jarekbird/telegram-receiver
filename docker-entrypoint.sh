#!/bin/bash
set -e

# Ensure shared database directory exists
mkdir -p /app/shared_db

# Set proper permissions for the shared database directory
# This allows the application to create and write to the shared SQLite database
chmod 777 /app/shared_db 2>/dev/null || true

# Execute the main command
exec "$@"
