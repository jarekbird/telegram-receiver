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
   * Matches Rails implementation in jarek-va/app/controllers/telegram_controller.rb (lines 51-70)
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @returns Promise that resolves when the response is sent
   */
  async setWebhook(req: Request, res: Response): Promise<void> {
    try {
      // Check admin authentication (matching Rails: return head :unauthorized unless authenticate_admin)
      if (!this.authenticateAdmin(req)) {
        res.status(401).json({
          ok: false,
          error: 'Unauthorized',
        });
        return;
      }

      // Get webhook URL from params or use default (matching Rails: params[:url] || default_webhook_url)
      const webhookUrl =
        (req.body?.url as string) ||
        (req.query.url as string) ||
        this.defaultWebhookUrl();

      // Get secret_token from params or use config default
      // Rails uses: params[:secret_token] || Rails.application.config.telegram_webhook_secret
      const secretToken =
        (req.body?.secret_token as string) ||
        (req.query.secret_token as string) ||
        process.env.TELEGRAM_WEBHOOK_SECRET ||
        'changeme';

      // Call TelegramService.setWebhook (matching Rails: TelegramService.set_webhook(url: webhook_url, secret_token: secret_token))
      const result = await this.telegramService.setWebhook(
        webhookUrl,
        secretToken,
      );

      // Return JSON success response (matching Rails format)
      res.status(200).json({
        ok: true,
        message: 'Webhook set successfully',
        webhook_info: result,
      });
    } catch (error) {
      // Error handling (matching Rails rescue StandardError)
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Log error (matching Rails: Rails.logger.error("Error setting webhook: #{e.message}"))
      logger.error(
        `Error setting webhook: ${errorMessage}`,
        error instanceof Error ? error : new Error(String(error)),
      );

      // Return JSON error response (matching Rails format)
      res.status(500).json({
        ok: false,
        error: errorMessage,
      });
    }
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
   * Checks X-Admin-Secret header, HTTP_X_ADMIN_SECRET env var, or admin_secret query/body param
   * against the expected WEBHOOK_SECRET configuration.
   * 
   * Matches Rails implementation in jarek-va/app/controllers/telegram_controller.rb (lines 110-130)
   * 
   * @param req - Express request object
   * @returns true if authenticated, false otherwise
   */
  protected authenticateAdmin(req: Request): boolean {
    // Get admin secret from various sources (matching Rails implementation)
    // Rails checks: request.headers['X-Admin-Secret'] || request.env['HTTP_X_ADMIN_SECRET'] || params[:admin_secret] || params['admin_secret']
    const adminSecret =
      req.headers['x-admin-secret'] ||
      req.headers['X-Admin-Secret'] ||
      (req as any).env?.['HTTP_X_ADMIN_SECRET'] ||
      req.query.admin_secret ||
      req.body?.admin_secret;

    // Get expected secret from WEBHOOK_SECRET environment variable
    // Rails uses: Rails.application.config.webhook_secret
    const expectedSecret = process.env.WEBHOOK_SECRET || 'changeme';

    // Compare secrets (matching Rails: admin_secret == expected_secret)
    const result = adminSecret === expectedSecret;

    // Debug logging in test environment (matching Rails behavior)
    if (process.env.NODE_ENV === 'test' && !result) {
      logger.warn('Admin authentication failed', {
        adminSecret: adminSecret ? '***' : undefined,
        expectedSecret: expectedSecret ? '***' : undefined,
        hasHeader: !!req.headers['x-admin-secret'] || !!req.headers['X-Admin-Secret'],
        hasQueryParam: !!req.query.admin_secret,
        hasBodyParam: !!req.body?.admin_secret,
      });
    }

    return result;
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
