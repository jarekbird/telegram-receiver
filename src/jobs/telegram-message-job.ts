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
import { TelegramUpdate, TelegramMessage, TelegramCallbackQuery } from '../types/telegram';
import TelegramService from '../services/telegram-service';
import CursorRunnerService, { CursorRunnerServiceError } from '../services/cursorRunnerService';
import CursorRunnerCallbackService from '../services/cursor-runner-callback-service';
import ElevenLabsSpeechToTextService from '../services/elevenlabs-speech-to-text-service';
import ElevenLabsTextToSpeechService from '../services/elevenlabs-text-to-speech-service';
import SystemSetting from '../models/system-setting';
import logger from '../utils/logger';
import { extractChatInfoFromUpdate } from '../utils/extractChatInfoFromUpdate';
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
        await this.handleCallbackQuery(update.callback_query);
      } else {
        logger.info({ updateKeys: Object.keys(update) }, 'Unhandled update type');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error && error.stack ? error.stack : '';
      
      logger.error(`Error in TelegramMessageHandler: ${errorMessage}`);
      logger.error(errorStack);

      // Try to send error message if we have chat info
      // Use extractChatInfoFromUpdate helper (PHASE2-063)
      const [chatId, messageId] = extractChatInfoFromUpdate(update);
      
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
   * PHASE2-086: Added comprehensive error handling wrapper around entire method
   * (Rails has NO overall try-catch wrapper, only for transcription)
   * 
   * @param message - Telegram message object
   */
  private async handleMessage(message: TelegramMessage): Promise<void> {
    // Extract message data for error handling
    const chatId = message.chat?.id;
    const messageId = message.message_id;

    try {
      const text = message.text;
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
          // Handle transcription exceptions (preserve existing error handling from Rails lines 90-104)
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
      // PHASE2-086: Added error handling for forwardToCursorRunner call (not handled in Rails)
      let forwarded = false;
      try {
        forwarded = await this.forwardToCursorRunner(message, chatId, messageId, originalWasAudio);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error && error.stack ? error.stack : '';
        
        logger.error(`Error forwarding to cursor-runner: ${errorMessage}`);
        logger.error(errorStack);
        
        // Send error message to user
        if (chatId) {
          try {
            await this.telegramService.sendMessage(
              chatId,
              `Sorry, I encountered an error forwarding your message: ${errorMessage}`,
              'HTML',
              messageId
            );
          } catch (sendError) {
            const sendErrorObj = sendError instanceof Error ? sendError : new Error(String(sendError));
            logger.error(`Error sending error message: ${sendErrorObj.message}`);
          }
        }
        // Re-throw error so it can be caught at handle() level for job tracking
        throw error;
      }

    // Only handle locally if not forwarded to cursor-runner
    // Local commands like /start, /help, /status are handled here
    if (forwarded) {
      return;
    }

    // Process local commands
      // PHASE2-086: Added error handling for processLocalMessage call (not handled in Rails)
      let result: ProcessLocalMessageResult;
      try {
        result = this.processLocalMessage(message.text, chatId, messageId);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error && error.stack ? error.stack : '';
        
        logger.error(`Error processing local message: ${errorMessage}`);
        logger.error(errorStack);
        
        // Send error message to user
        if (chatId) {
          try {
            await this.telegramService.sendMessage(
              chatId,
              `Sorry, I encountered an error processing your command: ${errorMessage}`,
              'HTML',
              messageId
            );
          } catch (sendError) {
            const sendErrorObj = sendError instanceof Error ? sendError : new Error(String(sendError));
            logger.error(`Error sending error message: ${sendErrorObj.message}`);
          }
        }
        return;
      }

    // Send response back to Telegram
    if (!result.say || !chatId) {
      return;
    }

      // PHASE2-086: Added error handling for sending responses (not handled in Rails)
      try {
    // If original message was audio, respond with audio (unless audio output is disabled)
    if (originalWasAudio && !SystemSetting.disabled('allow_audio_output')) {
          // PHASE2-086: Added error handling for sendTextAsAudio call (not handled in Rails)
          try {
      await this.sendTextAsAudio(chatId, result.say, messageId);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorStack = error instanceof Error && error.stack ? error.stack : '';
            
            logger.error(`Error sending text as audio: ${errorMessage}`);
            logger.error(errorStack);
            
            // Fallback to text message
            await this.telegramService.sendMessage(
              chatId,
              result.say,
              'HTML',
              messageId
            );
          }
    } else {
      await this.telegramService.sendMessage(
        chatId,
        result.say,
        'HTML',
        messageId
      );
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error && error.stack ? error.stack : '';
        
        logger.error(`Error sending response to Telegram: ${errorMessage}`);
        logger.error(errorStack);
        
        // Don't send another error message to avoid spam
        // The error is already logged for debugging
      }
    } catch (error) {
      // Overall error handling wrapper (Rails has NO overall try-catch wrapper)
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error && error.stack ? error.stack : '';
      
      logger.error(`Error in handleMessage: ${errorMessage}`);
      logger.error(errorStack);
      
      // Send error message to Telegram user
      if (chatId) {
        try {
          await this.telegramService.sendMessage(
            chatId,
            `Sorry, I encountered an error processing your message: ${errorMessage}`,
            'HTML',
            messageId
          );
        } catch (sendError) {
          const sendErrorObj = sendError instanceof Error ? sendError : new Error(String(sendError));
          logger.error(`Error sending error message: ${sendErrorObj.message}`);
        }
      }
      
      // Re-throw to allow caller to handle if needed
      throw error;
    }
  }

  /**
   * Handle callback query from inline keyboard button
   * 
   * Reference: jarek-va/app/jobs/telegram_message_job.rb (lines 135-171)
   * 
   * PHASE2-086: Added comprehensive error handling wrapper around entire method
   * (Rails has NO overall try-catch wrapper, only for answering callback query)
   * 
   * @param callbackQuery - Telegram callback query object
   */
  private async handleCallbackQuery(callbackQuery: TelegramCallbackQuery): Promise<void> {
    // Extract callback query data for error handling
    const message = callbackQuery.message;
    const chatId = message?.chat?.id;
    const messageId = message?.message_id;
    const data = callbackQuery.data;

    try {
      logger.info({ data }, 'Received callback query');

      // Answer the callback query with "Processing..." status
      // PHASE2-086: Preserve existing error handling for answerCallbackQuery (Rails lines 142-149)
      try {
        await this.telegramService.answerCallbackQuery(
          callbackQuery.id,
          'Processing...'
        );
      } catch (error) {
        // Log error but don't fail the entire method (matching Rails behavior)
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`Error answering callback query: ${errorMessage}`);
      }

      // Validate that message and message.chat exist (return early if not)
      if (!message || !message.chat) {
        return;
      }

      // PHASE2-086: Add error handling for forwardToCursorRunner call (not handled in Rails, line 158)
      let forwarded = false;
      try {
        // Create a message-like object with callback data as text
        const messageObject: TelegramMessage = {
          text: data,
          message_id: messageId!,
          chat: message.chat,
        };

        // Forward callback data to cursor-runner as a prompt
        forwarded = await this.forwardToCursorRunner(messageObject, chatId!, messageId!, false);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error && error.stack ? error.stack : '';
        
        logger.error(`Error forwarding callback query to cursor-runner: ${errorMessage}`);
        logger.error(errorStack);
        
        // Send error message to user
        if (chatId) {
          try {
            await this.telegramService.sendMessage(
              chatId,
              `Sorry, I encountered an error processing your callback: ${errorMessage}`,
              'HTML',
              messageId
            );
          } catch (sendError) {
            const sendErrorObj = sendError instanceof Error ? sendError : new Error(String(sendError));
            logger.error(`Error sending error message: ${sendErrorObj.message}`);
          }
        }
        return;
      }

      // If not forwarded, send a simple response
      if (forwarded) {
        return;
      }

      // PHASE2-086: Add error handling for TelegramService.sendMessage call (not handled in Rails, line 167)
      try {
        await this.telegramService.sendMessage(
          chatId!,
          `You selected: ${data}`,
          'HTML'
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error && error.stack ? error.stack : '';
        
        logger.error(`Error sending callback query response: ${errorMessage}`);
        logger.error(errorStack);
        
        // Don't send another error message to avoid spam
        // The error is already logged for debugging
      }
    } catch (error) {
      // Overall error handling wrapper (Rails has NO overall try-catch wrapper)
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error && error.stack ? error.stack : '';
      
      logger.error(`Error in handleCallbackQuery: ${errorMessage}`);
      logger.error(errorStack);
      
      // Send error message to Telegram user
      if (chatId) {
        try {
          await this.telegramService.sendMessage(
            chatId,
            `Sorry, I encountered an error processing your callback: ${errorMessage}`,
            'HTML',
            messageId
          );
        } catch (sendError) {
          const sendErrorObj = sendError instanceof Error ? sendError : new Error(String(sendError));
          logger.error(`Error sending error message: ${sendErrorObj.message}`);
        }
      }
      
      // Re-throw to allow caller to handle if needed
      throw error;
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
      // PHASE2-086: Error handling for CursorRunnerService errors (matching Rails lines 235-251)
      // Only catch CursorRunnerServiceError - let other errors propagate
      if (error instanceof CursorRunnerServiceError) {
        const errorMessage = error.message;
        
        // Log error appropriately (Rails uses logger.warn for CursorRunnerService::Error)
        logger.warn(`Failed to send Telegram message to cursor-runner: ${errorMessage}`);
        
        // Clean up pending request in Redis on error
        try {
          this.callbackService.removePendingRequest(requestId);
        } catch (cleanupError) {
          // Ignore cleanup errors (already logged in removePendingRequest)
          logger.warn(`Error cleaning up pending request: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`);
        }
        
        // Send error message to Telegram user
        if (chatId) {
          try {
            await this.telegramService.sendMessage(
              chatId,
              `❌ Error: Failed to execute cursor command. ${errorMessage}`,
              'HTML',
              messageId
            );
          } catch (sendError) {
            // Log error when sending error message fails
            const sendErrorObj = sendError instanceof Error ? sendError : new Error(String(sendError));
            logger.error(`Error sending error message to Telegram: ${sendErrorObj.message}`);
          }
        }
        
        // Return true even on error to prevent duplicate processing (matching Rails line 251)
        return true;
      } else {
        // Re-throw non-CursorRunnerServiceError errors so they can be handled at a higher level
        throw error;
      }
    }
  }

  /**
   * Process local message (commands like /start, /help, /status)
   * 
   * Reference: jarek-va/app/jobs/telegram_message_job.rb (lines 253-277)
   * 
   * PHASE2-086: Added comprehensive error handling (Rails has NO error handling for this method)
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
    try {
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
    } catch (error) {
      // PHASE2-086: Error handling for command parsing logic (Rails has NO error handling)
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error && error.stack ? error.stack : '';
      
      logger.error(`Error in processLocalMessage: ${errorMessage}`);
      logger.error(errorStack);
      
      // Return error response object (don't crash the job)
      return {
        ok: false,
        say: `Sorry, I encountered an error processing your command: ${errorMessage}`
      };
    }
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

}

export default TelegramMessageHandler;
