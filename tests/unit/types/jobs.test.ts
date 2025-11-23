/**
 * Unit tests for BullMQ job payload type definitions
 * Verifies that TypeScript types match expected job payload structures
 */

import { TelegramMessageJobPayload } from '../../../src/types/jobs';
import { TelegramUpdate, TelegramMessage } from '../../../src/types/telegram';

describe('Job Payload Types', () => {
  describe('TelegramMessageJobPayload', () => {
    it('should require update property of type TelegramUpdate', () => {
      const payload: TelegramMessageJobPayload = {
        update: {
          message: {
            message_id: 1,
            chat: { id: 123456789 },
            text: 'Hello',
          },
        },
      };
      expect(payload.update.message?.text).toBe('Hello');
    });

    it('should accept update with message', () => {
      const update: TelegramUpdate = {
        message: {
          message_id: 1,
          chat: { id: 123456789 },
          text: 'Test message',
        },
      };
      const payload: TelegramMessageJobPayload = {
        update,
      };
      expect(payload.update.message?.text).toBe('Test message');
    });

    it('should accept update with edited_message', () => {
      const update: TelegramUpdate = {
        edited_message: {
          message_id: 1,
          chat: { id: 123456789 },
          text: 'Edited message',
        },
      };
      const payload: TelegramMessageJobPayload = {
        update,
      };
      expect(payload.update.edited_message?.text).toBe('Edited message');
    });

    it('should accept update with callback_query', () => {
      const update: TelegramUpdate = {
        callback_query: {
          id: '123',
          data: 'callback_data',
        },
      };
      const payload: TelegramMessageJobPayload = {
        update,
      };
      expect(payload.update.callback_query?.data).toBe('callback_data');
    });

    it('should match the structure used when enqueueing jobs', () => {
      const telegramUpdate: TelegramUpdate = {
        message: {
          message_id: 1,
          chat: { id: 123456789 },
          text: 'Hello from Telegram',
        },
      };
      // This is how the payload would be used when enqueueing: queue.add('telegram-message', { update: telegramUpdate })
      const payload: TelegramMessageJobPayload = {
        update: telegramUpdate,
      };
      expect(payload.update).toEqual(telegramUpdate);
      expect(payload.update.message?.text).toBe('Hello from Telegram');
    });
  });
});
