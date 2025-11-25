/**
 * TelegramMessageJob - Handler for processing Telegram messages asynchronously
 * 
 * This handler processes incoming Telegram updates, handles audio transcription,
 * forwards messages to cursor-runner, and processes local commands.
 * 
 * Reference: jarek-va/app/jobs/telegram_message_job.rb
 * 
 * PHASE2-079: Implement handle_message method
 */

import { BaseAsyncHandler } from '../handlers/base-async-handler';
import { TelegramUpdate, TelegramMessage } from '../types/telegram';
import TelegramService from '../services/telegram-service';
import CursorRunnerService, { CursorRunnerServiceError } from '../services/cursorRunnerService';
import CursorRunnerCallbackService from '../services/cursor-runner-callback-service';
import ElevenLabsSpeechToTextService from '../services/elevenlabs-speech-to-text-service';
import ElevenLabsTextToSpeechService from '../services/elevenlabs-text-to-speech-service';
import SystemSetting from '../models/system-setting';
import logger from '../utils/logger';
import { randomBytes } from 'crypto';
import { promises as fs } from 'fs';

/**
 * Result interface for processLocalMessage
 */
interface ProcessLocalMessageResult {
  ok: boolean;
  say: string;
}

/**
 * TelegramMessageHandler class
 * Processes Telegram updates asynchronously
 */
class TelegramMessageHandler extends BaseAsyncHandler<TelegramUpdate, void> {
  private telegramService: TelegramService;
  private cursorRunnerService: CursorRunnerService;
  private callbackService: CursorRunnerCallbackService;

  constructor() {
    super();
    this.telegramService = new TelegramService();
    this.cursorRunnerService = new CursorRunnerService();
    this.callbackService = new CursorRunnerCallbackService();
  }

  /**
   * Get handler name for logging
   */
  protected getHandlerName(): string {
    return 'telegram-message';
  }

  /**
   * Handle Telegram update
   * Processes different update types (message, edited_message, callback_query)
   * 
   * Reference: jarek-va/app/jobs/telegram_message_job.rb (lines 14-51)
   */
  async handle(update: TelegramUpdate): Promise<void> {
    logger.info({ update: JSON.stringify(update) }, 'TelegramMessageHandler processing update');

    try {
      // Handle different update types
      if (update.message) {
        await this.handleMessage(update.message);
      } else if (update.edited_message) {
        await this.handleMessage(update.edited_message);
      } else if (update.callback_query) {
        // handle_callback_query will be implemented in a future task
        logger.info({ callbackQuery: update.callback_query }, 'Unhandled update type: callback_query');
      } else {
        logger.info({ updateKeys: Object.keys(update) }, 'Unhandled update type');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error && error.stack ? error.stack : '';
      
      logger.error(`Error in TelegramMessageHandler: ${errorMessage}`);
      logger.error(errorStack);

      // Try to send error message if we have chat info
      const chatId = this.extractChatIdFromUpdate(update);
      const messageId = this.extractMessageIdFromUpdate(update);
      
      if (chatId !== null) {
        try {
          await this.telegramService.sendMessage(
            chatId,
            `Sorry, I encountered an error processing your message: ${errorMessage}`,
            'HTML',
            messageId || undefined
          );
        } catch (sendError) {
          const sendErrorObj = sendError instanceof Error ? sendError : new Error(String(sendError));
          logger.error(`Error sending error message: ${sendErrorObj.message}`);
        }
      }
      
      // Re-raise to mark handler as failed
      throw error;
    }
  }

  /**
   * Handle incoming Telegram message
   * Processes messages, handles audio transcription, forwards to cursor-runner, and processes local commands
   * 
   * Reference: jarek-va/app/jobs/telegram_message_job.rb (lines 59-133)
   * 
   * @param message - Telegram message object
   */
  private async handleMessage(message: TelegramMessage): Promise<void> {
    // Extract message data
    const chatId = message.chat?.id;
    const text = message.text;
    const messageId = message.message_id;

    logger.info({ chatId, text }, 'Processing Telegram message from chat');

    // Track if original message was audio/voice BEFORE checking for audio
    // This flag determines response format
    const originalWasAudio = this.extractAudioFileId(message) !== null;

    // Check if message contains audio/voice
    const audioFileId = this.extractAudioFileId(message);
    if (audioFileId !== null) {
      logger.info('Audio/voice message detected, transcribing...');
      
      try {
        const transcribedText = await this.transcribeAudio(audioFileId, chatId, messageId);
        
        if (!transcribedText || transcribedText.trim() === '') {
          // Empty/falsy transcription result
          if (chatId) {
            await this.telegramService.sendMessage(
              chatId,
              "❌ Sorry, I couldn't transcribe the audio message. Please try again or send a text message.",
              'HTML',
              messageId
            );
          }
          return;
        }

        // Replace text with transcribed text and continue processing
        // Create a copy of message object to avoid mutation issues
        const messageCopy = { ...message };
        messageCopy.text = transcribedText;
        
        // Update the message reference for further processing
        Object.assign(message, messageCopy);
        
        logger.info({ transcribedText: transcribedText.substring(0, 50) }, 'Transcribed audio to text');
      } catch (error) {
        // Handle transcription exceptions
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error && error.stack ? error.stack : '';
        
        logger.error(`Error transcribing audio: ${errorMessage}`);
        logger.error(errorStack);
        
        // Truncate error message to 4000 characters (to leave room for prefix text, Telegram limit is 4096)
        const maxLength = 4000;
        const truncatedError = errorMessage.length > maxLength 
          ? `${errorMessage.substring(0, maxLength)}...` 
          : errorMessage;
        
        if (chatId) {
          await this.telegramService.sendMessage(
            chatId,
            `❌ Error transcribing audio: ${truncatedError}. Please try again or send a text message.`,
            'HTML',
            messageId
          );
        }
        return;
      }
    }

    // Try to forward to cursor-runner first
    // Returns true if message was forwarded, false otherwise
    // Pass original_was_audio flag so callback can respond with audio
    const forwarded = await this.forwardToCursorRunner(message, chatId, messageId, originalWasAudio);

    // Only handle locally if not forwarded to cursor-runner
    // Local commands like /start, /help, /status are handled here
    if (forwarded) {
      return;
    }

    // Process local commands
    const result = this.processLocalMessage(message.text, chatId, messageId);

    // Send response back to Telegram
    if (!result.say || !chatId) {
      return;
    }

    // If original message was audio, respond with audio (unless audio output is disabled)
    if (originalWasAudio && !SystemSetting.disabled('allow_audio_output')) {
      await this.sendTextAsAudio(chatId, result.say, messageId);
    } else {
      await this.telegramService.sendMessage(
        chatId,
        result.say,
        'HTML',
        messageId
      );
    }
  }

  /**
   * Extract audio file ID from message (supports voice, audio, and document)
   * 
   * Reference: jarek-va/app/jobs/telegram_message_job.rb (lines 297-312)
   * 
   * @param message - Telegram message object
   * @returns File ID if audio detected, null otherwise
   */
  private extractAudioFileId(message: TelegramMessage): string | null {
    // Check for voice message (most common for speech)
    if (message.voice?.file_id) {
      return message.voice.file_id;
    }

    // Check for audio file
    if (message.audio?.file_id) {
      return message.audio.file_id;
    }

    // Check for document (could be audio file)
    if (message.document?.file_id && message.document.mime_type?.startsWith('audio/')) {
      return message.document.file_id;
    }

    return null;
  }

  /**
   * Transcribe audio file using ElevenLabs
   * 
   * Reference: jarek-va/app/jobs/telegram_message_job.rb (lines 314-352)
   * 
   * @param fileId - Telegram file ID
   * @param chatId - Chat ID for status messages
   * @param messageId - Message ID for status messages
   * @returns Transcribed text, or empty string on failure
   */
  private async transcribeAudio(
    fileId: string,
    chatId: number | undefined,
    messageId: number
  ): Promise<string> {
    // Send processing message only if cursor debug is enabled
    if (this.cursorDebugEnabled() && chatId) {
      try {
        await this.telegramService.sendMessage(
          chatId,
          '🎤 Transcribing audio...',
          'HTML',
          messageId
        );
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        logger.warn(`Could not send transcription status message: ${errorObj.message}`);
      }
    }

    // Download audio file
    let audioPath: string | null = null;
    try {
      audioPath = await this.telegramService.downloadFile(fileId);
      if (!audioPath) {
        throw new Error('Failed to download audio file');
      }

      logger.info({ audioPath }, 'Downloaded audio file');

      // Transcribe using ElevenLabs
      const speechToTextService = new ElevenLabsSpeechToTextService();
      const transcribedText = await speechToTextService.transcribe(audioPath);

      return transcribedText;
    } finally {
      // Clean up downloaded file
      if (audioPath) {
        try {
          await fs.access(audioPath);
          await fs.unlink(audioPath);
          logger.info({ audioPath }, 'Cleaned up audio file');
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
   * Forward message to cursor-runner
   * 
   * Reference: jarek-va/app/jobs/telegram_message_job.rb (lines 173-251)
   * 
   * @param message - Telegram message object
   * @param chatId - Chat ID
   * @param messageId - Message ID
   * @param originalWasAudio - Whether original message was audio
   * @returns true if message was forwarded, false otherwise
   */
  private async forwardToCursorRunner(
    message: TelegramMessage,
    chatId: number | undefined,
    messageId: number,
    originalWasAudio: boolean = false
  ): Promise<boolean> {
    // Extract message text
    const messageText = message.text;
    if (!messageText || messageText.trim() === '') {
      return false;
    }

    // Skip commands that are handled locally (like /start, /help, /status)
    const localCommandPattern = /^\/(start|help|status)/i;
    if (localCommandPattern.test(messageText)) {
      logger.debug({ messageText }, 'Skipping forward: local command detected');
      return false;
    }

    if (!chatId) {
      return false;
    }

    // Generate unique request ID
    const timestamp = Math.floor(Date.now() / 1000);
    const randomHex = randomBytes(4).toString('hex');
    const requestId = `telegram-${timestamp}-${randomHex}`;

    // Store pending request in Redis for callback processing
    try {
      this.callbackService.storePendingRequest(
        requestId,
        {
          chat_id: chatId,
          message_id: messageId,
          prompt: messageText,
          original_was_audio: originalWasAudio,
          created_at: new Date().toISOString(),
        },
        3600 // 1 hour TTL
      );

      // Pass blank repository value for Telegram messages
      const repository = '';

      // Send message text directly as prompt to cursor-runner
      // cursor-runner will auto-construct the callback URL using Docker network and call it when complete
      await this.cursorRunnerService.iterate({
        repository: repository,
        branchName: 'main',
        prompt: messageText,
        maxIterations: 25,
        requestId: requestId,
        // callback_url is now optional - cursor-runner will auto-construct it from environment
      });

      logger.info({
        requestId,
        repository,
        prompt: messageText.substring(0, 50),
      }, 'Sent Telegram message to cursor-runner iterate (async)');

      // Send immediate acknowledgment to user only if CURSOR_DEBUG is enabled
      if (this.cursorDebugEnabled() && chatId) {
        await this.telegramService.sendMessage(
          chatId,
          "⏳ Processing your request... I'll send the results when complete.",
          'HTML',
          messageId
        );
      }

      return true; // Return true to indicate message was forwarded
    } catch (error) {
      // Log error and send error message to Telegram
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.warn(`Failed to send Telegram message to cursor-runner: ${errorMessage}`);
      
      // Clean up pending request if it was created
      try {
        this.callbackService.removePendingRequest(requestId);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      
      if (chatId) {
        try {
          await this.telegramService.sendMessage(
            chatId,
            `❌ Error: Failed to execute cursor command. ${errorMessage}`,
            'HTML',
            messageId
          );
        } catch (sendError) {
          // Ignore send errors
        }
      }
      
      // Return true even on error to prevent duplicate processing
      return true;
    }
  }

  /**
   * Process local message (commands like /start, /help, /status)
   * 
   * Reference: jarek-va/app/jobs/telegram_message_job.rb (lines 253-277)
   * 
   * @param text - Message text
   * @param chatId - Chat ID
   * @param messageId - Message ID
   * @returns Result object with ok and say properties
   */
  private processLocalMessage(
    text: string | undefined,
    chatId: number | undefined,
    messageId: number
  ): ProcessLocalMessageResult {
    // Simple command parsing
    const normalizedText = text?.toLowerCase().trim() || '';
    
    if (/^\/start/.test(normalizedText) || /^\/help/.test(normalizedText)) {
      return {
        ok: true,
        say: "Hello! I'm your Virtual Assistant. Send me a message and I'll help you out.\n\n" +
             "Available commands:\n/help - Show this message\n/status - Check my status"
      };
    }
    
    if (/^\/status/.test(normalizedText)) {
      return {
        ok: true,
        say: "✅ I'm online and ready to help!"
      };
    }
    
    // For other messages, return a default response
    return {
      ok: true,
      say: `I received your message: ${text}\n\n` +
           "I'm still learning how to process messages. More features coming soon!"
    };
  }

  /**
   * Convert text to speech and send as voice message
   * 
   * Reference: jarek-va/app/jobs/telegram_message_job.rb (lines 354-389)
   * 
   * @param chatId - Chat ID
   * @param text - Text to convert to speech
   * @param messageId - Message ID to reply to
   */
  private async sendTextAsAudio(
    chatId: number,
    text: string,
    messageId: number
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
        'HTML',
        messageId
      );
    } finally {
      // Clean up generated audio file
      if (audioPath) {
        try {
          await fs.access(audioPath);
          await fs.unlink(audioPath);
          logger.info({ audioPath }, 'Cleaned up audio file');
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
   * Check if cursor debug is enabled
   * 
   * @returns true if debug mode is enabled, false otherwise
   */
  private cursorDebugEnabled(): boolean {
    return SystemSetting.enabled('debug');
  }

  /**
   * Extract chat ID from update
   * 
   * @param update - Telegram update
   * @returns Chat ID or null
   */
  private extractChatIdFromUpdate(update: TelegramUpdate): number | null {
    if (update.message?.chat?.id) {
      return update.message.chat.id;
    }
    if (update.edited_message?.chat?.id) {
      return update.edited_message.chat.id;
    }
    if (update.callback_query?.message?.chat?.id) {
      return update.callback_query.message.chat.id;
    }
    return null;
  }

  /**
   * Extract message ID from update
   * 
   * @param update - Telegram update
   * @returns Message ID or null
   */
  private extractMessageIdFromUpdate(update: TelegramUpdate): number | null {
    if (update.message?.message_id) {
      return update.message.message_id;
    }
    if (update.edited_message?.message_id) {
      return update.edited_message.message_id;
    }
    if (update.callback_query?.message?.message_id) {
      return update.callback_query.message.message_id;
    }
    return null;
  }
}

export default TelegramMessageHandler;
