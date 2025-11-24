/**
 * Unit tests for TelegramService
 * Tests the setWebhook, deleteWebhook, and getWebhookInfo method implementations
 */

import TelegramService from '../../../src/services/telegram-service';
import axios from 'axios';
import { TelegramApiResponse, WebhookInfo, TelegramMessage } from '../../../src/types/telegram';
import { promises as fs } from 'fs';
import * as os from 'os';
import * as path from 'path';
import FormData from 'form-data';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock fs
jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
    readFile: jest.fn(),
    mkdir: jest.fn(),
    writeFile: jest.fn(),
  },
}));

// Mock os
jest.mock('os', () => ({
  tmpdir: jest.fn(),
}));

// Mock form-data
jest.mock('form-data');

describe('TelegramService', () => {
  let telegramService: TelegramService;
  const mockBotToken = 'test-bot-token-12345';
  const mockAxiosInstance = {
    post: jest.fn(),
    get: jest.fn(),
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock axios.create to return our mock instance
    mockedAxios.create = jest.fn().mockReturnValue(mockAxiosInstance as any);

    // Create service instance with test token
    telegramService = new TelegramService(mockBotToken);
  });

  describe('setWebhook', () => {
    const testUrl = 'https://example.com/webhook';
    const testSecretToken = 'secret-token-123';

    it('should return undefined if bot token is blank', async () => {
      // Arrange
      // Delete env var and pass empty string to ensure blank token
      const originalToken = process.env.TELEGRAM_BOT_TOKEN;
      delete process.env.TELEGRAM_BOT_TOKEN;
      // Create a new mock instance for this test to avoid interference
      const blankTokenMockAxiosInstance = {
        post: jest.fn(),
      };
      mockedAxios.create = jest.fn().mockReturnValue(blankTokenMockAxiosInstance as any);
      const serviceWithBlankToken = new TelegramService('');

      // Act
      const result = await serviceWithBlankToken.setWebhook(testUrl);

      // Assert
      expect(result).toBeUndefined();
      expect(blankTokenMockAxiosInstance.post).not.toHaveBeenCalled();

      // Cleanup
      if (originalToken) {
        process.env.TELEGRAM_BOT_TOKEN = originalToken;
      }
    });

    it('should return undefined if bot token is not provided and env var is not set', async () => {
      // Arrange
      const originalToken = process.env.TELEGRAM_BOT_TOKEN;
      delete process.env.TELEGRAM_BOT_TOKEN;
      const serviceWithoutToken = new TelegramService();

      // Act
      const result = await serviceWithoutToken.setWebhook(testUrl);

      // Assert
      expect(result).toBeUndefined();
      expect(mockAxiosInstance.post).not.toHaveBeenCalled();

      // Cleanup
      if (originalToken) {
        process.env.TELEGRAM_BOT_TOKEN = originalToken;
      }
    });

    it('should set webhook with url only', async () => {
      // Arrange
      const mockResponse: TelegramApiResponse<boolean> = {
        ok: true,
        result: true,
      };
      mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

      // Act
      const result = await telegramService.setWebhook(testUrl);

      // Assert
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/setWebhook',
        {
          url: testUrl,
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should set webhook with url and secret token', async () => {
      // Arrange
      const mockResponse: TelegramApiResponse<boolean> = {
        ok: true,
        result: true,
      };
      mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

      // Act
      const result = await telegramService.setWebhook(testUrl, testSecretToken);

      // Assert
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/setWebhook',
        {
          url: testUrl,
          secret_token: testSecretToken,
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should not include secret_token in params if secretToken is empty string', async () => {
      // Arrange
      const mockResponse: TelegramApiResponse<boolean> = {
        ok: true,
        result: true,
      };
      mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

      // Act
      const result = await telegramService.setWebhook(testUrl, '');

      // Assert
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/setWebhook',
        {
          url: testUrl,
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should not include secret_token in params if secretToken is whitespace only', async () => {
      // Arrange
      const mockResponse: TelegramApiResponse<boolean> = {
        ok: true,
        result: true,
      };
      mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

      // Act
      const result = await telegramService.setWebhook(testUrl, '   ');

      // Assert
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/setWebhook',
        {
          url: testUrl,
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should return API response with ok: false when Telegram API returns error', async () => {
      // Arrange
      const mockErrorResponse: TelegramApiResponse<boolean> = {
        ok: false,
        description: 'Bad Request: invalid webhook URL',
        error_code: 400,
      };
      mockAxiosInstance.post.mockResolvedValue({ data: mockErrorResponse });

      // Act
      const result = await telegramService.setWebhook(testUrl);

      // Assert
      expect(result).toEqual(mockErrorResponse);
    });

    it('should log error and re-throw exception when axios request fails', async () => {
      // Arrange
      const mockError = new Error('Network error');
      mockAxiosInstance.post.mockRejectedValue(mockError);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act & Assert
      await expect(telegramService.setWebhook(testUrl)).rejects.toThrow('Network error');

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error setting Telegram webhook: Network error'
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(mockError.stack);

      // Cleanup
      consoleErrorSpy.mockRestore();
    });

    it('should handle axios errors that are not Error instances', async () => {
      // Arrange
      const mockError = 'String error';
      mockAxiosInstance.post.mockRejectedValue(mockError);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act & Assert
      await expect(telegramService.setWebhook(testUrl)).rejects.toBe(mockError);

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error setting Telegram webhook: String error'
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith('');

      // Cleanup
      consoleErrorSpy.mockRestore();
    });

    it('should return response data from axios response', async () => {
      // Arrange
      const mockResponse: TelegramApiResponse<boolean> = {
        ok: true,
        result: true,
      };
      mockAxiosInstance.post.mockResolvedValue({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      // Act
      const result = await telegramService.setWebhook(testUrl);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(result).not.toHaveProperty('status');
      expect(result).not.toHaveProperty('statusText');
    });
  });

  describe('deleteWebhook', () => {
    it('should return undefined if bot token is blank', async () => {
      // Arrange
      // Delete env var and pass empty string to ensure blank token
      const originalToken = process.env.TELEGRAM_BOT_TOKEN;
      delete process.env.TELEGRAM_BOT_TOKEN;
      // Create a new mock instance for this test to avoid interference
      const blankTokenMockAxiosInstance = {
        post: jest.fn(),
      };
      mockedAxios.create = jest.fn().mockReturnValue(blankTokenMockAxiosInstance as any);
      const serviceWithBlankToken = new TelegramService('');

      // Act
      const result = await serviceWithBlankToken.deleteWebhook();

      // Assert
      expect(result).toBeUndefined();
      expect(blankTokenMockAxiosInstance.post).not.toHaveBeenCalled();

      // Cleanup
      if (originalToken) {
        process.env.TELEGRAM_BOT_TOKEN = originalToken;
      }
    });

    it('should return undefined if bot token is not provided and env var is not set', async () => {
      // Arrange
      const originalToken = process.env.TELEGRAM_BOT_TOKEN;
      delete process.env.TELEGRAM_BOT_TOKEN;
      const serviceWithoutToken = new TelegramService();

      // Act
      const result = await serviceWithoutToken.deleteWebhook();

      // Assert
      expect(result).toBeUndefined();
      expect(mockAxiosInstance.post).not.toHaveBeenCalled();

      // Cleanup
      if (originalToken) {
        process.env.TELEGRAM_BOT_TOKEN = originalToken;
      }
    });

    it('should delete webhook successfully', async () => {
      // Arrange
      const mockResponse: TelegramApiResponse<boolean> = {
        ok: true,
        result: true,
      };
      mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

      // Act
      const result = await telegramService.deleteWebhook();

      // Assert
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/deleteWebhook',
        {}
      );
      expect(result).toEqual(mockResponse);
    });

    it('should return API response with ok: false when Telegram API returns error', async () => {
      // Arrange
      const mockErrorResponse: TelegramApiResponse<boolean> = {
        ok: false,
        description: 'Bad Request: invalid bot token',
        error_code: 401,
      };
      mockAxiosInstance.post.mockResolvedValue({ data: mockErrorResponse });

      // Act
      const result = await telegramService.deleteWebhook();

      // Assert
      expect(result).toEqual(mockErrorResponse);
    });

    it('should log error and re-throw exception when axios request fails', async () => {
      // Arrange
      const mockError = new Error('Network error');
      mockAxiosInstance.post.mockRejectedValue(mockError);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act & Assert
      await expect(telegramService.deleteWebhook()).rejects.toThrow('Network error');

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error deleting Telegram webhook: Network error'
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(mockError.stack);

      // Cleanup
      consoleErrorSpy.mockRestore();
    });

    it('should handle axios errors that are not Error instances', async () => {
      // Arrange
      const mockError = 'String error';
      mockAxiosInstance.post.mockRejectedValue(mockError);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act & Assert
      await expect(telegramService.deleteWebhook()).rejects.toBe(mockError);

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error deleting Telegram webhook: String error'
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith('');

      // Cleanup
      consoleErrorSpy.mockRestore();
    });

    it('should return response data from axios response', async () => {
      // Arrange
      const mockResponse: TelegramApiResponse<boolean> = {
        ok: true,
        result: true,
      };
      mockAxiosInstance.post.mockResolvedValue({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      // Act
      const result = await telegramService.deleteWebhook();

      // Assert
      expect(result).toEqual(mockResponse);
      expect(result).not.toHaveProperty('status');
      expect(result).not.toHaveProperty('statusText');
    });
  });

  describe('getWebhookInfo', () => {
    it('should return undefined if bot token is blank', async () => {
      // Arrange
      // Delete env var and pass empty string to ensure blank token
      const originalToken = process.env.TELEGRAM_BOT_TOKEN;
      delete process.env.TELEGRAM_BOT_TOKEN;
      // Create a new mock instance for this test to avoid interference
      const blankTokenMockAxiosInstance = {
        post: jest.fn(),
        get: jest.fn(),
      };
      mockedAxios.create = jest.fn().mockReturnValue(blankTokenMockAxiosInstance as any);
      const serviceWithBlankToken = new TelegramService('');

      // Act
      const result = await serviceWithBlankToken.getWebhookInfo();

      // Assert
      expect(result).toBeUndefined();
      expect(blankTokenMockAxiosInstance.get).not.toHaveBeenCalled();

      // Cleanup
      if (originalToken) {
        process.env.TELEGRAM_BOT_TOKEN = originalToken;
      }
    });

    it('should return undefined if bot token is not provided and env var is not set', async () => {
      // Arrange
      const originalToken = process.env.TELEGRAM_BOT_TOKEN;
      delete process.env.TELEGRAM_BOT_TOKEN;
      const serviceWithoutToken = new TelegramService();

      // Act
      const result = await serviceWithoutToken.getWebhookInfo();

      // Assert
      expect(result).toBeUndefined();
      expect(mockAxiosInstance.get).not.toHaveBeenCalled();

      // Cleanup
      if (originalToken) {
        process.env.TELEGRAM_BOT_TOKEN = originalToken;
      }
    });

    it('should get webhook info successfully', async () => {
      // Arrange
      const mockWebhookInfo: WebhookInfo = {
        url: 'https://example.com/webhook',
        pending_update_count: 0,
        last_error_date: undefined,
        last_error_message: undefined,
        max_connections: 40,
        allowed_updates: ['message', 'callback_query'],
      };
      const mockResponse: TelegramApiResponse<WebhookInfo> = {
        ok: true,
        result: mockWebhookInfo,
      };
      mockAxiosInstance.get.mockResolvedValue({ data: mockResponse });

      // Act
      const result = await telegramService.getWebhookInfo();

      // Assert
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/getWebhookInfo');
      expect(result).toEqual(mockResponse);
    });

    it('should return webhook info with error details when webhook has errors', async () => {
      // Arrange
      const mockWebhookInfo: WebhookInfo = {
        url: 'https://example.com/webhook',
        pending_update_count: 5,
        last_error_date: 1234567890,
        last_error_message: 'Connection timeout',
        max_connections: 40,
        allowed_updates: ['message'],
      };
      const mockResponse: TelegramApiResponse<WebhookInfo> = {
        ok: true,
        result: mockWebhookInfo,
      };
      mockAxiosInstance.get.mockResolvedValue({ data: mockResponse });

      // Act
      const result = await telegramService.getWebhookInfo();

      // Assert
      expect(result).toEqual(mockResponse);
      expect(result?.ok).toBe(true);
      if (result && result.ok) {
        expect(result.result.last_error_date).toBe(1234567890);
        expect(result.result.last_error_message).toBe('Connection timeout');
        expect(result.result.pending_update_count).toBe(5);
      }
    });

    it('should return API response with ok: false when Telegram API returns error', async () => {
      // Arrange
      const mockErrorResponse: TelegramApiResponse<WebhookInfo> = {
        ok: false,
        description: 'Bad Request: invalid bot token',
        error_code: 401,
      };
      mockAxiosInstance.get.mockResolvedValue({ data: mockErrorResponse });

      // Act
      const result = await telegramService.getWebhookInfo();

      // Assert
      expect(result).toEqual(mockErrorResponse);
      expect(result?.ok).toBe(false);
    });

    it('should log error and re-throw exception when axios request fails', async () => {
      // Arrange
      const mockError = new Error('Network error');
      mockAxiosInstance.get.mockRejectedValue(mockError);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act & Assert
      await expect(telegramService.getWebhookInfo()).rejects.toThrow('Network error');

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error getting Telegram webhook info: Network error'
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(mockError.stack);

      // Cleanup
      consoleErrorSpy.mockRestore();
    });

    it('should handle axios errors that are not Error instances', async () => {
      // Arrange
      const mockError = 'String error';
      mockAxiosInstance.get.mockRejectedValue(mockError);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act & Assert
      await expect(telegramService.getWebhookInfo()).rejects.toBe(mockError);

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error getting Telegram webhook info: String error'
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith('');

      // Cleanup
      consoleErrorSpy.mockRestore();
    });

    it('should return response data from axios response', async () => {
      // Arrange
      const mockWebhookInfo: WebhookInfo = {
        url: 'https://example.com/webhook',
        pending_update_count: 0,
      };
      const mockResponse: TelegramApiResponse<WebhookInfo> = {
        ok: true,
        result: mockWebhookInfo,
      };
      mockAxiosInstance.get.mockResolvedValue({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      // Act
      const result = await telegramService.getWebhookInfo();

      // Assert
      expect(result).toEqual(mockResponse);
      expect(result).not.toHaveProperty('status');
      expect(result).not.toHaveProperty('statusText');
    });
  });

  describe('sendVoice', () => {
    const testChatId = 12345;
    const testVoicePath = '/path/to/voice.ogg';
    const testReplyToMessageId = 67890;
    const testCaption = 'Test voice caption';
    const mockFileContent = Buffer.from('mock audio content');

    beforeEach(() => {
      // Reset fs mocks
      jest.clearAllMocks();
      (fs.access as jest.Mock).mockResolvedValue(undefined);
      (fs.readFile as jest.Mock).mockResolvedValue(mockFileContent);
      
      // Reset FormData mock
      (FormData as jest.Mock).mockImplementation(() => {
        const append = jest.fn();
        const getHeaders = jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' });
        return { append, getHeaders };
      });
    });

    it('should return undefined if bot token is blank', async () => {
      // Arrange
      const originalToken = process.env.TELEGRAM_BOT_TOKEN;
      delete process.env.TELEGRAM_BOT_TOKEN;
      const blankTokenMockAxiosInstance = {
        post: jest.fn(),
      };
      mockedAxios.create = jest.fn().mockReturnValue(blankTokenMockAxiosInstance as any);
      const serviceWithBlankToken = new TelegramService('');

      // Act
      const result = await serviceWithBlankToken.sendVoice(testChatId, testVoicePath);

      // Assert
      expect(result).toBeUndefined();
      expect(blankTokenMockAxiosInstance.post).not.toHaveBeenCalled();
      expect(fs.access).not.toHaveBeenCalled();

      // Cleanup
      if (originalToken) {
        process.env.TELEGRAM_BOT_TOKEN = originalToken;
      }
    });

    it('should return undefined if bot token is not provided and env var is not set', async () => {
      // Arrange
      const originalToken = process.env.TELEGRAM_BOT_TOKEN;
      delete process.env.TELEGRAM_BOT_TOKEN;
      const serviceWithoutToken = new TelegramService();

      // Act
      const result = await serviceWithoutToken.sendVoice(testChatId, testVoicePath);

      // Assert
      expect(result).toBeUndefined();
      expect(mockAxiosInstance.post).not.toHaveBeenCalled();
      expect(fs.access).not.toHaveBeenCalled();

      // Cleanup
      if (originalToken) {
        process.env.TELEGRAM_BOT_TOKEN = originalToken;
      }
    });

    it('should throw error if voice file does not exist', async () => {
      // Arrange
      (fs.access as jest.Mock).mockRejectedValue({ code: 'ENOENT' });
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act & Assert
      await expect(telegramService.sendVoice(testChatId, testVoicePath)).rejects.toThrow(
        'Voice file does not exist'
      );

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error sending Telegram voice: Voice file does not exist'
      );

      // Cleanup
      consoleErrorSpy.mockRestore();
    });

    it('should send voice with required parameters only', async () => {
      // Arrange
      const mockMessage: TelegramMessage = {
        message_id: 123,
        chat: { id: testChatId },
      };
      const mockResponse: TelegramApiResponse<TelegramMessage> = {
        ok: true,
        result: mockMessage,
      };
      const mockFormData = {
        append: jest.fn(),
        getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
      };
      (FormData as jest.Mock).mockReturnValue(mockFormData);
      mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

      // Act
      const result = await telegramService.sendVoice(testChatId, testVoicePath);

      // Assert
      expect(fs.access).toHaveBeenCalledWith(testVoicePath);
      expect(fs.readFile).toHaveBeenCalledWith(testVoicePath);
      expect(mockFormData.append).toHaveBeenCalledWith('voice', mockFileContent, {
        filename: 'voice.ogg',
        contentType: 'audio/ogg',
      });
      expect(mockFormData.append).toHaveBeenCalledWith('chat_id', String(testChatId));
      expect(mockFormData.append).not.toHaveBeenCalledWith('reply_to_message_id', expect.anything());
      expect(mockFormData.append).not.toHaveBeenCalledWith('caption', expect.anything());
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/sendVoice',
        mockFormData,
        {
          headers: { 'content-type': 'multipart/form-data' },
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should send voice with all optional parameters', async () => {
      // Arrange
      const mockMessage: TelegramMessage = {
        message_id: 123,
        chat: { id: testChatId },
      };
      const mockResponse: TelegramApiResponse<TelegramMessage> = {
        ok: true,
        result: mockMessage,
      };
      const mockFormData = {
        append: jest.fn(),
        getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
      };
      (FormData as jest.Mock).mockReturnValue(mockFormData);
      mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

      // Act
      const result = await telegramService.sendVoice(
        testChatId,
        testVoicePath,
        testReplyToMessageId,
        testCaption
      );

      // Assert
      expect(mockFormData.append).toHaveBeenCalledWith('voice', mockFileContent, {
        filename: 'voice.ogg',
        contentType: 'audio/ogg',
      });
      expect(mockFormData.append).toHaveBeenCalledWith('chat_id', String(testChatId));
      expect(mockFormData.append).toHaveBeenCalledWith('reply_to_message_id', String(testReplyToMessageId));
      expect(mockFormData.append).toHaveBeenCalledWith('caption', testCaption);
      expect(result).toEqual(mockResponse);
    });

    it('should detect MIME type for .ogg file', async () => {
      // Arrange
      const mockMessage: TelegramMessage = {
        message_id: 123,
        chat: { id: testChatId },
      };
      const mockResponse: TelegramApiResponse<TelegramMessage> = {
        ok: true,
        result: mockMessage,
      };
      const mockFormData = {
        append: jest.fn(),
        getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
      };
      (FormData as jest.Mock).mockReturnValue(mockFormData);
      mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

      // Act
      await telegramService.sendVoice(testChatId, '/path/to/voice.ogg');

      // Assert
      expect(mockFormData.append).toHaveBeenCalledWith('voice', mockFileContent, {
        filename: 'voice.ogg',
        contentType: 'audio/ogg',
      });
    });

    it('should detect MIME type for .oga file', async () => {
      // Arrange
      const mockMessage: TelegramMessage = {
        message_id: 123,
        chat: { id: testChatId },
      };
      const mockResponse: TelegramApiResponse<TelegramMessage> = {
        ok: true,
        result: mockMessage,
      };
      const mockFormData = {
        append: jest.fn(),
        getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
      };
      (FormData as jest.Mock).mockReturnValue(mockFormData);
      mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

      // Act
      await telegramService.sendVoice(testChatId, '/path/to/voice.oga');

      // Assert
      expect(mockFormData.append).toHaveBeenCalledWith('voice', mockFileContent, {
        filename: 'voice.oga',
        contentType: 'audio/ogg',
      });
    });

    it('should detect MIME type for .wav file', async () => {
      // Arrange
      const mockMessage: TelegramMessage = {
        message_id: 123,
        chat: { id: testChatId },
      };
      const mockResponse: TelegramApiResponse<TelegramMessage> = {
        ok: true,
        result: mockMessage,
      };
      const mockFormData = {
        append: jest.fn(),
        getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
      };
      (FormData as jest.Mock).mockReturnValue(mockFormData);
      mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

      // Act
      await telegramService.sendVoice(testChatId, '/path/to/voice.wav');

      // Assert
      expect(mockFormData.append).toHaveBeenCalledWith('voice', mockFileContent, {
        filename: 'voice.wav',
        contentType: 'audio/wav',
      });
    });

    it('should detect MIME type for .mp3 file (default)', async () => {
      // Arrange
      const mockMessage: TelegramMessage = {
        message_id: 123,
        chat: { id: testChatId },
      };
      const mockResponse: TelegramApiResponse<TelegramMessage> = {
        ok: true,
        result: mockMessage,
      };
      const mockFormData = {
        append: jest.fn(),
        getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
      };
      (FormData as jest.Mock).mockReturnValue(mockFormData);
      mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

      // Act
      await telegramService.sendVoice(testChatId, '/path/to/voice.mp3');

      // Assert
      expect(mockFormData.append).toHaveBeenCalledWith('voice', mockFileContent, {
        filename: 'voice.mp3',
        contentType: 'audio/mpeg',
      });
    });

    it('should detect MIME type for file with unknown extension (default)', async () => {
      // Arrange
      const mockMessage: TelegramMessage = {
        message_id: 123,
        chat: { id: testChatId },
      };
      const mockResponse: TelegramApiResponse<TelegramMessage> = {
        ok: true,
        result: mockMessage,
      };
      const mockFormData = {
        append: jest.fn(),
        getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
      };
      (FormData as jest.Mock).mockReturnValue(mockFormData);
      mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

      // Act
      await telegramService.sendVoice(testChatId, '/path/to/voice.unknown');

      // Assert
      expect(mockFormData.append).toHaveBeenCalledWith('voice', mockFileContent, {
        filename: 'voice.unknown',
        contentType: 'audio/mpeg',
      });
    });

    it('should handle case-insensitive file extension', async () => {
      // Arrange
      const mockMessage: TelegramMessage = {
        message_id: 123,
        chat: { id: testChatId },
      };
      const mockResponse: TelegramApiResponse<TelegramMessage> = {
        ok: true,
        result: mockMessage,
      };
      const mockFormData = {
        append: jest.fn(),
        getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
      };
      (FormData as jest.Mock).mockReturnValue(mockFormData);
      mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

      // Act
      await telegramService.sendVoice(testChatId, '/path/to/voice.OGG');

      // Assert
      expect(mockFormData.append).toHaveBeenCalledWith('voice', mockFileContent, {
        filename: 'voice.OGG',
        contentType: 'audio/ogg',
      });
    });

    it('should not include caption if caption is null', async () => {
      // Arrange
      const mockMessage: TelegramMessage = {
        message_id: 123,
        chat: { id: testChatId },
      };
      const mockResponse: TelegramApiResponse<TelegramMessage> = {
        ok: true,
        result: mockMessage,
      };
      const mockFormData = {
        append: jest.fn(),
        getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
      };
      (FormData as jest.Mock).mockReturnValue(mockFormData);
      mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

      // Act
      await telegramService.sendVoice(testChatId, testVoicePath, undefined, null as any);

      // Assert
      expect(mockFormData.append).not.toHaveBeenCalledWith('caption', expect.anything());
    });

    it('should return API response with ok: false when Telegram API returns error', async () => {
      // Arrange
      const mockErrorResponse: TelegramApiResponse<TelegramMessage> = {
        ok: false,
        description: 'Bad Request: invalid file format',
        error_code: 400,
      };
      const mockFormData = {
        append: jest.fn(),
        getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
      };
      (FormData as jest.Mock).mockReturnValue(mockFormData);
      mockAxiosInstance.post.mockResolvedValue({ data: mockErrorResponse });

      // Act
      const result = await telegramService.sendVoice(testChatId, testVoicePath);

      // Assert
      expect(result).toEqual(mockErrorResponse);
      expect(result?.ok).toBe(false);
    });

    it('should log error and re-throw exception when axios request fails', async () => {
      // Arrange
      const mockFormData = {
        append: jest.fn(),
        getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
      };
      (FormData as jest.Mock).mockReturnValue(mockFormData);
      const mockError = new Error('Network error');
      mockAxiosInstance.post.mockRejectedValue(mockError);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act & Assert
      await expect(telegramService.sendVoice(testChatId, testVoicePath)).rejects.toThrow('Network error');

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error sending Telegram voice: Network error'
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(mockError.stack);

      // Cleanup
      consoleErrorSpy.mockRestore();
    });

    it('should log error and re-throw exception when file read fails', async () => {
      // Arrange
      const readError = new Error('Permission denied');
      (fs.readFile as jest.Mock).mockRejectedValue(readError);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act & Assert
      await expect(telegramService.sendVoice(testChatId, testVoicePath)).rejects.toThrow('Permission denied');

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error sending Telegram voice: Permission denied'
      );

      // Cleanup
      consoleErrorSpy.mockRestore();
    });

    it('should handle axios errors that are not Error instances', async () => {
      // Arrange
      const mockFormData = {
        append: jest.fn(),
        getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
      };
      (FormData as jest.Mock).mockReturnValue(mockFormData);
      const mockError = 'String error';
      mockAxiosInstance.post.mockRejectedValue(mockError);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act & Assert
      await expect(telegramService.sendVoice(testChatId, testVoicePath)).rejects.toBe(mockError);

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error sending Telegram voice: String error'
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith('');

      // Cleanup
      consoleErrorSpy.mockRestore();
    });

    it('should return response data from axios response', async () => {
      // Arrange
      const mockMessage: TelegramMessage = {
        message_id: 123,
        chat: { id: testChatId },
      };
      const mockResponse: TelegramApiResponse<TelegramMessage> = {
        ok: true,
        result: mockMessage,
      };
      const mockFormData = {
        append: jest.fn(),
        getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
      };
      (FormData as jest.Mock).mockReturnValue(mockFormData);
      mockAxiosInstance.post.mockResolvedValue({
        data: mockResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      // Act
      const result = await telegramService.sendVoice(testChatId, testVoicePath);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(result).not.toHaveProperty('status');
      expect(result).not.toHaveProperty('statusText');
    });

    it('should extract filename correctly from path with subdirectories', async () => {
      // Arrange
      const mockMessage: TelegramMessage = {
        message_id: 123,
        chat: { id: testChatId },
      };
      const mockResponse: TelegramApiResponse<TelegramMessage> = {
        ok: true,
        result: mockMessage,
      };
      const mockFormData = {
        append: jest.fn(),
        getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
      };
      (FormData as jest.Mock).mockReturnValue(mockFormData);
      mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

      // Act
      await telegramService.sendVoice(testChatId, '/path/to/subdir/voice.ogg');

      // Assert
      expect(mockFormData.append).toHaveBeenCalledWith('voice', mockFileContent, {
        filename: 'voice.ogg',
        contentType: 'audio/ogg',
      });
    });
  });

  describe('downloadFile', () => {
    const testFileId = 'test-file-id-12345';
    const testFilePath = 'photos/file_123.jpg';
    const testDestinationPath = '/path/to/downloaded/file.jpg';
    const mockFileContent = Buffer.from('mock file content');

    beforeEach(() => {
      // Reset fs mocks
      jest.clearAllMocks();
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
      (os.tmpdir as jest.Mock).mockReturnValue('/tmp');
    });

    it('should return undefined if bot token is blank', async () => {
      // Arrange
      const originalToken = process.env.TELEGRAM_BOT_TOKEN;
      delete process.env.TELEGRAM_BOT_TOKEN;
      const blankTokenMockAxiosInstance = {
        post: jest.fn(),
      };
      mockedAxios.create = jest.fn().mockReturnValue(blankTokenMockAxiosInstance as any);
      const serviceWithBlankToken = new TelegramService('');

      // Act
      const result = await serviceWithBlankToken.downloadFile(testFileId);

      // Assert
      expect(result).toBeUndefined();
      expect(blankTokenMockAxiosInstance.post).not.toHaveBeenCalled();

      // Cleanup
      if (originalToken) {
        process.env.TELEGRAM_BOT_TOKEN = originalToken;
      }
    });

    it('should return undefined if bot token is not provided and env var is not set', async () => {
      // Arrange
      const originalToken = process.env.TELEGRAM_BOT_TOKEN;
      delete process.env.TELEGRAM_BOT_TOKEN;
      const serviceWithoutToken = new TelegramService();

      // Act
      const result = await serviceWithoutToken.downloadFile(testFileId);

      // Assert
      expect(result).toBeUndefined();
      expect(mockAxiosInstance.post).not.toHaveBeenCalled();

      // Cleanup
      if (originalToken) {
        process.env.TELEGRAM_BOT_TOKEN = originalToken;
      }
    });

    it('should download file successfully with destination path provided', async () => {
      // Arrange
      const mockFileInfoResponse: TelegramApiResponse<{ file_path: string }> = {
        ok: true,
        result: {
          file_path: testFilePath,
        },
      };
      mockAxiosInstance.post.mockResolvedValue({ data: mockFileInfoResponse });

      // Mock axios.get for file download
      const mockDownloadResponse = {
        status: 200,
        statusText: 'OK',
        data: mockFileContent,
      };
      (mockedAxios.get as jest.Mock) = jest.fn().mockResolvedValue(mockDownloadResponse);

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      const result = await telegramService.downloadFile(testFileId, testDestinationPath);

      // Assert
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/getFile', { file_id: testFileId });
      expect(mockedAxios.get).toHaveBeenCalledWith(
        `https://api.telegram.org/file/bot${mockBotToken}/${testFilePath}`,
        {
          responseType: 'arraybuffer',
          timeout: 30000,
        }
      );
      expect(fs.mkdir).toHaveBeenCalledWith(path.dirname(testDestinationPath), { recursive: true });
      expect(fs.writeFile).toHaveBeenCalledWith(testDestinationPath, mockFileContent);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `Downloading Telegram file ${testFileId} to ${testDestinationPath}`
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `Downloaded file to ${testDestinationPath} (${mockFileContent.length} bytes)`
      );
      expect(result).toBe(testDestinationPath);

      // Cleanup
      consoleLogSpy.mockRestore();
    });

    it('should download file successfully without destination path (uses temp directory)', async () => {
      // Arrange
      const mockTempDir = '/tmp';
      const expectedTempPath = path.join(mockTempDir, `telegram_${testFileId}_file_123.jpg`);
      (os.tmpdir as jest.Mock).mockReturnValue(mockTempDir);

      const mockFileInfoResponse: TelegramApiResponse<{ file_path: string }> = {
        ok: true,
        result: {
          file_path: testFilePath,
        },
      };
      mockAxiosInstance.post.mockResolvedValue({ data: mockFileInfoResponse });

      // Mock axios.get for file download
      const mockDownloadResponse = {
        status: 200,
        statusText: 'OK',
        data: mockFileContent,
      };
      (mockedAxios.get as jest.Mock) = jest.fn().mockResolvedValue(mockDownloadResponse);

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      const result = await telegramService.downloadFile(testFileId);

      // Assert
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/getFile', { file_id: testFileId });
      expect(mockedAxios.get).toHaveBeenCalledWith(
        `https://api.telegram.org/file/bot${mockBotToken}/${testFilePath}`,
        {
          responseType: 'arraybuffer',
          timeout: 30000,
        }
      );
      expect(fs.mkdir).toHaveBeenCalledWith(path.dirname(expectedTempPath), { recursive: true });
      expect(fs.writeFile).toHaveBeenCalledWith(expectedTempPath, mockFileContent);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        `Downloading Telegram file ${testFileId} to ${expectedTempPath}`
      );
      expect(result).toBe(expectedTempPath);

      // Cleanup
      consoleLogSpy.mockRestore();
    });

    it('should extract filename correctly from file path for temp directory', async () => {
      // Arrange
      const mockTempDir = '/tmp';
      const testFilePathWithSubdir = 'photos/subdir/file_123.jpg';
      const expectedFilename = 'file_123.jpg';
      const expectedTempPath = path.join(mockTempDir, `telegram_${testFileId}_${expectedFilename}`);
      (os.tmpdir as jest.Mock).mockReturnValue(mockTempDir);

      const mockFileInfoResponse: TelegramApiResponse<{ file_path: string }> = {
        ok: true,
        result: {
          file_path: testFilePathWithSubdir,
        },
      };
      mockAxiosInstance.post.mockResolvedValue({ data: mockFileInfoResponse });

      // Mock axios.get for file download
      const mockDownloadResponse = {
        status: 200,
        statusText: 'OK',
        data: mockFileContent,
      };
      (mockedAxios.get as jest.Mock) = jest.fn().mockResolvedValue(mockDownloadResponse);

      // Act
      const result = await telegramService.downloadFile(testFileId);

      // Assert
      expect(result).toBe(expectedTempPath);
      expect(fs.writeFile).toHaveBeenCalledWith(expectedTempPath, mockFileContent);
    });

    it('should throw error when Telegram API returns error response', async () => {
      // Arrange
      const mockErrorResponse: TelegramApiResponse<{ file_path: string }> = {
        ok: false,
        description: 'Bad Request: file not found',
        error_code: 400,
      };
      mockAxiosInstance.post.mockResolvedValue({ data: mockErrorResponse });
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act & Assert
      await expect(telegramService.downloadFile(testFileId)).rejects.toThrow(
        'Telegram API error: Bad Request: file not found'
      );

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error downloading Telegram file: Telegram API error: Bad Request: file not found'
      );

      // Cleanup
      consoleErrorSpy.mockRestore();
    });

    it('should throw error when HTTP download fails with non-2xx status', async () => {
      // Arrange
      const mockFileInfoResponse: TelegramApiResponse<{ file_path: string }> = {
        ok: true,
        result: {
          file_path: testFilePath,
        },
      };
      mockAxiosInstance.post.mockResolvedValue({ data: mockFileInfoResponse });

      // Mock axios.get to return error status
      const mockDownloadResponse = {
        status: 404,
        statusText: 'Not Found',
        data: mockFileContent,
      };
      (mockedAxios.get as jest.Mock) = jest.fn().mockResolvedValue(mockDownloadResponse);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act & Assert
      await expect(telegramService.downloadFile(testFileId, testDestinationPath)).rejects.toThrow(
        'Failed to download file: HTTP 404 Not Found'
      );

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error downloading file from URL: Failed to download file: HTTP 404 Not Found'
      );

      // Cleanup
      consoleErrorSpy.mockRestore();
    });

    it('should throw error when axios download request fails', async () => {
      // Arrange
      const mockFileInfoResponse: TelegramApiResponse<{ file_path: string }> = {
        ok: true,
        result: {
          file_path: testFilePath,
        },
      };
      mockAxiosInstance.post.mockResolvedValue({ data: mockFileInfoResponse });

      // Mock axios.get to throw error
      const mockError = new Error('Network error');
      (mockedAxios.get as jest.Mock) = jest.fn().mockRejectedValue(mockError);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act & Assert
      await expect(telegramService.downloadFile(testFileId, testDestinationPath)).rejects.toThrow(
        'Network error'
      );

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error downloading file from URL: Network error'
      );

      // Cleanup
      consoleErrorSpy.mockRestore();
    });

    it('should handle axios error with response object', async () => {
      // Arrange
      const mockFileInfoResponse: TelegramApiResponse<{ file_path: string }> = {
        ok: true,
        result: {
          file_path: testFilePath,
        },
      };
      mockAxiosInstance.post.mockResolvedValue({ data: mockFileInfoResponse });

      // Mock axios.get to throw error with response
      const mockAxiosError = {
        response: {
          status: 500,
          statusText: 'Internal Server Error',
        },
        message: 'Request failed',
      };
      (mockedAxios.get as jest.Mock) = jest.fn().mockRejectedValue(mockAxiosError);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act & Assert
      await expect(telegramService.downloadFile(testFileId, testDestinationPath)).rejects.toThrow(
        'Failed to download file: HTTP 500 Internal Server Error'
      );

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error downloading file from URL: Failed to download file: HTTP 500 Internal Server Error'
      );

      // Cleanup
      consoleErrorSpy.mockRestore();
    });

    it('should log error and re-throw exception when getFile API request fails', async () => {
      // Arrange
      const mockError = new Error('Network error');
      mockAxiosInstance.post.mockRejectedValue(mockError);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act & Assert
      await expect(telegramService.downloadFile(testFileId)).rejects.toThrow('Network error');

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error downloading Telegram file: Network error'
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(mockError.stack);

      // Cleanup
      consoleErrorSpy.mockRestore();
    });

    it('should handle errors that are not Error instances', async () => {
      // Arrange
      const mockFileInfoResponse: TelegramApiResponse<{ file_path: string }> = {
        ok: true,
        result: {
          file_path: testFilePath,
        },
      };
      mockAxiosInstance.post.mockResolvedValue({ data: mockFileInfoResponse });

      // Mock axios.get to throw string error
      const mockError = 'String error';
      (mockedAxios.get as jest.Mock) = jest.fn().mockRejectedValue(mockError);
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act & Assert
      await expect(telegramService.downloadFile(testFileId, testDestinationPath)).rejects.toBe(
        mockError
      );

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error downloading file from URL: String error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('');

      // Cleanup
      consoleErrorSpy.mockRestore();
    });
  });
});
