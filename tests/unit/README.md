# Unit Tests

Unit tests test individual functions, classes, and modules in isolation. All external dependencies should be mocked.

## Structure

This directory mirrors the `src/` directory structure:

- `controllers/` - Controller unit tests
- `services/` - Service unit tests
- `routes/` - Route handler unit tests
- `middleware/` - Middleware unit tests
- `utils/` - Utility function tests
- `models/` - Model tests
- `config/` - Configuration tests
- `types/` - Type definition tests

## Guidelines

1. **Isolation**: Each test should be completely independent
2. **Mocking**: Mock all external dependencies (databases, APIs, file system, etc.)
3. **Speed**: Unit tests should run quickly (< 100ms per test)
4. **Coverage**: Aim for high coverage of business logic

## Example

```typescript
import { UserService } from '@/services/userService';
import * as userRepository from '@/repositories/userRepository';

jest.mock('@/repositories/userRepository');

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      // Arrange
      const userData = { name: 'John', email: 'john@example.com' };
      jest.spyOn(userRepository, 'create').mockResolvedValue({ id: 1, ...userData });

      // Act
      const result = await UserService.createUser(userData);

      // Assert
      expect(result).toHaveProperty('id');
      expect(userRepository.create).toHaveBeenCalledWith(userData);
    });
  });
});
```
