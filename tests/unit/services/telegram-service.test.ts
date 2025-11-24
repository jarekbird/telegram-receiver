/**
 * Unit tests for TelegramService
 * Tests the setWebhook, deleteWebhook, and getWebhookInfo method implementations
 */

import TelegramService from '../../../src/services/telegram-service';
import axios from 'axios';
import { TelegramApiResponse, WebhookInfo } from '../../../src/types/telegram';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

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
});
