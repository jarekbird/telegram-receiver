# Test Helpers

Utility functions and helpers for writing tests more efficiently.

## Common Helpers

- `testUtils.ts` - General test utilities
- `dbHelpers.ts` - Database test helpers (setup, cleanup, etc.)
- `apiHelpers.ts` - API test helpers (request builders, etc.)
- `mockHelpers.ts` - Mock creation helpers

## Example

```typescript
// helpers/testUtils.ts
export const createTestUser = (overrides = {}) => ({
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  ...overrides,
});

export const waitFor = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// In your test
import { createTestUser } from '../helpers/testUtils';
const user = createTestUser({ email: 'custom@example.com' });
```
