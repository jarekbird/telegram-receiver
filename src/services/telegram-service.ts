import axios, { AxiosInstance } from 'axios';
import { TelegramApiResponse, TelegramMessage, WebhookInfo } from '../types/telegram';
import { promises as fs } from 'fs';
import * as path from 'path';
import FormData from 'form-data';

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
      const errorMessage = error instanceof Error ? error.message : String(error);
      const stackTrace = error instanceof Error ? error.stack : '';
      console.error(`Error sending Telegram message: ${errorMessage}`);
      console.error(stackTrace);
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      const stackTrace = error instanceof Error ? error.stack : '';
      console.error(`Error setting Telegram webhook: ${errorMessage}`);
      console.error(stackTrace);
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      const stackTrace = error instanceof Error ? error.stack : '';
      console.error(`Error deleting Telegram webhook: ${errorMessage}`);
      console.error(stackTrace);
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      const stackTrace = error instanceof Error ? error.stack : '';
      console.error(`Error getting Telegram webhook info: ${errorMessage}`);
      console.error(stackTrace);
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
      // Validate that the voice file exists
      await fs.access(voicePath);
      
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
      const errorMessage = error instanceof Error ? error.message : String(error);
      const stackTrace = error instanceof Error ? error.stack : '';
      
      // Check if error is due to file not existing
      if (error.code === 'ENOENT') {
        const fileNotFoundError = new Error('Voice file does not exist');
        console.error(`Error sending Telegram voice: ${fileNotFoundError.message}`);
        console.error(stackTrace);
        throw fileNotFoundError;
      }
      
      console.error(`Error sending Telegram voice: ${errorMessage}`);
      console.error(stackTrace);
      throw error;
    }
  }

  /**
   * Downloads a file from Telegram
   * 
   * @param fileId - Telegram file ID
   * @param destinationPath - Optional path to save the file. If not provided, saves to temp directory
   * @returns Promise resolving to the path of the downloaded file
   * 
   * @throws Error if bot token is blank or if download fails
   * 
   * Implementation will be added in PHASE2-024
   */
  async downloadFile(_fileId: string, _destinationPath?: string): Promise<string> {
    if (!this.isTokenValid()) {
      return '';
    }

    try {
      // TODO: Implement in PHASE2-024
      // - Call get_file API to get file info (file_path)
      // - Construct download URL: https://api.telegram.org/file/bot{token}/{file_path}
      // - If destinationPath not provided, use temp directory: os.tmpdir() + path.sep + `telegram_${fileId}_${filename}`
      // - Use downloadFileFromUrl helper to download the file
      // - Return destination path
      throw new Error('Method not yet implemented');
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const stackTrace = error instanceof Error ? error.stack : '';
      console.error(`Error downloading Telegram file: ${errorMessage}`);
      console.error(stackTrace);
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
   * 
   * Implementation will be added in PHASE2-024
   */
  private async downloadFileFromUrl(_url: string, _destinationPath: string): Promise<void> {
    try {
      // TODO: Implement in PHASE2-024
      // - Use axios to download file from URL
      // - Ensure destination directory exists using fs.mkdir with recursive option
      // - Write file using fs.writeFile
      // - Log success message with file size
      throw new Error('Method not yet implemented');
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const stackTrace = error instanceof Error ? error.stack : '';
      console.error(`Error downloading file from URL: ${errorMessage}`);
      console.error(stackTrace);
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
