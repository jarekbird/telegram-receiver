# Test Mocks

Mock implementations for external dependencies and services.

## Usage

Create mock files for:

- External APIs (Telegram API, Cursor Runner API, etc.)
- Database connections
- Redis clients
- File system operations
- Third-party services

## Example

```typescript
// mocks/telegramApi.ts
export const mockTelegramApi = {
  sendMessage: jest.fn().mockResolvedValue({ ok: true }),
  getUpdates: jest.fn().mockResolvedValue({ ok: true, result: [] }),
};

// In your test
import { mockTelegramApi } from '../mocks/telegramApi';
jest.mock('@/services/telegramApi', () => mockTelegramApi);
```
