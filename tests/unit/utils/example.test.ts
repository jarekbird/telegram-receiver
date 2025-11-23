/**
 * Example unit test file
 *
 * This is a simple "hello world" style test that always passes.
 * Its purpose is to verify that the Jest test infrastructure is properly configured:
 * - Jest can discover and run test files
 * - TypeScript compilation works correctly in the test environment
 * - The test setup file (tests/setup.ts) is loaded properly
 * - Test output appears correctly in the console
 *
 * This test follows the AAA pattern (Arrange, Act, Assert) as documented in tests/README.md
 */

describe('Example Test Suite', () => {
  describe('Basic functionality', () => {
    it('should verify that Jest is working correctly', () => {
      // Arrange
      const expectedValue = true;

      // Act
      const actualValue = true;

      // Assert
      expect(actualValue).toBe(expectedValue);
    });

    it('should verify basic arithmetic operations', () => {
      // Arrange
      const a = 1;
      const b = 1;
      const expectedSum = 2;

      // Act
      const actualSum = a + b;

      // Assert
      expect(actualSum).toBe(expectedSum);
    });

    it('should verify that TypeScript types are working', () => {
      // Arrange
      const testString: string = 'Hello, Jest!';
      const expectedLength: number = 12;

      // Act
      const actualLength = testString.length;

      // Assert
      expect(actualLength).toBe(expectedLength);
      expect(typeof testString).toBe('string');
    });
  });
});
