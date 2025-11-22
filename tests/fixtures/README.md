# Test Fixtures

Test fixtures contain reusable test data that can be imported and used across multiple tests.

## Usage

Create fixture files for common test data patterns:

- `users.ts` - User test data
- `telegramMessages.ts` - Telegram message fixtures
- `apiResponses.ts` - Mock API response data
- `database.ts` - Database seed data

## Example

```typescript
// fixtures/users.ts
export const testUser = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  createdAt: new Date('2024-01-01'),
};

export const testUsers = [testUser, { ...testUser, id: 2, email: 'test2@example.com' }];

// In your test
import { testUser } from '../fixtures/users';
```
