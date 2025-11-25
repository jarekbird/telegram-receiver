/**
 * Unit tests for CursorRunnerCallbackController
 * Tests formatErrorMessage method implementation (PHASE2-072)
 * 
 * Reference: jarek-va/app/controllers/cursor_runner_callback_controller.rb (lines 279-282)
 */

import CursorRunnerCallbackController from '../../../src/controllers/cursor-runner-callback-controller';
import CursorRunnerCallbackService from '../../../src/services/cursor-runner-callback-service';
import TelegramService from '../../../src/services/telegram-service';
import ElevenLabsTextToSpeechService from '../../../src/services/elevenlabs-text-to-speech-service';

// Mock logger
jest.mock('../../../src/utils/logger', () => {
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };
  return {
    __esModule: true,
    default: mockLogger,
  };
});

// Mock pino
jest.mock('../../../src/config/logger', () => {
  return {
    __esModule: true,
    default: {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    },
  };
});

// Mock services
jest.mock('../../../src/services/cursor-runner-callback-service');
jest.mock('../../../src/services/telegram-service');
jest.mock('../../../src/services/elevenlabs-text-to-speech-service');

// Mock SystemSetting
jest.mock('../../../src/models/system-setting', () => {
  return {
    __esModule: true,
    default: {
      enabled: jest.fn(),
    },
  };
});

import SystemSetting from '../../../src/models/system-setting';

// Type for accessing private methods in tests
type ControllerWithPrivateMethods = CursorRunnerCallbackController & {
  formatErrorMessage: (
    result: {
      success: boolean;
      request_id: string;
      repository?: string;
      branch_name?: string;
      iterations: number;
      max_iterations: number;
      output: string;
      error?: string;
      exit_code: number;
      duration?: string;
      timestamp?: string;
    },
    cursorDebug: boolean
  ) => string;
  cleanAnsiEscapeSequences: (text: string) => string;
};

describe('CursorRunnerCallbackController - formatErrorMessage', () => {
  let controller: ControllerWithPrivateMethods;
  let mockCallbackService: jest.Mocked<CursorRunnerCallbackService>;
  let mockTelegramService: jest.Mocked<TelegramService>;
  let mockTextToSpeechService: jest.Mocked<ElevenLabsTextToSpeechService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCallbackService = new CursorRunnerCallbackService() as jest.Mocked<CursorRunnerCallbackService>;
    mockTelegramService = new TelegramService() as jest.Mocked<TelegramService>;
    mockTextToSpeechService = new ElevenLabsTextToSpeechService() as jest.Mocked<ElevenLabsTextToSpeechService>;

    controller = new CursorRunnerCallbackController(
      mockCallbackService,
      mockTelegramService,
      mockTextToSpeechService
    ) as ControllerWithPrivateMethods;
  });

  describe('formatErrorMessage', () => {
    it('should format error message without debug mode', () => {
      const result = {
        success: false,
        request_id: 'test-123',
        error: 'Test error message',
        iterations: 0,
        max_iterations: 25,
        output: '',
        exit_code: 1,
      };

      const formatted = controller.formatErrorMessage(result, false);

      expect(formatted).toBe('❌ Test error message');
    });

    it('should format error message with debug mode', () => {
      const result = {
        success: false,
        request_id: 'test-123',
        error: 'Test error message',
        iterations: 0,
        max_iterations: 25,
        output: '',
        exit_code: 1,
      };

      const formatted = controller.formatErrorMessage(result, true);

      expect(formatted).toBe('❌ Cursor command failed\n\nError: Test error message');
    });

    it('should use fallback message when error is missing', () => {
      const result = {
        success: false,
        request_id: 'test-123',
        iterations: 0,
        max_iterations: 25,
        output: '',
        exit_code: 1,
      };

      const formatted = controller.formatErrorMessage(result, false);

      expect(formatted).toBe('❌ Unknown error occurred');
    });

    it('should use fallback message when error is empty string', () => {
      const result = {
        success: false,
        request_id: 'test-123',
        error: '',
        iterations: 0,
        max_iterations: 25,
        output: '',
        exit_code: 1,
      };

      const formatted = controller.formatErrorMessage(result, false);

      expect(formatted).toBe('❌ Unknown error occurred');
    });

    it('should use fallback message when error is undefined', () => {
      const result = {
        success: false,
        request_id: 'test-123',
        error: undefined,
        iterations: 0,
        max_iterations: 25,
        output: '',
        exit_code: 1,
      };

      const formatted = controller.formatErrorMessage(result, false);

      expect(formatted).toBe('❌ Unknown error occurred');
    });

    it('should clean ANSI escape sequences from error message', () => {
      const result = {
        success: false,
        request_id: 'test-123',
        error: '\u001b[31mError message\u001b[0m',
        iterations: 0,
        max_iterations: 25,
        output: '',
        exit_code: 1,
      };

      // Mock cleanAnsiEscapeSequences to return cleaned text
      controller.cleanAnsiEscapeSequences = jest.fn((text: string) => {
        return text.replace(/\u001b\[[?0-9;]*[a-zA-Z]/g, '');
      });

      const formatted = controller.formatErrorMessage(result, false);

      expect(controller.cleanAnsiEscapeSequences).toHaveBeenCalledWith('\u001b[31mError message\u001b[0m');
      expect(formatted).toBe('❌ Error message');
    });

    it('should handle error with newlines and special characters', () => {
      const result = {
        success: false,
        request_id: 'test-123',
        error: 'Error: Something went wrong\nLine 2',
        iterations: 0,
        max_iterations: 25,
        output: '',
        exit_code: 1,
      };

      const formatted = controller.formatErrorMessage(result, false);

      expect(formatted).toBe('❌ Error: Something went wrong\nLine 2');
    });

    it('should format error with debug mode and fallback message', () => {
      const result = {
        success: false,
        request_id: 'test-123',
        iterations: 0,
        max_iterations: 25,
        output: '',
        exit_code: 1,
      };

      const formatted = controller.formatErrorMessage(result, true);

      expect(formatted).toBe('❌ Cursor command failed\n\nError: Unknown error occurred');
    });

    it('should handle null result gracefully', () => {
      const result = {
        success: false,
        request_id: 'test-123',
        error: null as any,
        iterations: 0,
        max_iterations: 25,
        output: '',
        exit_code: 1,
      };

      const formatted = controller.formatErrorMessage(result, false);

      expect(formatted).toBe('❌ Unknown error occurred');
    });
  });
});
