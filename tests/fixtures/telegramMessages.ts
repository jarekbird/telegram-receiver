/**
 * Telegram message fixtures for testing
 */

export const sampleTextMessage = {
  update_id: 123456789,
  message: {
    message_id: 1,
    from: {
      id: 123456789,
      is_bot: false,
      first_name: 'Test',
      last_name: 'User',
      username: 'testuser',
      language_code: 'en',
    },
    chat: {
      id: 123456789,
      first_name: 'Test',
      last_name: 'User',
      username: 'testuser',
      type: 'private',
    },
    date: Math.floor(Date.now() / 1000),
    text: 'Hello, this is a test message',
  },
};

export const sampleCallbackQuery = {
  update_id: 123456790,
  callback_query: {
    id: '123456789',
    from: {
      id: 123456789,
      is_bot: false,
      first_name: 'Test',
      username: 'testuser',
    },
    message: {
      message_id: 2,
      chat: {
        id: 123456789,
        type: 'private',
      },
      date: Math.floor(Date.now() / 1000),
      text: 'Test message',
    },
    data: 'callback_data',
  },
};

export const sampleWebhookUpdate = {
  update_id: 123456791,
  message: {
    message_id: 3,
    from: {
      id: 987654321,
      is_bot: false,
      first_name: 'Another',
      username: 'anotheruser',
    },
    chat: {
      id: 987654321,
      type: 'private',
    },
    date: Math.floor(Date.now() / 1000),
    text: '/start',
    entities: [
      {
        offset: 0,
        length: 6,
        type: 'bot_command',
      },
    ],
  },
};

export const createTelegramMessage = (overrides = {}) => ({
  ...sampleTextMessage,
  ...overrides,
});
