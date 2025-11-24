/**
 * Service for converting speech to text using ElevenLabs API
 * 
 * This service provides methods to transcribe audio files and audio IO objects
 * using the ElevenLabs Speech-to-Text API.
 * 
 * Reference: jarek-va/app/services/eleven_labs_speech_to_text_service.rb
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import axios, { AxiosError } from 'axios';
import FormData from 'form-data';
import logger from '@/utils/logger';

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
 */
const API_BASE_URL = 'https://api.elevenlabs.io';
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

  /**
   * Transcribe audio file to text
   * 
   * @param audioFilePath - Path to the audio file to transcribe
   * @param language - Optional language code (e.g., 'en', 'es', 'fr')
   * @returns Promise resolving to the transcribed text
   * @throws Error if audioFilePath is blank/null
   * @throws Error if file doesn't exist
   * @throws TranscriptionError if HTTP response is not successful or transcribed text is blank
   * @throws InvalidResponseError if JSON parsing fails
   * @throws ConnectionError for network connection issues
   * @throws TimeoutError for request timeouts
   */
  async transcribe(audioFilePath: string, language?: string): Promise<string> {
    // Validate audioFilePath parameter is not blank/null
    if (!audioFilePath || audioFilePath.trim().length === 0) {
      throw new Error('Audio file path is required');
    }

    // Validate file exists at the given path
    try {
      await fs.access(audioFilePath);
    } catch (accessError: any) {
      if (accessError.code === 'ENOENT') {
        throw new Error(`Audio file does not exist: ${accessError.message}`);
      }
      throw accessError;
    }

    // Read file content as binary data
    let fileContent: Buffer;
    try {
      fileContent = await fs.readFile(audioFilePath);
    } catch (readError: any) {
      if (readError.code === 'ENOENT') {
        throw new Error(`Audio file not found: ${readError.message}`);
      }
      throw new Error(`Failed to read audio file: ${readError.message}`);
    }

    // Extract filename from file path using basename
    const filename = path.basename(audioFilePath);

    // Create multipart form data
    const formData = new FormData();
    formData.append('file', fileContent, {
      filename: filename,
    });
    formData.append('model_id', this._modelId);
    
    // Add language field only if language parameter is provided
    if (language !== undefined && language !== null && language.trim().length > 0) {
      formData.append('language', language);
    }

    // Build HTTP POST request URL
    const url = `${API_BASE_URL}${TRANSCRIPTION_ENDPOINT}`;

    // Log when sending audio file for transcription
    logger.info(`Sending audio file to ElevenLabs for transcription: ${audioFilePath}`);

    try {
      // Execute HTTP request with timeout handling
      const response = await axios.post(url, formData, {
        headers: {
          'xi-api-key': this._apiKey,
          ...formData.getHeaders(),
        },
        timeout: this._timeout * 1000, // Convert seconds to milliseconds
      });

      // Parse JSON response
      let result: any;
      try {
        result = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
      } catch (parseError: any) {
        throw new InvalidResponseError(`Failed to parse response: ${parseError.message}`);
      }

      // Extract text field from response (handle both string and symbol keys)
      const transcribedText = result.text || result['text'] || '';

      // Validate transcribed text is not blank
      if (!transcribedText || transcribedText.trim().length === 0) {
        throw new TranscriptionError('No text returned from transcription');
      }

      // Log successful transcription (include first 50 characters of transcribed text)
      const preview = transcribedText.length > 50 
        ? `${transcribedText.substring(0, 50)}...` 
        : transcribedText;
      logger.info(`Successfully transcribed audio: ${preview}`);

      // Return transcribed text string
      return transcribedText;
    } catch (error: any) {
      // Handle HTTP error responses (non-2xx status codes)
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        
        // Handle timeout errors
        if (axiosError.code === 'ECONNABORTED' || (axiosError.message && axiosError.message.includes('timeout'))) {
          throw new TimeoutError(`Request to ElevenLabs timed out: ${axiosError.message || 'Request timeout'}`);
        }

        // Handle connection errors
        if (
          axiosError.code === 'ECONNREFUSED' ||
          axiosError.code === 'EHOSTUNREACH' ||
          axiosError.code === 'ENOTFOUND' ||
          axiosError.code === 'ETIMEDOUT'
        ) {
          throw new ConnectionError(`Failed to connect to ElevenLabs: ${axiosError.message}`);
        }

        // Handle HTTP error responses (non-2xx status codes)
        if (axiosError.response) {
          const status = axiosError.response.status;
          const statusText = axiosError.response.statusText;
          let errorMessage = `HTTP ${status}: ${statusText}`;

          // Log error response body (first 500 characters) for debugging
          const responseBody = axiosError.response.data 
            ? String(axiosError.response.data).substring(0, 500)
            : '';
          logger.error(`ElevenLabs API error: ${status} - Response body: ${responseBody}`);

          // Extract error message from response body JSON if available
          try {
            const errorBody = typeof axiosError.response.data === 'string'
              ? JSON.parse(axiosError.response.data)
              : axiosError.response.data;
            
            if (errorBody && typeof errorBody === 'object') {
              errorMessage = errorBody.detail || errorBody.error || errorBody.message || errorMessage;
            }
          } catch (jsonError) {
            // Failed to parse error response as JSON - use default error message
            logger.error('Failed to parse error response as JSON');
          }

          throw new TranscriptionError(errorMessage);
        }

        // Handle other axios errors (network errors, etc.)
        throw new ConnectionError(`Failed to connect to ElevenLabs: ${axiosError.message || 'Connection error'}`);
      }

      // Re-throw custom errors (Error, TranscriptionError, InvalidResponseError, etc.)
      if (
        error instanceof Error ||
        error instanceof TranscriptionError ||
        error instanceof InvalidResponseError ||
        error instanceof ConnectionError ||
        error instanceof TimeoutError
      ) {
        throw error;
      }

      // Handle unexpected errors
      throw new Error(`Unexpected error during transcription: ${String(error)}`);
    }
  }
}

export default ElevenLabsSpeechToTextService;
