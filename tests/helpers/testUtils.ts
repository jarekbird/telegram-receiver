/**
 * General test utility functions
 */

/**
 * Creates a delay for async operations in tests
 */
export const waitFor = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Creates a mock function with proper typing
 */
export const createMockFn = <T extends (...args: any[]) => any>(
  implementation?: T
): jest.MockedFunction<T> => {
  return jest.fn(implementation) as jest.MockedFunction<T>;
};

/**
 * Creates a random string for testing
 */
export const randomString = (length = 10): string => {
  return Math.random().toString(36).substring(2, length + 2);
};

/**
 * Creates a random email for testing
 */
export const randomEmail = (): string => {
  return `test-${randomString()}@example.com`;
};

/**
 * Creates a random integer within a range
 */
export const randomInt = (min = 0, max = 1000): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Asserts that a promise rejects with a specific error
 */
export const expectRejection = async (
  promise: Promise<any>,
  errorMessage?: string
): Promise<void> => {
  try {
    await promise;
    throw new Error('Expected promise to reject, but it resolved');
  } catch (error: any) {
    if (errorMessage) {
      expect(error.message).toContain(errorMessage);
    }
  }
};
