/**
 * TypeScript error classes and types for service error handling
 * These replace the Ruby exception classes with TypeScript error classes.
 * In Rails, each service defines its own error hierarchy (e.g., CursorRunnerService::Error,
 * ElevenLabsSpeechToTextService::Error), but in TypeScript we create a unified error
 * hierarchy that can be used across all services.
 *
 * Based on error classes in:
 * - jarek-va/app/services/cursor_runner_service.rb (lines 11-14)
 * - jarek-va/app/services/eleven_labs_speech_to_text_service.rb (lines 9-13)
 * - jarek-va/app/services/eleven_labs_text_to_speech_service.rb (lines 10-14)
 */

/**
 * Base error class for all service errors
 * Extends the standard Error class and maintains error message and stack trace
 * This unified base class replaces service-specific base error classes from Rails
 * (e.g., CursorRunnerService::Error, ElevenLabsSpeechToTextService::Error)
 */
export class ServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ServiceError';
    Object.setPrototypeOf(this, ServiceError.prototype);
  }
}

/**
 * Connection error for service operations
 * Used for connection failures (ECONNREFUSED, EHOSTUNREACH, SocketError)
 * Used in CursorRunnerService, ElevenLabsSpeechToTextService, and ElevenLabsTextToSpeechService
 */
export class ConnectionError extends ServiceError {
  constructor(message: string) {
    super(message);
    this.name = 'ConnectionError';
    Object.setPrototypeOf(this, ConnectionError.prototype);
  }
}

/**
 * Timeout error for service operations
 * Used for timeout errors (Net::OpenTimeout, Net::ReadTimeout)
 * Used in CursorRunnerService, ElevenLabsSpeechToTextService, and ElevenLabsTextToSpeechService
 */
export class TimeoutError extends ServiceError {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

/**
 * Invalid response error for service operations
 * Used for JSON parsing errors (JSON::ParserError)
 * Used in CursorRunnerService, ElevenLabsSpeechToTextService, and ElevenLabsTextToSpeechService
 */
export class InvalidResponseError extends ServiceError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidResponseError';
    Object.setPrototypeOf(this, InvalidResponseError.prototype);
  }
}

/**
 * Transcription error for ElevenLabs Speech-to-Text service
 * Used for ElevenLabs STT-specific errors (no text returned, API errors)
 * Used only in ElevenLabsSpeechToTextService
 */
export class TranscriptionError extends ServiceError {
  constructor(message: string) {
    super(message);
    this.name = 'TranscriptionError';
    Object.setPrototypeOf(this, TranscriptionError.prototype);
  }
}

/**
 * Synthesis error for ElevenLabs Text-to-Speech service
 * Used for ElevenLabs TTS-specific errors (API errors during synthesis)
 * Used only in ElevenLabsTextToSpeechService
 */
export class SynthesisError extends ServiceError {
  constructor(message: string) {
    super(message);
    this.name = 'SynthesisError';
    Object.setPrototypeOf(this, SynthesisError.prototype);
  }
}
