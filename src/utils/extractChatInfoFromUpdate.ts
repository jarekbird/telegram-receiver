/**
 * Chat info extraction utility
 *
 * This module provides a utility function to extract chat ID and message ID
 * from Telegram update objects for error handling purposes.
 *
 * **Rails Implementation References:**
 * - `jarek-va/app/controllers/telegram_controller.rb` (lines 151-169)
 * - `jarek-va/app/jobs/telegram_message_job.rb` (lines 279-295)
 *
 * **Key Implementation Details:**
 * - Handles three types of Telegram updates: `message`, `edited_message`, and `callback_query`
 * - Uses optional chaining (`?.`) for safe nested property access
 * - Returns `[chat_id, message_id]` tuple (both can be `null` if not found)
 * - Returns `[null, null]` if none of the update types match
 * - In TypeScript, updates are plain JavaScript objects (no hash conversion needed,
 *   unlike Rails controller which handles `ActionController::Parameters`)
 *
 * **Usage:**
 * ```typescript
 * import { extractChatInfoFromUpdate } from '@/utils/extractChatInfoFromUpdate';
 * import { TelegramUpdate } from '@/types/telegram';
 *
 * const update: TelegramUpdate = { message: { ... } };
 * const [chatId, messageId] = extractChatInfoFromUpdate(update);
 * if (chatId && messageId) {
 *   // Send error message to user
 * }
 * ```
 *
 * @module utils/extractChatInfoFromUpdate
 */

import type { TelegramUpdate } from '../types/telegram';

/**
 * Extracts chat ID and message ID from Telegram update objects.
 * Helper method for error handling - extracts chat information from update
 * so error messages can be sent to users.
 *
 * Handles three update types:
 * - `message`: Extract from `update.message.chat.id` and `update.message.message_id`
 * - `edited_message`: Extract from `update.edited_message.chat.id` and `update.edited_message.message_id`
 * - `callback_query`: Extract from `update.callback_query.message.chat.id` and `update.callback_query.message.message_id`
 *
 * @param update - Telegram update object (can be message, edited_message, or callback_query)
 * @returns Tuple of `[chat_id, message_id]` (both can be `null` if not found)
 *
 * @example
 * ```typescript
 * // Message update
 * const update1: TelegramUpdate = {
 *   message: {
 *     message_id: 123,
 *     chat: { id: 456 }
 *   }
 * };
 * extractChatInfoFromUpdate(update1); // [456, 123]
 *
 * // Edited message update
 * const update2: TelegramUpdate = {
 *   edited_message: {
 *     message_id: 789,
 *     chat: { id: 101 }
 *   }
 * };
 * extractChatInfoFromUpdate(update2); // [101, 789]
 *
 * // Callback query update
 * const update3: TelegramUpdate = {
 *   callback_query: {
 *     id: 'callback123',
 *     data: 'data',
 *     message: {
 *       message_id: 321,
 *       chat: { id: 654 }
 *     }
 *   }
 * };
 * extractChatInfoFromUpdate(update3); // [654, 321]
 *
 * // No matching update type
 * const update4: TelegramUpdate = {};
 * extractChatInfoFromUpdate(update4); // [null, null]
 * ```
 */
export function extractChatInfoFromUpdate(
  update: TelegramUpdate,
): [number | null, number | null] {
  // Handle message update type
  if (update.message) {
    const chatId = update.message.chat?.id ?? null;
    const messageId = update.message.message_id ?? null;
    return [chatId, messageId];
  }

  // Handle edited_message update type
  if (update.edited_message) {
    const chatId = update.edited_message.chat?.id ?? null;
    const messageId = update.edited_message.message_id ?? null;
    return [chatId, messageId];
  }

  // Handle callback_query update type (extract from nested message)
  if (update.callback_query?.message) {
    const chatId = update.callback_query.message.chat?.id ?? null;
    const messageId = update.callback_query.message.message_id ?? null;
    return [chatId, messageId];
  }

  // Return [null, null] if none of the update types match
  return [null, null];
}
