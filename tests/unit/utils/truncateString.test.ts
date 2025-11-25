/**
 * Unit tests for string truncation utility (src/utils/truncateString.ts)
 *
 * These tests verify that the truncateString function correctly:
 * - Truncates strings to the specified maximum length
 * - Appends ellipsis when truncation occurs
 * - Handles non-string inputs (null, undefined, numbers)
 * - Handles edge cases (empty strings, short maxLength, custom ellipsis)
 * - Preserves strings that don't need truncation
 */

import { truncateString } from '../../../src/utils/truncateString';

describe('truncateString', () => {
  describe('Basic truncation', () => {
    it('should truncate string longer than maxLength', () => {
      expect(truncateString('Hello world', 5)).toBe('He...');
    });

    it('should not truncate string shorter than maxLength', () => {
      expect(truncateString('Hi', 10)).toBe('Hi');
    });

    it('should not truncate string equal to maxLength', () => {
      expect(truncateString('Hello', 5)).toBe('Hello');
    });

    it('should truncate at exact maxLength with default ellipsis', () => {
      expect(truncateString('Hello world', 8)).toBe('Hello...');
    });
  });

  describe('Custom ellipsis', () => {
    it('should use custom ellipsis string', () => {
      expect(truncateString('Hello world', 5, '…')).toBe('Hell…');
    });

    it('should use custom ellipsis with multiple characters', () => {
      expect(truncateString('Hello world', 6, '...')).toBe('Hel...');
    });

    it('should use empty string as ellipsis', () => {
      expect(truncateString('Hello world', 5, '')).toBe('Hello');
    });

    it('should use single character ellipsis', () => {
      expect(truncateString('Hello world', 6, '.')).toBe('Hello.');
    });
  });

  describe('Non-string inputs', () => {
    it('should handle null input', () => {
      expect(truncateString(null, 10)).toBe('');
    });

    it('should handle undefined input', () => {
      expect(truncateString(undefined, 10)).toBe('');
    });

    it('should handle number input', () => {
      expect(truncateString(12345, 3)).toBe('...');
    });

    it('should handle zero', () => {
      expect(truncateString(0, 5)).toBe('0');
    });

    it('should handle negative numbers', () => {
      expect(truncateString(-42, 3)).toBe('-42');
    });

    it('should handle floating point numbers', () => {
      expect(truncateString(3.14159, 4)).toBe('3...');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string', () => {
      expect(truncateString('', 10)).toBe('');
    });

    it('should handle maxLength of 0', () => {
      expect(truncateString('Hello', 0)).toBe('');
    });

    it('should handle negative maxLength', () => {
      expect(truncateString('Hello', -5)).toBe('');
    });

    it('should handle maxLength less than ellipsis length', () => {
      expect(truncateString('Hello world', 2, '...')).toBe('..');
    });

    it('should handle maxLength equal to ellipsis length', () => {
      expect(truncateString('Hello world', 3, '...')).toBe('...');
    });

    it('should handle very long strings', () => {
      const longString = 'a'.repeat(1000);
      const result = truncateString(longString, 10);
      expect(result.length).toBe(10);
      expect(result).toBe('aaaaaaa...');
    });

    it('should handle strings with special characters', () => {
      expect(truncateString('Hello <world>', 8)).toBe('Hello...');
    });

    it('should handle strings with unicode characters', () => {
      expect(truncateString('Hello 🌍 world', 8)).toBe('Hello...');
    });
  });

  describe('Real-world examples', () => {
    it('should truncate long error messages', () => {
      const errorMsg = 'Connection timeout: Unable to establish connection to server';
      expect(truncateString(errorMsg, 30)).toBe('Connection timeout: Unable ...');
    });

    it('should truncate URLs', () => {
      const url = 'https://example.com/very/long/path/to/resource';
      expect(truncateString(url, 20)).toBe('https://example.c...');
    });

    it('should truncate user messages', () => {
      const message = 'This is a very long message that needs to be truncated';
      expect(truncateString(message, 25)).toBe('This is a very long me...');
    });
  });

  describe('Type safety and behavior', () => {
    it('should return string type for all inputs', () => {
      const results = [
        truncateString('text', 10),
        truncateString(123, 10),
        truncateString(null, 10),
        truncateString(undefined, 10),
      ];

      results.forEach((result) => {
        expect(typeof result).toBe('string');
      });
    });

    it('should always return string within maxLength', () => {
      const testCases = [
        ['Hello world', 5],
        ['Test', 10],
        ['Very long string here', 8],
        ['Short', 3],
      ];

      testCases.forEach(([str, maxLen]) => {
        const result = truncateString(str as string, maxLen as number);
        expect(result.length).toBeLessThanOrEqual(maxLen as number);
      });
    });

    it('should preserve original string when no truncation needed', () => {
      const original = 'Short text';
      const result = truncateString(original, 20);
      expect(result).toBe(original);
    });
  });
});
