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

// Mock fs
jest.mock('fs', () => {
  const actualFs = jest.requireActual('fs');
  return {
    ...actualFs,
    promises: {
      access: jest.fn(),
      unlink: jest.fn(),
    },
  };
});

import SystemSetting from '../../../src/models/system-setting';
import { promises as fs } from 'fs';

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
  sendTextAsAudio: (
    chatId: number,
    text: string,
    messageId: number | undefined
  ) => Promise<void>;
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

  describe('sendTextAsAudio', () => {
    const testChatId = 12345;
    const testText = 'Test message';
    const testMessageId = 67890;
    const testAudioPath = '/tmp/test-audio.mp3';

    beforeEach(() => {
      jest.clearAllMocks();
      (fs.access as jest.Mock).mockResolvedValue(undefined);
      (fs.unlink as jest.Mock).mockResolvedValue(undefined);
    });

    it('should successfully generate audio and send as voice message', async () => {
      // Mock synthesize to return audio file path
      const mockSynthesize = jest.fn().mockResolvedValue(testAudioPath);
      (ElevenLabsTextToSpeechService as jest.MockedClass<typeof ElevenLabsTextToSpeechService>).mockImplementation(() => {
        return {
          synthesize: mockSynthesize,
        } as any;
      });

      // Mock sendVoice to succeed
      mockTelegramService.sendVoice.mockResolvedValue({ ok: true } as any);

      await controller.sendTextAsAudio(testChatId, testText, testMessageId);

      // Verify synthesize was called with correct text
      expect(mockSynthesize).toHaveBeenCalledWith(testText);

      // Verify sendVoice was called with correct parameters
      expect(mockTelegramService.sendVoice).toHaveBeenCalledWith(
        testChatId,
        testAudioPath,
        testMessageId
      );

      // Verify cleanup was attempted
      expect(fs.access).toHaveBeenCalledWith(testAudioPath);
      expect(fs.unlink).toHaveBeenCalledWith(testAudioPath);
    });

    it('should successfully generate audio and send as voice message without messageId', async () => {
      // Mock synthesize to return audio file path
      const mockSynthesize = jest.fn().mockResolvedValue(testAudioPath);
      (ElevenLabsTextToSpeechService as jest.MockedClass<typeof ElevenLabsTextToSpeechService>).mockImplementation(() => {
        return {
          synthesize: mockSynthesize,
        } as any;
      });

      // Mock sendVoice to succeed
      mockTelegramService.sendVoice.mockResolvedValue({ ok: true } as any);

      await controller.sendTextAsAudio(testChatId, testText, undefined);

      // Verify sendVoice was called without messageId
      expect(mockTelegramService.sendVoice).toHaveBeenCalledWith(
        testChatId,
        testAudioPath,
        undefined
      );
    });

    it('should fallback to text message when audio generation fails', async () => {
      const testError = new Error('Audio generation failed');
      
      // Mock synthesize to throw error
      const mockSynthesize = jest.fn().mockRejectedValue(testError);
      (ElevenLabsTextToSpeechService as jest.MockedClass<typeof ElevenLabsTextToSpeechService>).mockImplementation(() => {
        return {
          synthesize: mockSynthesize,
        } as any;
      });

      // Mock sendMessage to succeed
      mockTelegramService.sendMessage.mockResolvedValue({ ok: true } as any);

      await controller.sendTextAsAudio(testChatId, testText, testMessageId);

      // Verify synthesize was called
      expect(mockSynthesize).toHaveBeenCalledWith(testText);

      // Verify sendVoice was NOT called
      expect(mockTelegramService.sendVoice).not.toHaveBeenCalled();

      // Verify fallback to sendMessage with Markdown parse mode
      expect(mockTelegramService.sendMessage).toHaveBeenCalledWith(
        testChatId,
        testText,
        'Markdown',
        testMessageId
      );
    });

    it('should fallback to text message when sendVoice fails', async () => {
      const testError = new Error('Send voice failed');
      
      // Mock synthesize to succeed
      const mockSynthesize = jest.fn().mockResolvedValue(testAudioPath);
      (ElevenLabsTextToSpeechService as jest.MockedClass<typeof ElevenLabsTextToSpeechService>).mockImplementation(() => {
        return {
          synthesize: mockSynthesize,
        } as any;
      });

      // Mock sendVoice to throw error
      mockTelegramService.sendVoice.mockRejectedValue(testError);

      // Mock sendMessage to succeed
      mockTelegramService.sendMessage.mockResolvedValue({ ok: true } as any);

      await controller.sendTextAsAudio(testChatId, testText, testMessageId);

      // Verify synthesize was called
      expect(mockSynthesize).toHaveBeenCalledWith(testText);

      // Verify sendVoice was called
      expect(mockTelegramService.sendVoice).toHaveBeenCalledWith(
        testChatId,
        testAudioPath,
        testMessageId
      );

      // Verify fallback to sendMessage
      expect(mockTelegramService.sendMessage).toHaveBeenCalledWith(
        testChatId,
        testText,
        'Markdown',
        testMessageId
      );

      // Verify cleanup was attempted
      expect(fs.access).toHaveBeenCalledWith(testAudioPath);
      expect(fs.unlink).toHaveBeenCalledWith(testAudioPath);
    });

    it('should clean up audio file after successful send', async () => {
      // Mock synthesize to return audio file path
      const mockSynthesize = jest.fn().mockResolvedValue(testAudioPath);
      (ElevenLabsTextToSpeechService as jest.MockedClass<typeof ElevenLabsTextToSpeechService>).mockImplementation(() => {
        return {
          synthesize: mockSynthesize,
        } as any;
      });

      // Mock sendVoice to succeed
      mockTelegramService.sendVoice.mockResolvedValue({ ok: true } as any);

      await controller.sendTextAsAudio(testChatId, testText, testMessageId);

      // Verify cleanup was attempted
      expect(fs.access).toHaveBeenCalledWith(testAudioPath);
      expect(fs.unlink).toHaveBeenCalledWith(testAudioPath);
    });

    it('should handle cleanup when file does not exist gracefully', async () => {
      // Mock synthesize to return audio file path
      const mockSynthesize = jest.fn().mockResolvedValue(testAudioPath);
      (ElevenLabsTextToSpeechService as jest.MockedClass<typeof ElevenLabsTextToSpeechService>).mockImplementation(() => {
        return {
          synthesize: mockSynthesize,
        } as any;
      });

      // Mock sendVoice to succeed
      mockTelegramService.sendVoice.mockResolvedValue({ ok: true } as any);

      // Mock fs.access to throw ENOENT error (file doesn't exist)
      const enoentError = new Error('File not found') as any;
      enoentError.code = 'ENOENT';
      (fs.access as jest.Mock).mockRejectedValue(enoentError);

      await controller.sendTextAsAudio(testChatId, testText, testMessageId);

      // Verify cleanup was attempted
      expect(fs.access).toHaveBeenCalledWith(testAudioPath);
      // unlink should not be called if access fails with ENOENT
      expect(fs.unlink).not.toHaveBeenCalled();
    });

    it('should handle cleanup errors gracefully and log warning', async () => {
      // Mock synthesize to return audio file path
      const mockSynthesize = jest.fn().mockResolvedValue(testAudioPath);
      (ElevenLabsTextToSpeechService as jest.MockedClass<typeof ElevenLabsTextToSpeechService>).mockImplementation(() => {
        return {
          synthesize: mockSynthesize,
        } as any;
      });

      // Mock sendVoice to succeed
      mockTelegramService.sendVoice.mockResolvedValue({ ok: true } as any);

      // Mock fs.unlink to throw error
      const deleteError = new Error('Permission denied');
      (fs.unlink as jest.Mock).mockRejectedValue(deleteError);

      await controller.sendTextAsAudio(testChatId, testText, testMessageId);

      // Verify cleanup was attempted
      expect(fs.access).toHaveBeenCalledWith(testAudioPath);
      expect(fs.unlink).toHaveBeenCalledWith(testAudioPath);
    });

    it('should handle cleanup when audioPath is null', async () => {
      const testError = new Error('Audio generation failed');
      
      // Mock synthesize to throw error before setting audioPath
      const mockSynthesize = jest.fn().mockRejectedValue(testError);
      (ElevenLabsTextToSpeechService as jest.MockedClass<typeof ElevenLabsTextToSpeechService>).mockImplementation(() => {
        return {
          synthesize: mockSynthesize,
        } as any;
      });

      // Mock sendMessage to succeed
      mockTelegramService.sendMessage.mockResolvedValue({ ok: true } as any);

      await controller.sendTextAsAudio(testChatId, testText, testMessageId);

      // Verify cleanup was NOT attempted (audioPath is null)
      expect(fs.access).not.toHaveBeenCalled();
      expect(fs.unlink).not.toHaveBeenCalled();
    });
  });
});
