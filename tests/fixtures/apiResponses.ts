/**
 * Mock API response fixtures
 */

export const cursorRunnerSuccessResponse = {
  success: true,
  message: 'Task completed successfully',
  data: {
    taskId: 'task-123',
    status: 'completed',
  },
};

export const cursorRunnerErrorResponse = {
  success: false,
  error: 'Task failed',
  message: 'An error occurred while processing the task',
};

export const createCursorRunnerResponse = (overrides = {}) => ({
  ...cursorRunnerSuccessResponse,
  ...overrides,
});
