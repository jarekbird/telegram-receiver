import request from 'supertest';
import express from 'express';
import TelegramController from '../../../src/controllers/telegram-controller';
import TelegramService from '../../../src/services/telegram-service';
import { BaseAsyncHandler } from '../../../src/handlers/base-async-handler';
import { TelegramUpdate } from '../../../src/types/telegram';

/**
 * Stub handler for testing
 */
class StubTelegramMessageHandler extends BaseAsyncHandler<TelegramUpdate, void> {
  async handle(_data: TelegramUpdate): Promise<void> {
    // Stub implementation for testing
  }
}

describe('DELETE /telegram/webhook', () => {
  let app: express.Application;
  let telegramService: TelegramService;
  let telegramController: TelegramController;
  let originalWebhookSecret: string | undefined;

  beforeEach(() => {
    // Save original env var
    originalWebhookSecret = process.env.WEBHOOK_SECRET;

    // Set up test environment
    process.env.WEBHOOK_SECRET = 'test-admin-secret';

    // Create Express app
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Create service and controller instances
    telegramService = new TelegramService('test-bot-token');
    const stubHandler = new StubTelegramMessageHandler();
    telegramController = new TelegramController(telegramService, stubHandler);

    // Register route
    app.delete('/telegram/webhook', telegramController.deleteWebhook.bind(telegramController));
  });

  afterEach(() => {
    // Restore original env var
    if (originalWebhookSecret !== undefined) {
      process.env.WEBHOOK_SECRET = originalWebhookSecret;
    } else {
      delete process.env.WEBHOOK_SECRET;
    }
  });

  describe('Admin Authentication', () => {
    it('should return 401 Unauthorized without admin authentication', async () => {
      const response = await request(app)
        .delete('/telegram/webhook')
        .send();

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        ok: false,
        error: 'Unauthorized',
      });
    });

    it('should return 401 Unauthorized with invalid admin secret header', async () => {
      const response = await request(app)
        .delete('/telegram/webhook')
        .set('X-Admin-Secret', 'wrong-secret')
        .send();

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        ok: false,
        error: 'Unauthorized',
      });
    });

    it('should accept request with valid X-Admin-Secret header', async () => {
      // Mock TelegramService.deleteWebhook to return success
      jest.spyOn(telegramService, 'deleteWebhook').mockResolvedValue({
        ok: true,
        result: true,
      });

      const response = await request(app)
        .delete('/telegram/webhook')
        .set('X-Admin-Secret', 'test-admin-secret')
        .send();

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ok: true,
        message: 'Webhook deleted successfully',
      });
      expect(telegramService.deleteWebhook).toHaveBeenCalledTimes(1);
    });

    it('should accept request with valid admin_secret query parameter', async () => {
      // Mock TelegramService.deleteWebhook to return success
      jest.spyOn(telegramService, 'deleteWebhook').mockResolvedValue({
        ok: true,
        result: true,
      });

      const response = await request(app)
        .delete('/telegram/webhook?admin_secret=test-admin-secret')
        .send();

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ok: true,
        message: 'Webhook deleted successfully',
      });
      expect(telegramService.deleteWebhook).toHaveBeenCalledTimes(1);
    });

    it('should accept request with valid admin_secret body parameter', async () => {
      // Mock TelegramService.deleteWebhook to return success
      jest.spyOn(telegramService, 'deleteWebhook').mockResolvedValue({
        ok: true,
        result: true,
      });

      const response = await request(app)
        .delete('/telegram/webhook')
        .send({ admin_secret: 'test-admin-secret' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ok: true,
        message: 'Webhook deleted successfully',
      });
      expect(telegramService.deleteWebhook).toHaveBeenCalledTimes(1);
    });
  });

  describe('Success Cases', () => {
    beforeEach(() => {
      // Mock TelegramService.deleteWebhook to return success
      jest.spyOn(telegramService, 'deleteWebhook').mockResolvedValue({
        ok: true,
        result: true,
      });
    });

    it('should call TelegramService.deleteWebhook', async () => {
      await request(app)
        .delete('/telegram/webhook')
        .set('X-Admin-Secret', 'test-admin-secret')
        .send();

      expect(telegramService.deleteWebhook).toHaveBeenCalledTimes(1);
    });

    it('should return success response with correct format', async () => {
      const response = await request(app)
        .delete('/telegram/webhook')
        .set('X-Admin-Secret', 'test-admin-secret')
        .send();

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ok: true,
        message: 'Webhook deleted successfully',
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      // Mock TelegramService.deleteWebhook to throw error
      jest.spyOn(telegramService, 'deleteWebhook').mockRejectedValue(
        new Error('Telegram API error')
      );
    });

    it('should return 500 status on error', async () => {
      const response = await request(app)
        .delete('/telegram/webhook')
        .set('X-Admin-Secret', 'test-admin-secret')
        .send();

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        ok: false,
        error: 'Telegram API error',
      });
    });

    it('should return error response with correct format', async () => {
      const response = await request(app)
        .delete('/telegram/webhook')
        .set('X-Admin-Secret', 'test-admin-secret')
        .send();

      expect(response.body).toHaveProperty('ok', false);
      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
    });

    it('should handle errors when TelegramService.deleteWebhook throws', async () => {
      const errorMessage = 'Network timeout';
      jest.spyOn(telegramService, 'deleteWebhook').mockRejectedValue(
        new Error(errorMessage)
      );

      const response = await request(app)
        .delete('/telegram/webhook')
        .set('X-Admin-Secret', 'test-admin-secret')
        .send();

      expect(response.status).toBe(500);
      expect(response.body.error).toBe(errorMessage);
    });
  });

  describe('TelegramService Integration', () => {
    it('should handle empty bot token gracefully (TelegramService returns undefined)', async () => {
      // Create service with empty token
      const serviceWithEmptyToken = new TelegramService('');
      const stubHandler = new StubTelegramMessageHandler();
      const controllerWithEmptyToken = new TelegramController(
        serviceWithEmptyToken,
        stubHandler
      );

      const testApp = express();
      testApp.use(express.json());
      testApp.delete(
        '/telegram/webhook',
        controllerWithEmptyToken.deleteWebhook.bind(controllerWithEmptyToken)
      );

      // Mock deleteWebhook to return undefined (when token is blank)
      jest.spyOn(serviceWithEmptyToken, 'deleteWebhook').mockResolvedValue(undefined);

      const response = await request(testApp)
        .delete('/telegram/webhook')
        .set('X-Admin-Secret', 'test-admin-secret')
        .send();

      // Should still return success (service handles blank token gracefully)
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ok: true,
        message: 'Webhook deleted successfully',
      });
    });
  });
});
