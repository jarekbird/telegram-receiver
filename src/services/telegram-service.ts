import axios, { AxiosInstance } from 'axios';
import { TelegramApiResponse, TelegramMessage, WebhookInfo } from '../types/telegram';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import FormData from 'form-data';
import logger from '@/utils/logger';

/**
 * Service for interacting with Telegram Bot API
 * 
 * This service provides methods to interact with the Telegram Bot API,
 * including sending messages, managing webhooks, sending voice messages,
 * and downloading files.
 * 
 * All methods follow a consistent error handling pattern:
 * - Early return if bot token is blank
 * - Try-catch block for error handling
 * - Log errors with message and stack trace
 * - Re-raise exceptions to allow callers to handle them
 */
class TelegramService {
  private botToken: string;
  private apiBaseUrl: string;
  private axiosInstance: AxiosInstance;

  /**
   * Creates a new TelegramService instance
   * @param botToken - Telegram bot token. If not provided, reads from TELEGRAM_BOT_TOKEN environment variable
   */
  constructor(botToken?: string) {
    this.botToken = botToken || process.env.TELEGRAM_BOT_TOKEN || '';
    this.apiBaseUrl = `https://api.telegram.org/bot${this.botToken}`;
    
    // Initialize axios instance for Telegram Bot API requests
    // Will be used in method implementations (PHASE2-019 through PHASE2-024)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    this.axiosInstance = axios.create({
      baseURL: this.apiBaseUrl,
      timeout: 30000, // 30 second timeout
    });
  }

  /**
   * Validates that the bot token is present
   * @returns true if token is present, false otherwise
   */
  private isTokenValid(): boolean {
    return this.botToken.trim().length > 0;
  }

  /**
   * Sends a text message to a Telegram chat
   * 
   * @param chatId - Chat ID to send the message to (can be number or string)
   * @param text - Message text to send
   * @param parseMode - Optional parse mode ('HTML' or 'Markdown'). Defaults to 'HTML'
   * @param replyToMessageId - Optional message ID to reply to
   * @returns Promise resolving to Telegram API response, or undefined if bot token is blank
   * 
   * @throws Error if API request fails
   */
  async sendMessage(
    chatId: number | string,
    text: string,
    parseMode: string = 'HTML',
    replyToMessageId?: number
  ): Promise<TelegramApiResponse<TelegramMessage> | undefined> {
    if (!this.isTokenValid()) {
      return undefined;
    }

    try {
      // Escape HTML entities if using HTML parse_mode to prevent parsing errors
      // with text that looks like HTML tags (e.g., "tcpsocket:(closed)")
      const escapedText = parseMode === 'HTML' 
        ? this.escapeHtmlEntities(text)
        : text;

      // Build request body
      const requestBody: {
        chat_id: number | string;
        text: string;
        parse_mode?: string;
        reply_to_message_id?: number;
      } = {
        chat_id: chatId,
        text: escapedText,
      };

      // Only include parse_mode if it's provided (Telegram API accepts null for plain text)
      if (parseMode) {
        requestBody.parse_mode = parseMode;
      }

      // Only include reply_to_message_id if provided
      if (replyToMessageId !== undefined) {
        requestBody.reply_to_message_id = replyToMessageId;
      }

      // Make POST request to Telegram Bot API sendMessage endpoint
      const response = await this.axiosInstance.post<TelegramApiResponse<TelegramMessage>>(
        '/sendMessage',
        requestBody
      );

      return response.data;
    } catch (error: any) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error('Error sending Telegram message:', errorObj);
      throw error;
    }
  }

  /**
   * Sets a webhook URL for receiving Telegram updates
   * 
   * @param url - Webhook URL to set
   * @param secretToken - Optional secret token for webhook verification
   * @returns Promise resolving to Telegram API response, or undefined if bot token is blank
   * 
   * @throws Error if API request fails
   */
  async setWebhook(url: string, secretToken?: string): Promise<TelegramApiResponse<boolean> | undefined> {
    if (!this.isTokenValid()) {
      return undefined;
    }

    try {
      // Build params object with url
      const params: {
        url: string;
        secret_token?: string;
      } = {
        url: url,
      };

      // Conditionally add secret_token to params only if provided and not empty
      if (secretToken && secretToken.trim().length > 0) {
        params.secret_token = secretToken;
      }

      // Make POST request to Telegram Bot API setWebhook endpoint
      const response = await this.axiosInstance.post<TelegramApiResponse<boolean>>(
        '/setWebhook',
        params
      );

      return response.data;
    } catch (error: any) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error('Error setting Telegram webhook:', errorObj);
      throw error;
    }
  }

  /**
   * Deletes the current webhook
   * 
   * @returns Promise resolving to Telegram API response, or undefined if bot token is blank
   * 
   * @throws Error if API request fails
   */
  async deleteWebhook(): Promise<TelegramApiResponse<boolean> | undefined> {
    if (!this.isTokenValid()) {
      return undefined;
    }

    try {
      // Make POST request to Telegram Bot API deleteWebhook endpoint
      const response = await this.axiosInstance.post<TelegramApiResponse<boolean>>(
        '/deleteWebhook',
        {}
      );

      return response.data;
    } catch (error: any) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error('Error deleting Telegram webhook:', errorObj);
      throw error;
    }
  }

  /**
   * Gets information about the current webhook
   * 
   * @returns Promise resolving to Telegram API response with webhook info, or undefined if bot token is blank
   * 
   * @throws Error if API request fails
   */
  async getWebhookInfo(): Promise<TelegramApiResponse<WebhookInfo> | undefined> {
    if (!this.isTokenValid()) {
      return undefined;
    }

    try {
      // Make GET request to Telegram Bot API getWebhookInfo endpoint
      const response = await this.axiosInstance.get<TelegramApiResponse<WebhookInfo>>(
        '/getWebhookInfo'
      );

      return response.data;
    } catch (error: any) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error('Error getting Telegram webhook info:', errorObj);
      throw error;
    }
  }

  /**
   * Sends a voice message to a Telegram chat
   * 
   * @param chatId - Chat ID to send the voice to (can be number or string)
   * @param voicePath - Path to the voice/audio file
   * @param replyToMessageId - Optional message ID to reply to
   * @param caption - Optional caption for the voice message
   * @returns Promise resolving to Telegram API response, or undefined if bot token is blank
   * 
   * @throws Error if file doesn't exist or if API request fails
   */
  async sendVoice(
    chatId: number | string,
    voicePath: string,
    replyToMessageId?: number,
    caption?: string
  ): Promise<TelegramApiResponse<TelegramMessage> | undefined> {
    if (!this.isTokenValid()) {
      return undefined;
    }

    try {
      // Validate that the voice file exists (matching Rails File.exist? pattern)
      try {
        await fs.access(voicePath);
      } catch (accessError: any) {
        if (accessError.code === 'ENOENT') {
          const fileNotFoundError = new Error('Voice file does not exist');
          logger.error('Error sending Telegram voice:', fileNotFoundError);
          throw fileNotFoundError;
        }
        throw accessError;
      }
      
      // Read file content from disk using binary read
      const fileContent = await fs.readFile(voicePath);
      
      // Extract filename from voice_path using basename
      const filename = path.basename(voicePath);
      
      // Extract file extension and convert to lowercase for case-insensitive matching
      const fileExtension = path.extname(voicePath).toLowerCase();
      
      // Determine MIME type based on file extension
      let mimeType: string;
      if (fileExtension === '.ogg' || fileExtension === '.oga') {
        mimeType = 'audio/ogg';
      } else if (fileExtension === '.wav') {
        mimeType = 'audio/wav';
      } else {
        // Default (including .mp3) → 'audio/mpeg'
        mimeType = 'audio/mpeg';
      }
      
      // Create multipart form data with file upload
      const formData = new FormData();
      formData.append('voice', fileContent, {
        filename: filename,
        contentType: mimeType,
      });
      
      // Build request parameters
      formData.append('chat_id', String(chatId));
      
      // Add optional parameters if provided
      if (replyToMessageId !== undefined) {
        formData.append('reply_to_message_id', String(replyToMessageId));
      }
      
      if (caption !== undefined && caption !== null) {
        formData.append('caption', caption);
      }
      
      // Call Telegram Bot API sendVoice endpoint
      // Use POST request with multipart/form-data content type
      const response = await this.axiosInstance.post<TelegramApiResponse<TelegramMessage>>(
        '/sendVoice',
        formData,
        {
          headers: formData.getHeaders(),
        }
      );
      
      return response.data;
    } catch (error: any) {
      // If error is already the file not found error we threw, re-throw it
      if (error.message === 'Voice file does not exist') {
        throw error;
      }
      
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error('Error sending Telegram voice:', errorObj);
      throw error;
    }
  }

  /**
   * Downloads a file from Telegram
   * 
   * @param fileId - Telegram file ID
   * @param destinationPath - Optional path to save the file. If not provided, saves to temp directory
   * @returns Promise resolving to the path of the downloaded file, or undefined if bot token is blank
   * 
   * @throws Error if download fails
   */
  async downloadFile(fileId: string, destinationPath?: string): Promise<string | undefined> {
    if (!this.isTokenValid()) {
      return undefined;
    }

    try {
      // Get file info from Telegram Bot API
      const fileInfoResponse = await this.axiosInstance.post<TelegramApiResponse<{ file_path: string }>>(
        '/getFile',
        { file_id: fileId }
      );

      // Check if API response indicates an error
      if (!fileInfoResponse.data.ok) {
        throw new Error(`Telegram API error: ${fileInfoResponse.data.description}`);
      }

      const filePath = fileInfoResponse.data.result.file_path;

      // Construct download URL
      const downloadUrl = `https://api.telegram.org/file/bot${this.botToken}/${filePath}`;

      // Determine destination path
      let finalDestinationPath: string;
      if (destinationPath === undefined) {
        // Use temp directory with original filename
        const filename = path.basename(filePath);
        finalDestinationPath = path.join(os.tmpdir(), `telegram_${fileId}_${filename}`);
      } else {
        finalDestinationPath = destinationPath;
      }

      // Log download start
      logger.info(`Downloading Telegram file ${fileId} to ${finalDestinationPath}`);

      // Download the file
      await this.downloadFileFromUrl(downloadUrl, finalDestinationPath);

      return finalDestinationPath;
    } catch (error: any) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error('Error downloading Telegram file:', errorObj);
      throw error;
    }
  }

  /**
   * Downloads a file from a URL to a destination path
   * 
   * @param url - URL to download the file from
   * @param destinationPath - Path where the file should be saved
   * @returns Promise that resolves when the file is downloaded
   * 
   * @throws Error if download fails
   */
  private async downloadFileFromUrl(url: string, destinationPath: string): Promise<void> {
    try {
      // Download file from URL using axios with arraybuffer response type for binary data
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000, // 30 second timeout
      });

      // Check HTTP status code (matching Rails response.is_a?(Net::HTTPSuccess) pattern)
      if (response.status < 200 || response.status >= 300) {
        const statusText = response.statusText || 'Unknown';
        throw new Error(`Failed to download file: HTTP ${response.status} ${statusText}`);
      }

      // Ensure destination directory exists
      const destinationDir = path.dirname(destinationPath);
      await fs.mkdir(destinationDir, { recursive: true });

      // Write file using binary mode (no encoding specified)
      await fs.writeFile(destinationPath, Buffer.from(response.data));

      // Log success message with file size
      const fileSize = Buffer.from(response.data).length;
      logger.info(`Downloaded file to ${destinationPath} (${fileSize} bytes)`);
    } catch (error: any) {
      // If it's an axios error with response, format it properly to match Rails pattern
      if (error.response) {
        const statusCode = error.response.status;
        const statusText = error.response.statusText || 'Unknown';
        const httpError = new Error(`Failed to download file: HTTP ${statusCode} ${statusText}`);
        logger.error('Error downloading file from URL:', httpError);
        throw httpError;
      }
      
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error('Error downloading file from URL:', errorObj);
      throw error;
    }
  }

  /**
   * Answers a callback query from an inline keyboard button
   * 
   * @param callbackQueryId - Callback query ID from the callback query
   * @param text - Optional text to show to the user
   * @param showAlert - Optional flag to show an alert instead of a notification
   * @returns Promise resolving to Telegram API response, or undefined if bot token is blank
   * 
   * @throws Error if API request fails
   */
  async answerCallbackQuery(
    callbackQueryId: string,
    text?: string,
    showAlert?: boolean
  ): Promise<TelegramApiResponse<boolean> | undefined> {
    if (!this.isTokenValid()) {
      return undefined;
    }

    try {
      // Build request body
      const requestBody: {
        callback_query_id: string;
        text?: string;
        show_alert?: boolean;
      } = {
        callback_query_id: callbackQueryId,
      };

      // Only include optional parameters if provided
      if (text !== undefined) {
        requestBody.text = text;
      }

      if (showAlert !== undefined) {
        requestBody.show_alert = showAlert;
      }

      // Make POST request to Telegram Bot API answerCallbackQuery endpoint
      const response = await this.axiosInstance.post<TelegramApiResponse<boolean>>(
        '/answerCallbackQuery',
        requestBody
      );

      return response.data;
    } catch (error: any) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error('Error answering Telegram callback query:', errorObj);
      throw error;
    }
  }

  /**
   * Escapes HTML special characters to prevent Telegram from trying to parse them as HTML tags
   * 
   * Must escape & first to avoid double-escaping existing entities.
   * 
   * @param text - Text to escape
   * @returns Escaped text
   */
  private escapeHtmlEntities(text: string): string {
    // Escape HTML special characters to prevent Telegram from trying to parse
    // them as HTML tags. Must escape & first to avoid double-escaping existing entities.
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}

export default TelegramService;
