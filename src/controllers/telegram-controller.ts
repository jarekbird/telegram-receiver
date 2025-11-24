import { Request, Response } from 'express';
import TelegramService from '../services/telegram-service';
import { TelegramUpdate } from '../types/telegram';
import { BaseAsyncHandler } from '../handlers/base-async-handler';
import logger from '../utils/logger';

/**
 * TelegramController class (PHASE2-055)
 * 
 * Controller for handling Telegram webhook requests and admin endpoints.
 * This is the foundational class structure - method implementations will be added
 * in subsequent tasks (PHASE2-056 through PHASE2-063).
 * 
 * Matches Rails implementation in jarek-va/app/controllers/telegram_controller.rb
 * 
 * Key features:
 * - Webhook endpoint for receiving Telegram updates
 * - Admin endpoints for webhook management (set, get info, delete)
 * - Authentication middleware for webhook and admin endpoints
 * - Error handling that sends error messages to Telegram users when possible
 * - Always returns 200 OK to Telegram to avoid retries
 */
class TelegramController {
  // These will be used in method implementations (PHASE2-056 through PHASE2-063)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private telegramService: TelegramService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private telegramMessageHandler: BaseAsyncHandler<TelegramUpdate, void>;

  /**
   * Creates a new TelegramController instance
   * 
   * @param telegramService - TelegramService instance for Telegram API interactions
   * @param telegramMessageHandler - Handler for processing Telegram updates asynchronously
   */
  constructor(
    telegramService: TelegramService,
    telegramMessageHandler: BaseAsyncHandler<TelegramUpdate, void>
  ) {
    this.telegramService = telegramService;
    this.telegramMessageHandler = telegramMessageHandler;
  }

  /**
   * Webhook endpoint for Telegram updates
   * 
   * Receives updates from Telegram Bot API, filters out Express-specific params,
   * and executes the async handler to process the update.
   * 
   * Matches Rails implementation in jarek-va/app/controllers/telegram_controller.rb (lines 12-48)
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @returns Promise that resolves when the response is sent
   */
  async webhook(req: Request, res: Response): Promise<void> {
    let update: TelegramUpdate;

    try {
      // Parse request body as TelegramUpdate
      // Express automatically parses JSON when Content-Type is application/json
      // Express automatically parses form-encoded when Content-Type is application/x-www-form-urlencoded
      // Both populate req.body, so we can use it directly
      // Get update from request body (Express middleware has already parsed it)
      // For JSON: req.body contains parsed JSON
      // For form-encoded: req.body contains parsed form data
      const bodyData = req.body || {};

      // Remove framework-specific parameters (similar to Rails update.except(:controller, :action, :format, :telegram))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { controller, action, format, telegram, ...updateData } = bodyData as any;

      // Convert to TelegramUpdate type
      update = updateData as TelegramUpdate;

      // Log the received Telegram update (equivalent to Rails.logger.info("Received Telegram update: #{update.inspect}"))
      logger.info(
        {
          update: JSON.stringify(update),
        },
        'Received Telegram update',
      );

      // Execute async handler to process update asynchronously
      // This is equivalent to Rails TelegramMessageJob.perform_later(update.to_json)
      // We call execute() which starts the async processing but don't await it
      // This allows us to return 200 OK immediately to Telegram
      this.telegramMessageHandler.execute(update).catch((error) => {
        // Log handler execution errors (these are separate from webhook errors)
        logger.error(
          {
            err: error instanceof Error ? error : new Error(String(error)),
          },
          'Error in async handler execution',
        );
      });

      // Return 200 OK immediately to Telegram (before handler processing completes)
      // This prevents Telegram from retrying the webhook
      res.status(200).send('OK');
    } catch (error) {
      // Comprehensive error handling (equivalent to Rails rescue StandardError)
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack =
        error instanceof Error ? error.stack : undefined;

      // Log error message and stack trace (equivalent to Rails error logging)
      logger.error(
        {
          err: error instanceof Error ? error : new Error(String(error)),
        },
        `Error handling Telegram webhook: ${errorMessage}`,
      );

      if (errorStack) {
        logger.error(
          {
            stack: errorStack,
          },
          'Error stack trace',
        );
      }

      // Try to send error message if we have chat info
      // Convert update to plain object if needed (handle both object and plain types)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateHash: any = update || {};
      const [chatId, messageId] = this.extractChatInfoFromUpdate(updateHash);

      if (chatId !== null) {
        try {
          // Send error message to user via TelegramService
          // Use parse_mode: 'HTML' and reply_to_message_id if available
          await this.telegramService.sendMessage(
            chatId,
            `Sorry, I encountered an error processing your message: ${errorMessage}`,
            'HTML',
            messageId || undefined,
          );
        } catch (sendError) {
          // Log errors from sending error message (but don't re-raise)
          logger.error(
            {
              err:
                sendError instanceof Error
                  ? sendError
                  : new Error(String(sendError)),
            },
            'Error sending error message',
          );
        }
      }

      // Always return 200 OK even on error (to prevent Telegram from retrying)
      res.status(200).send('OK');
    }
  }

  /**
   * Endpoint to set webhook (for setup/management)
   * 
   * Sets the Telegram webhook URL and optional secret token.
   * Requires admin authentication.
   * 
   * Implementation will be added in PHASE2-058
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @returns Promise that resolves when the response is sent
   */
  async setWebhook(_req: Request, _res: Response): Promise<void> {
    // Implementation will be added in PHASE2-058
    // - Check admin authentication
    // - Get webhook URL from params or use default
    // - Get secret token from params or config
    // - Call TelegramService.setWebhook
    // - Return JSON with { ok: true/false, ... } format
    throw new Error('Not implemented: setWebhook method implementation in PHASE2-058');
  }

  /**
   * Endpoint to get webhook info
   * 
   * Gets information about the current webhook configuration.
   * Requires admin authentication.
   * 
   * Implementation will be added in PHASE2-059
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @returns Promise that resolves when the response is sent
   */
  async getWebhookInfo(_req: Request, _res: Response): Promise<void> {
    // Implementation will be added in PHASE2-059
    // - Check admin authentication
    // - Call TelegramService.getWebhookInfo
    // - Return JSON with { ok: true/false, webhook_info: ... } format
    throw new Error('Not implemented: getWebhookInfo method implementation in PHASE2-059');
  }

  /**
   * Endpoint to delete webhook
   * 
   * Deletes the current webhook configuration.
   * Requires admin authentication.
   * 
   * Implementation will be added in PHASE2-060
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @returns Promise that resolves when the response is sent
   */
  async deleteWebhook(_req: Request, _res: Response): Promise<void> {
    // Implementation will be added in PHASE2-060
    // - Check admin authentication
    // - Call TelegramService.deleteWebhook
    // - Return JSON with { ok: true/false, message: ... } format
    throw new Error('Not implemented: deleteWebhook method implementation in PHASE2-060');
  }

  /**
   * Authenticates admin requests
   * 
   * Checks X-Admin-Secret header or admin_secret query/body param
   * against the expected WEBHOOK_SECRET configuration.
   * 
   * Implementation will be added in PHASE2-061
   * 
   * @param req - Express request object
   * @returns true if authenticated, false otherwise
   */
  protected authenticateAdmin(_req: Request): boolean {
    // Implementation will be added in PHASE2-061
    // - Check X-Admin-Secret header or admin_secret query/body param
    // - Compare against WEBHOOK_SECRET environment variable
    // - Return true if authenticated, false otherwise
    return false;
  }

  /**
   * Gets the default webhook URL from configuration
   * 
   * Uses TELEGRAM_WEBHOOK_BASE_URL environment variable or config value,
   * appends /telegram/webhook path.
   * 
   * @returns Default webhook URL string
   */
  protected defaultWebhookUrl(): string {
    const baseUrl =
      process.env.TELEGRAM_WEBHOOK_BASE_URL || 'http://localhost:3000';
    return `${baseUrl}/telegram/webhook`;
  }

  /**
   * Extracts chat info from Telegram update
   * 
   * Helper method for error handling - extracts chat_id and message_id
   * from update. Handles three update types: message, edited_message, and callback_query.
   * 
   * Basic implementation for error handling in webhook method.
   * Full implementation will be added in PHASE2-063.
   * 
   * @param update - Telegram update object
   * @returns Tuple of [chat_id, message_id] or [null, null] if not found
   */
  protected extractChatInfoFromUpdate(
    update: TelegramUpdate
  ): [number | null, number | null] {
    // Handle message update type
    if (update.message) {
      return [
        update.message.chat?.id || null,
        update.message.message_id || null,
      ];
    }

    // Handle edited_message update type
    if (update.edited_message) {
      return [
        update.edited_message.chat?.id || null,
        update.edited_message.message_id || null,
      ];
    }

    // Handle callback_query update type (extract from nested message)
    if (update.callback_query?.message) {
      return [
        update.callback_query.message.chat?.id || null,
        update.callback_query.message.message_id || null,
      ];
    }

    // Return [null, null] if not found
    return [null, null];
  }
}

export default TelegramController;
