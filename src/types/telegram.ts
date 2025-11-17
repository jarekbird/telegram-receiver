/**
 * TypeScript type definitions for Telegram Bot API
 * Based on Telegram Bot API documentation: https://core.telegram.org/bots/api
 * These types match the structure used in the Rails application
 */

/**
 * Root object received from Telegram webhook
 * Contains one of: message, edited_message, or callback_query
 */
export interface TelegramUpdate {
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

/**
 * Telegram message object
 * Used extensively throughout the codebase
 */
export interface TelegramMessage {
  message_id: number;
  chat: TelegramChat;
  text?: string;
  from?: TelegramUser;
  voice?: TelegramVoice;
  audio?: TelegramAudio;
  document?: TelegramDocument;
}

/**
 * Telegram chat information
 */
export interface TelegramChat {
  id: number;
  type?: string;
  title?: string;
  username?: string;
}

/**
 * Telegram user information
 */
export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
}

/**
 * Telegram callback query
 * Used for inline keyboard button callbacks
 */
export interface TelegramCallbackQuery {
  id: string;
  data: string;
  message?: TelegramMessage;
  from?: TelegramUser;
}

/**
 * Telegram file information from get_file API
 * Structure: { result: { file_path: string } }
 * Note: file_id is the input parameter, not part of the response structure
 */
export interface TelegramFile {
  result: {
    file_path: string;
  };
}

/**
 * Telegram voice message
 * Used for voice/audio messages
 */
export interface TelegramVoice {
  file_id: string;
  duration?: number;
  mime_type?: string;
  file_size?: number;
}

/**
 * Telegram audio message
 * Used for audio files
 */
export interface TelegramAudio {
  file_id: string;
  duration?: number;
  performer?: string;
  title?: string;
  mime_type?: string;
  file_size?: number;
}

/**
 * Telegram document
 * Used for documents, including audio files sent as documents
 * Must include file_id and mime_type fields
 */
export interface TelegramDocument {
  file_id: string;
  mime_type?: string;
  file_name?: string;
  file_size?: number;
}

/**
 * Parameters for sending a message via Telegram API
 * parse_mode can be null for plain text (no formatting)
 */
export interface SendMessageParams {
  chat_id: number;
  text: string;
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2' | null;
  reply_to_message_id?: number;
}

/**
 * Parameters for sending a voice message via Telegram API
 * voice_path is a local file path, not a Telegram file_id
 */
export interface SendVoiceParams {
  chat_id: number;
  voice_path: string;
  reply_to_message_id?: number;
  caption?: string;
}

/**
 * Parameters for setting a webhook
 */
export interface SetWebhookParams {
  url: string;
  secret_token?: string;
}

/**
 * Parameters for answering a callback query
 */
export interface AnswerCallbackQueryParams {
  callback_query_id: string;
  text?: string;
  show_alert?: boolean;
}

/**
 * Parameters for getting file information
 */
export interface GetFileParams {
  file_id: string;
}

/**
 * Webhook information structure
 * This is the structure inside the result field of TelegramApiResponse<WebhookInfo>
 */
export interface WebhookInfo {
  url: string;
  pending_update_count: number;
  last_error_date?: number;
  last_error_message?: string;
  max_connections?: number;
  allowed_updates?: string[];
}

/**
 * Generic Telegram API response type
 * Matches Telegram Bot API response structure
 * When ok is true: result field is present
 * When ok is false: description and error_code fields are present
 */
export type TelegramApiResponse<T> =
  | {
      ok: true;
      result: T;
    }
  | {
      ok: false;
      description: string;
      error_code: number;
    };
