/**
 * Service for converting speech to text using ElevenLabs API
 * 
 * This service provides methods to transcribe audio files and audio IO objects
 * using the ElevenLabs Speech-to-Text API.
 * 
 * Reference: jarek-va/app/services/eleven_labs_speech_to_text_service.rb
 */

// Custom error classes for ElevenLabs Speech-to-Text Service
/**
 * Base error class for ElevenLabs Speech-to-Text Service
 */
export class Error extends globalThis.Error {
  constructor(message: string) {
    super(message);
    this.name = 'ElevenLabsSpeechToTextService.Error';
    Object.setPrototypeOf(this, Error.prototype);
  }
}

/**
 * Connection error - raised when connection to ElevenLabs API fails
 */
export class ConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ElevenLabsSpeechToTextService.ConnectionError';
    Object.setPrototypeOf(this, ConnectionError.prototype);
  }
}

/**
 * Timeout error - raised when request to ElevenLabs API times out
 */
export class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ElevenLabsSpeechToTextService.TimeoutError';
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

/**
 * Invalid response error - raised when response from ElevenLabs API cannot be parsed or is invalid
 */
export class InvalidResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ElevenLabsSpeechToTextService.InvalidResponseError';
    Object.setPrototypeOf(this, InvalidResponseError.prototype);
  }
}

/**
 * Transcription error - raised when transcription operation fails
 */
export class TranscriptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ElevenLabsSpeechToTextService.TranscriptionError';
    Object.setPrototypeOf(this, TranscriptionError.prototype);
  }
}

/**
 * API constants
 * Note: API_BASE_URL and TRANSCRIPTION_ENDPOINT will be used in method implementations (PHASE2-046, PHASE2-047, etc.)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const API_BASE_URL = 'https://api.elevenlabs.io';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const TRANSCRIPTION_ENDPOINT = '/v1/speech-to-text';
const DEFAULT_TIMEOUT = 60; // seconds
const DEFAULT_MODEL_ID = 'scribe_v1'; // Default speech-to-text model

/**
 * Service for converting speech to text using ElevenLabs API
 */
class ElevenLabsSpeechToTextService {
  private readonly _apiKey: string;
  private readonly _timeout: number;
  private readonly _modelId: string;

  /**
   * Creates a new ElevenLabsSpeechToTextService instance
   * 
   * @param apiKey - ElevenLabs API key. If not provided, reads from ELEVENLABS_API_KEY environment variable
   * @param timeout - Request timeout in seconds. If not provided, defaults to DEFAULT_TIMEOUT (60 seconds)
   * @param modelId - Model ID for transcription. If not provided, reads from ELEVENLABS_STT_MODEL_ID environment variable or defaults to DEFAULT_MODEL_ID
   * @throws Error if API key is not configured
   */
  constructor(apiKey?: string, timeout?: number, modelId?: string) {
    // Read API key from parameter or environment variable
    this._apiKey = apiKey || process.env.ELEVENLABS_API_KEY || '';
    
    // Read timeout from parameter or use default
    this._timeout = timeout || DEFAULT_TIMEOUT;
    
    // Read model ID from parameter, environment variable, or use default
    this._modelId = modelId || process.env.ELEVENLABS_STT_MODEL_ID || DEFAULT_MODEL_ID;

    // Validate that API key is not blank/empty
    if (!this._apiKey || this._apiKey.trim().length === 0) {
      throw new Error('ElevenLabs API key is not configured');
    }
  }

  /**
   * Getter for API key (read-only access)
   */
  get apiKey(): string {
    return this._apiKey;
  }

  /**
   * Getter for timeout (read-only access)
   */
  get timeout(): number {
    return this._timeout;
  }

  /**
   * Getter for model ID (read-only access)
   */
  get modelId(): string {
    return this._modelId;
  }
}

export default ElevenLabsSpeechToTextService;
