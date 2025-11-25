/**
 * String truncation utility
 *
 * This module provides a utility function to truncate strings to a specified length
 * with optional ellipsis handling.
 *
 * **Usage:**
 * ```typescript
 * import { truncateString } from '@/utils/truncateString';
 *
 * truncateString('Hello world', 5); // 'Hello...'
 * truncateString('Hello world', 5, '…'); // 'Hello…'
 * ```
 *
 * @module utils/truncateString
 */

/**
 * Truncate a string to a specified length with optional ellipsis.
 *
 * @param str - String to truncate (can be string, number, null, or undefined)
 * @param maxLength - Maximum length of the truncated string (including ellipsis if added)
 * @param ellipsis - String to append when truncating (default: '...')
 * @returns Truncated string as string (empty string for null/undefined)
 *
 * @example
 * ```typescript
 * truncateString('Hello world', 5); // 'He...'
 * truncateString('Hello world', 5, '…'); // 'He…'
 * truncateString('Hi', 10); // 'Hi' (no truncation needed)
 * truncateString(null, 10); // ''
 * truncateString(12345, 3); // '12...'
 * ```
 */
export function truncateString(
  str: string | number | null | undefined,
  maxLength: number,
  ellipsis: string = '...',
): string {
  // Convert input to string (handles null/undefined/numbers)
  const strValue = String(str ?? '');

  // Handle edge cases
  if (!strValue || maxLength <= 0) {
    return '';
  }

  // If string is already short enough, return as-is
  if (strValue.length <= maxLength) {
    return strValue;
  }

  // If maxLength is less than or equal to ellipsis length, return ellipsis only
  if (maxLength <= ellipsis.length) {
    return ellipsis.slice(0, maxLength);
  }

  // Truncate and append ellipsis
  const truncateLength = maxLength - ellipsis.length;
  return strValue.slice(0, truncateLength) + ellipsis;
}
