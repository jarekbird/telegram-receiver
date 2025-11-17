/**
 * Mock Cursor Runner API implementation
 */

export const mockCursorRunnerApi = {
  sendMessage: jest.fn().mockResolvedValue({
    success: true,
    message: 'Message sent successfully',
    data: {
      taskId: 'task-123',
    },
  }),
  iterate: jest.fn().mockResolvedValue({
    success: true,
    result: 'Task completed',
  }),
  iterateAsync: jest.fn().mockResolvedValue({
    success: true,
    taskId: 'async-task-123',
  }),
};

export const resetCursorRunnerApiMocks = () => {
  Object.values(mockCursorRunnerApi).forEach((mockFn) => {
    if (jest.isMockFunction(mockFn)) {
      mockFn.mockClear();
    }
  });
};
