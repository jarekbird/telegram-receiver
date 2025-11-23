# Logging Library Comparison and Selection

## Task: PHASE1-030 - Choose logging library

This document compares the three main logging libraries for Node.js (Winston, Pino, Bunyan) and documents the selection decision for the telegram-receiver application.

## Requirements Summary

The logging library must support:
1. **Structured logging** - JSON format for production
2. **Multiple log levels** - info, error, warn, debug
3. **Request ID tagging** - Similar to Rails `ActiveSupport::TaggedLogging`
4. **Environment-based configuration** - Different log levels and formats based on `NODE_ENV` and `LOG_LEVEL`
5. **Error logging with stack traces** - Full exception backtraces
6. **Production/Docker support** - Stdout logging for containerized environments
7. **TypeScript support** - Type definitions available
8. **Performance** - High throughput for API applications
9. **Rails pattern replication** - Match jarek-va Rails logging patterns

## Library Comparison

### 1. Pino

**Overview:**
Pino is a very fast, low overhead structured logger for Node.js applications. It's designed for high-performance logging with minimal overhead.

**Performance:**
- **Significantly faster than Winston** (often 5-10x faster)
- Asynchronous logging by default
- Optimized JSON serialization
- Minimal CPU and memory overhead
- Benchmarks show Pino can log 10x faster than Winston

**Features:**
- ✅ Structured JSON logging (default format)
- ✅ Multiple log levels (trace, debug, info, warn, error, fatal)
- ✅ Child loggers for request ID tagging (`logger.child({ requestId })`)
- ✅ Environment-based configuration (via options)
- ✅ Full error stack traces (automatic via `pino.stdSerializers.err`)
- ✅ Stdout/stderr transport (default behavior)
- ✅ TypeScript support (built-in types in v9+)
- ✅ Pretty printing via `pino-pretty` transport
- ✅ Timestamp and PID support (via base object)
- ✅ Production-ready and Docker-friendly

**Ecosystem:**
- Large community and ecosystem
- Well-maintained and actively developed
- Many plugins and integrations available
- Used by major Node.js projects

**Rails Pattern Support:**
- ✅ `Rails.logger.info()` → `logger.info()`
- ✅ `Rails.logger.error()` → `logger.error({ err }, 'message')` (includes stack trace)
- ✅ `Rails.logger.warn()` → `logger.warn()`
- ✅ `Rails.logger.debug()` → `logger.debug()`
- ✅ `config.log_tags = [:request_id]` → `logger.child({ requestId })`
- ✅ `ENV['LOG_LEVEL']` → `process.env.LOG_LEVEL`
- ✅ Error logging with full backtraces (via error serializer)
- ✅ Timestamp and PID in output (via base object)

**Installation:**
```bash
npm install pino
npm install pino-pretty  # For pretty printing in development
```

**TypeScript:**
- Built-in TypeScript types (v9+)
- No need for `@types/pino` package

**Example Usage:**
```typescript
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: { pid: process.pid },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// Request ID tagging
const requestLogger = logger.child({ requestId: 'uuid-here' });
requestLogger.info('Request started');

// Error logging with stack trace
logger.error({ err: error }, 'Error occurred');
```

**Pros:**
- Extremely fast (5-10x faster than Winston)
- Low overhead
- Built-in TypeScript support
- Excellent structured logging
- Child logger support for request ID tagging
- Production-ready and Docker-friendly

**Cons:**
- Less flexible than Winston (but sufficient for most use cases)
- Pretty printing requires separate transport (`pino-pretty`)

### 2. Winston

**Overview:**
Winston is a popular, flexible logging library for Node.js with a large ecosystem of transports and formatters.

**Performance:**
- Slower than Pino (often 5-10x slower)
- Synchronous logging by default (can be configured for async)
- Higher CPU and memory overhead
- More features = more overhead

**Features:**
- ✅ Structured JSON logging (via JSON formatter)
- ✅ Multiple log levels (customizable)
- ✅ Request ID tagging (via format options or metadata)
- ✅ Environment-based configuration
- ✅ Error stack traces (via error formatter)
- ✅ Multiple transports (console, file, HTTP, etc.)
- ✅ TypeScript support (via `@types/winston`)
- ✅ Pretty printing (via `winston.format.prettyPrint()`)
- ✅ Timestamp and PID support (via format options)

**Ecosystem:**
- Very large ecosystem
- Many transports and formatters available
- Well-maintained and widely used
- Extensive documentation

**Rails Pattern Support:**
- ✅ `Rails.logger.info()` → `logger.info()`
- ✅ `Rails.logger.error()` → `logger.error('message', { error })` (requires formatter for stack trace)
- ✅ `Rails.logger.warn()` → `logger.warn()`
- ✅ `Rails.logger.debug()` → `logger.debug()`
- ⚠️ `config.log_tags = [:request_id]` → Requires format configuration (more complex)
- ✅ `ENV['LOG_LEVEL']` → `process.env.LOG_LEVEL`
- ⚠️ Error logging with full backtraces (requires custom formatter)
- ✅ Timestamp and PID in output (via format options)

**Installation:**
```bash
npm install winston
npm install --save-dev @types/winston
```

**TypeScript:**
- Requires `@types/winston` package

**Example Usage:**
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});

// Request ID tagging (more complex)
const requestLogger = logger.child({ requestId: 'uuid-here' });
requestLogger.info('Request started');
```

**Pros:**
- Very flexible and configurable
- Large ecosystem of transports
- Extensive documentation
- Widely used and well-supported

**Cons:**
- Slower than Pino (5-10x slower)
- Higher overhead
- More complex configuration
- Requires `@types/winston` for TypeScript

### 3. Bunyan

**Overview:**
Bunyan is a JSON logging library for Node.js services. It was one of the first structured logging libraries for Node.js.

**Performance:**
- Faster than Winston, but slower than Pino
- Asynchronous logging
- Moderate overhead

**Features:**
- ✅ Structured JSON logging (default format)
- ✅ Multiple log levels
- ✅ Child loggers for request ID tagging
- ✅ Environment-based configuration
- ✅ Error stack traces (via error serializer)
- ✅ Stdout/stderr transport
- ✅ TypeScript support (via `@types/bunyan`)
- ⚠️ Pretty printing (requires `bunyan` CLI tool, not built-in)
- ✅ Timestamp support (built-in)

**Ecosystem:**
- Smaller ecosystem than Winston or Pino
- Less actively maintained (development has slowed)
- Fewer plugins and integrations

**Rails Pattern Support:**
- ✅ `Rails.logger.info()` → `logger.info()`
- ✅ `Rails.logger.error()` → `logger.error({ err }, 'message')` (includes stack trace)
- ✅ `Rails.logger.warn()` → `logger.warn()`
- ✅ `Rails.logger.debug()` → `logger.debug()`
- ✅ `config.log_tags = [:request_id]` → `logger.child({ requestId })`
- ✅ `ENV['LOG_LEVEL']` → `process.env.LOG_LEVEL`
- ✅ Error logging with full backtraces (via error serializer)
- ✅ Timestamp in output (built-in)

**Installation:**
```bash
npm install bunyan
npm install --save-dev @types/bunyan
```

**TypeScript:**
- Requires `@types/bunyan` package

**Example Usage:**
```typescript
import bunyan from 'bunyan';

const logger = bunyan.createLogger({
  name: 'app',
  level: process.env.LOG_LEVEL || 'info',
});

// Request ID tagging
const requestLogger = logger.child({ requestId: 'uuid-here' });
requestLogger.info('Request started');
```

**Pros:**
- Good structured logging
- Child logger support
- JSON format by default

**Cons:**
- Slower than Pino
- Less actively maintained
- Smaller ecosystem
- Pretty printing requires external CLI tool
- Requires `@types/bunyan` for TypeScript

## Decision: Pino

**Selected Library:** Pino

**Rationale:**

1. **Performance**: Pino is significantly faster (5-10x) than Winston, which is critical for high-throughput API applications. This aligns with the performance consideration mentioned in the task notes.

2. **Rails Pattern Support**: Pino's child logger feature (`logger.child({ requestId })`) perfectly matches Rails' `ActiveSupport::TaggedLogging` pattern for request ID tagging.

3. **Structured Logging**: Pino's default JSON format is ideal for production log aggregation and analysis, matching the requirements from PHASE1-020 and PHASE1-031.

4. **TypeScript Support**: Pino v9+ has built-in TypeScript types, eliminating the need for `@types/pino` package.

5. **Error Handling**: Pino's error serializer (`pino.stdSerializers.err`) automatically includes full stack traces, matching Rails' error logging pattern.

6. **Production Ready**: Pino is designed for production use with stdout logging, making it Docker-friendly and suitable for containerized environments.

7. **Environment Configuration**: Pino supports environment-based log levels and formats (JSON for production, pretty for development) via configuration options.

8. **Already Installed**: Pino v9.14.0 is already installed in the project, and the logger configuration is already implemented.

## Verification

### Requirements Checklist

- [x] **Multiple log levels** (info, error, warn, debug) - ✅ Supported
- [x] **Structured JSON logging** - ✅ Default format
- [x] **Environment-based log level configuration** - ✅ Via `LOG_LEVEL` env var and `NODE_ENV`
- [x] **Pretty printing for development** - ✅ Via `pino-pretty` transport
- [x] **Request ID/tagging support** - ✅ Via child loggers (`logger.child({ requestId })`)
- [x] **Error logging with stack traces** - ✅ Via `pino.stdSerializers.err`
- [x] **Stdout/stderr transport for production** - ✅ Default behavior
- [x] **Log formatter with timestamp and PID** - ✅ Via base object and timestamp option
- [x] **TypeScript type definitions** - ✅ Built-in (v9+)

### Implementation Status

- [x] **Library installed** - ✅ Pino v9.14.0 installed
- [x] **TypeScript types** - ✅ Built-in (no @types/pino needed)
- [x] **Logger configuration** - ✅ Implemented in `src/config/logger.ts`
- [x] **Rails-like wrapper** - ✅ Implemented in `src/utils/logger.ts`
- [x] **Request ID support** - ✅ Via child loggers
- [x] **Error logging** - ✅ Rails-style error logging implemented
- [x] **Environment configuration** - ✅ LOG_LEVEL and NODE_ENV support

## Conclusion

Pino is the optimal choice for the telegram-receiver application. It provides:
- Superior performance (critical for API applications)
- Excellent Rails pattern replication
- Built-in TypeScript support
- Production-ready structured logging
- All required features out of the box

The library is already installed and configured, meeting all requirements from the task checklist.
