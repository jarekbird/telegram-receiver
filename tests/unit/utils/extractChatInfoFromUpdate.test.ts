/**
 * Unit tests for chat info extraction utility (src/utils/extractChatInfoFromUpdate.ts)
 *
 * These tests verify that the extractChatInfoFromUpdate function correctly:
 * - Extracts chat ID and message ID from message updates
 * - Extracts chat ID and message ID from edited_message updates
 * - Extracts chat ID and message ID from callback_query updates
 * - Handles missing or incomplete update data gracefully
 * - Returns [null, null] when no matching update type is found
 * - Uses optional chaining for safe nested property access
 *
 * This is part of PHASE2-063 task to implement extractChatInfoFromUpdate utility function.
 */

import { extractChatInfoFromUpdate } from '../../../src/utils/extractChatInfoFromUpdate';
import type { TelegramUpdate } from '../../../src/types/telegram';

describe('extractChatInfoFromUpdate', () => {
  describe('Message update type', () => {
    it('should extract chat ID and message ID from message update', () => {
      const update: TelegramUpdate = {
        message: {
          message_id: 123,
          chat: {
            id: 456,
            type: 'private',
          },
        },
      };

      const [chatId, messageId] = extractChatInfoFromUpdate(update);

      expect(chatId).toBe(456);
      expect(messageId).toBe(123);
    });

    it('should handle message with minimal chat data', () => {
      const update: TelegramUpdate = {
        message: {
          message_id: 789,
          chat: {
            id: 101,
          },
        },
      };

      const [chatId, messageId] = extractChatInfoFromUpdate(update);

      expect(chatId).toBe(101);
      expect(messageId).toBe(789);
    });

    it('should return null for chat ID if chat is missing', () => {
      const update: TelegramUpdate = {
        message: {
          message_id: 123,
          // @ts-expect-error - Testing missing chat property
          chat: undefined,
        },
      };

      const [chatId, messageId] = extractChatInfoFromUpdate(update);

      expect(chatId).toBeNull();
      expect(messageId).toBe(123);
    });

    it('should return null for message ID if message_id is missing', () => {
      const update: TelegramUpdate = {
        message: {
          // @ts-expect-error - Testing missing message_id property
          message_id: undefined,
          chat: {
            id: 456,
          },
        },
      };

      const [chatId, messageId] = extractChatInfoFromUpdate(update);

      expect(chatId).toBe(456);
      expect(messageId).toBeNull();
    });

    it('should handle message with zero values', () => {
      const update: TelegramUpdate = {
        message: {
          message_id: 0,
          chat: {
            id: 0,
          },
        },
      };

      const [chatId, messageId] = extractChatInfoFromUpdate(update);

      // Note: 0 is a valid value, not null
      expect(chatId).toBe(0);
      expect(messageId).toBe(0);
    });
  });

  describe('Edited message update type', () => {
    it('should extract chat ID and message ID from edited_message update', () => {
      const update: TelegramUpdate = {
        edited_message: {
          message_id: 321,
          chat: {
            id: 654,
            type: 'group',
          },
        },
      };

      const [chatId, messageId] = extractChatInfoFromUpdate(update);

      expect(chatId).toBe(654);
      expect(messageId).toBe(321);
    });

    it('should handle edited_message with minimal chat data', () => {
      const update: TelegramUpdate = {
        edited_message: {
          message_id: 999,
          chat: {
            id: 888,
          },
        },
      };

      const [chatId, messageId] = extractChatInfoFromUpdate(update);

      expect(chatId).toBe(888);
      expect(messageId).toBe(999);
    });

    it('should return null for chat ID if chat is missing in edited_message', () => {
      const update: TelegramUpdate = {
        edited_message: {
          message_id: 321,
          // @ts-expect-error - Testing missing chat property
          chat: undefined,
        },
      };

      const [chatId, messageId] = extractChatInfoFromUpdate(update);

      expect(chatId).toBeNull();
      expect(messageId).toBe(321);
    });

    it('should return null for message ID if message_id is missing in edited_message', () => {
      const update: TelegramUpdate = {
        edited_message: {
          // @ts-expect-error - Testing missing message_id property
          message_id: undefined,
          chat: {
            id: 654,
          },
        },
      };

      const [chatId, messageId] = extractChatInfoFromUpdate(update);

      expect(chatId).toBe(654);
      expect(messageId).toBeNull();
    });
  });

  describe('Callback query update type', () => {
    it('should extract chat ID and message ID from callback_query update', () => {
      const update: TelegramUpdate = {
        callback_query: {
          id: 'callback123',
          data: 'button_data',
          message: {
            message_id: 555,
            chat: {
              id: 777,
              type: 'private',
            },
          },
        },
      };

      const [chatId, messageId] = extractChatInfoFromUpdate(update);

      expect(chatId).toBe(777);
      expect(messageId).toBe(555);
    });

    it('should handle callback_query with minimal message data', () => {
      const update: TelegramUpdate = {
        callback_query: {
          id: 'callback456',
          data: 'data',
          message: {
            message_id: 111,
            chat: {
              id: 222,
            },
          },
        },
      };

      const [chatId, messageId] = extractChatInfoFromUpdate(update);

      expect(chatId).toBe(222);
      expect(messageId).toBe(111);
    });

    it('should return [null, null] if callback_query has no message', () => {
      const update: TelegramUpdate = {
        callback_query: {
          id: 'callback789',
          data: 'data',
          // message is optional in callback_query
        },
      };

      const [chatId, messageId] = extractChatInfoFromUpdate(update);

      expect(chatId).toBeNull();
      expect(messageId).toBeNull();
    });

    it('should return null for chat ID if chat is missing in callback_query message', () => {
      const update: TelegramUpdate = {
        callback_query: {
          id: 'callback999',
          data: 'data',
          message: {
            message_id: 333,
            // @ts-expect-error - Testing missing chat property
            chat: undefined,
          },
        },
      };

      const [chatId, messageId] = extractChatInfoFromUpdate(update);

      expect(chatId).toBeNull();
      expect(messageId).toBe(333);
    });

    it('should return null for message ID if message_id is missing in callback_query message', () => {
      const update: TelegramUpdate = {
        callback_query: {
          id: 'callback000',
          data: 'data',
          message: {
            // @ts-expect-error - Testing missing message_id property
            message_id: undefined,
            chat: {
              id: 444,
            },
          },
        },
      };

      const [chatId, messageId] = extractChatInfoFromUpdate(update);

      expect(chatId).toBe(444);
      expect(messageId).toBeNull();
    });
  });

  describe('Update type priority', () => {
    it('should prioritize message over edited_message when both are present', () => {
      const update: TelegramUpdate = {
        message: {
          message_id: 100,
          chat: { id: 200 },
        },
        edited_message: {
          message_id: 300,
          chat: { id: 400 },
        },
      };

      const [chatId, messageId] = extractChatInfoFromUpdate(update);

      // Should extract from message, not edited_message
      expect(chatId).toBe(200);
      expect(messageId).toBe(100);
    });

    it('should prioritize message over callback_query when both are present', () => {
      const update: TelegramUpdate = {
        message: {
          message_id: 500,
          chat: { id: 600 },
        },
        callback_query: {
          id: 'callback',
          data: 'data',
          message: {
            message_id: 700,
            chat: { id: 800 },
          },
        },
      };

      const [chatId, messageId] = extractChatInfoFromUpdate(update);

      // Should extract from message, not callback_query
      expect(chatId).toBe(600);
      expect(messageId).toBe(500);
    });

    it('should prioritize edited_message over callback_query when both are present', () => {
      const update: TelegramUpdate = {
        edited_message: {
          message_id: 900,
          chat: { id: 1000 },
        },
        callback_query: {
          id: 'callback',
          data: 'data',
          message: {
            message_id: 1100,
            chat: { id: 1200 },
          },
        },
      };

      const [chatId, messageId] = extractChatInfoFromUpdate(update);

      // Should extract from edited_message, not callback_query
      expect(chatId).toBe(1000);
      expect(messageId).toBe(900);
    });
  });

  describe('Empty or invalid updates', () => {
    it('should return [null, null] for empty update object', () => {
      const update: TelegramUpdate = {};

      const [chatId, messageId] = extractChatInfoFromUpdate(update);

      expect(chatId).toBeNull();
      expect(messageId).toBeNull();
    });

    it('should return [null, null] when update has no matching types', () => {
      const update: TelegramUpdate = {
        // No message, edited_message, or callback_query
      };

      const [chatId, messageId] = extractChatInfoFromUpdate(update);

      expect(chatId).toBeNull();
      expect(messageId).toBeNull();
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle typical message update from Telegram', () => {
      const update: TelegramUpdate = {
        message: {
          message_id: 12345,
          chat: {
            id: -987654321,
            type: 'group',
            title: 'Test Group',
          },
          from: {
            id: 111222333,
            first_name: 'Test',
          },
          text: 'Hello, world!',
        },
      };

      const [chatId, messageId] = extractChatInfoFromUpdate(update);

      expect(chatId).toBe(-987654321);
      expect(messageId).toBe(12345);
    });

    it('should handle callback_query from inline keyboard button', () => {
      const update: TelegramUpdate = {
        callback_query: {
          id: '1234567890123456789',
          data: 'action:confirm',
          message: {
            message_id: 42,
            chat: {
              id: 123456789,
              type: 'private',
            },
          },
          from: {
            id: 987654321,
            first_name: 'User',
          },
        },
      };

      const [chatId, messageId] = extractChatInfoFromUpdate(update);

      expect(chatId).toBe(123456789);
      expect(messageId).toBe(42);
    });

    it('should handle edited message update', () => {
      const update: TelegramUpdate = {
        edited_message: {
          message_id: 999,
          chat: {
            id: 888,
            type: 'supergroup',
            title: 'Super Group',
          },
          from: {
            id: 777,
            first_name: 'Editor',
          },
          text: 'Edited text',
        },
      };

      const [chatId, messageId] = extractChatInfoFromUpdate(update);

      expect(chatId).toBe(888);
      expect(messageId).toBe(999);
    });
  });

  describe('Type safety and return value', () => {
    it('should return tuple type [number | null, number | null]', () => {
      const update: TelegramUpdate = {
        message: {
          message_id: 1,
          chat: { id: 2 },
        },
      };

      const result = extractChatInfoFromUpdate(update);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
      expect(typeof result[0] === 'number' || result[0] === null).toBe(true);
      expect(typeof result[1] === 'number' || result[1] === null).toBe(true);
    });

    it('should handle large number values', () => {
      const update: TelegramUpdate = {
        message: {
          message_id: Number.MAX_SAFE_INTEGER,
          chat: { id: Number.MIN_SAFE_INTEGER },
        },
      };

      const [chatId, messageId] = extractChatInfoFromUpdate(update);

      expect(chatId).toBe(Number.MIN_SAFE_INTEGER);
      expect(messageId).toBe(Number.MAX_SAFE_INTEGER);
    });
  });
});
