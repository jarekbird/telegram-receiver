/**
 * Mock API response fixtures
 */

export const cursorRunnerSuccessResponse = {
  ok: true,
  message: 'Task completed successfully',
  data: {
    taskId: 'task-123',
    status: 'completed',
  },
};

export const cursorRunnerErrorResponse = {
  ok: false,
  error: 'Task failed',
  details: {
    reason: 'An error occurred while processing the task',
  },
};

export const createCursorRunnerResponse = (overrides = {}) => ({
  ...cursorRunnerSuccessResponse,
  ...overrides,
});
