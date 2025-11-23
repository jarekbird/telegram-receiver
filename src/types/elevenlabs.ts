/**
 * TypeScript type definitions for ElevenLabs API
 * Based on the structure used in jarek-va/app/services/eleven_labs_speech_to_text_service.rb
 * and jarek-va/app/services/eleven_labs_text_to_speech_service.rb
 * These types are used for speech-to-text and text-to-speech operations.
 */

/**
 * Request interface for ElevenLabs Speech-to-Text (STT) API
 * Uses multipart/form-data format (not JSON)
 * Endpoint: POST /v1/speech-to-text
 */
export interface ElevenLabsTranscribeRequest {
  /**
   * Audio file content as Buffer or Readable stream for multipart/form-data in Node.js
   */
  file: Buffer | NodeJS.ReadableStream;
  /**
   * Filename for the audio file in multipart form (optional)
   */
  filename?: string;
  /**
   * Model ID for transcription (default: 'scribe_v1')
   */
  model_id?: string;
  /**
   * Optional language code (e.g., 'en', 'es', 'fr')
   */
  language?: string;
}

/**
 * Response interface for ElevenLabs Speech-to-Text (STT) API
 * Response is JSON with transcribed text
 */
export interface ElevenLabsTranscribeResponse {
  /**
   * The transcribed text (required)
   */
  text: string;
}

/**
 * Voice settings for ElevenLabs Text-to-Speech (TTS) API
 * Optional configuration for voice characteristics
 */
export interface ElevenLabsVoiceSettings {
  /**
   * Stability setting (typically 0-1)
   */
  stability?: number;
  /**
   * Similarity boost setting (typically 0-1)
   */
  similarity_boost?: number;
  /**
   * Style setting (if supported by the model)
   */
  style?: number;
  /**
   * Whether to use speaker boost
   */
  use_speaker_boost?: boolean;
  /**
   * Additional voice settings that may be supported
   */
  [key: string]: unknown;
}

/**
 * Request interface for ElevenLabs Text-to-Speech (TTS) API
 * Uses JSON format for request body
 * Endpoint: POST /v1/text-to-speech/{voice_id}
 */
export interface ElevenLabsSynthesizeRequest {
  /**
   * Text to convert to speech (required)
   */
  text: string;
  /**
   * Model ID for synthesis (default: 'eleven_turbo_v2_5')
   */
  model_id?: string;
  /**
   * Output format (default: 'mp3_44100_128')
   */
  output_format?: string;
  /**
   * Optional voice settings for voice configuration
   */
  voice_settings?: ElevenLabsVoiceSettings;
}

/**
 * Response type for ElevenLabs Text-to-Speech (TTS) API
 * TTS returns binary audio data (Buffer), not JSON
 * Content-Type: audio/mpeg
 */
export type ElevenLabsSynthesizeResponse = Buffer | ArrayBuffer;

/**
 * Object format error response for ElevenLabs API
 * STT typically returns objects with detail, error, or message fields
 */
export interface ElevenLabsErrorResponseObject {
  /**
   * Error detail - can be a string, array of strings, or array of objects with msg field
   * When detail is an array, extract msg fields from each item
   */
  detail?: string | string[] | Array<{ msg?: string }>;
  /**
   * Error message (optional)
   */
  error?: string;
  /**
   * Error message (optional, alternative field name)
   */
  message?: string;
}

/**
 * Array format error response for ElevenLabs API
 * TTS can return errors as arrays of objects with optional msg field
 */
export type ElevenLabsArrayErrorResponse = Array<{ msg?: string }>;

/**
 * Error response type for ElevenLabs API
 * Error responses can be objects or arrays
 * TTS handles both formats, STT typically returns objects
 * When detail is an array, extract msg fields from each item
 */
export type ElevenLabsErrorResponse =
  | ElevenLabsErrorResponseObject
  | ElevenLabsArrayErrorResponse;

/**
 * Base error class for ElevenLabs API errors
 * Extends the standard Error class
 */
export class ElevenLabsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ElevenLabsError';
    Object.setPrototypeOf(this, ElevenLabsError.prototype);
  }
}

/**
 * Connection error for ElevenLabs API
 * Raised when connection to ElevenLabs API fails
 */
export class ElevenLabsConnectionError extends ElevenLabsError {
  constructor(message: string) {
    super(message);
    this.name = 'ElevenLabsConnectionError';
    Object.setPrototypeOf(this, ElevenLabsConnectionError.prototype);
  }
}

/**
 * Timeout error for ElevenLabs API
 * Raised when request to ElevenLabs API times out
 */
export class ElevenLabsTimeoutError extends ElevenLabsError {
  constructor(message: string) {
    super(message);
    this.name = 'ElevenLabsTimeoutError';
    Object.setPrototypeOf(this, ElevenLabsTimeoutError.prototype);
  }
}

/**
 * Invalid response error for ElevenLabs API
 * Raised when response from ElevenLabs API cannot be parsed or is invalid
 */
export class ElevenLabsInvalidResponseError extends ElevenLabsError {
  constructor(message: string) {
    super(message);
    this.name = 'ElevenLabsInvalidResponseError';
    Object.setPrototypeOf(this, ElevenLabsInvalidResponseError.prototype);
  }
}

/**
 * Transcription error for ElevenLabs Speech-to-Text API
 * Raised when transcription operation fails
 */
export class ElevenLabsTranscriptionError extends ElevenLabsError {
  constructor(message: string) {
    super(message);
    this.name = 'ElevenLabsTranscriptionError';
    Object.setPrototypeOf(this, ElevenLabsTranscriptionError.prototype);
  }
}

/**
 * Synthesis error for ElevenLabs Text-to-Speech API
 * Raised when synthesis operation fails
 */
export class ElevenLabsSynthesisError extends ElevenLabsError {
  constructor(message: string) {
    super(message);
    this.name = 'ElevenLabsSynthesisError';
    Object.setPrototypeOf(this, ElevenLabsSynthesisError.prototype);
  }
}
