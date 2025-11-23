/**
 * TypeScript type definitions for Redis callback data structures
 * These types define the structure of data stored in Redis for pending cursor-runner requests.
 *
 * Based on the structure used in:
 * - jarek-va/app/services/cursor_runner_callback_service.rb
 * - jarek-va/app/jobs/telegram_message_job.rb (lines 193-199)
 * - jarek-va/app/controllers/cursor_runner_callback_controller.rb (line 104)
 *
 * The data is stored as JSON in Redis with a TTL (default: 3600 seconds / 1 hour).
 * When retrieved, `original_was_audio` may be undefined/null and should default to `false`.
 */

/**
 * Interface for stored callback data in Redis
 * Represents pending cursor-runner request information stored while waiting for async completion
 */
export interface PendingRequestData {
  /**
   * Telegram chat ID where the original message was sent
   */
  chat_id: number;

  /**
   * Telegram message ID of the original message
   */
  message_id: number;

  /**
   * The user's message text/prompt that was sent to cursor-runner
   */
  prompt: string;

  /**
   * Whether the original message was an audio/voice message
   * Optional - defaults to false if undefined when retrieved from Redis
   */
  original_was_audio?: boolean;

  /**
   * ISO8601 formatted timestamp when the request was created
   */
  created_at: string;
}
