/**
 * Unit tests for service error classes
 * Verifies that error classes extend properly and maintain error message and stack trace
 */

import {
  ServiceError,
  ConnectionError,
  TimeoutError,
  InvalidResponseError,
  TranscriptionError,
  SynthesisError,
} from '../../../src/types/errors';

describe('Service Error Classes', () => {
  describe('ServiceError', () => {
    it('should extend Error class', () => {
      const error = new ServiceError('Test error');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ServiceError);
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('ServiceError');
    });

    it('should maintain error message', () => {
      const message = 'Custom error message';
      const error = new ServiceError(message);
      expect(error.message).toBe(message);
    });

    it('should maintain stack trace', () => {
      const error = new ServiceError('Test error');
      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe('string');
    });
  });

  describe('ConnectionError', () => {
    it('should extend ServiceError', () => {
      const error = new ConnectionError('Connection failed');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ServiceError);
      expect(error).toBeInstanceOf(ConnectionError);
      expect(error.message).toBe('Connection failed');
      expect(error.name).toBe('ConnectionError');
    });

    it('should maintain error message', () => {
      const message = 'Failed to connect to service';
      const error = new ConnectionError(message);
      expect(error.message).toBe(message);
    });

    it('should maintain stack trace', () => {
      const error = new ConnectionError('Connection failed');
      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe('string');
    });
  });

  describe('TimeoutError', () => {
    it('should extend ServiceError', () => {
      const error = new TimeoutError('Request timed out');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ServiceError);
      expect(error).toBeInstanceOf(TimeoutError);
      expect(error.message).toBe('Request timed out');
      expect(error.name).toBe('TimeoutError');
    });

    it('should maintain error message', () => {
      const message = 'Request to service timed out';
      const error = new TimeoutError(message);
      expect(error.message).toBe(message);
    });

    it('should maintain stack trace', () => {
      const error = new TimeoutError('Request timed out');
      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe('string');
    });
  });

  describe('InvalidResponseError', () => {
    it('should extend ServiceError', () => {
      const error = new InvalidResponseError('Invalid response');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ServiceError);
      expect(error).toBeInstanceOf(InvalidResponseError);
      expect(error.message).toBe('Invalid response');
      expect(error.name).toBe('InvalidResponseError');
    });

    it('should maintain error message', () => {
      const message = 'Failed to parse response';
      const error = new InvalidResponseError(message);
      expect(error.message).toBe(message);
    });

    it('should maintain stack trace', () => {
      const error = new InvalidResponseError('Invalid response');
      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe('string');
    });
  });

  describe('TranscriptionError', () => {
    it('should extend ServiceError', () => {
      const error = new TranscriptionError('Transcription failed');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ServiceError);
      expect(error).toBeInstanceOf(TranscriptionError);
      expect(error.message).toBe('Transcription failed');
      expect(error.name).toBe('TranscriptionError');
    });

    it('should maintain error message', () => {
      const message = 'No text returned from transcription';
      const error = new TranscriptionError(message);
      expect(error.message).toBe(message);
    });

    it('should maintain stack trace', () => {
      const error = new TranscriptionError('Transcription failed');
      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe('string');
    });
  });

  describe('SynthesisError', () => {
    it('should extend ServiceError', () => {
      const error = new SynthesisError('Synthesis failed');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ServiceError);
      expect(error).toBeInstanceOf(SynthesisError);
      expect(error.message).toBe('Synthesis failed');
      expect(error.name).toBe('SynthesisError');
    });

    it('should maintain error message', () => {
      const message = 'API error during synthesis';
      const error = new SynthesisError(message);
      expect(error.message).toBe(message);
    });

    it('should maintain stack trace', () => {
      const error = new SynthesisError('Synthesis failed');
      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe('string');
    });
  });
});
