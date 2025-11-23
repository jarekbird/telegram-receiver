# Multi-stage Dockerfile for Node.js/TypeScript telegram-receiver application
# Build stage: Compile TypeScript and prepare production build
FROM node:18-alpine AS builder

# Install system dependencies needed for building native modules
# better-sqlite3 requires python3, make, and g++ for native compilation
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    curl

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package.json package-lock.json ./

# Install all dependencies (including dev dependencies for TypeScript compilation)
RUN npm ci

# Copy source files and TypeScript configuration
COPY src/ ./src/
COPY tsconfig.json ./

# Build TypeScript to JavaScript
RUN npm run build

# Production stage: Create minimal production image
FROM node:18-alpine AS production

# Install system dependencies for runtime
# curl is needed for health checks
# better-sqlite3 may need sqlite3 runtime library
RUN apk add --no-cache \
    curl \
    sqlite

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Copy package.json for runtime (needed for app name/version in logs)
COPY package.json ./

# Create shared database directory with proper permissions
# This directory is used for shared SQLite database at /app/shared_db/shared.sqlite3
RUN mkdir -p /app/shared_db && chmod 777 /app/shared_db

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Health check
# Checks the /health endpoint using curl
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Use entrypoint script
ENTRYPOINT ["docker-entrypoint.sh"]

# Start production server
# Note: This CMD is for production deployment only.
# Developers should NOT run the server manually for testing - use automated tests instead.
CMD ["node", "dist/index.js"]
