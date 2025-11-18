/**
 * Unit tests for Telegram API type definitions
 * Verifies that TypeScript types match expected Telegram Bot API structures
 */

import {
  TelegramUpdate,
  TelegramMessage,
  TelegramChat,
  TelegramUser,
  TelegramCallbackQuery,
  TelegramFile,
  TelegramVoice,
  TelegramAudio,
  TelegramDocument,
  SendMessageParams,
  SendVoiceParams,
  SetWebhookParams,
  AnswerCallbackQueryParams,
  GetFileParams,
  WebhookInfo,
  TelegramApiResponse,
} from '../../../src/types/telegram';

describe('Telegram Types', () => {
  describe('TelegramUpdate', () => {
    it('should accept update with message', () => {
      const update: TelegramUpdate = {
        message: {
          message_id: 1,
          chat: { id: 123456789 },
          text: 'Hello',
        },
      };
      expect(update.message?.text).toBe('Hello');
    });

    it('should accept update with edited_message', () => {
      const update: TelegramUpdate = {
        edited_message: {
          message_id: 1,
          chat: { id: 123456789 },
          text: 'Edited',
        },
      };
      expect(update.edited_message?.text).toBe('Edited');
    });

    it('should accept update with callback_query', () => {
      const update: TelegramUpdate = {
        callback_query: {
          id: '123',
          data: 'callback_data',
        },
      };
      expect(update.callback_query?.data).toBe('callback_data');
    });
  });

  describe('TelegramMessage', () => {
    it('should require message_id and chat', () => {
      const message: TelegramMessage = {
        message_id: 1,
        chat: { id: 123456789 },
      };
      expect(message.message_id).toBe(1);
      expect(message.chat.id).toBe(123456789);
    });

    it('should accept optional text field', () => {
      const message: TelegramMessage = {
        message_id: 1,
        chat: { id: 123456789 },
        text: 'Hello',
      };
      expect(message.text).toBe('Hello');
    });

    it('should accept optional voice field', () => {
      const message: TelegramMessage = {
        message_id: 1,
        chat: { id: 123456789 },
        voice: {
          file_id: 'voice_file_id',
          duration: 10,
        },
      };
      expect(message.voice?.file_id).toBe('voice_file_id');
    });

    it('should accept optional audio field', () => {
      const message: TelegramMessage = {
        message_id: 1,
        chat: { id: 123456789 },
        audio: {
          file_id: 'audio_file_id',
          duration: 30,
        },
      };
      expect(message.audio?.file_id).toBe('audio_file_id');
    });

    it('should accept optional document field', () => {
      const message: TelegramMessage = {
        message_id: 1,
        chat: { id: 123456789 },
        document: {
          file_id: 'doc_file_id',
          mime_type: 'audio/mpeg',
        },
      };
      expect(message.document?.file_id).toBe('doc_file_id');
    });
  });

  describe('TelegramChat', () => {
    it('should require id field', () => {
      const chat: TelegramChat = {
        id: 123456789,
      };
      expect(chat.id).toBe(123456789);
    });

    it('should accept optional type, title, and username fields', () => {
      const chat: TelegramChat = {
        id: 123456789,
        type: 'private',
        title: 'Test Chat',
        username: 'testchat',
      };
      expect(chat.type).toBe('private');
      expect(chat.title).toBe('Test Chat');
      expect(chat.username).toBe('testchat');
    });
  });

  describe('TelegramUser', () => {
    it('should require id field', () => {
      const user: TelegramUser = {
        id: 123456789,
      };
      expect(user.id).toBe(123456789);
    });

    it('should accept optional first_name, last_name, and username fields', () => {
      const user: TelegramUser = {
        id: 123456789,
        first_name: 'John',
        last_name: 'Doe',
        username: 'johndoe',
      };
      expect(user.first_name).toBe('John');
      expect(user.last_name).toBe('Doe');
      expect(user.username).toBe('johndoe');
    });
  });

  describe('TelegramCallbackQuery', () => {
    it('should require id and data fields', () => {
      const callbackQuery: TelegramCallbackQuery = {
        id: '123',
        data: 'callback_data',
      };
      expect(callbackQuery.id).toBe('123');
      expect(callbackQuery.data).toBe('callback_data');
    });

    it('should accept optional message and from fields', () => {
      const callbackQuery: TelegramCallbackQuery = {
        id: '123',
        data: 'callback_data',
        message: {
          message_id: 1,
          chat: { id: 123456789 },
        },
        from: {
          id: 987654321,
        },
      };
      expect(callbackQuery.message?.message_id).toBe(1);
      expect(callbackQuery.from?.id).toBe(987654321);
    });
  });

  describe('TelegramFile', () => {
    it('should match the structure from get_file API', () => {
      const file: TelegramFile = {
        result: {
          file_path: 'path/to/file.ogg',
        },
      };
      expect(file.result.file_path).toBe('path/to/file.ogg');
    });
  });

  describe('TelegramVoice', () => {
    it('should require file_id field', () => {
      const voice: TelegramVoice = {
        file_id: 'voice_file_id',
      };
      expect(voice.file_id).toBe('voice_file_id');
    });

    it('should accept optional duration, mime_type, and file_size fields', () => {
      const voice: TelegramVoice = {
        file_id: 'voice_file_id',
        duration: 10,
        mime_type: 'audio/ogg',
        file_size: 1024,
      };
      expect(voice.duration).toBe(10);
      expect(voice.mime_type).toBe('audio/ogg');
      expect(voice.file_size).toBe(1024);
    });
  });

  describe('TelegramAudio', () => {
    it('should require file_id field', () => {
      const audio: TelegramAudio = {
        file_id: 'audio_file_id',
      };
      expect(audio.file_id).toBe('audio_file_id');
    });

    it('should accept optional fields', () => {
      const audio: TelegramAudio = {
        file_id: 'audio_file_id',
        duration: 30,
        performer: 'Artist',
        title: 'Song Title',
        mime_type: 'audio/mpeg',
        file_size: 2048,
      };
      expect(audio.performer).toBe('Artist');
      expect(audio.title).toBe('Song Title');
    });
  });

  describe('TelegramDocument', () => {
    it('should require file_id field', () => {
      const document: TelegramDocument = {
        file_id: 'doc_file_id',
      };
      expect(document.file_id).toBe('doc_file_id');
    });

    it('should accept optional mime_type, file_name, and file_size fields', () => {
      const document: TelegramDocument = {
        file_id: 'doc_file_id',
        mime_type: 'audio/mpeg',
        file_name: 'audio.mp3',
        file_size: 4096,
      };
      expect(document.mime_type).toBe('audio/mpeg');
      expect(document.file_name).toBe('audio.mp3');
      expect(document.file_size).toBe(4096);
    });
  });

  describe('SendMessageParams', () => {
    it('should require chat_id and text fields', () => {
      const params: SendMessageParams = {
        chat_id: 123456789,
        text: 'Hello',
      };
      expect(params.chat_id).toBe(123456789);
      expect(params.text).toBe('Hello');
    });

    it('should accept optional parse_mode and reply_to_message_id fields', () => {
      const params: SendMessageParams = {
        chat_id: 123456789,
        text: 'Hello',
        parse_mode: 'HTML',
        reply_to_message_id: 1,
      };
      expect(params.parse_mode).toBe('HTML');
      expect(params.reply_to_message_id).toBe(1);
    });

    it('should accept null parse_mode for plain text', () => {
      const params: SendMessageParams = {
        chat_id: 123456789,
        text: 'Hello',
        parse_mode: null,
      };
      expect(params.parse_mode).toBeNull();
    });
  });

  describe('SendVoiceParams', () => {
    it('should require chat_id and voice_path fields', () => {
      const params: SendVoiceParams = {
        chat_id: 123456789,
        voice_path: '/path/to/voice.ogg',
      };
      expect(params.chat_id).toBe(123456789);
      expect(params.voice_path).toBe('/path/to/voice.ogg');
    });

    it('should accept optional reply_to_message_id and caption fields', () => {
      const params: SendVoiceParams = {
        chat_id: 123456789,
        voice_path: '/path/to/voice.ogg',
        reply_to_message_id: 1,
        caption: 'Voice message',
      };
      expect(params.reply_to_message_id).toBe(1);
      expect(params.caption).toBe('Voice message');
    });
  });

  describe('SetWebhookParams', () => {
    it('should require url field', () => {
      const params: SetWebhookParams = {
        url: 'https://example.com/webhook',
      };
      expect(params.url).toBe('https://example.com/webhook');
    });

    it('should accept optional secret_token field', () => {
      const params: SetWebhookParams = {
        url: 'https://example.com/webhook',
        secret_token: 'secret123',
      };
      expect(params.secret_token).toBe('secret123');
    });
  });

  describe('AnswerCallbackQueryParams', () => {
    it('should require callback_query_id field', () => {
      const params: AnswerCallbackQueryParams = {
        callback_query_id: '123',
      };
      expect(params.callback_query_id).toBe('123');
    });

    it('should accept optional text and show_alert fields', () => {
      const params: AnswerCallbackQueryParams = {
        callback_query_id: '123',
        text: 'Processing...',
        show_alert: true,
      };
      expect(params.text).toBe('Processing...');
      expect(params.show_alert).toBe(true);
    });
  });

  describe('GetFileParams', () => {
    it('should require file_id field', () => {
      const params: GetFileParams = {
        file_id: 'file123',
      };
      expect(params.file_id).toBe('file123');
    });
  });

  describe('WebhookInfo', () => {
    it('should require url and pending_update_count fields', () => {
      const info: WebhookInfo = {
        url: 'https://example.com/webhook',
        pending_update_count: 0,
      };
      expect(info.url).toBe('https://example.com/webhook');
      expect(info.pending_update_count).toBe(0);
    });

    it('should accept optional fields', () => {
      const info: WebhookInfo = {
        url: 'https://example.com/webhook',
        pending_update_count: 5,
        last_error_date: 1234567890,
        last_error_message: 'Error message',
        max_connections: 40,
        allowed_updates: ['message', 'callback_query'],
      };
      expect(info.last_error_date).toBe(1234567890);
      expect(info.allowed_updates).toEqual(['message', 'callback_query']);
    });
  });

  describe('TelegramApiResponse', () => {
    it('should handle success response with result', () => {
      const response: TelegramApiResponse<{ file_path: string }> = {
        ok: true,
        result: {
          file_path: 'path/to/file.ogg',
        },
      };
      expect(response.ok).toBe(true);
      if (response.ok) {
        expect(response.result.file_path).toBe('path/to/file.ogg');
      }
    });

    it('should handle error response with description and error_code', () => {
      const response: TelegramApiResponse<never> = {
        ok: false,
        description: 'Error message',
        error_code: 400,
      };
      expect(response.ok).toBe(false);
      if (!response.ok) {
        expect(response.description).toBe('Error message');
        expect(response.error_code).toBe(400);
      }
    });
  });
});
