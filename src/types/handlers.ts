/**
 * TypeScript type definitions for async handler payloads and execution
 *
 * This module defines types for handler execution. Since handlers accept TelegramUpdate
 * directly (via BaseAsyncHandler<TelegramUpdate, void>), these types provide type
 * aliases and interfaces for consistency and future extensibility.
 *
 * **Rails Implementation Reference:**
 * - `jarek-va/app/jobs/telegram_message_job.rb` - The `perform` method accepts `update` parameter (Hash or JSON string)
 * - In Rails: `TelegramMessageJob.perform_later(update.to_json)` passes update as JSON string
 *
 * **TypeScript Implementation:**
 * - Handlers accept TelegramUpdate object directly (no wrapper payload needed)
 * - Handler signature: `async handle(update: TelegramUpdate): Promise<void>`
 * - Usage: `await handler.handle(telegramUpdate)` where `telegramUpdate` is of type `TelegramUpdate`
 *
 * @module types/handlers
 */

import type { TelegramUpdate } from './telegram';

/**
 * Handler payload type
 * Since handlers accept TelegramUpdate directly, this is a type alias for consistency
 * and future extensibility (e.g., if we need to add metadata or wrapper types later)
 */
export type HandlerPayload = TelegramUpdate;

/**
 * Handler function type
 * Defines the signature for handler functions that process Telegram updates
 *
 * @example
 * ```typescript
 * const myHandler: HandlerFunction = async (update: TelegramUpdate) => {
 *   // Process update
 * };
 * ```
 */
export type HandlerFunction = (update: TelegramUpdate) => Promise<void>;

/**
 * Handler execution context (for future use)
 * Can be extended to include metadata, execution context, or other information
 * Currently, handlers accept TelegramUpdate directly, but this type provides
 * a foundation for future enhancements
 */
export interface HandlerExecutionContext {
  /** The Telegram update to process */
  update: TelegramUpdate;
  /** Optional metadata for handler execution */
  metadata?: Record<string, unknown>;
}
