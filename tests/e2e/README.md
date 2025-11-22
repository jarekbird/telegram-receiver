# End-to-End Tests

E2E tests verify complete user flows using Playwright. They test the full application stack including the frontend (if applicable) and backend.

## Structure

Tests in this directory use Playwright and follow the `.spec.ts` naming convention.

## Guidelines

1. **Full Stack**: Test the complete application flow
2. **Real Environment**: Use test environment that closely matches production
3. **Isolation**: Each test should be independent
4. **Performance**: E2E tests are slower, so keep them focused on critical paths

## Example

```typescript
import { test, expect } from '@playwright/test';

test.describe('User Registration Flow', () => {
  test('should register a new user successfully', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/register');

    // Fill in registration form
    await page.fill('[name="name"]', 'John Doe');
    await page.fill('[name="email"]', 'john@example.com');
    await page.fill('[name="password"]', 'password123');

    // Submit form
    await page.click('button[type="submit"]');

    // Verify success message
    await expect(page.locator('.success-message')).toBeVisible();
  });
});
```

## Running E2E Tests

```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```
