/**
 * Unit tests for TelegramMessageHandler (src/jobs/telegram-message-job.ts)
 * 
 * PHASE2-079: Tests for handleMessage method and helper methods
 * 
 * These tests verify that the handler correctly:
 * - Processes incoming Telegram messages
 * - Handles audio transcription
 * - Forwards messages to cursor-runner
 * - Processes local commands
 * - Sends responses (as audio if original was audio, otherwise as text)
 */

// Mock the logger utility first (before any imports)
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

jest.mock('../../../src/utils/logger', () => {
  return {
    __esModule: true,
    default: mockLogger,
  };
});

// Mock all services
const mockSendMessage = jest.fn();
const mockSendVoice = jest.fn();
const mockDownloadFile = jest.fn();
const mockAnswerCallbackQuery = jest.fn();

jest.mock('../../../src/services/telegram-service', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      sendMessage: mockSendMessage,
      sendVoice: mockSendVoice,
      downloadFile: mockDownloadFile,
      answerCallbackQuery: mockAnswerCallbackQuery,
    })),
  };
});

const mockIterate = jest.fn();
jest.mock('../../../src/services/cursorRunnerService', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      iterate: mockIterate,
    })),
    CursorRunnerServiceError: class extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'CursorRunnerServiceError';
      }
    },
  };
});

const mockStorePendingRequest = jest.fn();
const mockRemovePendingRequest = jest.fn();
jest.mock('../../../src/services/cursor-runner-callback-service', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      storePendingRequest: mockStorePendingRequest,
      removePendingRequest: mockRemovePendingRequest,
    })),
  };
});

const mockTranscribe = jest.fn();
jest.mock('../../../src/services/elevenlabs-speech-to-text-service', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      transcribe: mockTranscribe,
    })),
  };
});

const mockSynthesize = jest.fn();
jest.mock('../../../src/services/elevenlabs-text-to-speech-service', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      synthesize: mockSynthesize,
    })),
  };
});

const mockSystemSettingEnabled = jest.fn();
const mockSystemSettingDisabled = jest.fn();
jest.mock('../../../src/models/system-setting', () => {
  return {
    __esModule: true,
    default: {
      enabled: mockSystemSettingEnabled,
      disabled: mockSystemSettingDisabled,
    },
  };
});

// Mock fs
jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
    unlink: jest.fn(),
  },
}));

import TelegramMessageHandler from '../../../src/jobs/telegram-message-job';
import { TelegramUpdate, TelegramMessage } from '../../../src/types/telegram';
import { promises as fs } from 'fs';

const mockFs = fs as jest.Mocked<typeof fs>;

describe('TelegramMessageHandler', () => {
  let handler: TelegramMessageHandler;
  const mockChatId = 12345;
  const mockMessageId = 67890;

  beforeEach(() => {
    jest.clearAllMocks();
    handler = new TelegramMessageHandler();
    mockSystemSettingEnabled.mockReturnValue(false);
    mockSystemSettingDisabled.mockReturnValue(true);
  });

  describe('handleMessage - text messages', () => {
    it('should process a simple text message and forward to cursor-runner', async () => {
      const message: TelegramMessage = {
        message_id: mockMessageId,
        chat: { id: mockChatId },
        text: 'Hello, world!',
      };

      const update: TelegramUpdate = {
        message,
      };

      mockIterate.mockResolvedValue({ success: true });
      mockStorePendingRequest.mockReturnValue(undefined);

      await handler.execute(update);

      expect(mockIterate).toHaveBeenCalledWith(
        expect.objectContaining({
          repository: '',
          branchName: 'main',
          prompt: 'Hello, world!',
          maxIterations: 25,
        })
      );
      expect(mockStorePendingRequest).toHaveBeenCalled();
    });

    it('should process local /start command without forwarding', async () => {
      const message: TelegramMessage = {
        message_id: mockMessageId,
        chat: { id: mockChatId },
        text: '/start',
      };

      const update: TelegramUpdate = {
        message,
      };

      mockSendMessage.mockResolvedValue({ ok: true });

      await handler.execute(update);

      expect(mockIterate).not.toHaveBeenCalled();
      expect(mockSendMessage).toHaveBeenCalledWith(
        mockChatId,
        expect.stringContaining("Hello! I'm your Virtual Assistant"),
        'HTML',
        mockMessageId
      );
    });

    it('should process local /help command without forwarding', async () => {
      const message: TelegramMessage = {
        message_id: mockMessageId,
        chat: { id: mockChatId },
        text: '/help',
      };

      const update: TelegramUpdate = {
        message,
      };

      mockSendMessage.mockResolvedValue({ ok: true });

      await handler.execute(update);

      expect(mockIterate).not.toHaveBeenCalled();
      expect(mockSendMessage).toHaveBeenCalledWith(
        mockChatId,
        expect.stringContaining("Hello! I'm your Virtual Assistant"),
        'HTML',
        mockMessageId
      );
    });

    it('should process local /status command without forwarding', async () => {
      const message: TelegramMessage = {
        message_id: mockMessageId,
        chat: { id: mockChatId },
        text: '/status',
      };

      const update: TelegramUpdate = {
        message,
      };

      mockSendMessage.mockResolvedValue({ ok: true });

      await handler.execute(update);

      expect(mockIterate).not.toHaveBeenCalled();
      expect(mockSendMessage).toHaveBeenCalledWith(
        mockChatId,
        "✅ I'm online and ready to help!",
        'HTML',
        mockMessageId
      );
    });
  });

  describe('handleMessage - audio messages', () => {
    it('should transcribe audio and process as text', async () => {
      const message: TelegramMessage = {
        message_id: mockMessageId,
        chat: { id: mockChatId },
        voice: { file_id: 'voice-file-id-123' },
      };

      const update: TelegramUpdate = {
        message,
      };

      const transcribedText = 'This is the transcribed text';
      mockDownloadFile.mockResolvedValue('/tmp/audio-file.ogg');
      mockTranscribe.mockResolvedValue(transcribedText);
      mockFs.access.mockResolvedValue(undefined);
      mockFs.unlink.mockResolvedValue(undefined);
      mockIterate.mockResolvedValue({ success: true });
      mockStorePendingRequest.mockReturnValue(undefined);

      await handler.execute(update);

      expect(mockDownloadFile).toHaveBeenCalledWith('voice-file-id-123');
      expect(mockTranscribe).toHaveBeenCalledWith('/tmp/audio-file.ogg');
      expect(mockIterate).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: transcribedText,
        })
      );
    });

    it('should handle empty transcription result', async () => {
      const message: TelegramMessage = {
        message_id: mockMessageId,
        chat: { id: mockChatId },
        voice: { file_id: 'voice-file-id-123' },
      };

      const update: TelegramUpdate = {
        message,
      };

      mockDownloadFile.mockResolvedValue('/tmp/audio-file.ogg');
      mockTranscribe.mockResolvedValue('');
      mockFs.access.mockResolvedValue(undefined);
      mockFs.unlink.mockResolvedValue(undefined);
      mockSendMessage.mockResolvedValue({ ok: true });

      await handler.execute(update);

      expect(mockSendMessage).toHaveBeenCalledWith(
        mockChatId,
        expect.stringContaining("❌ Sorry, I couldn't transcribe"),
        'HTML',
        mockMessageId
      );
      expect(mockIterate).not.toHaveBeenCalled();
    });

    it('should handle transcription errors', async () => {
      const message: TelegramMessage = {
        message_id: mockMessageId,
        chat: { id: mockChatId },
        voice: { file_id: 'voice-file-id-123' },
      };

      const update: TelegramUpdate = {
        message,
      };

      const errorMessage = 'Transcription failed';
      mockDownloadFile.mockResolvedValue('/tmp/audio-file.ogg');
      mockTranscribe.mockRejectedValue(new Error(errorMessage));
      mockFs.access.mockResolvedValue(undefined);
      mockFs.unlink.mockResolvedValue(undefined);
      mockSendMessage.mockResolvedValue({ ok: true });

      await handler.execute(update);

      expect(mockSendMessage).toHaveBeenCalledWith(
        mockChatId,
        expect.stringContaining('❌ Error transcribing audio'),
        'HTML',
        mockMessageId
      );
      expect(mockIterate).not.toHaveBeenCalled();
    });

    it('should send audio response if original was audio and audio output is enabled', async () => {
      const message: TelegramMessage = {
        message_id: mockMessageId,
        chat: { id: mockChatId },
        voice: { file_id: 'voice-file-id-123' },
      };

      const update: TelegramUpdate = {
        message,
      };

      const transcribedText = 'Test message';
      mockDownloadFile.mockResolvedValue('/tmp/audio-file.ogg');
      mockTranscribe.mockResolvedValue(transcribedText);
      mockFs.access.mockResolvedValue(undefined);
      mockFs.unlink.mockResolvedValue(undefined);
      mockSystemSettingDisabled.mockReturnValue(false); // Audio output enabled
      mockSynthesize.mockResolvedValue('/tmp/output-audio.mp3');
      mockSendVoice.mockResolvedValue({ ok: true });

      await handler.execute(update);

      // Should not forward since it's a local command after transcription
      // Actually, let me check - if the transcribed text is not a local command, it should forward
      // But if it's a local command, it should process locally
      // Let me adjust the test to use a local command after transcription
      const messageWithLocalCommand: TelegramMessage = {
        message_id: mockMessageId,
        chat: { id: mockChatId },
        voice: { file_id: 'voice-file-id-123' },
      };

      const updateWithLocalCommand: TelegramUpdate = {
        message: messageWithLocalCommand,
      };

      mockTranscribe.mockResolvedValue('/status');
      mockSystemSettingDisabled.mockReturnValue(false);

      await handler.execute(updateWithLocalCommand);

      expect(mockSynthesize).toHaveBeenCalled();
      expect(mockSendVoice).toHaveBeenCalled();
    });
  });

  describe('handleMessage - error handling', () => {
    it('should send error message to user on handler failure', async () => {
      const message: TelegramMessage = {
        message_id: mockMessageId,
        chat: { id: mockChatId },
        text: 'Test message',
      };

      const update: TelegramUpdate = {
        message,
      };

      const error = new Error('Handler error');
      mockIterate.mockRejectedValue(error);
      mockSendMessage.mockResolvedValue({ ok: true });

      // Disable retries for this test to avoid timeout (test expects immediate rejection)
      await expect(
        handler.execute(update, {
          retryOptions: {
            attempts: 1, // Only 1 attempt (no retries)
            shouldRetry: () => false, // Don't retry any errors
          },
        })
      ).rejects.toThrow('Handler error');

      expect(mockSendMessage).toHaveBeenCalledWith(
        mockChatId,
        expect.stringContaining('Sorry, I encountered an error'),
        'HTML',
        mockMessageId
      );
    }, 30000); // Increase timeout to 30 seconds to account for error handling

    it('should handle missing chat_id gracefully', async () => {
      const message: TelegramMessage = {
        message_id: mockMessageId,
        chat: undefined as any,
        text: 'Test message',
      };

      const update: TelegramUpdate = {
        message,
      };

      await handler.execute(update);

      // Should not crash, but also should not process
      expect(mockIterate).not.toHaveBeenCalled();
    });
  });

  describe('handleMessage - edited messages', () => {
    it('should process edited messages the same way as regular messages', async () => {
      const editedMessage: TelegramMessage = {
        message_id: mockMessageId,
        chat: { id: mockChatId },
        text: 'Edited message',
      };

      const update: TelegramUpdate = {
        edited_message: editedMessage,
      };

      mockIterate.mockResolvedValue({ success: true });
      mockStorePendingRequest.mockReturnValue(undefined);

      await handler.execute(update);

      expect(mockIterate).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: 'Edited message',
        })
      );
    });
  });

  describe('extractAudioFileId', () => {
    it('should extract file_id from voice message', async () => {
      const message: TelegramMessage = {
        message_id: mockMessageId,
        chat: { id: mockChatId },
        voice: { file_id: 'voice-123' },
      };

      const update: TelegramUpdate = {
        message,
      };

      mockDownloadFile.mockResolvedValue('/tmp/audio.ogg');
      mockTranscribe.mockResolvedValue('Transcribed text');
      mockFs.access.mockResolvedValue(undefined);
      mockFs.unlink.mockResolvedValue(undefined);
      mockIterate.mockResolvedValue({ success: true });

      await handler.execute(update);

      expect(mockDownloadFile).toHaveBeenCalledWith('voice-123');
    });

    it('should extract file_id from audio message', async () => {
      const message: TelegramMessage = {
        message_id: mockMessageId,
        chat: { id: mockChatId },
        audio: { file_id: 'audio-123' },
      };

      const update: TelegramUpdate = {
        message,
      };

      mockDownloadFile.mockResolvedValue('/tmp/audio.mp3');
      mockTranscribe.mockResolvedValue('Transcribed text');
      mockFs.access.mockResolvedValue(undefined);
      mockFs.unlink.mockResolvedValue(undefined);
      mockIterate.mockResolvedValue({ success: true });

      await handler.execute(update);

      expect(mockDownloadFile).toHaveBeenCalledWith('audio-123');
    });

    it('should extract file_id from document with audio mime_type', async () => {
      const message: TelegramMessage = {
        message_id: mockMessageId,
        chat: { id: mockChatId },
        document: { file_id: 'doc-123', mime_type: 'audio/mpeg' },
      };

      const update: TelegramUpdate = {
        message,
      };

      mockDownloadFile.mockResolvedValue('/tmp/audio.mp3');
      mockTranscribe.mockResolvedValue('Transcribed text');
      mockFs.access.mockResolvedValue(undefined);
      mockFs.unlink.mockResolvedValue(undefined);
      mockIterate.mockResolvedValue({ success: true });

      await handler.execute(update);

      expect(mockDownloadFile).toHaveBeenCalledWith('doc-123');
    });
  });
});
