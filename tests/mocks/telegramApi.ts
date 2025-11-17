/**
 * Mock Telegram API implementation
 */

export const mockTelegramApi = {
  sendMessage: jest.fn().mockResolvedValue({
    ok: true,
    result: {
      message_id: 1,
      date: Math.floor(Date.now() / 1000),
      text: 'Test message',
    },
  }),
  getUpdates: jest.fn().mockResolvedValue({
    ok: true,
    result: [],
  }),
  setWebhook: jest.fn().mockResolvedValue({
    ok: true,
    result: true,
    description: 'Webhook was set',
  }),
  deleteWebhook: jest.fn().mockResolvedValue({
    ok: true,
    result: true,
    description: 'Webhook was deleted',
  }),
  getMe: jest.fn().mockResolvedValue({
    ok: true,
    result: {
      id: 123456789,
      is_bot: true,
      first_name: 'Test Bot',
      username: 'testbot',
    },
  }),
};

export const resetTelegramApiMocks = () => {
  Object.values(mockTelegramApi).forEach((mockFn) => {
    if (jest.isMockFunction(mockFn)) {
      mockFn.mockClear();
    }
  });
};
