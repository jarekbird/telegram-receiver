# Integration Tests

Integration tests verify that multiple components work together correctly. They may use real dependencies (with proper test isolation) or mocked external services.

## Structure

- `api/` - API endpoint integration tests using Supertest
- `services/` - Service integration tests that test multiple services together

## Guidelines

1. **Real Dependencies**: Can use real databases, but should use test databases
2. **Isolation**: Each test should clean up after itself
3. **Setup/Teardown**: Use beforeEach/afterEach for test isolation
4. **External APIs**: Mock external HTTP APIs using nock or similar

## Example

```typescript
import request from 'supertest';
import app from '@/index';

describe('POST /api/users', () => {
  beforeEach(async () => {
    // Setup test database
    await setupTestDatabase();
  });

  afterEach(async () => {
    // Cleanup
    await cleanupTestDatabase();
  });

  it('should create a user and return 201', async () => {
    const userData = { name: 'John', email: 'john@example.com' };
    
    const response = await request(app)
      .post('/api/users')
      .send(userData)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe(userData.name);
  });
});
```
