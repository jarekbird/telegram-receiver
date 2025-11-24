/**
 * Unit tests for ElevenLabsSpeechToTextService
 * Tests the transcribe method with file path parameter
 */

import ElevenLabsSpeechToTextService, {
  Error,
  ConnectionError,
  TimeoutError,
  InvalidResponseError,
  TranscriptionError,
} from '../../../src/services/elevenlabs-speech-to-text-service';
import axios, { AxiosError } from 'axios';
import { promises as fs } from 'fs';
import * as path from 'path';
import FormData from 'form-data';

// Mock logger - define inline to avoid hoisting issues
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

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

// Import the mocked logger to get the same instance
import logger from '../../../src/utils/logger';
// Get the actual mock instance that jest created
const getMockLogger = () => logger as typeof mockLogger;

// Mock fs
jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
    readFile: jest.fn(),
  },
}));

// Mock path
jest.mock('path', () => ({
  basename: jest.fn((filePath: string) => {
    // Simple basename implementation for testing
    const parts = filePath.split('/');
    return parts[parts.length - 1] || filePath;
  }),
}));

// Mock form-data
jest.mock('form-data');

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ElevenLabsSpeechToTextService', () => {
  let service: ElevenLabsSpeechToTextService;
  const mockApiKey = 'test-api-key-12345';
  const mockTimeout = 60;
  const mockModelId = 'scribe_v1';
  const mockAudioFilePath = '/path/to/audio.ogg';
  const mockFilename = 'audio.ogg';
  const mockFileContent = Buffer.from('mock audio file content');

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    // Reset logger mocks
    getMockLogger().info.mockClear();
    getMockLogger().error.mockClear();
    getMockLogger().warn.mockClear();
    getMockLogger().debug.mockClear();

    // Clear environment variables
    delete process.env.ELEVENLABS_API_KEY;
    delete process.env.ELEVENLABS_STT_MODEL_ID;

    // Create service instance
    service = new ElevenLabsSpeechToTextService(mockApiKey, mockTimeout, mockModelId);
  });

  describe('constructor', () => {
    it('should create service with valid API key from parameter', () => {
      const testApiKey = 'test-key-123';
      const service = new ElevenLabsSpeechToTextService(testApiKey);
      expect(service.apiKey).toBe(testApiKey);
    });

    it('should create service with valid API key from environment variable', () => {
      const envApiKey = 'env-api-key-456';
      process.env.ELEVENLABS_API_KEY = envApiKey;
      const service = new ElevenLabsSpeechToTextService();
      expect(service.apiKey).toBe(envApiKey);
      delete process.env.ELEVENLABS_API_KEY;
    });

    it('should throw Error when API key is blank', () => {
      expect(() => new ElevenLabsSpeechToTextService('')).toThrow(Error);
      expect(() => new ElevenLabsSpeechToTextService('   ')).toThrow(Error);
    });

    it('should throw Error when API key is null', () => {
      expect(() => new ElevenLabsSpeechToTextService(null as any)).toThrow(Error);
    });

    it('should throw Error when API key is undefined and env var is not set', () => {
      delete process.env.ELEVENLABS_API_KEY;
      expect(() => new ElevenLabsSpeechToTextService(undefined)).toThrow(Error);
    });

    it('should use default timeout (60 seconds) when not provided', () => {
      const service = new ElevenLabsSpeechToTextService(mockApiKey);
      expect(service.timeout).toBe(60);
    });

    it('should use custom timeout when provided', () => {
      const customTimeout = 120;
      const service = new ElevenLabsSpeechToTextService(mockApiKey, customTimeout);
      expect(service.timeout).toBe(customTimeout);
    });

    it('should use default model_id (scribe_v1) when not provided', () => {
      const service = new ElevenLabsSpeechToTextService(mockApiKey);
      expect(service.modelId).toBe('scribe_v1');
    });

    it('should use custom model_id when provided', () => {
      const customModelId = 'custom_model_v2';
      const service = new ElevenLabsSpeechToTextService(mockApiKey, undefined, customModelId);
      expect(service.modelId).toBe(customModelId);
    });

    it('should use model_id from environment variable when not provided', () => {
      const envModelId = 'env_model_v3';
      process.env.ELEVENLABS_STT_MODEL_ID = envModelId;
      const service = new ElevenLabsSpeechToTextService(mockApiKey);
      expect(service.modelId).toBe(envModelId);
      delete process.env.ELEVENLABS_STT_MODEL_ID;
    });
  });

  describe('transcribe', () => {
    describe('parameter validation', () => {
      it('should throw Error if audioFilePath is blank', async () => {
        await expect(service.transcribe('')).rejects.toThrow(Error);
        await expect(service.transcribe('   ')).rejects.toThrow(Error);
      });

      it('should throw Error if audioFilePath is null', async () => {
        await expect(service.transcribe(null as any)).rejects.toThrow(Error);
      });

      it('should throw Error if audioFilePath is undefined', async () => {
        await expect(service.transcribe(undefined as any)).rejects.toThrow(Error);
      });

      it('should throw Error if file does not exist', async () => {
        (fs.access as jest.Mock).mockRejectedValue({ code: 'ENOENT', message: 'File not found' });

        await expect(service.transcribe(mockAudioFilePath)).rejects.toThrow(Error);
        expect(fs.access).toHaveBeenCalledWith(mockAudioFilePath);
      });
    });

    describe('file reading', () => {
      beforeEach(() => {
        (fs.access as jest.Mock).mockResolvedValue(undefined);
        (fs.readFile as jest.Mock).mockResolvedValue(mockFileContent);
        (path.basename as jest.Mock).mockReturnValue(mockFilename);
      });

      it('should read file content as binary data', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        mockedAxios.post = jest.fn().mockResolvedValue({
          data: { text: 'Transcribed text' },
        });

        await service.transcribe(mockAudioFilePath);

        expect(fs.readFile).toHaveBeenCalledWith(mockAudioFilePath);
      });

      it('should throw Error if file read fails with ENOENT', async () => {
        (fs.readFile as jest.Mock).mockRejectedValue({ code: 'ENOENT', message: 'File not found' });

        await expect(service.transcribe(mockAudioFilePath)).rejects.toThrow(Error);
      });

      it('should throw Error if file read fails with other error', async () => {
        (fs.readFile as jest.Mock).mockRejectedValue(new Error('Permission denied'));

        await expect(service.transcribe(mockAudioFilePath)).rejects.toThrow(Error);
      });
    });

    describe('multipart form data creation', () => {
      beforeEach(() => {
        (fs.access as jest.Mock).mockResolvedValue(undefined);
        (fs.readFile as jest.Mock).mockResolvedValue(mockFileContent);
        (path.basename as jest.Mock).mockReturnValue(mockFilename);
      });

      it('should create multipart form data with file content and filename', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        mockedAxios.post = jest.fn().mockResolvedValue({
          data: { text: 'Transcribed text' },
        });

        await service.transcribe(mockAudioFilePath);

        expect(mockFormData.append).toHaveBeenCalledWith('file', mockFileContent, {
          filename: mockFilename,
        });
      });

      it('should append model_id field', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        mockedAxios.post = jest.fn().mockResolvedValue({
          data: { text: 'Transcribed text' },
        });

        await service.transcribe(mockAudioFilePath);

        expect(mockFormData.append).toHaveBeenCalledWith('model_id', mockModelId);
      });

      it('should append language field if provided', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        mockedAxios.post = jest.fn().mockResolvedValue({
          data: { text: 'Transcribed text' },
        });

        await service.transcribe(mockAudioFilePath, 'en');

        expect(mockFormData.append).toHaveBeenCalledWith('language', 'en');
      });

      it('should not append language field if not provided', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        mockedAxios.post = jest.fn().mockResolvedValue({
          data: { text: 'Transcribed text' },
        });

        await service.transcribe(mockAudioFilePath);

        expect(mockFormData.append).not.toHaveBeenCalledWith('language', expect.anything());
      });

      it('should not append language field if empty string', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        mockedAxios.post = jest.fn().mockResolvedValue({
          data: { text: 'Transcribed text' },
        });

        await service.transcribe(mockAudioFilePath, '');

        expect(mockFormData.append).not.toHaveBeenCalledWith('language', expect.anything());
      });

      it('should extract filename from file path using basename', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        mockedAxios.post = jest.fn().mockResolvedValue({
          data: { text: 'Transcribed text' },
        });

        await service.transcribe(mockAudioFilePath);

        expect(path.basename).toHaveBeenCalledWith(mockAudioFilePath);
      });
    });

    describe('HTTP request', () => {
      beforeEach(() => {
        (fs.access as jest.Mock).mockResolvedValue(undefined);
        (fs.readFile as jest.Mock).mockResolvedValue(mockFileContent);
        (path.basename as jest.Mock).mockReturnValue(mockFilename);
      });

      it('should build HTTP POST request to correct URL', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        mockedAxios.post = jest.fn().mockResolvedValue({
          data: { text: 'Transcribed text' },
        });

        await service.transcribe(mockAudioFilePath);

        expect(mockedAxios.post).toHaveBeenCalledWith(
          'https://api.elevenlabs.io/v1/speech-to-text',
          mockFormData,
          expect.objectContaining({
            headers: expect.objectContaining({
              'xi-api-key': mockApiKey,
            }),
            timeout: mockTimeout * 1000,
          })
        );
      });

      it('should set xi-api-key header with API key', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        mockedAxios.post = jest.fn().mockResolvedValue({
          data: { text: 'Transcribed text' },
        });

        await service.transcribe(mockAudioFilePath);

        expect(mockedAxios.post).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(Object),
          expect.objectContaining({
            headers: expect.objectContaining({
              'xi-api-key': mockApiKey,
            }),
          })
        );
      });

      it('should set Content-Type header to multipart/form-data', async () => {
        const mockHeaders = { 'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary' };
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue(mockHeaders),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        mockedAxios.post = jest.fn().mockResolvedValue({
          data: { text: 'Transcribed text' },
        });

        await service.transcribe(mockAudioFilePath);

        expect(mockedAxios.post).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(Object),
          expect.objectContaining({
            headers: expect.objectContaining(mockHeaders),
          })
        );
      });

      it('should execute HTTP request with timeout handling', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        mockedAxios.post = jest.fn().mockResolvedValue({
          data: { text: 'Transcribed text' },
        });

        await service.transcribe(mockAudioFilePath);

        expect(mockedAxios.post).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(Object),
          expect.objectContaining({
            timeout: mockTimeout * 1000,
          })
        );
      });
    });

    describe('response parsing', () => {
      beforeEach(() => {
        (fs.access as jest.Mock).mockResolvedValue(undefined);
        (fs.readFile as jest.Mock).mockResolvedValue(mockFileContent);
        (path.basename as jest.Mock).mockReturnValue(mockFilename);
      });

      it('should parse JSON response', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        const mockResponse = { text: 'Transcribed text' };
        mockedAxios.post = jest.fn().mockResolvedValue({
          data: mockResponse,
        });

        const result = await service.transcribe(mockAudioFilePath);

        expect(result).toBe('Transcribed text');
      });

      it('should extract text field from response with string key', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        mockedAxios.post = jest.fn().mockResolvedValue({
          data: { text: 'Transcribed text' },
        });

        const result = await service.transcribe(mockAudioFilePath);

        expect(result).toBe('Transcribed text');
      });

      it('should handle string response data', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        mockedAxios.post = jest.fn().mockResolvedValue({
          data: JSON.stringify({ text: 'Transcribed text' }),
        });

        const result = await service.transcribe(mockAudioFilePath);

        expect(result).toBe('Transcribed text');
      });

      it('should throw InvalidResponseError if JSON parsing fails', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        mockedAxios.post = jest.fn().mockResolvedValue({
          data: 'invalid json {',
        });

        await expect(service.transcribe(mockAudioFilePath)).rejects.toThrow(InvalidResponseError);
      });

      it('should throw TranscriptionError if transcribed text is blank', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        mockedAxios.post = jest.fn().mockResolvedValue({
          data: { text: '' },
        });

        await expect(service.transcribe(mockAudioFilePath)).rejects.toThrow(TranscriptionError);
      });

      it('should throw TranscriptionError if text field is missing', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        mockedAxios.post = jest.fn().mockResolvedValue({
          data: {},
        });

        await expect(service.transcribe(mockAudioFilePath)).rejects.toThrow(TranscriptionError);
      });

      it('should return transcribed text string', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        const expectedText = 'This is the transcribed text';
        mockedAxios.post = jest.fn().mockResolvedValue({
          data: { text: expectedText },
        });

        const result = await service.transcribe(mockAudioFilePath);

        expect(result).toBe(expectedText);
        expect(typeof result).toBe('string');
      });
    });

    describe('error handling', () => {
      beforeEach(() => {
        (fs.access as jest.Mock).mockResolvedValue(undefined);
        (fs.readFile as jest.Mock).mockResolvedValue(mockFileContent);
        (path.basename as jest.Mock).mockReturnValue(mockFilename);
      });

      it('should handle HTTP error responses (non-2xx status codes)', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        const mockError = {
          isAxiosError: true,
          message: 'Request failed with status code 400',
          response: {
            status: 400,
            statusText: 'Bad Request',
            data: { detail: 'Invalid audio file format' },
          },
        } as AxiosError;

        mockedAxios.post = jest.fn().mockRejectedValue(mockError);
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);

        await expect(service.transcribe(mockAudioFilePath)).rejects.toThrow(TranscriptionError);
      });

      it('should extract error message from response body JSON (detail field)', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        const mockError = {
          isAxiosError: true,
          message: 'Request failed with status code 400',
          response: {
            status: 400,
            statusText: 'Bad Request',
            data: { detail: 'Invalid audio file format' },
          },
        } as AxiosError;

        mockedAxios.post = jest.fn().mockRejectedValue(mockError);
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);

        await expect(service.transcribe(mockAudioFilePath)).rejects.toThrow('Invalid audio file format');
      });

      it('should extract error message from response body JSON (error field)', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        const mockError = {
          isAxiosError: true,
          message: 'Request failed with status code 401',
          response: {
            status: 401,
            statusText: 'Unauthorized',
            data: { error: 'Invalid API key' },
          },
        } as AxiosError;

        mockedAxios.post = jest.fn().mockRejectedValue(mockError);
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);

        await expect(service.transcribe(mockAudioFilePath)).rejects.toThrow('Invalid API key');
      });

      it('should extract error message from response body JSON (message field)', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        const mockError = {
          isAxiosError: true,
          message: 'Request failed with status code 500',
          response: {
            status: 500,
            statusText: 'Internal Server Error',
            data: { message: 'Server error occurred' },
          },
        } as AxiosError;

        mockedAxios.post = jest.fn().mockRejectedValue(mockError);
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);

        await expect(service.transcribe(mockAudioFilePath)).rejects.toThrow('Server error occurred');
      });

      it('should fall back to HTTP status code and message if JSON parsing fails', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        const mockError = {
          isAxiosError: true,
          message: 'Request failed with status code 500',
          response: {
            status: 500,
            statusText: 'Internal Server Error',
            data: 'invalid json',
          },
        } as AxiosError;

        mockedAxios.post = jest.fn().mockRejectedValue(mockError);
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);

        await expect(service.transcribe(mockAudioFilePath)).rejects.toThrow(TranscriptionError);
        expect(getMockLogger().error).toHaveBeenCalledWith(
          expect.stringContaining('Failed to parse error response as JSON')
        );
      });

      it('should log error response body (first 500 characters) for debugging', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        const longErrorBody = 'x'.repeat(600);
        const mockError = {
          isAxiosError: true,
          message: 'Request failed with status code 400',
          response: {
            status: 400,
            statusText: 'Bad Request',
            data: longErrorBody,
          },
        } as AxiosError;

        mockedAxios.post = jest.fn().mockRejectedValue(mockError);
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);

        await expect(service.transcribe(mockAudioFilePath)).rejects.toThrow(TranscriptionError);

        expect(getMockLogger().error).toHaveBeenCalledWith(
          expect.stringContaining('ElevenLabs API error: 400 - Response body:')
        );
        const errorCall = getMockLogger().error.mock.calls.find((call) =>
          call[0].toString().includes('Response body:')
        );
        expect(errorCall).toBeDefined();
        if (errorCall) {
          const fullMessage = errorCall[0].toString();
          const bodyPart = fullMessage.split('Response body: ')[1] || '';
          // The logged body should be truncated to 500 characters
          expect(bodyPart.length).toBeLessThanOrEqual(500);
          // Verify it's actually the first 500 characters of the original body
          expect(bodyPart).toBe(longErrorBody.substring(0, 500));
        }
      });

      it('should throw ConnectionError for network connection issues (ECONNREFUSED)', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        const mockError = {
          isAxiosError: true,
          code: 'ECONNREFUSED',
          message: 'Connection refused',
        } as AxiosError;

        mockedAxios.post = jest.fn().mockRejectedValue(mockError);
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);

        await expect(service.transcribe(mockAudioFilePath)).rejects.toThrow(ConnectionError);
      });

      it('should throw ConnectionError for network connection issues (EHOSTUNREACH)', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        const mockError = {
          isAxiosError: true,
          code: 'EHOSTUNREACH',
          message: 'Host unreachable',
        } as AxiosError;

        mockedAxios.post = jest.fn().mockRejectedValue(mockError);
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);

        await expect(service.transcribe(mockAudioFilePath)).rejects.toThrow(ConnectionError);
      });

      it('should throw TimeoutError for request timeouts (ECONNABORTED)', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        const mockError = {
          isAxiosError: true,
          code: 'ECONNABORTED',
          message: 'timeout of 60000ms exceeded',
        } as AxiosError;

        mockedAxios.post = jest.fn().mockRejectedValue(mockError);
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);

        await expect(service.transcribe(mockAudioFilePath)).rejects.toThrow(TimeoutError);
      });

      it('should throw TimeoutError for request timeouts (timeout message)', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        const mockError = {
          isAxiosError: true,
          message: 'timeout of 60000ms exceeded',
        } as AxiosError;

        mockedAxios.post = jest.fn().mockRejectedValue(mockError);
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);

        await expect(service.transcribe(mockAudioFilePath)).rejects.toThrow(TimeoutError);
      });
    });

    describe('logging', () => {
      beforeEach(() => {
        (fs.access as jest.Mock).mockResolvedValue(undefined);
        (fs.readFile as jest.Mock).mockResolvedValue(mockFileContent);
        (path.basename as jest.Mock).mockReturnValue(mockFilename);
      });

      it('should log when sending audio file for transcription (include file path)', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        mockedAxios.post = jest.fn().mockResolvedValue({
          data: { text: 'Transcribed text' },
          status: 200,
          statusText: 'OK',
        });

        await service.transcribe(mockAudioFilePath);

        expect(getMockLogger().info).toHaveBeenCalledWith(
          `Sending audio file to ElevenLabs for transcription: ${mockAudioFilePath}`
        );
      });

      it('should log request info: "ElevenLabsSpeechToTextService: POST {uri.path}"', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        mockedAxios.post = jest.fn().mockResolvedValue({
          data: { text: 'Transcribed text' },
          status: 200,
          statusText: 'OK',
        });

        await service.transcribe(mockAudioFilePath);

        expect(getMockLogger().info).toHaveBeenCalledWith(
          'ElevenLabsSpeechToTextService: POST /v1/speech-to-text'
        );
      });

      it('should log response info: "ElevenLabsSpeechToTextService: Response {code} {message}"', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        mockedAxios.post = jest.fn().mockResolvedValue({
          data: { text: 'Transcribed text' },
          status: 200,
          statusText: 'OK',
        });

        await service.transcribe(mockAudioFilePath);

        expect(getMockLogger().info).toHaveBeenCalledWith(
          'ElevenLabsSpeechToTextService: Response 200 OK'
        );
      });

      it('should log successful transcription (include first 50 characters of transcribed text)', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        const longText = 'This is a very long transcribed text that should be truncated in the log';
        mockedAxios.post = jest.fn().mockResolvedValue({
          data: { text: longText },
          status: 200,
          statusText: 'OK',
        });

        await service.transcribe(mockAudioFilePath);

        expect(getMockLogger().info).toHaveBeenCalledWith(
          `Successfully transcribed audio: ${longText.substring(0, 50)}...`
        );
      });

      it('should log full text if transcribed text is 50 characters or less', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        const shortText = 'Short text';
        mockedAxios.post = jest.fn().mockResolvedValue({
          data: { text: shortText },
          status: 200,
          statusText: 'OK',
        });

        await service.transcribe(mockAudioFilePath);

        expect(getMockLogger().info).toHaveBeenCalledWith(
          `Successfully transcribed audio: ${shortText}`
        );
      });
    });
  });

  describe('transcribeIo', () => {
    const mockAudioBuffer = Buffer.from('mock audio file content');
    const mockFilename = 'audio.ogg';
    const mockTranscribedText = 'Transcribed text';

    describe('parameter validation', () => {
      it('should throw Error if audioIo is null', async () => {
        await expect(service.transcribeIo(null as any)).rejects.toThrow(Error);
      });

      it('should throw Error if audioIo is undefined', async () => {
        await expect(service.transcribeIo(undefined as any)).rejects.toThrow(Error);
      });
    });

    describe('Buffer input handling', () => {
      it('should use Buffer directly if audioIo is a Buffer', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        mockedAxios.post = jest.fn().mockResolvedValue({
          data: { text: mockTranscribedText },
          status: 200,
          statusText: 'OK',
        });

        const result = await service.transcribeIo(mockAudioBuffer);

        expect(result).toBe(mockTranscribedText);
        expect(mockFormData.append).toHaveBeenCalledWith('file', mockAudioBuffer, {
          filename: mockFilename,
        });
      });

      it('should use custom filename if provided in options', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        mockedAxios.post = jest.fn().mockResolvedValue({
          data: { text: mockTranscribedText },
          status: 200,
          statusText: 'OK',
        });

        const customFilename = 'custom-audio.mp3';
        await service.transcribeIo(mockAudioBuffer, { filename: customFilename });

        expect(mockFormData.append).toHaveBeenCalledWith('file', mockAudioBuffer, {
          filename: customFilename,
        });
      });

      it('should use default filename "audio.ogg" if not provided', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        mockedAxios.post = jest.fn().mockResolvedValue({
          data: { text: mockTranscribedText },
          status: 200,
          statusText: 'OK',
        });

        await service.transcribeIo(mockAudioBuffer);

        expect(mockFormData.append).toHaveBeenCalledWith('file', mockAudioBuffer, {
          filename: 'audio.ogg',
        });
      });
    });

    describe('ReadableStream input handling', () => {
      it('should convert ReadableStream to Buffer', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        // Create a mock ReadableStream
        const mockStream = {
          [Symbol.asyncIterator]: async function* () {
            yield Buffer.from('chunk1');
            yield Buffer.from('chunk2');
          },
        } as NodeJS.ReadableStream;

        mockedAxios.post = jest.fn().mockResolvedValue({
          data: { text: mockTranscribedText },
          status: 200,
          statusText: 'OK',
        });

        const result = await service.transcribeIo(mockStream);

        expect(result).toBe(mockTranscribedText);
        // Verify form data was appended with concatenated buffer
        expect(mockFormData.append).toHaveBeenCalled();
      });

      it('should throw Error if stream read fails', async () => {
        const mockStream = {
          [Symbol.asyncIterator]: async function* () {
            throw new Error('Stream read error');
          },
        } as NodeJS.ReadableStream;

        await expect(service.transcribeIo(mockStream)).rejects.toThrow(Error);
        await expect(service.transcribeIo(mockStream)).rejects.toThrow('Failed to read audio stream');
      });
    });

    describe('multipart form data creation', () => {
      beforeEach(() => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);
      });

      it('should create multipart form data with file content and filename', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        mockedAxios.post = jest.fn().mockResolvedValue({
          data: { text: mockTranscribedText },
          status: 200,
          statusText: 'OK',
        });

        await service.transcribeIo(mockAudioBuffer, { filename: mockFilename });

        expect(mockFormData.append).toHaveBeenCalledWith('file', mockAudioBuffer, {
          filename: mockFilename,
        });
      });

      it('should append model_id field', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        mockedAxios.post = jest.fn().mockResolvedValue({
          data: { text: mockTranscribedText },
          status: 200,
          statusText: 'OK',
        });

        await service.transcribeIo(mockAudioBuffer);

        expect(mockFormData.append).toHaveBeenCalledWith('model_id', mockModelId);
      });

      it('should append language field if provided', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        mockedAxios.post = jest.fn().mockResolvedValue({
          data: { text: mockTranscribedText },
          status: 200,
          statusText: 'OK',
        });

        await service.transcribeIo(mockAudioBuffer, { language: 'en' });

        expect(mockFormData.append).toHaveBeenCalledWith('language', 'en');
      });

      it('should not append language field if not provided', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        mockedAxios.post = jest.fn().mockResolvedValue({
          data: { text: mockTranscribedText },
          status: 200,
          statusText: 'OK',
        });

        await service.transcribeIo(mockAudioBuffer);

        expect(mockFormData.append).not.toHaveBeenCalledWith('language', expect.anything());
      });

      it('should not append language field if empty string', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        mockedAxios.post = jest.fn().mockResolvedValue({
          data: { text: mockTranscribedText },
          status: 200,
          statusText: 'OK',
        });

        await service.transcribeIo(mockAudioBuffer, { language: '' });

        expect(mockFormData.append).not.toHaveBeenCalledWith('language', expect.anything());
      });
    });

    describe('HTTP request', () => {
      beforeEach(() => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);
      });

      it('should build HTTP POST request to correct URL', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        mockedAxios.post = jest.fn().mockResolvedValue({
          data: { text: mockTranscribedText },
          status: 200,
          statusText: 'OK',
        });

        await service.transcribeIo(mockAudioBuffer);

        expect(mockedAxios.post).toHaveBeenCalledWith(
          'https://api.elevenlabs.io/v1/speech-to-text',
          mockFormData,
          expect.objectContaining({
            headers: expect.objectContaining({
              'xi-api-key': mockApiKey,
            }),
            timeout: mockTimeout * 1000,
          })
        );
      });

      it('should set xi-api-key header with API key', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        mockedAxios.post = jest.fn().mockResolvedValue({
          data: { text: mockTranscribedText },
          status: 200,
          statusText: 'OK',
        });

        await service.transcribeIo(mockAudioBuffer);

        expect(mockedAxios.post).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(Object),
          expect.objectContaining({
            headers: expect.objectContaining({
              'xi-api-key': mockApiKey,
            }),
          })
        );
      });

      it('should set Content-Type header to multipart/form-data', async () => {
        const mockHeaders = { 'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary' };
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue(mockHeaders),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        mockedAxios.post = jest.fn().mockResolvedValue({
          data: { text: mockTranscribedText },
          status: 200,
          statusText: 'OK',
        });

        await service.transcribeIo(mockAudioBuffer);

        expect(mockedAxios.post).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(Object),
          expect.objectContaining({
            headers: expect.objectContaining(mockHeaders),
          })
        );
      });

      it('should execute HTTP request with timeout handling', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        mockedAxios.post = jest.fn().mockResolvedValue({
          data: { text: mockTranscribedText },
          status: 200,
          statusText: 'OK',
        });

        await service.transcribeIo(mockAudioBuffer);

        expect(mockedAxios.post).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(Object),
          expect.objectContaining({
            timeout: mockTimeout * 1000,
          })
        );
      });
    });

    describe('response parsing', () => {
      beforeEach(() => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);
      });

      it('should parse JSON response', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        const mockResponse = { text: mockTranscribedText };
        mockedAxios.post = jest.fn().mockResolvedValue({
          data: mockResponse,
          status: 200,
          statusText: 'OK',
        });

        const result = await service.transcribeIo(mockAudioBuffer);

        expect(result).toBe(mockTranscribedText);
      });

      it('should extract text field from response with string key', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        mockedAxios.post = jest.fn().mockResolvedValue({
          data: { text: mockTranscribedText },
          status: 200,
          statusText: 'OK',
        });

        const result = await service.transcribeIo(mockAudioBuffer);

        expect(result).toBe(mockTranscribedText);
      });

      it('should handle string response data', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        mockedAxios.post = jest.fn().mockResolvedValue({
          data: JSON.stringify({ text: mockTranscribedText }),
          status: 200,
          statusText: 'OK',
        });

        const result = await service.transcribeIo(mockAudioBuffer);

        expect(result).toBe(mockTranscribedText);
      });

      it('should throw InvalidResponseError if JSON parsing fails', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        mockedAxios.post = jest.fn().mockResolvedValue({
          data: 'invalid json {',
          status: 200,
          statusText: 'OK',
        });

        await expect(service.transcribeIo(mockAudioBuffer)).rejects.toThrow(InvalidResponseError);
      });

      it('should throw TranscriptionError if transcribed text is blank', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        mockedAxios.post = jest.fn().mockResolvedValue({
          data: { text: '' },
          status: 200,
          statusText: 'OK',
        });

        await expect(service.transcribeIo(mockAudioBuffer)).rejects.toThrow(TranscriptionError);
      });

      it('should throw TranscriptionError if text field is missing', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        mockedAxios.post = jest.fn().mockResolvedValue({
          data: {},
          status: 200,
          statusText: 'OK',
        });

        await expect(service.transcribeIo(mockAudioBuffer)).rejects.toThrow(TranscriptionError);
      });

      it('should return transcribed text string', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        const expectedText = 'This is the transcribed text';
        mockedAxios.post = jest.fn().mockResolvedValue({
          data: { text: expectedText },
          status: 200,
          statusText: 'OK',
        });

        const result = await service.transcribeIo(mockAudioBuffer);

        expect(result).toBe(expectedText);
        expect(typeof result).toBe('string');
      });
    });

    describe('error handling', () => {
      beforeEach(() => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);
      });

      it('should handle HTTP error responses (non-2xx status codes)', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        const mockError = {
          isAxiosError: true,
          message: 'Request failed with status code 400',
          response: {
            status: 400,
            statusText: 'Bad Request',
            data: { detail: 'Invalid audio file format' },
          },
        } as AxiosError;

        mockedAxios.post = jest.fn().mockRejectedValue(mockError);
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);

        await expect(service.transcribeIo(mockAudioBuffer)).rejects.toThrow(TranscriptionError);
      });

      it('should extract error message from response body JSON (detail field)', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        const mockError = {
          isAxiosError: true,
          message: 'Request failed with status code 400',
          response: {
            status: 400,
            statusText: 'Bad Request',
            data: { detail: 'Invalid audio file format' },
          },
        } as AxiosError;

        mockedAxios.post = jest.fn().mockRejectedValue(mockError);
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);

        await expect(service.transcribeIo(mockAudioBuffer)).rejects.toThrow('Invalid audio file format');
      });

      it('should extract error message from response body JSON (error field)', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        const mockError = {
          isAxiosError: true,
          message: 'Request failed with status code 401',
          response: {
            status: 401,
            statusText: 'Unauthorized',
            data: { error: 'Invalid API key' },
          },
        } as AxiosError;

        mockedAxios.post = jest.fn().mockRejectedValue(mockError);
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);

        await expect(service.transcribeIo(mockAudioBuffer)).rejects.toThrow('Invalid API key');
      });

      it('should extract error message from response body JSON (message field)', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        const mockError = {
          isAxiosError: true,
          message: 'Request failed with status code 500',
          response: {
            status: 500,
            statusText: 'Internal Server Error',
            data: { message: 'Server error occurred' },
          },
        } as AxiosError;

        mockedAxios.post = jest.fn().mockRejectedValue(mockError);
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);

        await expect(service.transcribeIo(mockAudioBuffer)).rejects.toThrow('Server error occurred');
      });

      it('should fall back to HTTP status code and message if JSON parsing fails', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        const mockError = {
          isAxiosError: true,
          message: 'Request failed with status code 500',
          response: {
            status: 500,
            statusText: 'Internal Server Error',
            data: 'invalid json',
          },
        } as AxiosError;

        mockedAxios.post = jest.fn().mockRejectedValue(mockError);
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);

        await expect(service.transcribeIo(mockAudioBuffer)).rejects.toThrow(TranscriptionError);
        expect(getMockLogger().error).toHaveBeenCalledWith(
          expect.stringContaining('Failed to parse error response as JSON')
        );
      });

      it('should log error response body (first 500 characters) for debugging', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        const longErrorBody = 'x'.repeat(600);
        const mockError = {
          isAxiosError: true,
          message: 'Request failed with status code 400',
          response: {
            status: 400,
            statusText: 'Bad Request',
            data: longErrorBody,
          },
        } as AxiosError;

        mockedAxios.post = jest.fn().mockRejectedValue(mockError);
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);

        await expect(service.transcribeIo(mockAudioBuffer)).rejects.toThrow(TranscriptionError);

        expect(getMockLogger().error).toHaveBeenCalledWith(
          expect.stringContaining('ElevenLabs API error: 400 - Response body:')
        );
        const errorCall = getMockLogger().error.mock.calls.find((call) =>
          call[0].toString().includes('Response body:')
        );
        expect(errorCall).toBeDefined();
        if (errorCall) {
          const fullMessage = errorCall[0].toString();
          const bodyPart = fullMessage.split('Response body: ')[1] || '';
          // The logged body should be truncated to 500 characters
          expect(bodyPart.length).toBeLessThanOrEqual(500);
          // Verify it's actually the first 500 characters of the original body
          expect(bodyPart).toBe(longErrorBody.substring(0, 500));
        }
      });

      it('should throw ConnectionError for network connection issues (ECONNREFUSED)', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        const mockError = {
          isAxiosError: true,
          code: 'ECONNREFUSED',
          message: 'Connection refused',
        } as AxiosError;

        mockedAxios.post = jest.fn().mockRejectedValue(mockError);
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);

        await expect(service.transcribeIo(mockAudioBuffer)).rejects.toThrow(ConnectionError);
      });

      it('should throw ConnectionError for network connection issues (EHOSTUNREACH)', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        const mockError = {
          isAxiosError: true,
          code: 'EHOSTUNREACH',
          message: 'Host unreachable',
        } as AxiosError;

        mockedAxios.post = jest.fn().mockRejectedValue(mockError);
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);

        await expect(service.transcribeIo(mockAudioBuffer)).rejects.toThrow(ConnectionError);
      });

      it('should throw TimeoutError for request timeouts (ECONNABORTED)', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        const mockError = {
          isAxiosError: true,
          code: 'ECONNABORTED',
          message: 'timeout of 60000ms exceeded',
        } as AxiosError;

        mockedAxios.post = jest.fn().mockRejectedValue(mockError);
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);

        await expect(service.transcribeIo(mockAudioBuffer)).rejects.toThrow(TimeoutError);
      });

      it('should throw TimeoutError for request timeouts (timeout message)', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        const mockError = {
          isAxiosError: true,
          message: 'timeout of 60000ms exceeded',
        } as AxiosError;

        mockedAxios.post = jest.fn().mockRejectedValue(mockError);
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);

        await expect(service.transcribeIo(mockAudioBuffer)).rejects.toThrow(TimeoutError);
      });
    });

    describe('logging', () => {
      beforeEach(() => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);
      });

      it('should log when sending audio IO for transcription (include filename)', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        mockedAxios.post = jest.fn().mockResolvedValue({
          data: { text: mockTranscribedText },
          status: 200,
          statusText: 'OK',
        });

        await service.transcribeIo(mockAudioBuffer, { filename: mockFilename });

        expect(getMockLogger().info).toHaveBeenCalledWith(
          `Sending audio IO to ElevenLabs for transcription: ${mockFilename}`
        );
      });

      it('should log request info: "ElevenLabsSpeechToTextService: POST {uri.path}"', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        mockedAxios.post = jest.fn().mockResolvedValue({
          data: { text: mockTranscribedText },
          status: 200,
          statusText: 'OK',
        });

        await service.transcribeIo(mockAudioBuffer);

        expect(getMockLogger().info).toHaveBeenCalledWith(
          'ElevenLabsSpeechToTextService: POST /v1/speech-to-text'
        );
      });

      it('should log response info: "ElevenLabsSpeechToTextService: Response {code} {message}"', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        mockedAxios.post = jest.fn().mockResolvedValue({
          data: { text: mockTranscribedText },
          status: 200,
          statusText: 'OK',
        });

        await service.transcribeIo(mockAudioBuffer);

        expect(getMockLogger().info).toHaveBeenCalledWith(
          'ElevenLabsSpeechToTextService: Response 200 OK'
        );
      });

      it('should log successful transcription (include first 50 characters of transcribed text)', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        const longText = 'This is a very long transcribed text that should be truncated in the log';
        mockedAxios.post = jest.fn().mockResolvedValue({
          data: { text: longText },
          status: 200,
          statusText: 'OK',
        });

        await service.transcribeIo(mockAudioBuffer);

        expect(getMockLogger().info).toHaveBeenCalledWith(
          `Successfully transcribed audio: ${longText.substring(0, 50)}...`
        );
      });

      it('should log full text if transcribed text is 50 characters or less', async () => {
        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        const shortText = 'Short text';
        mockedAxios.post = jest.fn().mockResolvedValue({
          data: { text: shortText },
          status: 200,
          statusText: 'OK',
        });

        await service.transcribeIo(mockAudioBuffer);

        expect(getMockLogger().info).toHaveBeenCalledWith(
          `Successfully transcribed audio: ${shortText}`
        );
      });
    });
  });

  describe('edge cases and integration', () => {
    beforeEach(() => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);
      (fs.readFile as jest.Mock).mockResolvedValue(mockFileContent);
      (path.basename as jest.Mock).mockReturnValue(mockFilename);
    });

    it('should handle empty audio file gracefully', async () => {
      const emptyFileContent = Buffer.from('');
      (fs.readFile as jest.Mock).mockResolvedValue(emptyFileContent);

      const mockFormData = {
        append: jest.fn(),
        getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
      };
      (FormData as any).mockImplementation(() => mockFormData);

      mockedAxios.post = jest.fn().mockResolvedValue({
        data: { text: 'Empty file transcription' },
        status: 200,
        statusText: 'OK',
      });

      const result = await service.transcribe(mockAudioFilePath);
      expect(result).toBe('Empty file transcription');
      expect(mockFormData.append).toHaveBeenCalledWith('file', emptyFileContent, {
        filename: mockFilename,
      });
    });

    it('should handle very large audio files', async () => {
      const largeFileContent = Buffer.alloc(10 * 1024 * 1024); // 10MB
      (fs.readFile as jest.Mock).mockResolvedValue(largeFileContent);

      const mockFormData = {
        append: jest.fn(),
        getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
      };
      (FormData as any).mockImplementation(() => mockFormData);

      mockedAxios.post = jest.fn().mockResolvedValue({
        data: { text: 'Large file transcription' },
        status: 200,
        statusText: 'OK',
      });

      const result = await service.transcribe(mockAudioFilePath);
      expect(result).toBe('Large file transcription');
      expect(mockFormData.append).toHaveBeenCalledWith('file', largeFileContent, {
        filename: mockFilename,
      });
    });

    it('should handle special characters in file paths', async () => {
      const specialPath = '/path/to/audio file (1).ogg';
      const specialFilename = 'audio file (1).ogg';
      (path.basename as jest.Mock).mockReturnValue(specialFilename);

      const mockFormData = {
        append: jest.fn(),
        getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
      };
      (FormData as any).mockImplementation(() => mockFormData);

      mockedAxios.post = jest.fn().mockResolvedValue({
        data: { text: 'Transcribed text' },
        status: 200,
        statusText: 'OK',
      });

      await service.transcribe(specialPath);

      expect(path.basename).toHaveBeenCalledWith(specialPath);
      expect(mockFormData.append).toHaveBeenCalledWith('file', mockFileContent, {
        filename: specialFilename,
      });
    });

    it('should handle different audio file formats', async () => {
      const formats = [
        { path: '/path/to/audio.mp3', filename: 'audio.mp3' },
        { path: '/path/to/audio.wav', filename: 'audio.wav' },
        { path: '/path/to/audio.m4a', filename: 'audio.m4a' },
        { path: '/path/to/audio.flac', filename: 'audio.flac' },
      ];

      for (const format of formats) {
        (path.basename as jest.Mock).mockReturnValue(format.filename);

        const mockFormData = {
          append: jest.fn(),
          getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
        };
        (FormData as any).mockImplementation(() => mockFormData);

        mockedAxios.post = jest.fn().mockResolvedValue({
          data: { text: 'Transcribed text' },
          status: 200,
          statusText: 'OK',
        });

        await service.transcribe(format.path);

        expect(mockFormData.append).toHaveBeenCalledWith('file', mockFileContent, {
          filename: format.filename,
        });
      }
    });

    it('should handle concurrent transcription requests', async () => {
      const mockFormData1 = {
        append: jest.fn(),
        getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
      };
      const mockFormData2 = {
        append: jest.fn(),
        getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
      };

      let formDataCallCount = 0;
      (FormData as any).mockImplementation(() => {
        formDataCallCount++;
        return formDataCallCount === 1 ? mockFormData1 : mockFormData2;
      });

      mockedAxios.post = jest
        .fn()
        .mockResolvedValueOnce({
          data: { text: 'First transcription' },
          status: 200,
          statusText: 'OK',
        })
        .mockResolvedValueOnce({
          data: { text: 'Second transcription' },
          status: 200,
          statusText: 'OK',
        });

      const [result1, result2] = await Promise.all([
        service.transcribe('/path/to/audio1.ogg'),
        service.transcribe('/path/to/audio2.ogg'),
      ]);

      expect(result1).toBe('First transcription');
      expect(result2).toBe('Second transcription');
      expect(mockedAxios.post).toHaveBeenCalledTimes(2);
    });

    it('should use correct model_id from instance configuration', async () => {
      const customModelId = 'custom_model_test';
      const customService = new ElevenLabsSpeechToTextService(mockApiKey, mockTimeout, customModelId);

      const mockFormData = {
        append: jest.fn(),
        getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
      };
      (FormData as any).mockImplementation(() => mockFormData);

      mockedAxios.post = jest.fn().mockResolvedValue({
        data: { text: 'Transcribed text' },
        status: 200,
        statusText: 'OK',
      });

      await customService.transcribe(mockAudioFilePath);

      expect(mockFormData.append).toHaveBeenCalledWith('model_id', customModelId);
    });

    it('should respect timeout configuration', async () => {
      const customTimeout = 30;
      const customService = new ElevenLabsSpeechToTextService(mockApiKey, customTimeout);

      const mockFormData = {
        append: jest.fn(),
        getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
      };
      (FormData as any).mockImplementation(() => mockFormData);

      mockedAxios.post = jest.fn().mockResolvedValue({
        data: { text: 'Transcribed text' },
        status: 200,
        statusText: 'OK',
      });

      await customService.transcribe(mockAudioFilePath);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          timeout: customTimeout * 1000,
        })
      );
    });

    it('should handle stream rewinding if stream supports it', async () => {
      const mockStream = {
        rewind: jest.fn(),
        [Symbol.asyncIterator]: async function* () {
          yield Buffer.from('chunk1');
          yield Buffer.from('chunk2');
        },
      } as any;

      const mockFormData = {
        append: jest.fn(),
        getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
      };
      (FormData as any).mockImplementation(() => mockFormData);

      mockedAxios.post = jest.fn().mockResolvedValue({
        data: { text: 'Transcribed text' },
        status: 200,
        statusText: 'OK',
      });

      await service.transcribeIo(mockStream);

      // Note: Node.js streams don't have rewind by default, but if a stream supports it,
      // the service should handle it. Since we're using async iteration, rewind won't be called
      // but the stream should still be readable.
      expect(mockFormData.append).toHaveBeenCalled();
    });
  });
});
