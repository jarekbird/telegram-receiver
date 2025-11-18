/**
 * TypeScript type definitions for BullMQ job payloads
 * These types define the structure of data passed to background job processors
 */

import { TelegramUpdate } from './telegram';

/**
 * Payload structure for Telegram message job
 * Used when enqueueing jobs with BullMQ: queue.add('telegram-message', { update: telegramUpdate })
 * The payload contains the Telegram update object (as defined in telegram.ts)
 */
export interface TelegramMessageJobPayload {
  update: TelegramUpdate;
}
