# Redis Client Usage Guide

This document describes how Redis clients are used in the telegram-receiver application, matching the Rails implementation patterns from `jarek-va`.

## Overview

The application uses Redis for two main purposes:

1. **Background Job Processing** (BullMQ) - Replaces Rails Sidekiq
2. **Direct Redis Operations** (CursorRunnerCallbackService) - Stores callback state

## Redis Client Packages

The application includes the following Redis client packages:

| Package | Version | Purpose | TypeScript Types |
|---------|---------|---------|------------------|
| `redis` | ^4.6.10 | Direct Redis operations (alternative to ioredis) | `@types/redis` (^4.0.11) |
| `ioredis` | ^5.8.2 | BullMQ integration and direct Redis operations (recommended) | Built-in types |
| `bullmq` | ^5.64.1 | Background job processing (Sidekiq replacement) | Built-in types |

**Note**: Modern versions of `redis` (v4+) and `ioredis` (v5+) include their own TypeScript type definitions. The `@types/*` packages are listed in `package.json` for compatibility but are not strictly required.

## Redis Connection Configuration

Redis connection configuration matches the Rails pattern:

- **Environment Variable**: `REDIS_URL` (matches Rails `ENV.fetch('REDIS_URL', ...)`)
- **Default Value**: `redis://localhost:6379/0` (matches Rails default)
- **Docker Configuration**: `redis://redis:6379/0` (matches Rails Docker pattern)

**Implementation Location**: `src/config/redis.ts`

```typescript
export const redisConfig = {
  url: process.env.REDIS_URL || 'redis://localhost:6379/0',
};
```

**Rails Reference**:
- `jarek-va/app/services/cursor_runner_callback_service.rb`: `ENV.fetch('REDIS_URL', 'redis://localhost:6379/0')`
- `jarek-va/config/initializers/sidekiq.rb`: `ENV.fetch('REDIS_URL', 'redis://localhost:6379/0')`

## Component Usage

### 1. BullMQ (Background Jobs) → Uses `ioredis`

**Location**: `src/worker.ts`, `src/config/queue.ts`

**Rails Equivalent**: `config/initializers/sidekiq.rb` (Sidekiq)

BullMQ requires `ioredis` for its connection. The application creates an IORedis instance and passes it to BullMQ:

```typescript
import IORedis from 'ioredis';
import { redisConfig } from './redis';

export const redisConnection = new IORedis(redisConfig.url, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// BullMQ uses this connection
export const connection = redisConnection;
```

**Why ioredis**: BullMQ has a hard dependency on `ioredis` and cannot use the `redis` (node-redis) package.

### 2. CursorRunnerCallbackService (Direct Redis Operations) → Uses `ioredis` (recommended)

**Location**: `src/services/cursor_runner_callback_service.ts` (to be implemented)

**Rails Equivalent**: `app/services/cursor_runner_callback_service.rb`

The CursorRunnerCallbackService performs direct Redis operations (`setex`, `get`, `del`) to store callback state. While both `redis` and `ioredis` can be used, **`ioredis` is recommended** for the following reasons:

1. **Consistency**: BullMQ already uses `ioredis`, so using the same client reduces dependencies
2. **TypeScript Support**: Better TypeScript support and type definitions
3. **Feature-Rich API**: More comprehensive API with better error handling
4. **Connection Reuse**: Can reuse the same IORedis connection instance used by BullMQ

**Example Implementation** (using ioredis):

```typescript
import IORedis from 'ioredis';
import { redisConfig } from '../config/redis';

class CursorRunnerCallbackService {
  private redis: IORedis;
  private readonly REDIS_KEY_PREFIX = 'cursor_runner_callback:';
  private readonly DEFAULT_TTL = 3600; // 1 hour

  constructor(redisClient?: IORedis, redisUrl?: string) {
    if (redisClient) {
      this.redis = redisClient;
    } else {
      const url = redisUrl || redisConfig.url;
      this.redis = new IORedis(url);
    }
  }

  async storePendingRequest(requestId: string, data: object, ttl: number = this.DEFAULT_TTL): Promise<void> {
    const key = `${this.REDIS_KEY_PREFIX}${requestId}`;
    await this.redis.setex(key, ttl, JSON.stringify(data));
  }

  async getPendingRequest(requestId: string): Promise<object | null> {
    const key = `${this.REDIS_KEY_PREFIX}${requestId}`;
    const data = await this.redis.get(key);
    if (!data) return null;
    return JSON.parse(data);
  }

  async removePendingRequest(requestId: string): Promise<void> {
    const key = `${this.REDIS_KEY_PREFIX}${requestId}`;
    await this.redis.del(key);
  }
}
```

**Alternative Implementation** (using redis/node-redis):

If you prefer to use the `redis` package instead, the implementation would be:

```typescript
import { createClient } from 'redis';
import { redisConfig } from '../config/redis';

class CursorRunnerCallbackService {
  private redis: ReturnType<typeof createClient>;
  // ... similar implementation using redis client API
}
```

## Redis Operations Reference

### Common Operations (matching Rails implementation)

| Operation | Rails (redis gem) | ioredis | redis (node-redis) |
|-----------|-------------------|---------|-------------------|
| Set with TTL | `redis.setex(key, ttl, value)` | `redis.setex(key, ttl, value)` | `redis.setEx(key, ttl, value)` |
| Get | `redis.get(key)` | `redis.get(key)` | `redis.get(key)` |
| Delete | `redis.del(key)` | `redis.del(key)` | `redis.del(key)` |
| Exists | `redis.exists(key)` | `redis.exists(key)` | `redis.exists(key)` |

## Testing

Redis connection tests are located at `tests/unit/redis-connection.test.ts`. These tests verify:

- `ioredis` client connectivity
- `redis` (node-redis) client connectivity
- Redis URL configuration
- Basic operations (set/get/del)

**Note**: The tests require a running Redis instance. In CI/CD, use a test Redis container or mock the Redis clients.

## Docker Configuration

In Docker, Redis is configured via environment variables:

```yaml
# docker-compose.yml
environment:
  - REDIS_URL=redis://redis:6379/0
```

This matches the Rails Docker configuration where `REDIS_URL` is set to `redis://redis:6379/0` (using the service name `redis` instead of `localhost`).

## Migration from Rails

When converting Rails code that uses Redis:

1. **Sidekiq → BullMQ**: Use `ioredis` connection with BullMQ
2. **Direct Redis operations**: Use `ioredis` for consistency (or `redis` if preferred)
3. **Connection URL**: Use `REDIS_URL` environment variable (same as Rails)
4. **Operations**: Map Rails redis gem methods to ioredis/redis equivalents

## Summary

- **BullMQ**: Must use `ioredis` (hard requirement)
- **CursorRunnerCallbackService**: Recommended to use `ioredis` for consistency and better TypeScript support
- **Connection Configuration**: Uses `REDIS_URL` environment variable (matches Rails pattern)
- **Default URL**: `redis://localhost:6379/0` (matches Rails default)
- **Docker URL**: `redis://redis:6379/0` (matches Rails Docker pattern)
