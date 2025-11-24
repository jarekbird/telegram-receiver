/**
 * Unit tests for HTML entity escaping utility (src/utils/escapeHtmlEntities.ts)
 *
 * These tests verify that the escapeHtmlEntities function correctly:
 * - Escapes HTML special characters (&, <, >) in the correct order
 * - Handles non-string inputs (null, undefined, numbers)
 * - Handles edge cases (empty strings, already-escaped entities)
 * - Prevents double-escaping by escaping & first
 *
 * This is part of PHASE2-025 task to implement HTML entity escaping utility.
 */

import { escapeHtmlEntities } from '../../../src/utils/escapeHtmlEntities';

describe('escapeHtmlEntities', () => {
  describe('Basic escaping of HTML special characters', () => {
    it('should escape < character', () => {
      expect(escapeHtmlEntities('Hello <world>')).toBe('Hello &lt;world&gt;');
    });

    it('should escape > character', () => {
      expect(escapeHtmlEntities('x > y')).toBe('x &gt; y');
    });

    it('should escape & character', () => {
      expect(escapeHtmlEntities('A & B')).toBe('A &amp; B');
    });

    it('should escape all three characters together', () => {
      expect(escapeHtmlEntities('<tag> & value')).toBe(
        '&lt;tag&gt; &amp; value',
      );
    });

    it('should escape multiple occurrences', () => {
      expect(escapeHtmlEntities('<<test>>')).toBe('&lt;&lt;test&gt;&gt;');
    });

    it('should escape & multiple times', () => {
      expect(escapeHtmlEntities('A & B & C')).toBe('A &amp; B &amp; C');
    });
  });

  describe('Order of escaping (must escape & first)', () => {
    it('should escape & first to avoid double-escaping existing entities', () => {
      // If we escaped < first, then &, we'd get: &amp;lt; instead of &amp;lt;
      // By escaping & first, we ensure existing entities are properly escaped
      const input = '&lt;tag&gt;';
      const result = escapeHtmlEntities(input);

      // Should be: &amp;lt;tag&amp;gt;
      // This is correct - we're escaping the & in &lt; and &gt;
      expect(result).toBe('&amp;lt;tag&amp;gt;');
    });

    it('should handle mixed content with existing entities', () => {
      const input = 'Text &lt;tag&gt; and <new>';
      const result = escapeHtmlEntities(input);

      // Should escape: & in &lt; and &gt;, and < in <new>
      expect(result).toBe('Text &amp;lt;tag&amp;gt; and &lt;new&gt;');
    });

    it('should escape & before < in strings containing both', () => {
      const input = 'A & B < C';
      const result = escapeHtmlEntities(input);

      // Order matters: & first, then <
      expect(result).toBe('A &amp; B &lt; C');
    });
  });

  describe('Non-string inputs', () => {
    it('should handle null input', () => {
      expect(escapeHtmlEntities(null)).toBe('');
    });

    it('should handle undefined input', () => {
      expect(escapeHtmlEntities(undefined)).toBe('');
    });

    it('should handle number input', () => {
      expect(escapeHtmlEntities(123)).toBe('123');
    });

    it('should handle zero', () => {
      expect(escapeHtmlEntities(0)).toBe('0');
    });

    it('should handle negative numbers', () => {
      expect(escapeHtmlEntities(-42)).toBe('-42');
    });

    it('should handle floating point numbers', () => {
      expect(escapeHtmlEntities(3.14)).toBe('3.14');
    });

    it('should handle number with special characters in string representation', () => {
      // Numbers don't contain HTML characters, but test conversion
      expect(escapeHtmlEntities(1000)).toBe('1000');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string', () => {
      expect(escapeHtmlEntities('')).toBe('');
    });

    it('should handle strings with no special characters', () => {
      expect(escapeHtmlEntities('Hello World')).toBe('Hello World');
    });

    it('should handle strings with only spaces', () => {
      expect(escapeHtmlEntities('   ')).toBe('   ');
    });

    it('should handle strings that already contain HTML entities', () => {
      // This will double-escape, which is expected behavior
      // The function escapes & first, so &amp; becomes &amp;amp;
      const input = '&amp;';
      const result = escapeHtmlEntities(input);
      expect(result).toBe('&amp;amp;');
    });

    it('should handle strings with mixed content', () => {
      const input = 'Normal text <tag> and more text';
      const result = escapeHtmlEntities(input);
      expect(result).toBe('Normal text &lt;tag&gt; and more text');
    });

    it('should handle strings that look like HTML tags', () => {
      // Real-world example from Rails implementation
      const input = 'tcpsocket:(closed)';
      const result = escapeHtmlEntities(input);
      // Should not escape parentheses, only <, >, &
      expect(result).toBe('tcpsocket:(closed)');
    });

    it('should handle strings with angle brackets that look like tags', () => {
      const input = '<error>tcpsocket:(closed)</error>';
      const result = escapeHtmlEntities(input);
      expect(result).toBe('&lt;error&gt;tcpsocket:(closed)&lt;/error&gt;');
    });

    it('should handle newlines and special whitespace', () => {
      const input = 'Line 1\nLine 2\tTab';
      const result = escapeHtmlEntities(input);
      // Should preserve newlines and tabs (only escape <, >, &)
      expect(result).toBe('Line 1\nLine 2\tTab');
    });
  });

  describe('Real-world examples', () => {
    it('should handle error messages that look like HTML', () => {
      const input = 'Connection error: <socket closed>';
      const result = escapeHtmlEntities(input);
      expect(result).toBe('Connection error: &lt;socket closed&gt;');
    });

    it('should handle text with ampersands in URLs', () => {
      const input = 'Visit https://example.com?q=test&page=1';
      const result = escapeHtmlEntities(input);
      expect(result).toBe('Visit https://example.com?q=test&amp;page=1');
    });

    it('should handle comparison operators', () => {
      const input = 'x < 10 && y > 5';
      const result = escapeHtmlEntities(input);
      expect(result).toBe('x &lt; 10 &amp;&amp; y &gt; 5');
    });

    it('should handle XML-like content', () => {
      const input = '<message>Hello & goodbye</message>';
      const result = escapeHtmlEntities(input);
      expect(result).toBe(
        '&lt;message&gt;Hello &amp; goodbye&lt;/message&gt;',
      );
    });
  });

  describe('Type safety and behavior', () => {
    it('should return string type for all inputs', () => {
      const results = [
        escapeHtmlEntities('text'),
        escapeHtmlEntities(123),
        escapeHtmlEntities(null),
        escapeHtmlEntities(undefined),
      ];

      results.forEach((result) => {
        expect(typeof result).toBe('string');
      });
    });

    it('should handle very long strings', () => {
      const longString = '<'.repeat(1000) + 'test' + '>'.repeat(1000);
      const result = escapeHtmlEntities(longString);

      // Should escape all < and >
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
    });

    it('should handle strings with only & character', () => {
      expect(escapeHtmlEntities('&')).toBe('&amp;');
    });

    it('should handle strings with only < character', () => {
      expect(escapeHtmlEntities('<')).toBe('&lt;');
    });

    it('should handle strings with only > character', () => {
      expect(escapeHtmlEntities('>')).toBe('&gt;');
    });
  });
});
