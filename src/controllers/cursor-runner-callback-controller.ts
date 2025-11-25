import { Request, Response, NextFunction } from 'express';
import { promises as fs } from 'fs';
import CursorRunnerCallbackService, { PendingRequestData } from '../services/cursor-runner-callback-service';
import TelegramService from '../services/telegram-service';
import ElevenLabsTextToSpeechService from '../services/elevenlabs-text-to-speech-service';
import SystemSetting from '../models/system-setting';
import { CursorCallbackPayload } from '../types/cursor-runner';
import logger from '../utils/logger';

/**
 * Normalized callback result interface
 * Result after normalizing camelCase/snake_case keys
 */
interface NormalizedCallbackResult {
  success: boolean;
  request_id: string;
  repository?: string;
  branch_name?: string;
  iterations: number;
  max_iterations: number;
  output: string;
  error?: string;
  exit_code: number;
  duration?: string;
  timestamp?: string;
}

/**
 * CursorRunnerCallbackController class (PHASE2-065)
 * 
 * Controller for handling webhook callbacks from cursor-runner.
 * This controller receives POST requests at `/cursor-runner/callback` when
 * cursor-runner completes an iterate operation. It processes the callback
 * results, retrieves pending request data from Redis, and sends formatted
 * responses back to Telegram.
 * 
 * Reference: jarek-va/app/controllers/cursor_runner_callback_controller.rb
 * 
 * Key features:
 * - Handles POST `/cursor-runner/callback` endpoint
 * - Authenticates webhook requests using X-Webhook-Secret header
 * - Processes callback results from cursor-runner
 * - Retrieves pending request data from Redis via CursorRunnerCallbackService
 * - Formats and sends responses to Telegram via TelegramService
 * - Supports audio responses via ElevenLabsTextToSpeechService
 * - Handles error cases and sends error notifications
 */
class CursorRunnerCallbackController {
  private callbackService: CursorRunnerCallbackService;
  private telegramService: TelegramService;
  private textToSpeechService: ElevenLabsTextToSpeechService;

  /**
   * Creates a new CursorRunnerCallbackController instance
   * 
   * @param callbackService - CursorRunnerCallbackService instance for Redis state management
   * @param telegramService - TelegramService instance for sending messages to Telegram
   * @param textToSpeechService - ElevenLabsTextToSpeechService instance for audio responses
   */
  constructor(
    callbackService?: CursorRunnerCallbackService,
    telegramService?: TelegramService,
    textToSpeechService?: ElevenLabsTextToSpeechService
  ) {
    this.callbackService = callbackService || new CursorRunnerCallbackService();
    this.telegramService = telegramService || new TelegramService();
    this.textToSpeechService = textToSpeechService || new ElevenLabsTextToSpeechService();
  }

  /**
   * POST /cursor-runner/callback
   * Receives callback from cursor-runner when iterate operation completes
   * 
   * Matches Rails implementation in jarek-va/app/controllers/cursor_runner_callback_controller.rb (lines 10-58)
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @returns Promise that resolves when the response is sent
   */
  async create(req: Request, res: Response): Promise<void> {
    let pendingData: PendingRequestData | null = null;

    try {
      // Extract callback parameters from request body
      // Express automatically parses JSON when Content-Type is application/json
      const result = req.body as CursorCallbackPayload;

      // Normalize request_id (handle both camelCase and snake_case)
      const requestId = result.requestId || result.request_id;

      if (!requestId || requestId.trim() === '') {
        logger.warn('Callback received without request_id');
        res.status(400).json({ error: 'request_id is required' });
        return;
      }

      logger.info(
        `Received cursor-runner callback (request_id: ${requestId}, success: ${result.success})`
      );

      // Retrieve pending request data from Redis
      try {
        pendingData = await this.callbackService.getPendingRequest(requestId);
      } catch (error) {
        // Handle invalid request_id format (ArgumentError equivalent)
        if (error instanceof Error && error.message.includes('Invalid request_id format')) {
          logger.warn(`Invalid request_id format: ${error.message}`);
          res.status(400).json({ error: 'Invalid request_id format' });
          return;
        }
        // Re-throw other errors
        throw error;
      }

      if (pendingData === null) {
        logger.warn(`Callback received for unknown request_id: ${requestId}`);
        // Still return 200 to cursor-runner to prevent retries
        res.status(200).json({ received: true, message: 'Request not found' });
        return;
      }

      // Process the callback synchronously in main thread
      await this.processCallback(requestId, result, pendingData);

      // Return 200 OK
      res.status(200).json({ received: true, request_id: requestId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorObj = error instanceof Error ? error : new Error(String(error));
      const stackTrace = error instanceof Error && error.stack 
        ? error.stack.split('\n').slice(0, 5).join('\n')
        : '';

      logger.error(
        `Error processing cursor-runner callback: ${errorMessage}\n${stackTrace}`
      );

      // Try to send error message to user if we have pending data
      if (pendingData) {
        await this.sendErrorNotification(pendingData, errorObj);
      }

      // Always return 200 to prevent cursor-runner from retrying
      res.status(200).json({ received: true, error: 'Internal error' });
    }
  }

  /**
   * Authenticates webhook requests
   * 
   * Checks X-Webhook-Secret header, X-Cursor-Runner-Secret header, or secret query parameter
   * against the expected WEBHOOK_SECRET configuration.
   * 
   * Matches Rails implementation in jarek-va/app/controllers/cursor_runner_callback_controller.rb (lines 77-96)
   * 
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Express next function to continue request processing
   */
  authenticateWebhook(req: Request, res: Response, next: NextFunction): void {
    // Authenticate using webhook secret
    // cursor-runner sends the secret in X-Webhook-Secret header or query param
    const secret = 
      (req.headers['x-webhook-secret'] as string) ||
      (req.headers['X-Webhook-Secret'] as string) ||
      (req.headers['x-cursor-runner-secret'] as string) ||
      (req.headers['X-Cursor-Runner-Secret'] as string) ||
      (req.query.secret as string);

    const expectedSecret = process.env.WEBHOOK_SECRET;

    // Allow if secret matches or if expected secret is not configured (development)
    const isSecretBlank = !expectedSecret || expectedSecret.trim() === '';
    
    if (secret === expectedSecret || isSecretBlank) {
      next();
      return;
    }

    const secretStatus = secret ? '[present]' : '[missing]';
    logger.warn(
      `Unauthorized cursor-runner callback - invalid secret (provided_secret: ${secretStatus}, ip: ${req.ip})`
    );
    
    res.status(401).json({ error: 'Unauthorized' });
  }

  /**
   * Processes callback result and pending data
   * 
   * Normalizes the callback result, extracts chat info, sends response to Telegram,
   * and cleans up pending request from Redis.
   * 
   * Matches Rails implementation in jarek-va/app/controllers/cursor_runner_callback_controller.rb (lines 98-149)
   * 
   * @param requestId - Request ID
   * @param result - Callback result from cursor-runner
   * @param pendingData - Pending request data from Redis
   */
  private async processCallback(
    requestId: string,
    result: CursorCallbackPayload,
    pendingData: PendingRequestData
  ): Promise<void> {
    // Placeholder implementation - will be implemented in later tasks
    logger.info(
      `Processing cursor-runner callback (request_id: ${requestId}, success: ${result.success})`
    );
    
    // Normalize result keys (handle both camelCase and snake_case)
    const normalizedResult = this.normalizeResult(result);

    // Extract chat info from pending data
    const chatId = pendingData.chat_id;
    const messageId = pendingData.message_id;
    const originalWasAudio = pendingData.original_was_audio || false;

    if (!chatId) {
      logger.warn(`Callback processed but no chat_id found (request_id: ${requestId})`);
      return;
    }

    // Send response to Telegram
    await this.sendResponseToTelegram(chatId, messageId, normalizedResult, originalWasAudio);

    // Clean up pending request
    try {
      await this.callbackService.removePendingRequest(requestId);
    } catch (error) {
      // Log but don't throw - cleanup operation, non-critical
      if (error instanceof Error && error.message.includes('Invalid request_id format')) {
        logger.warn(`Invalid request_id format when removing: ${error.message}`);
      }
      // Continue processing even if removal fails
    }
  }

  /**
   * Sends error notification to Telegram
   * 
   * Matches Rails implementation in jarek-va/app/controllers/cursor_runner_callback_controller.rb (lines 62-75)
   * 
   * @param pendingData - Pending request data containing chat info
   * @param error - Error object
   */
  private async sendErrorNotification(
    pendingData: PendingRequestData,
    error: Error
  ): Promise<void> {
    const chatId = pendingData.chat_id;
    const messageId = pendingData.message_id;
    
    if (!chatId) {
      return;
    }

    try {
      await this.telegramService.sendMessage(
        chatId,
        `❌ Error processing cursor command result: ${error.message}`,
        'HTML',
        messageId
      );
    } catch (sendError) {
      const sendErrorObj = sendError instanceof Error ? sendError : new Error(String(sendError));
      logger.error(`Error sending error message: ${sendErrorObj.message}`);
    }
  }

  /**
   * Normalizes callback result (handles camelCase/snake_case)
   * 
   * Matches Rails implementation in jarek-va/app/controllers/cursor_runner_callback_controller.rb (lines 152-178)
   * 
   * @param result - Callback result from cursor-runner
   * @returns Normalized result with consistent key names
   */
  private normalizeResult(result: CursorCallbackPayload): NormalizedCallbackResult {
    // Handle success as boolean (params may send string "false" which is truthy)
    const successValue = result.success;
    let successBool: boolean;
    
    if (successValue === true || successValue === 'true' || successValue === 1 || successValue === '1') {
      successBool = true;
    } else if (successValue === false || successValue === 'false' || successValue === 0 || successValue === '0' || successValue === null || successValue === undefined) {
      successBool = false;
    } else {
      successBool = Boolean(successValue);
    }

    return {
      success: successBool,
      request_id: result.requestId || result.request_id || '',
      repository: result.repository,
      branch_name: result.branchName || result.branch_name,
      iterations: result.iterations || 0,
      max_iterations: result.maxIterations || result.max_iterations || 25,
      output: result.output || '',
      error: result.error,
      exit_code: result.exitCode || result.exit_code || 0,
      duration: result.duration,
      timestamp: result.timestamp,
    };
  }

  /**
   * Formats and sends response to Telegram
   * 
   * Matches Rails implementation in jarek-va/app/controllers/cursor_runner_callback_controller.rb (lines 180-228)
   * 
   * @param chatId - Telegram chat ID
   * @param messageId - Telegram message ID to reply to
   * @param result - Normalized callback result
   * @param originalWasAudio - Whether the original message was audio
   */
  private async sendResponseToTelegram(
    chatId: number,
    messageId: number | undefined,
    result: NormalizedCallbackResult,
    originalWasAudio: boolean
  ): Promise<void> {
    // Placeholder implementation - will be implemented in later tasks
    logger.info(`Sending response to Telegram (chat_id: ${chatId}, success: ${result.success})`);
  }

  /**
   * Converts text to speech and sends as voice message
   * 
   * Matches Rails implementation in jarek-va/app/controllers/cursor_runner_callback_controller.rb (lines 230-265)
   * 
   * @param chatId - Telegram chat ID
   * @param text - Text to convert to speech
   * @param messageId - Telegram message ID to reply to
   */
  private async sendTextAsAudio(
    chatId: number,
    text: string,
    messageId: number | undefined
  ): Promise<void> {
    let audioPath: string | null = null;
    
    try {
      // Generate audio from text using ElevenLabs
      const textToSpeechService = new ElevenLabsTextToSpeechService();
      audioPath = await textToSpeechService.synthesize(text);

      // Send as voice message
      await this.telegramService.sendVoice(
        chatId,
        audioPath,
        messageId
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error && error.stack ? error.stack : '';
      
      logger.error(`Error converting text to speech: ${errorMessage}`);
      logger.error(errorStack);
      
      // Fallback to text message if audio generation fails
      await this.telegramService.sendMessage(
        chatId,
        text,
        'Markdown',
        messageId
      );
    } finally {
      // Clean up generated audio file
      if (audioPath) {
        try {
          // Check if file exists before attempting deletion
          await fs.access(audioPath);
          await fs.unlink(audioPath);
          logger.info(`Cleaned up audio file: ${audioPath}`);
        } catch (cleanupError: any) {
          // Only log warning if file exists but deletion failed
          // If file doesn't exist (ENOENT), that's fine - just skip logging
          if (cleanupError.code !== 'ENOENT') {
            const cleanupErrorMessage = cleanupError instanceof Error 
              ? cleanupError.message 
              : String(cleanupError);
            logger.warn(`Could not delete audio file ${audioPath}: ${cleanupErrorMessage}`);
          }
        }
      }
    }
  }

  /**
   * Checks if debug mode is enabled
   * 
   * Matches Rails implementation in jarek-va/app/controllers/cursor_runner_callback_controller.rb (lines 267-269)
   * 
   * @returns true if debug mode is enabled, false otherwise
   */
  private cursorDebugEnabled(): boolean {
    return SystemSetting.enabled('debug');
  }

  /**
   * Formats success response message
   * 
   * Matches Rails implementation in jarek-va/app/controllers/cursor_runner_callback_controller.rb (lines 271-277)
   * 
   * @param result - Normalized callback result
   * @param cursorDebug - Whether debug mode is enabled
   * @returns Formatted success message
   */
  private formatSuccessMessage(
    result: NormalizedCallbackResult,
    cursorDebug: boolean
  ): string {
    // Placeholder implementation - will be implemented in later tasks
    return '✅ Cursor command completed successfully';
  }

  /**
   * Formats error response message
   * 
   * Matches Rails implementation in jarek-va/app/controllers/cursor_runner_callback_controller.rb (lines 279-282)
   * 
   * @param result - Normalized callback result
   * @param cursorDebug - Whether debug mode is enabled
   * @returns Formatted error message
   */
  private formatErrorMessage(
    result: NormalizedCallbackResult,
    cursorDebug: boolean
  ): string {
    // Extract error message with fallback
    const errorText = result?.error || 'Unknown error occurred';
    
    // Clean ANSI escape sequences from error message
    const errorMsg = this.cleanAnsiEscapeSequences(errorText);
    
    // Format based on debug mode
    if (cursorDebug) {
      return `❌ Cursor command failed\n\nError: ${errorMsg}`;
    } else {
      return `❌ ${errorMsg}`;
    }
  }

  /**
   * Formats metadata (iterations, duration)
   * 
   * Matches Rails implementation in jarek-va/app/controllers/cursor_runner_callback_controller.rb (lines 284-290)
   * 
   * @param result - Normalized callback result
   * @returns Array of formatted metadata lines
   */
  private formatMetadata(result: NormalizedCallbackResult): string[] {
    // Placeholder implementation - will be implemented in later tasks
    return [];
  }

  /**
   * Formats output with truncation and code blocks
   * 
   * Matches Rails implementation in jarek-va/app/controllers/cursor_runner_callback_controller.rb (lines 292-310)
   * 
   * @param output - Output text to format
   * @param cursorDebug - Whether debug mode is enabled
   * @returns Formatted output text
   */
  private formatOutput(output: string, cursorDebug: boolean): string {
    // Placeholder implementation - will be implemented in later tasks
    return output;
  }

  /**
   * Formats warning messages
   * 
   * Matches Rails implementation in jarek-va/app/controllers/cursor_runner_callback_controller.rb (lines 312-317)
   * 
   * @param error - Error text to format as warning
   * @param cursorDebug - Whether debug mode is enabled
   * @returns Formatted warning text
   */
  private formatWarnings(error: string | undefined, cursorDebug: boolean): string {
    // Placeholder implementation - will be implemented in later tasks
    return '';
  }

  /**
   * Sends fallback error message
   * 
   * Matches Rails implementation in jarek-va/app/controllers/cursor_runner_callback_controller.rb (lines 319-327)
   * 
   * @param chatId - Telegram chat ID
   * @param messageId - Telegram message ID to reply to
   */
  private async sendErrorFallbackMessage(
    chatId: number,
    messageId: number | undefined
  ): Promise<void> {
    // Placeholder implementation - will be implemented in later tasks
    logger.info(`Sending error fallback message (chat_id: ${chatId})`);
  }

  /**
   * Removes ANSI escape codes from text
   * 
   * Matches Rails implementation in jarek-va/app/controllers/cursor_runner_callback_controller.rb (lines 330-338)
   * 
   * @param text - Text to clean
   * @returns Cleaned text without ANSI escape sequences
   */
  private cleanAnsiEscapeSequences(text: string): string {
    // Placeholder implementation - will be implemented in later tasks
    if (!text || text.trim() === '') {
      return '';
    }
    return text;
  }
}

export default CursorRunnerCallbackController;
