# Logging Library Comparison

This document compares logging libraries for the Node.js application to replicate Rails logging patterns from jarek-va.

## Requirements

The chosen library must support:

- Multiple log levels (info, error, warn, debug)
- Structured JSON logging
- Environment-based configuration (log levels, formats)
- Request ID/tagging support (for request tracing)
- Error logging with stack traces
- TypeScript type definitions
- Production readiness (stdout logging, Docker-friendly)
- Ecosystem and community support

## Comparison: Pino vs Winston vs Bunyan

### Pino (Recommended)

**Performance:**

- ⭐⭐⭐⭐⭐ Significantly faster than Winston (5-10x faster)
- Asynchronous logging with minimal overhead
- Optimized JSON serialization
- Critical for high-throughput API applications

**Structured Logging:**

- ✅ Native JSON output (default format)
- ✅ Excellent structured logging support
- ✅ Easy to add custom fields

**Environment Configuration:**

- ✅ Configurable log levels via `LOG_LEVEL` env var
- ✅ Supports different formats per environment
- ✅ `pino-pretty` for development (readable output)
- ✅ JSON format for production (Docker-friendly)

**Request ID/Tagging:**

- ✅ Child loggers for request context (similar to Rails TaggedLogging)
- ✅ Can create child loggers with `logger.child({ requestId: '...' })`
- ✅ All logs from child logger automatically include requestId

**Error Logging:**

- ✅ Automatic error serialization with `logger.error({ err }, 'message')`
- ✅ Includes full stack traces in error objects
- ✅ Can log exception class, message, and backtrace separately

**TypeScript Support:**

- ✅ Official TypeScript types (`@types/pino`)
- ✅ Full type safety

**Production/Docker:**

- ✅ Stdout logging by default
- ✅ JSON format perfect for log aggregation
- ✅ Minimal overhead

**Ecosystem:**

- ✅ Active maintenance and community
- ✅ Many plugins available (pino-pretty, pino-http, etc.)
- ✅ Well-documented

**Verdict:** ✅ **CHOSEN** - Best performance, excellent structured logging, perfect for production use.

---

### Winston

**Performance:**

- ⭐⭐⭐ Slower than Pino (5-10x slower)
- Synchronous by default (can be async with transports)
- Higher overhead

**Structured Logging:**

- ✅ Supports JSON format
- ✅ Flexible format configuration
- ✅ Multiple transports

**Environment Configuration:**

- ✅ Configurable log levels
- ✅ Multiple format options
- ✅ Environment-based configuration possible

**Request ID/Tagging:**

- ✅ Can use child loggers with metadata
- ✅ More complex setup than Pino

**Error Logging:**

- ✅ Supports error objects
- ✅ Can include stack traces
- ⚠️ Requires more configuration

**TypeScript Support:**

- ✅ TypeScript types available
- ✅ Good type safety

**Production/Docker:**

- ✅ Supports stdout logging
- ✅ JSON format available
- ⚠️ More configuration needed

**Ecosystem:**

- ✅ Large ecosystem
- ✅ Many transports available
- ✅ Well-documented

**Verdict:** ⚠️ **NOT CHOSEN** - More flexible but significantly slower, more complex configuration.

---

### Bunyan

**Performance:**

- ⭐⭐⭐⭐ Good performance (faster than Winston, slower than Pino)
- Asynchronous logging
- JSON-first design

**Structured Logging:**

- ✅ Native JSON output
- ✅ Excellent structured logging

**Environment Configuration:**

- ✅ Configurable log levels
- ✅ Environment-based configuration possible

**Request ID/Tagging:**

- ✅ Child loggers with context
- ✅ Similar to Pino's approach

**Error Logging:**

- ✅ Good error serialization
- ✅ Stack trace support

**TypeScript Support:**

- ⚠️ Limited TypeScript support
- ⚠️ Types may be outdated

**Production/Docker:**

- ✅ Stdout logging
- ✅ JSON format
- ✅ Docker-friendly

**Ecosystem:**

- ⚠️ Less active maintenance
- ⚠️ Smaller ecosystem than Pino/Winston

**Verdict:** ⚠️ **NOT CHOSEN** - Good performance but less active maintenance, limited TypeScript support.

---

## Decision: Pino

**Rationale:**

1. **Performance**: 5-10x faster than Winston, critical for API applications
2. **Structured Logging**: Native JSON output perfect for production
3. **Request ID Support**: Child loggers provide Rails TaggedLogging-like functionality
4. **Error Handling**: Excellent error serialization with full stack traces
5. **TypeScript**: Official types with full type safety
6. **Production Ready**: JSON format, stdout logging, Docker-friendly
7. **Ecosystem**: Active maintenance, well-documented, many plugins

**Installation:**

- Production: `pino` (already installed: ^10.1.0)
- Development: `pino-pretty` (already installed: ^13.1.2)
- TypeScript: `@types/pino` (already installed: ^7.0.4)

**Configuration:**

- Log level: Configurable via `LOG_LEVEL` env var (defaults to 'info' in production, 'debug' in development)
- Format: JSON for production, pretty-printed for development (via pino-pretty)
- Request ID: Child loggers for request context
- Error logging: Automatic error serialization with stack traces
- Timestamp: Included by default in Pino output
- PID: Can be added via custom serializer

---

## Rails Logging Patterns Replicated

| Rails Pattern                     | Pino Implementation                      | Status |
| --------------------------------- | ---------------------------------------- | ------ | ------- | --- |
| `Rails.logger.info()`             | `logger.info()`                          | ✅     |
| `Rails.logger.error()`            | `logger.error({ err }, 'message')`       | ✅     |
| `Rails.logger.warn()`             | `logger.warn()`                          | ✅     |
| `Rails.logger.debug()`            | `logger.debug()`                         | ✅     |
| `config.log_level = :info`        | `level: process.env.LOG_LEVEL            |        | 'info'` | ✅  |
| `config.log_tags = [:request_id]` | `logger.child({ requestId })`            | ✅     |
| `ActiveSupport::TaggedLogging`    | Child loggers with context               | ✅     |
| Error with backtrace              | `logger.error({ err })` (includes stack) | ✅     |
| Stdout logging                    | Default Pino behavior                    | ✅     |
| JSON format (production)          | Default Pino format                      | ✅     |
| Pretty format (development)       | `pino-pretty`                            | ✅     |
| Timestamp in logs                 | Included by default                      | ✅     |
| PID in logs                       | Can be added via serializer              | ✅     |

---

## References

- **Pino Documentation**: https://getpino.io/
- **Pino Performance**: https://getpino.io/#/docs/benchmarks
- **Rails Logging**: jarek-va/config/application.rb, jarek-va/config/environments/production.rb
- **Task Requirements**: telegram-receiver/Plan/tasks/phase-1/section-08/subsection-01/30.md
