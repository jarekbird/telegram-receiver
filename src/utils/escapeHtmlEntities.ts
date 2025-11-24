/**
 * HTML entity escaping utility
 *
 * This module provides a utility function to escape HTML special characters
 * to prevent Telegram from trying to parse them as HTML tags when using HTML parse mode.
 *
 * **Rails Implementation Reference:**
 * - `jarek-va/app/services/telegram_service.rb` lines 176-183
 * - Private method `escape_html_entities` in `TelegramService` class
 * - Used in `send_message` method when `parse_mode == 'HTML'` (line 21)
 * - Purpose: Prevents parsing errors with text that looks like HTML tags (e.g., "tcpsocket:(closed)")
 *
 * **Key Implementation Details:**
 * - Must escape `&` first to avoid double-escaping existing HTML entities
 * - Escapes `<` and `>` to prevent Telegram from parsing them as HTML tags
 * - Handles non-string inputs (numbers, null, undefined) by converting to string
 *
 * **Usage:**
 * ```typescript
 * import { escapeHtmlEntities } from '@/utils/escapeHtmlEntities';
 *
 * // In TelegramService.sendMessage()
 * const escapedText = parseMode === 'HTML' ? escapeHtmlEntities(text) : text;
 * ```
 *
 * @module utils/escapeHtmlEntities
 */

/**
 * Escape HTML special characters to prevent Telegram from trying to parse them as HTML tags.
 * Must escape & first to avoid double-escaping existing entities.
 *
 * @param text - Text to escape (can be string, number, null, or undefined)
 * @returns Escaped text as string (empty string for null/undefined)
 *
 * @example
 * ```typescript
 * escapeHtmlEntities('Hello <world>'); // 'Hello &lt;world&gt;'
 * escapeHtmlEntities('A & B'); // 'A &amp; B'
 * escapeHtmlEntities('&lt;tag&gt;'); // '&amp;lt;tag&amp;gt;' (double-escaped)
 * escapeHtmlEntities(null); // ''
 * escapeHtmlEntities(123); // '123'
 * ```
 */
export function escapeHtmlEntities(
  text: string | number | null | undefined,
): string {
  // Convert input to string (equivalent to Ruby's .to_s)
  // Handles null/undefined by converting to empty string
  // Handles numbers by converting to string representation
  const textString = String(text ?? '');

  // Escape HTML special characters in correct order:
  // 1. Escape & first to avoid double-escaping existing entities
  // 2. Escape < and > to prevent Telegram from parsing them as HTML tags
  return textString
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
