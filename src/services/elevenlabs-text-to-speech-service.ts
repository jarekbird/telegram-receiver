/**
 * Service for converting text to speech using ElevenLabs API
 * 
 * This service provides methods to synthesize text to speech and save to files
 * or return as streams using the ElevenLabs Text-to-Speech API.
 * 
 * Reference: jarek-va/app/services/eleven_labs_text_to_speech_service.rb
 */

import { URL } from 'url';
import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
import logger from '@/utils/logger';

// Custom error classes for ElevenLabs Text-to-Speech Service
/**
 * Base error class for ElevenLabs Text-to-Speech Service
 */
export class ElevenLabsTextToSpeechServiceError extends globalThis.Error {
  constructor(message: string) {
    super(message);
    this.name = 'ElevenLabsTextToSpeechServiceError';
    Object.setPrototypeOf(this, ElevenLabsTextToSpeechServiceError.prototype);
  }
}

/**
 * Connection error - raised when connection to ElevenLabs API fails
 */
export class ConnectionError extends ElevenLabsTextToSpeechServiceError {
  constructor(message: string) {
    super(message);
    this.name = 'ElevenLabsTextToSpeechService.ConnectionError';
    Object.setPrototypeOf(this, ConnectionError.prototype);
  }
}

/**
 * Timeout error - raised when request to ElevenLabs API times out
 */
export class TimeoutError extends ElevenLabsTextToSpeechServiceError {
  constructor(message: string) {
    super(message);
    this.name = 'ElevenLabsTextToSpeechService.TimeoutError';
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

/**
 * Invalid response error - raised when response from ElevenLabs API cannot be parsed or is invalid
 */
export class InvalidResponseError extends ElevenLabsTextToSpeechServiceError {
  constructor(message: string) {
    super(message);
    this.name = 'ElevenLabsTextToSpeechService.InvalidResponseError';
    Object.setPrototypeOf(this, InvalidResponseError.prototype);
  }
}

/**
 * Synthesis error - raised when synthesis operation fails
 */
export class SynthesisError extends ElevenLabsTextToSpeechServiceError {
  constructor(message: string) {
    super(message);
    this.name = 'ElevenLabsTextToSpeechService.SynthesisError';
    Object.setPrototypeOf(this, SynthesisError.prototype);
  }
}

/**
 * API constants
 */
const API_BASE_URL = 'https://api.elevenlabs.io'; // Will be used in method implementations
const TEXT_TO_SPEECH_ENDPOINT = '/v1/text-to-speech'; // Will be used in method implementations
const DEFAULT_TIMEOUT = 60; // seconds
const DEFAULT_MODEL_ID = 'eleven_turbo_v2_5'; // Default text-to-speech model
const DEFAULT_VOICE_ID = 'vfaqCOvlrKi4Zp7C2IAm'; // Default voice ID
const DEFAULT_OUTPUT_FORMAT = 'mp3_44100_128'; // MP3 format, 44.1kHz, 128kbps (will be used in method implementations)

/**
 * HTTP client type - Axios instance
 */
type HttpClient = AxiosInstance;

/**
 * HTTP request type - Axios request config
 */
type HttpRequest = {
  method: string;
  url: string;
  headers: Record<string, string>;
  data?: unknown;
  responseType: 'arraybuffer' | 'json' | 'text' | 'blob' | 'document' | 'stream';
  timeout: number;
};

/**
 * HTTP response type - Axios response with arraybuffer body
 */
type HttpResponse = AxiosResponse<ArrayBuffer>;

/**
 * Service for converting text to speech using ElevenLabs API
 */
class ElevenLabsTextToSpeechService {
  private readonly _apiKey: string;
  private readonly _timeout: number;
  private readonly _modelId: string;
  private readonly _voiceId: string;

  /**
   * Creates a new ElevenLabsTextToSpeechService instance
   * 
   * @param apiKey - ElevenLabs API key. If not provided, reads from ELEVENLABS_API_KEY environment variable
   * @param timeout - Request timeout in seconds. If not provided, defaults to DEFAULT_TIMEOUT (60 seconds)
   * @param modelId - Model ID for synthesis. If not provided, reads from ELEVENLABS_TTS_MODEL_ID environment variable or defaults to DEFAULT_MODEL_ID
   * @param voiceId - Voice ID for synthesis. If not provided, reads from ELEVENLABS_VOICE_ID environment variable or defaults to DEFAULT_VOICE_ID
   * @throws ElevenLabsTextToSpeechServiceError if API key is not configured
   */
  constructor(apiKey?: string, timeout?: number, modelId?: string, voiceId?: string) {
    // Read API key from parameter or environment variable
    this._apiKey = apiKey || process.env.ELEVENLABS_API_KEY || '';
    
    // Read timeout from parameter or use default
    this._timeout = timeout || DEFAULT_TIMEOUT;
    
    // Read model ID from parameter, environment variable, or use default
    this._modelId = modelId || process.env.ELEVENLABS_TTS_MODEL_ID || DEFAULT_MODEL_ID;
    
    // Read voice ID from parameter, environment variable, or use default
    this._voiceId = voiceId || process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID;

    // Validate that API key is not blank/empty
    if (!this._apiKey || this._apiKey.trim().length === 0) {
      throw new ElevenLabsTextToSpeechServiceError('ElevenLabs API key is not configured');
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
   * Getter for voice ID (read-only access)
   */
  get voiceId(): string {
    return this._voiceId;
  }

  /**
   * Checks if voice_id is configured (not blank)
   * 
   * @returns true if voice_id is configured, false otherwise
   */
  voiceIdConfigured(): boolean {
    return !!(this._voiceId && this._voiceId.trim().length > 0);
  }

  /**
   * Convert text to speech and save to file
   * 
   * @param text - Text to convert to speech
   * @param options - Optional parameters: outputPath (path to save audio file) and voiceSettings (voice configuration)
   * @returns Promise resolving to the path of the generated audio file
   * @throws ElevenLabsTextToSpeechServiceError if text is blank
   * @throws ElevenLabsTextToSpeechServiceError if voice_id is not configured
   * @throws SynthesisError if HTTP response is not successful
   * @throws InvalidResponseError if response cannot be parsed
   * @throws ConnectionError for network connection issues
   * @throws TimeoutError for request timeouts
   */
  async synthesize(
    text: string,
    options?: { outputPath?: string; voiceSettings?: object }
  ): Promise<string> {
    try {
      // Validate text parameter is not blank
      if (!text || text.trim().length === 0) {
        throw new ElevenLabsTextToSpeechServiceError('Text is required');
      }

      // Validate voice_id is configured
      if (!this.voiceIdConfigured()) {
        throw new ElevenLabsTextToSpeechServiceError('ElevenLabs voice_id is not configured');
      }

      // Build URI with voice_id in path
      const uri = new URL(`${API_BASE_URL}${TEXT_TO_SPEECH_ENDPOINT}/${this._voiceId}`);
      const http = this.buildHttp(uri);

      // Determine output path
      let outputPath: string;
      if (options?.outputPath) {
        outputPath = options.outputPath;
      } else {
        // Generate temp file path using random filename
        const randomHex = crypto.randomBytes(8).toString('hex');
        outputPath = path.join(os.tmpdir(), `elevenlabs_tts_${randomHex}.mp3`);
      }

      // Build request body JSON
      const body: {
        text: string;
        model_id: string;
        output_format: string;
        voice_settings?: object;
      } = {
        text: text,
        model_id: this._modelId,
        output_format: DEFAULT_OUTPUT_FORMAT,
      };
      if (options?.voiceSettings) {
        body.voice_settings = options.voiceSettings;
      }

      // Create POST request with headers
      const request: HttpRequest = {
        method: 'POST',
        url: uri.toString(),
        headers: {
          'xi-api-key': this._apiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        data: body,
        responseType: 'arraybuffer',
        timeout: this._timeout * 1000, // Convert seconds to milliseconds
      };

      // Log request info
      const textPreview = text.length > 50 ? `${text.substring(0, 50)}...` : text;
      logger.info(`Sending text to ElevenLabs for synthesis: ${textPreview}`);

      // Execute HTTP request
      let response: HttpResponse;
      try {
        response = await this.executeRequest(http, request, uri);
      } catch (error) {
        // Connection/timeout errors are handled in executeRequest
        // HTTP error responses are handled in executeRequest (raises SynthesisError)
        throw error;
      }

      // Save audio file to output path using binary write
      try {
        await fs.writeFile(outputPath, Buffer.from(response.data));
      } catch (error) {
        throw new ElevenLabsTextToSpeechServiceError(
          `Failed to write audio file to ${outputPath}: ${error instanceof Error ? error.message : String(error)}`
        );
      }

      // Log success
      logger.info(`Generated audio file: ${outputPath} (${response.data.byteLength} bytes)`);

      // Return output path string
      return outputPath;
    } catch (error) {
      // Catch JSON parsing errors and raise InvalidResponseError
      if (error instanceof SyntaxError && error.message.includes('JSON')) {
        throw new InvalidResponseError(`Failed to parse response: ${error.message}`);
      }
      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Convert text to speech and return as stream
   * 
   * @param text - Text to convert to speech
   * @param options - Optional parameters: voiceSettings (voice configuration)
   * @returns Promise resolving to a ReadableStream containing audio data
   * @throws ElevenLabsTextToSpeechServiceError if text is blank
   * @throws ElevenLabsTextToSpeechServiceError if voice_id is not configured
   * @throws SynthesisError if HTTP response is not successful
   * @throws InvalidResponseError if response cannot be parsed
   * @throws ConnectionError for network connection issues
   * @throws TimeoutError for request timeouts
   */
  async synthesizeToStream(
    text: string,
    _options?: { voiceSettings?: object }
  ): Promise<ReadableStream> {
    // Validate text parameter is not blank
    if (!text || text.trim().length === 0) {
      throw new ElevenLabsTextToSpeechServiceError('Text is required');
    }

    // Validate voice_id is configured
    if (!this.voiceIdConfigured()) {
      throw new ElevenLabsTextToSpeechServiceError('ElevenLabs voice_id is not configured');
    }

    // Method implementation will be added in subsequent tasks
    throw new Error('Method not yet implemented');
  }

  /**
   * Builds HTTP client with SSL and timeout configuration
   * 
   * @param uri - URL object for the request
   * @returns HTTP client instance
   * @throws ConnectionError for connection failures (ECONNREFUSED, EHOSTUNREACH, SocketError)
   * @throws TimeoutError for timeout errors (OpenTimeout, ReadTimeout)
   */
  private buildHttp(uri: URL): HttpClient {
    try {
      const http = axios.create({
        baseURL: `${uri.protocol}//${uri.host}`,
        timeout: this._timeout * 1000, // Convert seconds to milliseconds
        httpsAgent: uri.protocol === 'https:' ? undefined : undefined, // Axios handles SSL automatically
      });
      return http;
    } catch (error) {
      // Handle connection errors
      if (
        error instanceof Error &&
        (error.message.includes('ECONNREFUSED') ||
          error.message.includes('EHOSTUNREACH') ||
          error.message.includes('ENOTFOUND') ||
          error.message.includes('getaddrinfo'))
      ) {
        throw new ConnectionError(`Failed to connect to ElevenLabs: ${error.message}`);
      }
      // Handle timeout errors
      if (error instanceof Error && error.message.includes('timeout')) {
        throw new TimeoutError(`Request to ElevenLabs timed out: ${error.message}`);
      }
      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Executes HTTP request with error handling
   * 
   * @param http - HTTP client instance
   * @param request - HTTP request object
   * @param uri - URL object for the request
   * @returns Promise resolving to HTTP response
   * @throws SynthesisError for non-success HTTP responses (with extracted error messages from JSON error bodies)
   * @throws InvalidResponseError for JSON parsing failures
   * @throws TimeoutError for request timeouts
   * @throws ConnectionError for connection failures
   * 
   * Error response parsing:
   * - Handles both array and hash error response formats from ElevenLabs API
   * - For array errors: extracts 'msg' field from each error object
   * - For hash errors: extracts 'detail', 'error', or 'message' field
   * - If 'detail' is an array, extracts 'msg' from each item
   * 
   * Logging:
   * - Logs request path: "ElevenLabsTextToSpeechService: POST {uri.path}"
   * - Logs response code: "ElevenLabsTextToSpeechService: Response {code} {message}"
   * - Logs error details: "ElevenLabs API error: {code} - Response body: {body[0..500]}"
   */
  private async executeRequest(
    http: HttpClient,
    request: HttpRequest,
    uri: URL
  ): Promise<HttpResponse> {
    // Log request path
    logger.info(`ElevenLabsTextToSpeechService: POST ${uri.pathname}`);

    try {
      const response = await http.request<ArrayBuffer>({
        method: request.method as 'POST',
        url: request.url,
        headers: request.headers,
        data: request.data,
        responseType: 'arraybuffer',
        timeout: request.timeout,
      });

      // Log response code
      logger.info(`ElevenLabsTextToSpeechService: Response ${response.status} ${response.statusText}`);

      // Check if response is successful (status 200-299)
      if (response.status >= 200 && response.status < 300) {
        return response;
      }

      // Handle non-success HTTP responses
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      const responseBody = response.data ? Buffer.from(response.data).toString('utf-8') : '';
      const responseBodyPreview = responseBody.length > 500 ? responseBody.substring(0, 500) : responseBody;
      logger.error(`ElevenLabs API error: ${response.status} - Response body: ${responseBodyPreview}`);

      // Try to parse error response as JSON
      try {
        const errorBody = JSON.parse(responseBody);
        // Handle both array and hash error responses
        if (Array.isArray(errorBody)) {
          const errorMessages = errorBody
            .map((error) => {
              if (typeof error === 'object' && error !== null) {
                return (error as { msg?: string }).msg || String(error);
              }
              return String(error);
            })
            .filter((msg) => msg);
          if (errorMessages.length > 0) {
            errorMessage = errorMessages.join('; ');
          }
        } else if (typeof errorBody === 'object' && errorBody !== null) {
          // Try to extract error message from various fields
          const detail = (errorBody as { detail?: unknown }).detail;
          const error = (errorBody as { error?: string }).error;
          const message = (errorBody as { message?: string }).message;

          if (Array.isArray(detail)) {
            const errorMessages = detail
              .map((error) => {
                if (typeof error === 'object' && error !== null) {
                  return (error as { msg?: string }).msg || String(error);
                }
                return String(error);
              })
              .filter((msg) => msg);
            if (errorMessages.length > 0) {
              errorMessage = errorMessages.join('; ');
            }
          } else if (typeof detail === 'string') {
            errorMessage = detail;
          } else if (error) {
            errorMessage = error;
          } else if (message) {
            errorMessage = message;
          }
        }
      } catch (parseError) {
        // Failed to parse error response as JSON - use default error message
        logger.error('Failed to parse error response as JSON');
      }

      throw new SynthesisError(errorMessage);
    } catch (error) {
      // Handle JSON parsing errors first (before checking if it's an Axios error)
      if (error instanceof SyntaxError && error.message.includes('JSON')) {
        throw new InvalidResponseError(`Failed to parse response: ${error.message}`);
      }

      // Handle Axios errors
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;

        // Handle timeout errors
        if (axiosError.code === 'ECONNABORTED' || axiosError.message.includes('timeout')) {
          throw new TimeoutError(`Request to ElevenLabs timed out: ${axiosError.message}`);
        }

        // Handle connection errors
        if (
          axiosError.code === 'ECONNREFUSED' ||
          axiosError.code === 'EHOSTUNREACH' ||
          axiosError.code === 'ENOTFOUND' ||
          axiosError.message.includes('getaddrinfo')
        ) {
          throw new ConnectionError(`Failed to connect to ElevenLabs: ${axiosError.message}`);
        }

        // Handle HTTP error responses (already handled above, but catch here for safety)
        if (axiosError.response) {
          const response = axiosError.response;
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          const responseBody = response.data
            ? Buffer.isBuffer(response.data)
              ? response.data.toString('utf-8')
              : typeof response.data === 'string'
                ? response.data
                : JSON.stringify(response.data)
            : '';
          const responseBodyPreview = responseBody.length > 500 ? responseBody.substring(0, 500) : responseBody;
          logger.error(`ElevenLabs API error: ${response.status} - Response body: ${responseBodyPreview}`);

          // Try to parse error response as JSON
          try {
            const errorBody = JSON.parse(responseBody);
            if (Array.isArray(errorBody)) {
              const errorMessages = errorBody
                .map((error) => {
                  if (typeof error === 'object' && error !== null) {
                    return (error as { msg?: string }).msg || String(error);
                  }
                  return String(error);
                })
                .filter((msg) => msg);
              if (errorMessages.length > 0) {
                errorMessage = errorMessages.join('; ');
              }
            } else if (typeof errorBody === 'object' && errorBody !== null) {
              const detail = (errorBody as { detail?: unknown }).detail;
              const error = (errorBody as { error?: string }).error;
              const message = (errorBody as { message?: string }).message;

              if (Array.isArray(detail)) {
                const errorMessages = detail
                  .map((error) => {
                    if (typeof error === 'object' && error !== null) {
                      return (error as { msg?: string }).msg || String(error);
                    }
                    return String(error);
                  })
                  .filter((msg) => msg);
                if (errorMessages.length > 0) {
                  errorMessage = errorMessages.join('; ');
                }
              } else if (typeof detail === 'string') {
                errorMessage = detail;
              } else if (error) {
                errorMessage = error;
              } else if (message) {
                errorMessage = message;
              }
            }
          } catch (parseError) {
            // Failed to parse error response as JSON - use default error message
            logger.error('Failed to parse error response as JSON');
          }

          throw new SynthesisError(errorMessage);
        }

        // Re-throw as connection error for other network errors
        throw new ConnectionError(`Failed to connect to ElevenLabs: ${axiosError.message}`);
      }

      // Re-throw other errors
      throw error;
    }
  }
}

export default ElevenLabsTextToSpeechService;
