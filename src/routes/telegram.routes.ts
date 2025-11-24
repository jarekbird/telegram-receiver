import express, { Router } from 'express';
import TelegramController from '../controllers/telegram-controller';
import TelegramService from '../services/telegram-service';
import { BaseAsyncHandler } from '../handlers/base-async-handler';
import { TelegramUpdate } from '../types/telegram';

/**
 * Creates and returns the Telegram routes router
 * 
 * This function accepts the required dependencies and creates a router
 * with all Telegram endpoints configured.
 * 
 * @param telegramMessageHandler - Handler for processing Telegram updates asynchronously
 * @returns Express router with Telegram routes configured
 */
export function createTelegramRoutes(
  telegramMessageHandler: BaseAsyncHandler<TelegramUpdate, void>
): Router {
  const router = express.Router();
  
  // Create TelegramService instance
  const telegramService = new TelegramService();
  
  // Create TelegramController instance with dependencies
  const telegramController = new TelegramController(
    telegramService,
    telegramMessageHandler
  );

  // POST /telegram/webhook - Webhook endpoint for receiving Telegram updates
  // Note: Webhook authentication middleware should be applied when registering routes
  router.post('/webhook', telegramController.webhook.bind(telegramController));

  // POST /telegram/set_webhook - Set webhook (admin only)
  router.post('/set_webhook', telegramController.setWebhook.bind(telegramController));

  // GET /telegram/webhook_info - Get webhook info (admin only)
  router.get('/webhook_info', telegramController.getWebhookInfo.bind(telegramController));

  // DELETE /telegram/webhook - Delete webhook (admin only)
  router.delete('/webhook', telegramController.deleteWebhook.bind(telegramController));

  return router;
}

/**
 * Creates a minimal stub handler for routes that don't require full handler implementation
 * This is a temporary solution until the full handler is implemented
 */
class StubTelegramMessageHandler extends BaseAsyncHandler<TelegramUpdate, void> {
  async handle(_data: TelegramUpdate): Promise<void> {
    // Stub implementation - will be replaced with actual handler
    // This is only used for controller instantiation, not for actual message processing
  }
}

/**
 * Default export that creates routes with a stub handler
 * This allows routes to be registered without requiring the full handler implementation
 * The stub handler will be replaced when the actual handler is implemented
 */
const router = express.Router();
const telegramService = new TelegramService();
const stubHandler = new StubTelegramMessageHandler();
const telegramController = new TelegramController(telegramService, stubHandler);

// POST /telegram/webhook - Webhook endpoint for receiving Telegram updates
// Note: Webhook authentication middleware should be applied when registering routes
router.post('/webhook', telegramController.webhook.bind(telegramController));

// POST /telegram/set_webhook - Set webhook (admin only)
router.post('/set_webhook', telegramController.setWebhook.bind(telegramController));

// GET /telegram/webhook_info - Get webhook info (admin only)
router.get('/webhook_info', telegramController.getWebhookInfo.bind(telegramController));

// DELETE /telegram/webhook - Delete webhook (admin only)
router.delete('/webhook', telegramController.deleteWebhook.bind(telegramController));

export default router;
