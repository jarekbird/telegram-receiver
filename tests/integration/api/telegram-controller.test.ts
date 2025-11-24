import request from 'supertest';
import express from 'express';
import TelegramController from '../../../src/controllers/telegram-controller';
import TelegramService from '../../../src/services/telegram-service';
import { BaseAsyncHandler } from '../../../src/handlers/base-async-handler';
import { TelegramUpdate } from '../../../src/types/telegram';
import { authenticateWebhook } from '../../../src/middleware/authenticate-webhook.middleware';
import {
  sampleTextMessage,
  sampleCallbackQuery,
  sampleWebhookUpdate,
} from '../../../tests/fixtures/telegramMessages';

/**
 * Mock handler for testing
 * Tracks execute calls to verify async handler execution
 */
class MockTelegramMessageHandler extends BaseAsyncHandler<TelegramUpdate, void> {
  public executeCalls: Array<{ data: TelegramUpdate }> = [];

  async handle(_data: TelegramUpdate): Promise<void> {
    // Mock implementation for testing
  }

  async execute(data: TelegramUpdate): Promise<void> {
    // Track execute calls
    this.executeCalls.push({ data });
    // Don't call super.execute to avoid retry logic in tests
    // Just resolve immediately
    return Promise.resolve();
  }
}

describe('TelegramController Integration Tests', () => {
  let app: express.Application;
  let telegramService: TelegramService;
  let telegramController: TelegramController;
  let mockHandler: MockTelegramMessageHandler;
  let originalWebhookSecret: string | undefined;
  let originalAdminSecret: string | undefined;
  let originalBaseUrl: string | undefined;

  beforeEach(() => {
    // Save original env vars
    originalWebhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    originalAdminSecret = process.env.WEBHOOK_SECRET;
    originalBaseUrl = process.env.TELEGRAM_WEBHOOK_BASE_URL;

    // Set up test environment
    process.env.TELEGRAM_WEBHOOK_SECRET = 'test-webhook-secret';
    process.env.WEBHOOK_SECRET = 'test-admin-secret';
    process.env.TELEGRAM_WEBHOOK_BASE_URL = 'http://localhost:3000';

    // Create Express app
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Create service and controller instances
    telegramService = new TelegramService('test-bot-token');
    mockHandler = new MockTelegramMessageHandler();
    telegramController = new TelegramController(telegramService, mockHandler);

    // Register routes
    // Apply authenticateWebhook middleware to webhook route (matching Rails before_action)
    app.post('/telegram/webhook', authenticateWebhook, telegramController.webhook.bind(telegramController));
    app.post('/telegram/set_webhook', telegramController.setWebhook.bind(telegramController));
    app.get('/telegram/webhook_info', telegramController.getWebhookInfo.bind(telegramController));
    app.delete('/telegram/webhook', telegramController.deleteWebhook.bind(telegramController));

    // Reset mocks
    mockHandler.executeCalls = [];
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original env vars
    if (originalWebhookSecret !== undefined) {
      process.env.TELEGRAM_WEBHOOK_SECRET = originalWebhookSecret;
    } else {
      delete process.env.TELEGRAM_WEBHOOK_SECRET;
    }

    if (originalAdminSecret !== undefined) {
      process.env.WEBHOOK_SECRET = originalAdminSecret;
    } else {
      delete process.env.WEBHOOK_SECRET;
    }

    if (originalBaseUrl !== undefined) {
      process.env.TELEGRAM_WEBHOOK_BASE_URL = originalBaseUrl;
    } else {
      delete process.env.TELEGRAM_WEBHOOK_BASE_URL;
    }
  });

  describe('POST /telegram/webhook', () => {
    describe('Authentication', () => {
      it('should return 401 when webhook secret is configured and header is missing', async () => {
        const response = await request(app)
          .post('/telegram/webhook')
          .set('Content-Type', 'application/json')
          .send(sampleTextMessage);

        expect(response.status).toBe(401);
      });

      it('should return 401 when webhook secret is configured and header does not match', async () => {
        const response = await request(app)
          .post('/telegram/webhook')
          .set('Content-Type', 'application/json')
          .set('X-Telegram-Bot-Api-Secret-Token', 'wrong-secret')
          .send(sampleTextMessage);

        expect(response.status).toBe(401);
      });

      it('should accept request when webhook secret is not configured', async () => {
        delete process.env.TELEGRAM_WEBHOOK_SECRET;

        // Mock handler execute to resolve successfully
        jest.spyOn(mockHandler, 'execute').mockResolvedValue(undefined);

        const response = await request(app)
          .post('/telegram/webhook')
          .set('Content-Type', 'application/json')
          .send(sampleTextMessage);

        expect(response.status).toBe(200);
        expect(response.text).toBe('OK');
      });

      it('should accept request with valid X-Telegram-Bot-Api-Secret-Token header', async () => {
        // Mock handler execute to resolve successfully
        jest.spyOn(mockHandler, 'execute').mockResolvedValue(undefined);

        const response = await request(app)
          .post('/telegram/webhook')
          .set('Content-Type', 'application/json')
          .set('X-Telegram-Bot-Api-Secret-Token', 'test-webhook-secret')
          .send(sampleTextMessage);

        expect(response.status).toBe(200);
        expect(response.text).toBe('OK');
      });
    });

    describe('Success Cases', () => {
      beforeEach(() => {
        // Reset execute calls tracking
        mockHandler.executeCalls = [];
      });

      it('should return 200 OK immediately', async () => {
        const response = await request(app)
          .post('/telegram/webhook')
          .set('Content-Type', 'application/json')
          .set('X-Telegram-Bot-Api-Secret-Token', 'test-webhook-secret')
          .send(sampleTextMessage);

        expect(response.status).toBe(200);
        expect(response.text).toBe('OK');
      });

      it('should execute async handler for processing', async () => {
        await request(app)
          .post('/telegram/webhook')
          .set('Content-Type', 'application/json')
          .set('X-Telegram-Bot-Api-Secret-Token', 'test-webhook-secret')
          .send(sampleTextMessage);

        // Wait a bit for async handler to execute (handler.execute is called asynchronously)
        await new Promise((resolve) => setTimeout(resolve, 200));

        expect(mockHandler.executeCalls.length).toBeGreaterThan(0);
      });

      it('should pass correct update data to handler (excluding controller/action/format params)', async () => {
        const updateWithExtraParams = {
          ...sampleTextMessage,
          controller: 'telegram',
          action: 'webhook',
          format: 'json',
          telegram: { bot_token: 'test' },
        };

        await request(app)
          .post('/telegram/webhook')
          .set('Content-Type', 'application/json')
          .set('X-Telegram-Bot-Api-Secret-Token', 'test-webhook-secret')
          .send(updateWithExtraParams);

        // Wait a bit for async handler to execute
        await new Promise((resolve) => setTimeout(resolve, 200));

        expect(mockHandler.executeCalls.length).toBeGreaterThan(0);
        const passedData = mockHandler.executeCalls[0].data;
        expect(passedData).not.toHaveProperty('controller');
        expect(passedData).not.toHaveProperty('action');
        expect(passedData).not.toHaveProperty('format');
        expect(passedData).not.toHaveProperty('telegram');
        expect(passedData).toHaveProperty('update_id');
        expect(passedData).toHaveProperty('message');
      });

      it('should handle message update (command message)', async () => {
        const commandMessage = {
          update_id: 123456789,
          message: {
            message_id: 1,
            text: '/start',
            chat: { id: 123456 },
            from: { id: 789, username: 'test_user' },
          },
        };

        await request(app)
          .post('/telegram/webhook')
          .set('Content-Type', 'application/json')
          .set('X-Telegram-Bot-Api-Secret-Token', 'test-webhook-secret')
          .send(commandMessage);

        // Wait a bit for async handler to execute
        await new Promise((resolve) => setTimeout(resolve, 200));

        expect(mockHandler.executeCalls.length).toBeGreaterThan(0);
        const passedData = mockHandler.executeCalls[0].data;
        expect(passedData.message?.text).toBe('/start');
      });

      it('should handle message update (non-command message)', async () => {
        const nonCommandMessage = {
          update_id: 123456789,
          message: {
            message_id: 1,
            text: 'Create a user authentication service',
            chat: { id: 123456 },
            from: { id: 789, username: 'test_user' },
          },
        };

        await request(app)
          .post('/telegram/webhook')
          .set('Content-Type', 'application/json')
          .set('X-Telegram-Bot-Api-Secret-Token', 'test-webhook-secret')
          .send(nonCommandMessage);

        // Wait a bit for async handler to execute
        await new Promise((resolve) => setTimeout(resolve, 200));

        expect(mockHandler.executeCalls.length).toBeGreaterThan(0);
        const passedData = mockHandler.executeCalls[0].data;
        expect(passedData.message?.text).toBe('Create a user authentication service');
      });

      it('should handle edited_message update', async () => {
        const editedMessage = {
          update_id: 123456789,
          edited_message: {
            message_id: 2,
            text: 'Add error handling to the service',
            chat: { id: 123456 },
          },
        };

        await request(app)
          .post('/telegram/webhook')
          .set('Content-Type', 'application/json')
          .set('X-Telegram-Bot-Api-Secret-Token', 'test-webhook-secret')
          .send(editedMessage);

        // Wait a bit for async handler to execute
        await new Promise((resolve) => setTimeout(resolve, 200));

        expect(mockHandler.executeCalls.length).toBeGreaterThan(0);
        const passedData = mockHandler.executeCalls[0].data;
        expect(passedData.edited_message?.text).toBe('Add error handling to the service');
      });

      it('should handle callback_query update', async () => {
        await request(app)
          .post('/telegram/webhook')
          .set('Content-Type', 'application/json')
          .set('X-Telegram-Bot-Api-Secret-Token', 'test-webhook-secret')
          .send(sampleCallbackQuery);

        // Wait a bit for async handler to execute
        await new Promise((resolve) => setTimeout(resolve, 200));

        expect(mockHandler.executeCalls.length).toBeGreaterThan(0);
        const passedData = mockHandler.executeCalls[0].data;
        expect(passedData.callback_query?.data).toBe('callback_data');
      });

      it('should handle unhandled update type', async () => {
        const unhandledUpdate = {
          update_id: 123456789,
          unknown_type: {},
        };

        await request(app)
          .post('/telegram/webhook')
          .set('Content-Type', 'application/json')
          .set('X-Telegram-Bot-Api-Secret-Token', 'test-webhook-secret')
          .send(unhandledUpdate);

        // Wait a bit for async handler to execute
        await new Promise((resolve) => setTimeout(resolve, 200));

        expect(mockHandler.executeCalls.length).toBeGreaterThan(0);
        const passedData = mockHandler.executeCalls[0].data;
        expect(passedData).toHaveProperty('unknown_type');
      });
    });

    describe('Error Handling', () => {
      it('should return 200 even on error (to avoid Telegram retries)', async () => {
        // Mock handler execute to throw error
        jest.spyOn(mockHandler, 'execute').mockRejectedValue(new Error('Test error'));
        jest.spyOn(telegramService, 'sendMessage').mockResolvedValue({
          ok: true,
          result: {
            message_id: 1,
            date: Math.floor(Date.now() / 1000),
            text: 'Test message',
          },
        });

        const response = await request(app)
          .post('/telegram/webhook')
          .set('Content-Type', 'application/json')
          .set('X-Telegram-Bot-Api-Secret-Token', 'test-webhook-secret')
          .send(sampleTextMessage);

        expect(response.status).toBe(200);
        expect(response.text).toBe('OK');
      });

      it('should send error message to user if chat_id is available', async () => {
        // Make handler execute throw synchronously (simulating error during handler setup)
        // This matches Rails test where perform_later raises synchronously
        jest.spyOn(mockHandler, 'execute').mockImplementation(() => {
          throw new Error('Test error');
        });
        const sendMessageSpy = jest.spyOn(telegramService, 'sendMessage').mockResolvedValue({
          ok: true,
          result: {
            message_id: 1,
            date: Math.floor(Date.now() / 1000),
            text: 'Test message',
          },
        });

        await request(app)
          .post('/telegram/webhook')
          .set('Content-Type', 'application/json')
          .set('X-Telegram-Bot-Api-Secret-Token', 'test-webhook-secret')
          .send(sampleTextMessage);

        // Wait a bit for async error handling
        await new Promise((resolve) => setTimeout(resolve, 200));

        expect(sendMessageSpy).toHaveBeenCalledWith(
          sampleTextMessage.message.chat.id,
          expect.stringContaining('Sorry, I encountered an error processing your message: Test error'),
          'HTML',
          sampleTextMessage.message.message_id,
        );
      });

      it('should handle errors when sending error message fails', async () => {
        // Mock handler execute to throw error
        jest.spyOn(mockHandler, 'execute').mockRejectedValue(new Error('Test error'));
        // Mock sendMessage to throw error
        jest.spyOn(telegramService, 'sendMessage').mockRejectedValue(new Error('Send failed'));

        const response = await request(app)
          .post('/telegram/webhook')
          .set('Content-Type', 'application/json')
          .set('X-Telegram-Bot-Api-Secret-Token', 'test-webhook-secret')
          .send(sampleTextMessage);

        // Should still return 200 OK even if sending error message fails
        expect(response.status).toBe(200);
        expect(response.text).toBe('OK');
      });
    });
  });

  describe('POST /telegram/set_webhook', () => {
    describe('Admin Authentication', () => {
      it('should return 401 without admin authentication', async () => {
        const response = await request(app)
          .post('/telegram/set_webhook')
          .send({ url: 'https://example.com/webhook' });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
          ok: false,
          error: 'Unauthorized',
        });
      });

      it('should return 401 with invalid admin secret header', async () => {
        const response = await request(app)
          .post('/telegram/set_webhook')
          .set('X-Admin-Secret', 'wrong-secret')
          .send({ url: 'https://example.com/webhook' });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
          ok: false,
          error: 'Unauthorized',
        });
      });

      it('should accept request with valid X-Admin-Secret header', async () => {
        jest.spyOn(telegramService, 'setWebhook').mockResolvedValue({
          ok: true,
          result: true,
        });

        const response = await request(app)
          .post('/telegram/set_webhook')
          .set('X-Admin-Secret', 'test-admin-secret')
          .send({ url: 'https://example.com/webhook' });

        expect(response.status).toBe(200);
        expect(response.body.ok).toBe(true);
      });

      it('should accept request with valid HTTP_X_ADMIN_SECRET env variable', async () => {
        jest.spyOn(telegramService, 'setWebhook').mockResolvedValue({
          ok: true,
          result: true,
        });

        const response = await request(app)
          .post('/telegram/set_webhook')
          .send({ url: 'https://example.com/webhook' })
          .set('X-Admin-Secret', 'test-admin-secret');

        expect(response.status).toBe(200);
        expect(response.body.ok).toBe(true);
      });

      it('should accept request with valid admin_secret query parameter', async () => {
        jest.spyOn(telegramService, 'setWebhook').mockResolvedValue({
          ok: true,
          result: true,
        });

        const response = await request(app)
          .post('/telegram/set_webhook?admin_secret=test-admin-secret')
          .send({ url: 'https://example.com/webhook' });

        expect(response.status).toBe(200);
        expect(response.body.ok).toBe(true);
      });

      it('should accept request with valid admin_secret body parameter', async () => {
        jest.spyOn(telegramService, 'setWebhook').mockResolvedValue({
          ok: true,
          result: true,
        });

        const response = await request(app)
          .post('/telegram/set_webhook')
          .send({
            url: 'https://example.com/webhook',
            admin_secret: 'test-admin-secret',
          });

        expect(response.status).toBe(200);
        expect(response.body.ok).toBe(true);
      });
    });

    describe('Success Cases', () => {
      beforeEach(() => {
        jest.spyOn(telegramService, 'setWebhook').mockResolvedValue({
          ok: true,
          result: true,
        });
      });

      it('should return success response', async () => {
        const response = await request(app)
          .post('/telegram/set_webhook')
          .set('X-Admin-Secret', 'test-admin-secret')
          .send({ url: 'https://example.com/webhook' });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
          ok: true,
          message: 'Webhook set successfully',
          webhook_info: {
            ok: true,
            result: true,
          },
        });
      });

      it('should call TelegramService.setWebhook with correct parameters', async () => {
        const setWebhookSpy = jest.spyOn(telegramService, 'setWebhook');

        await request(app)
          .post('/telegram/set_webhook')
          .set('X-Admin-Secret', 'test-admin-secret')
          .send({ url: 'https://example.com/webhook' });

        expect(setWebhookSpy).toHaveBeenCalledWith(
          'https://example.com/webhook',
          'test-webhook-secret',
        );
      });

      it('should use default webhook URL when not provided', async () => {
        const setWebhookSpy = jest.spyOn(telegramService, 'setWebhook');

        await request(app)
          .post('/telegram/set_webhook')
          .set('X-Admin-Secret', 'test-admin-secret')
          .send();

        expect(setWebhookSpy).toHaveBeenCalledWith(
          'http://localhost:3000/telegram/webhook',
          'test-webhook-secret',
        );
      });

      it('should use provided secret_token parameter', async () => {
        const setWebhookSpy = jest.spyOn(telegramService, 'setWebhook');

        await request(app)
          .post('/telegram/set_webhook')
          .set('X-Admin-Secret', 'test-admin-secret')
          .send({
            url: 'https://example.com/webhook',
            secret_token: 'custom-secret',
          });

        expect(setWebhookSpy).toHaveBeenCalledWith(
          'https://example.com/webhook',
          'custom-secret',
        );
      });

      it('should use config telegram_webhook_secret when secret_token not provided', async () => {
        const setWebhookSpy = jest.spyOn(telegramService, 'setWebhook');

        await request(app)
          .post('/telegram/set_webhook')
          .set('X-Admin-Secret', 'test-admin-secret')
          .send({ url: 'https://example.com/webhook' });

        expect(setWebhookSpy).toHaveBeenCalledWith(
          'https://example.com/webhook',
          'test-webhook-secret',
        );
      });
    });

    describe('Error Handling', () => {
      it('should return error response when TelegramService raises error', async () => {
        jest.spyOn(telegramService, 'setWebhook').mockRejectedValue(
          new Error('API error'),
        );

        const response = await request(app)
          .post('/telegram/set_webhook')
          .set('X-Admin-Secret', 'test-admin-secret')
          .send({ url: 'https://example.com/webhook' });

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
          ok: false,
          error: 'API error',
        });
      });
    });
  });

  describe('GET /telegram/webhook_info', () => {
    describe('Admin Authentication', () => {
      it('should return 401 without admin authentication', async () => {
        const response = await request(app).get('/telegram/webhook_info');

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
          ok: false,
          error: 'Unauthorized',
        });
      });

      it('should return 401 with invalid admin secret header', async () => {
        const response = await request(app)
          .get('/telegram/webhook_info')
          .set('X-Admin-Secret', 'wrong-secret');

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
          ok: false,
          error: 'Unauthorized',
        });
      });

      it('should accept request with valid X-Admin-Secret header', async () => {
        jest.spyOn(telegramService, 'getWebhookInfo').mockResolvedValue({
          ok: true,
          result: {
            url: 'https://example.com/webhook',
            pending_update_count: 0,
          },
        });

        const response = await request(app)
          .get('/telegram/webhook_info')
          .set('X-Admin-Secret', 'test-admin-secret');

        expect(response.status).toBe(200);
        expect(response.body.ok).toBe(true);
      });
    });

    describe('Success Cases', () => {
      beforeEach(() => {
        jest.spyOn(telegramService, 'getWebhookInfo').mockResolvedValue({
          ok: true,
          result: {
            url: 'https://example.com/webhook',
            pending_update_count: 0,
          },
        });
      });

      it('should return success response', async () => {
        const response = await request(app)
          .get('/telegram/webhook_info')
          .set('X-Admin-Secret', 'test-admin-secret');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
          ok: true,
          webhook_info: {
            ok: true,
            result: {
              url: 'https://example.com/webhook',
              pending_update_count: 0,
            },
          },
        });
      });

      it('should return webhook info from TelegramService', async () => {
        const webhookInfoData = {
          ok: true,
          result: {
            url: 'https://example.com/webhook',
            pending_update_count: 5,
          },
        };
        jest.spyOn(telegramService, 'getWebhookInfo').mockResolvedValue(webhookInfoData);

        const response = await request(app)
          .get('/telegram/webhook_info')
          .set('X-Admin-Secret', 'test-admin-secret');

        expect(response.body.webhook_info).toEqual(webhookInfoData);
      });
    });

    describe('Error Handling', () => {
      it('should return error response when TelegramService raises error', async () => {
        jest.spyOn(telegramService, 'getWebhookInfo').mockRejectedValue(
          new Error('API error'),
        );

        const response = await request(app)
          .get('/telegram/webhook_info')
          .set('X-Admin-Secret', 'test-admin-secret');

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
          ok: false,
          error: 'API error',
        });
      });
    });
  });

  describe('DELETE /telegram/webhook', () => {
    describe('Admin Authentication', () => {
      it('should return 401 without admin authentication', async () => {
        const response = await request(app).delete('/telegram/webhook');

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
          ok: false,
          error: 'Unauthorized',
        });
      });

      it('should return 401 with invalid admin secret header', async () => {
        const response = await request(app)
          .delete('/telegram/webhook')
          .set('X-Admin-Secret', 'wrong-secret');

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
          ok: false,
          error: 'Unauthorized',
        });
      });

      it('should accept request with valid X-Admin-Secret header', async () => {
        jest.spyOn(telegramService, 'deleteWebhook').mockResolvedValue({
          ok: true,
          result: true,
        });

        const response = await request(app)
          .delete('/telegram/webhook')
          .set('X-Admin-Secret', 'test-admin-secret');

        expect(response.status).toBe(200);
        expect(response.body.ok).toBe(true);
      });
    });

    describe('Success Cases', () => {
      beforeEach(() => {
        jest.spyOn(telegramService, 'deleteWebhook').mockResolvedValue({
          ok: true,
          result: true,
        });
      });

      it('should return success response', async () => {
        const response = await request(app)
          .delete('/telegram/webhook')
          .set('X-Admin-Secret', 'test-admin-secret');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
          ok: true,
          message: 'Webhook deleted successfully',
        });
      });

      it('should call TelegramService.deleteWebhook', async () => {
        const deleteWebhookSpy = jest.spyOn(telegramService, 'deleteWebhook');

        await request(app)
          .delete('/telegram/webhook')
          .set('X-Admin-Secret', 'test-admin-secret');

        expect(deleteWebhookSpy).toHaveBeenCalledTimes(1);
      });
    });

    describe('Error Handling', () => {
      it('should return error response when TelegramService raises error', async () => {
        jest.spyOn(telegramService, 'deleteWebhook').mockRejectedValue(
          new Error('API error'),
        );

        const response = await request(app)
          .delete('/telegram/webhook')
          .set('X-Admin-Secret', 'test-admin-secret');

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
          ok: false,
          error: 'API error',
        });
      });
    });
  });
});
