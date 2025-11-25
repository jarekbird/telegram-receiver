import express, { Router } from 'express';
import TelegramController from '../controllers/telegram-controller';
import TelegramService from '../services/telegram-service';
import { BaseAsyncHandler } from '../handlers/base-async-handler';
import { TelegramUpdate } from '../types/telegram';
import { authenticateAdmin } from '../middleware/authenticate-admin.middleware';
import TelegramMessageHandler from '../jobs/telegram-message-job';

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
  router.post('/set_webhook', authenticateAdmin, telegramController.setWebhook.bind(telegramController));

  // GET /telegram/webhook_info - Get webhook info (admin only)
  router.get('/webhook_info', authenticateAdmin, telegramController.getWebhookInfo.bind(telegramController));

  // DELETE /telegram/webhook - Delete webhook (admin only)
  router.delete('/webhook', authenticateAdmin, telegramController.deleteWebhook.bind(telegramController));

  return router;
}

/**
 * Default export that creates routes with the TelegramMessageHandler
 * PHASE2-079: Uses the actual TelegramMessageHandler instead of stub
 */
const router = express.Router();
const telegramService = new TelegramService();
const telegramMessageHandler = new TelegramMessageHandler();
const telegramController = new TelegramController(telegramService, telegramMessageHandler);

// POST /telegram/webhook - Webhook endpoint for receiving Telegram updates
// Note: Webhook authentication middleware should be applied when registering routes
router.post('/webhook', telegramController.webhook.bind(telegramController));

// POST /telegram/set_webhook - Set webhook (admin only)
router.post('/set_webhook', authenticateAdmin, telegramController.setWebhook.bind(telegramController));

// GET /telegram/webhook_info - Get webhook info (admin only)
router.get('/webhook_info', authenticateAdmin, telegramController.getWebhookInfo.bind(telegramController));

// DELETE /telegram/webhook - Delete webhook (admin only)
router.delete('/webhook', authenticateAdmin, telegramController.deleteWebhook.bind(telegramController));

export default router;
