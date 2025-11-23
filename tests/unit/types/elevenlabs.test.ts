/**
 * Unit tests for ElevenLabs API type definitions
 * Verifies that TypeScript types match expected ElevenLabs API structures
 */

import {
  ElevenLabsTranscribeRequest,
  ElevenLabsTranscribeResponse,
  ElevenLabsSynthesizeRequest,
  ElevenLabsSynthesizeResponse,
  ElevenLabsVoiceSettings,
  ElevenLabsErrorResponse,
  ElevenLabsErrorResponseObject,
  ElevenLabsArrayErrorResponse,
  ElevenLabsError,
  ElevenLabsConnectionError,
  ElevenLabsTimeoutError,
  ElevenLabsInvalidResponseError,
  ElevenLabsTranscriptionError,
  ElevenLabsSynthesisError,
} from '../../../src/types/elevenlabs';

describe('ElevenLabs Types', () => {
  describe('ElevenLabsTranscribeRequest', () => {
    it('should require file field', () => {
      const request: ElevenLabsTranscribeRequest = {
        file: Buffer.from('audio data'),
      };
      expect(Buffer.isBuffer(request.file)).toBe(true);
    });

    it('should accept optional filename field', () => {
      const request: ElevenLabsTranscribeRequest = {
        file: Buffer.from('audio data'),
        filename: 'audio.ogg',
      };
      expect(request.filename).toBe('audio.ogg');
    });

    it('should accept optional model_id field', () => {
      const request: ElevenLabsTranscribeRequest = {
        file: Buffer.from('audio data'),
        model_id: 'scribe_v1',
      };
      expect(request.model_id).toBe('scribe_v1');
    });

    it('should accept optional language field', () => {
      const request: ElevenLabsTranscribeRequest = {
        file: Buffer.from('audio data'),
        language: 'en',
      };
      expect(request.language).toBe('en');
    });

    it('should accept all optional fields together', () => {
      const request: ElevenLabsTranscribeRequest = {
        file: Buffer.from('audio data'),
        filename: 'audio.ogg',
        model_id: 'scribe_v1',
        language: 'en',
      };
      expect(request.filename).toBe('audio.ogg');
      expect(request.model_id).toBe('scribe_v1');
      expect(request.language).toBe('en');
    });
  });

  describe('ElevenLabsTranscribeResponse', () => {
    it('should require text field', () => {
      const response: ElevenLabsTranscribeResponse = {
        text: 'Transcribed text',
      };
      expect(response.text).toBe('Transcribed text');
    });
  });

  describe('ElevenLabsVoiceSettings', () => {
    it('should accept optional stability field', () => {
      const settings: ElevenLabsVoiceSettings = {
        stability: 0.5,
      };
      expect(settings.stability).toBe(0.5);
    });

    it('should accept optional similarity_boost field', () => {
      const settings: ElevenLabsVoiceSettings = {
        similarity_boost: 0.75,
      };
      expect(settings.similarity_boost).toBe(0.75);
    });

    it('should accept optional style field', () => {
      const settings: ElevenLabsVoiceSettings = {
        style: 0.3,
      };
      expect(settings.style).toBe(0.3);
    });

    it('should accept optional use_speaker_boost field', () => {
      const settings: ElevenLabsVoiceSettings = {
        use_speaker_boost: true,
      };
      expect(settings.use_speaker_boost).toBe(true);
    });

    it('should accept all voice settings together', () => {
      const settings: ElevenLabsVoiceSettings = {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.3,
        use_speaker_boost: true,
      };
      expect(settings.stability).toBe(0.5);
      expect(settings.similarity_boost).toBe(0.75);
      expect(settings.style).toBe(0.3);
      expect(settings.use_speaker_boost).toBe(true);
    });

    it('should accept additional voice settings via index signature', () => {
      const settings: ElevenLabsVoiceSettings = {
        stability: 0.5,
        custom_setting: 'value',
      };
      expect(settings.stability).toBe(0.5);
      expect(settings.custom_setting).toBe('value');
    });
  });

  describe('ElevenLabsSynthesizeRequest', () => {
    it('should require text field', () => {
      const request: ElevenLabsSynthesizeRequest = {
        text: 'Hello, world!',
      };
      expect(request.text).toBe('Hello, world!');
    });

    it('should accept optional model_id field', () => {
      const request: ElevenLabsSynthesizeRequest = {
        text: 'Hello, world!',
        model_id: 'eleven_turbo_v2_5',
      };
      expect(request.model_id).toBe('eleven_turbo_v2_5');
    });

    it('should accept optional output_format field', () => {
      const request: ElevenLabsSynthesizeRequest = {
        text: 'Hello, world!',
        output_format: 'mp3_44100_128',
      };
      expect(request.output_format).toBe('mp3_44100_128');
    });

    it('should accept optional voice_settings field', () => {
      const request: ElevenLabsSynthesizeRequest = {
        text: 'Hello, world!',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      };
      expect(request.voice_settings?.stability).toBe(0.5);
      expect(request.voice_settings?.similarity_boost).toBe(0.75);
    });

    it('should accept all optional fields together', () => {
      const request: ElevenLabsSynthesizeRequest = {
        text: 'Hello, world!',
        model_id: 'eleven_turbo_v2_5',
        output_format: 'mp3_44100_128',
        voice_settings: {
          stability: 0.5,
        },
      };
      expect(request.text).toBe('Hello, world!');
      expect(request.model_id).toBe('eleven_turbo_v2_5');
      expect(request.output_format).toBe('mp3_44100_128');
      expect(request.voice_settings?.stability).toBe(0.5);
    });
  });

  describe('ElevenLabsSynthesizeResponse', () => {
    it('should accept Buffer type', () => {
      const response: ElevenLabsSynthesizeResponse = Buffer.from('audio data');
      expect(Buffer.isBuffer(response)).toBe(true);
    });

    it('should accept ArrayBuffer type', () => {
      const response: ElevenLabsSynthesizeResponse = new ArrayBuffer(8);
      expect(response).toBeInstanceOf(ArrayBuffer);
    });
  });

  describe('ElevenLabsErrorResponse', () => {
    it('should accept object format with detail string', () => {
      const error: ElevenLabsErrorResponse = {
        detail: 'Error message',
      };
      expect('detail' in error && typeof error === 'object' && !Array.isArray(error)).toBe(true);
      if (!Array.isArray(error)) {
        expect(error.detail).toBe('Error message');
      }
    });

    it('should accept object format with detail as string array', () => {
      const error: ElevenLabsErrorResponse = {
        detail: ['Error 1', 'Error 2'],
      };
      if (!Array.isArray(error)) {
        expect(Array.isArray(error.detail)).toBe(true);
      }
    });

    it('should accept object format with detail as array of objects with msg', () => {
      const error: ElevenLabsErrorResponse = {
        detail: [{ msg: 'Error 1' }, { msg: 'Error 2' }],
      };
      if (!Array.isArray(error)) {
        expect(Array.isArray(error.detail)).toBe(true);
      }
    });

    it('should accept object format with error field', () => {
      const error: ElevenLabsErrorResponse = {
        error: 'Error message',
      };
      if (!Array.isArray(error)) {
        expect(error.error).toBe('Error message');
      }
    });

    it('should accept object format with message field', () => {
      const error: ElevenLabsErrorResponse = {
        message: 'Error message',
      };
      if (!Array.isArray(error)) {
        expect(error.message).toBe('Error message');
      }
    });

    it('should accept array format with objects containing msg field', () => {
      const error: ElevenLabsErrorResponse = [{ msg: 'Error 1' }, { msg: 'Error 2' }];
      expect(Array.isArray(error)).toBe(true);
      if (Array.isArray(error)) {
        expect(error[0].msg).toBe('Error 1');
        expect(error[1].msg).toBe('Error 2');
      }
    });

    it('should accept array format with optional msg fields', () => {
      const error: ElevenLabsErrorResponse = [{}, { msg: 'Error 2' }];
      expect(Array.isArray(error)).toBe(true);
      if (Array.isArray(error)) {
        expect(error[0].msg).toBeUndefined();
        expect(error[1].msg).toBe('Error 2');
      }
    });
  });

  describe('ElevenLabsErrorResponseObject', () => {
    it('should match object format of ElevenLabsErrorResponse', () => {
      const error: ElevenLabsErrorResponseObject = {
        detail: 'Error message',
        error: 'Error',
        message: 'Message',
      };
      expect(error.detail).toBe('Error message');
      expect(error.error).toBe('Error');
      expect(error.message).toBe('Message');
    });
  });

  describe('ElevenLabsArrayErrorResponse', () => {
    it('should match array format of ElevenLabsErrorResponse', () => {
      const error: ElevenLabsArrayErrorResponse = [{ msg: 'Error 1' }, { msg: 'Error 2' }];
      expect(Array.isArray(error)).toBe(true);
      expect(error[0].msg).toBe('Error 1');
      expect(error[1].msg).toBe('Error 2');
    });
  });

  describe('ElevenLabsError', () => {
    it('should extend Error class', () => {
      const error = new ElevenLabsError('Test error');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ElevenLabsError);
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('ElevenLabsError');
    });
  });

  describe('ElevenLabsConnectionError', () => {
    it('should extend ElevenLabsError', () => {
      const error = new ElevenLabsConnectionError('Connection failed');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ElevenLabsError);
      expect(error).toBeInstanceOf(ElevenLabsConnectionError);
      expect(error.message).toBe('Connection failed');
      expect(error.name).toBe('ElevenLabsConnectionError');
    });
  });

  describe('ElevenLabsTimeoutError', () => {
    it('should extend ElevenLabsError', () => {
      const error = new ElevenLabsTimeoutError('Request timed out');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ElevenLabsError);
      expect(error).toBeInstanceOf(ElevenLabsTimeoutError);
      expect(error.message).toBe('Request timed out');
      expect(error.name).toBe('ElevenLabsTimeoutError');
    });
  });

  describe('ElevenLabsInvalidResponseError', () => {
    it('should extend ElevenLabsError', () => {
      const error = new ElevenLabsInvalidResponseError('Invalid response');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ElevenLabsError);
      expect(error).toBeInstanceOf(ElevenLabsInvalidResponseError);
      expect(error.message).toBe('Invalid response');
      expect(error.name).toBe('ElevenLabsInvalidResponseError');
    });
  });

  describe('ElevenLabsTranscriptionError', () => {
    it('should extend ElevenLabsError', () => {
      const error = new ElevenLabsTranscriptionError('Transcription failed');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ElevenLabsError);
      expect(error).toBeInstanceOf(ElevenLabsTranscriptionError);
      expect(error.message).toBe('Transcription failed');
      expect(error.name).toBe('ElevenLabsTranscriptionError');
    });
  });

  describe('ElevenLabsSynthesisError', () => {
    it('should extend ElevenLabsError', () => {
      const error = new ElevenLabsSynthesisError('Synthesis failed');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ElevenLabsError);
      expect(error).toBeInstanceOf(ElevenLabsSynthesisError);
      expect(error.message).toBe('Synthesis failed');
      expect(error.name).toBe('ElevenLabsSynthesisError');
    });
  });
});
