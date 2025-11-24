/**
 * Unit tests for ElevenLabsTextToSpeechService
 * Tests the synthesize method
 */

import ElevenLabsTextToSpeechService, {
  ElevenLabsTextToSpeechServiceError,
  ConnectionError,
  TimeoutError,
  InvalidResponseError,
  SynthesisError,
} from '../../../src/services/elevenlabs-text-to-speech-service';
import axios, { AxiosInstance, AxiosError } from 'axios';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';

// Mock logger
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
    writeFile: jest.fn(),
  },
}));

// Mock path
jest.mock('path', () => ({
  join: jest.fn((...args: string[]) => args.join('/')),
}));

// Mock os
jest.mock('os', () => ({
  tmpdir: jest.fn(() => '/tmp'),
}));

// Mock crypto
jest.mock('crypto', () => ({
  randomBytes: jest.fn((size: number) => ({
    toString: jest.fn((encoding: string) => {
      if (encoding === 'hex') {
        return 'a1b2c3d4e5f6g7h8'; // Mock hex string
      }
      return '';
    }),
  })),
}));

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ElevenLabsTextToSpeechService', () => {
  let service: ElevenLabsTextToSpeechService;
  const mockApiKey = 'test-api-key-12345';
  const mockTimeout = 60;
  const mockModelId = 'eleven_turbo_v2_5';
  const mockVoiceId = 'vfaqCOvlrKi4Zp7C2IAm';
  const mockText = 'Hello, this is a test message';
  const mockAudioData = Buffer.from('mock audio data');

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
    delete process.env.ELEVENLABS_TTS_MODEL_ID;
    delete process.env.ELEVENLABS_VOICE_ID;

    // Create service instance
    service = new ElevenLabsTextToSpeechService(mockApiKey, mockTimeout, mockModelId, mockVoiceId);

    // Mock axios.create to return a mock instance
    const mockAxiosInstance = {
      request: jest.fn(),
    } as unknown as AxiosInstance;
    mockedAxios.create = jest.fn().mockReturnValue(mockAxiosInstance);
  });

  describe('constructor', () => {
    it('should create service with valid API key from parameter', () => {
      const testApiKey = 'test-key-123';
      const service = new ElevenLabsTextToSpeechService(testApiKey);
      expect(service.apiKey).toBe(testApiKey);
    });

    it('should create service with valid API key from environment variable', () => {
      const envApiKey = 'env-api-key-456';
      process.env.ELEVENLABS_API_KEY = envApiKey;
      const service = new ElevenLabsTextToSpeechService();
      expect(service.apiKey).toBe(envApiKey);
      delete process.env.ELEVENLABS_API_KEY;
    });

    it('should throw Error when API key is blank', () => {
      expect(() => new ElevenLabsTextToSpeechService('')).toThrow(ElevenLabsTextToSpeechServiceError);
      expect(() => new ElevenLabsTextToSpeechService('   ')).toThrow(ElevenLabsTextToSpeechServiceError);
    });

    it('should throw Error when API key is undefined and env var is not set', () => {
      delete process.env.ELEVENLABS_API_KEY;
      expect(() => new ElevenLabsTextToSpeechService(undefined)).toThrow(ElevenLabsTextToSpeechServiceError);
    });

    it('should use default timeout (60 seconds) when not provided', () => {
      const service = new ElevenLabsTextToSpeechService(mockApiKey);
      expect(service.timeout).toBe(60);
    });

    it('should use custom timeout when provided', () => {
      const customTimeout = 120;
      const service = new ElevenLabsTextToSpeechService(mockApiKey, customTimeout);
      expect(service.timeout).toBe(customTimeout);
    });

    it('should use default model_id when not provided', () => {
      const service = new ElevenLabsTextToSpeechService(mockApiKey);
      expect(service.modelId).toBe('eleven_turbo_v2_5');
    });

    it('should use custom model_id when provided', () => {
      const customModelId = 'custom_model_v2';
      const service = new ElevenLabsTextToSpeechService(mockApiKey, undefined, customModelId);
      expect(service.modelId).toBe(customModelId);
    });

    it('should use default voice_id when not provided', () => {
      const service = new ElevenLabsTextToSpeechService(mockApiKey);
      expect(service.voiceId).toBe('vfaqCOvlrKi4Zp7C2IAm');
    });

    it('should use custom voice_id when provided', () => {
      const customVoiceId = 'custom_voice_123';
      const service = new ElevenLabsTextToSpeechService(mockApiKey, undefined, undefined, customVoiceId);
      expect(service.voiceId).toBe(customVoiceId);
    });
  });

  describe('voiceIdConfigured', () => {
    it('should return true when voiceId is configured', () => {
      expect(service.voiceIdConfigured()).toBe(true);
    });

    it('should return false when voiceId is not configured/blank', () => {
      const serviceWithoutVoiceId = new ElevenLabsTextToSpeechService(mockApiKey, mockTimeout, mockModelId, undefined);
      // Manually set voice_id to empty string to test validation
      (serviceWithoutVoiceId as any)._voiceId = '';
      expect(serviceWithoutVoiceId.voiceIdConfigured()).toBe(false);
    });

    it('should return false when voiceId is whitespace only', () => {
      const serviceWithoutVoiceId = new ElevenLabsTextToSpeechService(mockApiKey, mockTimeout, mockModelId, undefined);
      // Manually set voice_id to whitespace to test validation
      (serviceWithoutVoiceId as any)._voiceId = '   ';
      expect(serviceWithoutVoiceId.voiceIdConfigured()).toBe(false);
    });
  });

  describe('synthesize', () => {
    describe('parameter validation', () => {
      it('should throw Error if text is blank', async () => {
        await expect(service.synthesize('')).rejects.toThrow(ElevenLabsTextToSpeechServiceError);
        await expect(service.synthesize('   ')).rejects.toThrow(ElevenLabsTextToSpeechServiceError);
      });

      it('should throw Error if text is null', async () => {
        await expect(service.synthesize(null as any)).rejects.toThrow(ElevenLabsTextToSpeechServiceError);
      });

      it('should throw Error if text is undefined', async () => {
        await expect(service.synthesize(undefined as any)).rejects.toThrow(ElevenLabsTextToSpeechServiceError);
      });

      it('should throw Error if voice_id is not configured', async () => {
        // Create service with undefined voice_id and clear env var to ensure no default is used
        delete process.env.ELEVENLABS_VOICE_ID;
        // Mock the default voice_id to be empty by creating a service that would normally use default
        // but we'll manually set _voiceId to empty after construction
        const serviceWithoutVoiceId = new ElevenLabsTextToSpeechService(mockApiKey, mockTimeout, mockModelId, undefined);
        // Manually set voice_id to empty string to test validation
        (serviceWithoutVoiceId as any)._voiceId = '';
        await expect(serviceWithoutVoiceId.synthesize(mockText)).rejects.toThrow(
          ElevenLabsTextToSpeechServiceError
        );
        await expect(serviceWithoutVoiceId.synthesize(mockText)).rejects.toThrow(
          'ElevenLabs voice_id is not configured'
        );
      });
    });

    describe('output path handling', () => {
      beforeEach(() => {
        const mockAxiosInstance = mockedAxios.create() as jest.Mocked<AxiosInstance>;
        (mockAxiosInstance.request as jest.Mock).mockResolvedValue({
          status: 200,
          statusText: 'OK',
          data: mockAudioData,
          headers: {},
          config: {},
        });
        (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
      });

      it('should use provided outputPath when specified', async () => {
        const customOutputPath = '/custom/path/output.mp3';
        const result = await service.synthesize(mockText, { outputPath: customOutputPath });

        expect(result).toBe(customOutputPath);
        expect(fs.writeFile).toHaveBeenCalledWith(customOutputPath, mockAudioData);
      });

      it('should generate temp file path when outputPath not provided', async () => {
        (os.tmpdir as jest.Mock).mockReturnValue('/tmp');
        (crypto.randomBytes as jest.Mock).mockReturnValue({
          toString: jest.fn(() => 'a1b2c3d4e5f6g7h8'),
        });

        const result = await service.synthesize(mockText);

        expect(result).toContain('/tmp/elevenlabs_tts_');
        expect(result).toContain('.mp3');
        expect(path.join).toHaveBeenCalled();
      });
    });

    describe('request building', () => {
      let mockAxiosInstance: jest.Mocked<AxiosInstance>;

      beforeEach(() => {
        mockAxiosInstance = mockedAxios.create() as jest.Mocked<AxiosInstance>;
        (mockAxiosInstance.request as jest.Mock).mockResolvedValue({
          status: 200,
          statusText: 'OK',
          data: mockAudioData,
          headers: {},
          config: {},
        });
        (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
        (os.tmpdir as jest.Mock).mockReturnValue('/tmp');
        (crypto.randomBytes as jest.Mock).mockReturnValue({
          toString: jest.fn(() => 'a1b2c3d4e5f6g7h8'),
        });
      });

      it('should build URI with voice_id in path', async () => {
        await service.synthesize(mockText);

        expect(mockedAxios.create).toHaveBeenCalled();
        const requestCall = (mockAxiosInstance.request as jest.Mock).mock.calls[0][0];
        expect(requestCall.url).toContain(`/v1/text-to-speech/${mockVoiceId}`);
      });

      it('should include correct headers in request', async () => {
        await service.synthesize(mockText);

        const requestCall = (mockAxiosInstance.request as jest.Mock).mock.calls[0][0];
        expect(requestCall.headers['xi-api-key']).toBe(mockApiKey);
        expect(requestCall.headers['Content-Type']).toBe('application/json');
        expect(requestCall.headers['Accept']).toBe('audio/mpeg');
      });

      it('should include text in request body', async () => {
        await service.synthesize(mockText);

        const requestCall = (mockAxiosInstance.request as jest.Mock).mock.calls[0][0];
        expect(requestCall.data.text).toBe(mockText);
        expect(requestCall.data.model_id).toBe(mockModelId);
        expect(requestCall.data.output_format).toBe('mp3_44100_128');
      });

      it('should include voice_settings in request body when provided', async () => {
        const voiceSettings = { stability: 0.5, similarity_boost: 0.75 };
        await service.synthesize(mockText, { voiceSettings });

        const requestCall = (mockAxiosInstance.request as jest.Mock).mock.calls[0][0];
        expect(requestCall.data.voice_settings).toEqual(voiceSettings);
      });

      it('should not include voice_settings in request body when not provided', async () => {
        await service.synthesize(mockText);

        const requestCall = (mockAxiosInstance.request as jest.Mock).mock.calls[0][0];
        expect(requestCall.data.voice_settings).toBeUndefined();
      });

      it('should use arraybuffer response type', async () => {
        await service.synthesize(mockText);

        const requestCall = (mockAxiosInstance.request as jest.Mock).mock.calls[0][0];
        expect(requestCall.responseType).toBe('arraybuffer');
      });

      it('should log request info with text preview', async () => {
        await service.synthesize(mockText);

        expect(getMockLogger().info).toHaveBeenCalledWith(
          expect.stringContaining('Sending text to ElevenLabs for synthesis:')
        );
        expect(getMockLogger().info).toHaveBeenCalledWith(expect.stringContaining(mockText.substring(0, 50)));
      });

      it('should truncate long text in log message', async () => {
        const longText = 'a'.repeat(100);
        await service.synthesize(longText);

        expect(getMockLogger().info).toHaveBeenCalledWith(
          expect.stringContaining('Sending text to ElevenLabs for synthesis:')
        );
        expect(getMockLogger().info).toHaveBeenCalledWith(expect.stringContaining('...'));
      });
    });

    describe('response handling', () => {
      let mockAxiosInstance: jest.Mocked<AxiosInstance>;

      beforeEach(() => {
        mockAxiosInstance = mockedAxios.create() as jest.Mocked<AxiosInstance>;
        (os.tmpdir as jest.Mock).mockReturnValue('/tmp');
        (crypto.randomBytes as jest.Mock).mockReturnValue({
          toString: jest.fn(() => 'a1b2c3d4e5f6g7h8'),
        });
      });

      it('should save audio file to output path', async () => {
        const outputPath = '/tmp/elevenlabs_tts_test.mp3';
        (mockAxiosInstance.request as jest.Mock).mockResolvedValue({
          status: 200,
          statusText: 'OK',
          data: mockAudioData,
          headers: {},
          config: {},
        });
        (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

        const result = await service.synthesize(mockText, { outputPath });

        expect(fs.writeFile).toHaveBeenCalledWith(outputPath, mockAudioData);
        expect(result).toBe(outputPath);
      });

      it('should log success message with file path and size', async () => {
        const outputPath = '/tmp/elevenlabs_tts_test.mp3';
        (mockAxiosInstance.request as jest.Mock).mockResolvedValue({
          status: 200,
          statusText: 'OK',
          data: mockAudioData,
          headers: {},
          config: {},
        });
        (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

        await service.synthesize(mockText, { outputPath });

        expect(getMockLogger().info).toHaveBeenCalledWith(
          expect.stringContaining(`Generated audio file: ${outputPath}`)
        );
        expect(getMockLogger().info).toHaveBeenCalledWith(expect.stringContaining(`${mockAudioData.length} bytes`));
      });

      it('should return output path string', async () => {
        const outputPath = '/tmp/elevenlabs_tts_test.mp3';
        (mockAxiosInstance.request as jest.Mock).mockResolvedValue({
          status: 200,
          statusText: 'OK',
          data: mockAudioData,
          headers: {},
          config: {},
        });
        (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

        const result = await service.synthesize(mockText, { outputPath });

        expect(typeof result).toBe('string');
        expect(result).toBe(outputPath);
      });

      it('should throw Error if file write fails', async () => {
        const outputPath = '/tmp/elevenlabs_tts_test.mp3';
        (mockAxiosInstance.request as jest.Mock).mockResolvedValue({
          status: 200,
          statusText: 'OK',
          data: mockAudioData,
          headers: {},
          config: {},
        });
        (fs.writeFile as jest.Mock).mockRejectedValue(new Error('Permission denied'));

        await expect(service.synthesize(mockText, { outputPath })).rejects.toThrow(
          ElevenLabsTextToSpeechServiceError
        );
      });
    });

    describe('error handling', () => {
      let mockAxiosInstance: jest.Mocked<AxiosInstance>;

      beforeEach(() => {
        mockAxiosInstance = mockedAxios.create() as jest.Mocked<AxiosInstance>;
        (os.tmpdir as jest.Mock).mockReturnValue('/tmp');
        (crypto.randomBytes as jest.Mock).mockReturnValue({
          toString: jest.fn(() => 'a1b2c3d4e5f6g7h8'),
        });
      });

      it('should throw SynthesisError for HTTP 400 error (as AxiosError)', async () => {
        const errorResponse = {
          response: {
            status: 400,
            statusText: 'Bad Request',
            data: Buffer.from(JSON.stringify({ detail: 'Invalid request' })),
            headers: {},
            config: {},
          },
        };
        const axiosError = new Error('Request failed') as AxiosError;
        Object.assign(axiosError, errorResponse);
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);
        (mockAxiosInstance.request as jest.Mock).mockRejectedValue(axiosError);

        await expect(service.synthesize(mockText)).rejects.toThrow(SynthesisError);
      });


      it('should handle error response with string data (not Buffer)', async () => {
        const errorResponse = {
          response: {
            status: 400,
            statusText: 'Bad Request',
            data: JSON.stringify({ detail: 'String error' }),
            headers: {},
            config: {},
          },
        };
        const axiosError = new Error('Request failed') as AxiosError;
        Object.assign(axiosError, errorResponse);
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);
        (mockAxiosInstance.request as jest.Mock).mockRejectedValue(axiosError);

        await expect(service.synthesize(mockText)).rejects.toThrow(SynthesisError);
        await expect(service.synthesize(mockText)).rejects.toThrow('String error');
      });

      it('should handle error response with object data (not Buffer/string)', async () => {
        const errorResponse = {
          response: {
            status: 400,
            statusText: 'Bad Request',
            data: { detail: 'Object error' },
            headers: {},
            config: {},
          },
        };
        const axiosError = new Error('Request failed') as AxiosError;
        Object.assign(axiosError, errorResponse);
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);
        (mockAxiosInstance.request as jest.Mock).mockRejectedValue(axiosError);

        await expect(service.synthesize(mockText)).rejects.toThrow(SynthesisError);
        await expect(service.synthesize(mockText)).rejects.toThrow('Object error');
      });

      it('should throw SynthesisError for HTTP 401 error', async () => {
        const errorResponse = {
          response: {
            status: 401,
            statusText: 'Unauthorized',
            data: Buffer.from(JSON.stringify({ detail: 'Invalid API key' })),
            headers: {},
            config: {},
          },
        };
        const axiosError = new Error('Request failed') as AxiosError;
        Object.assign(axiosError, errorResponse);
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);
        (mockAxiosInstance.request as jest.Mock).mockRejectedValue(axiosError);

        await expect(service.synthesize(mockText)).rejects.toThrow(SynthesisError);
      });

      it('should throw TimeoutError for timeout errors (ECONNABORTED)', async () => {
        const axiosError = new Error('timeout of 60000ms exceeded') as AxiosError;
        axiosError.code = 'ECONNABORTED';
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);
        (mockAxiosInstance.request as jest.Mock).mockRejectedValue(axiosError);

        await expect(service.synthesize(mockText)).rejects.toThrow(TimeoutError);
      });

      it('should throw TimeoutError for timeout errors (ETIMEDOUT)', async () => {
        const axiosError = new Error('ETIMEDOUT') as AxiosError;
        axiosError.code = 'ETIMEDOUT';
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);
        (mockAxiosInstance.request as jest.Mock).mockRejectedValue(axiosError);

        await expect(service.synthesize(mockText)).rejects.toThrow(TimeoutError);
      });

      it('should throw TimeoutError for timeout errors (message includes timeout)', async () => {
        const axiosError = new Error('Request timeout occurred') as AxiosError;
        axiosError.code = 'UNKNOWN';
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);
        (mockAxiosInstance.request as jest.Mock).mockRejectedValue(axiosError);

        await expect(service.synthesize(mockText)).rejects.toThrow(TimeoutError);
      });

      it('should throw ConnectionError for connection refused errors', async () => {
        const axiosError = new Error('connect ECONNREFUSED') as AxiosError;
        axiosError.code = 'ECONNREFUSED';
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);
        (mockAxiosInstance.request as jest.Mock).mockRejectedValue(axiosError);

        await expect(service.synthesize(mockText)).rejects.toThrow(ConnectionError);
      });

      it('should throw ConnectionError for host unreachable errors', async () => {
        const axiosError = new Error('EHOSTUNREACH') as AxiosError;
        axiosError.code = 'EHOSTUNREACH';
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);
        (mockAxiosInstance.request as jest.Mock).mockRejectedValue(axiosError);

        await expect(service.synthesize(mockText)).rejects.toThrow(ConnectionError);
      });

      it('should throw ConnectionError for ENOTFOUND errors', async () => {
        const axiosError = new Error('getaddrinfo ENOTFOUND api.elevenlabs.io') as AxiosError;
        axiosError.code = 'ENOTFOUND';
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);
        (mockAxiosInstance.request as jest.Mock).mockRejectedValue(axiosError);

        await expect(service.synthesize(mockText)).rejects.toThrow(ConnectionError);
      });

      it('should throw ConnectionError for getaddrinfo errors', async () => {
        const axiosError = new Error('getaddrinfo failed') as AxiosError;
        axiosError.message = 'getaddrinfo failed';
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);
        (mockAxiosInstance.request as jest.Mock).mockRejectedValue(axiosError);

        await expect(service.synthesize(mockText)).rejects.toThrow(ConnectionError);
      });

      it('should throw SynthesisError for HTTP 500 error', async () => {
        const errorResponse = {
          response: {
            status: 500,
            statusText: 'Internal Server Error',
            data: Buffer.from(JSON.stringify({ error: 'Server error' })),
            headers: {},
            config: {},
          },
        };
        const axiosError = new Error('Request failed') as AxiosError;
        Object.assign(axiosError, errorResponse);
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);
        (mockAxiosInstance.request as jest.Mock).mockRejectedValue(axiosError);

        await expect(service.synthesize(mockText)).rejects.toThrow(SynthesisError);
        await expect(service.synthesize(mockText)).rejects.toThrow('Server error');
      });

      it('should throw SynthesisError for HTTP 404 error', async () => {
        const errorResponse = {
          response: {
            status: 404,
            statusText: 'Not Found',
            data: Buffer.from(JSON.stringify({ message: 'Voice not found' })),
            headers: {},
            config: {},
          },
        };
        const axiosError = new Error('Request failed') as AxiosError;
        Object.assign(axiosError, errorResponse);
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);
        (mockAxiosInstance.request as jest.Mock).mockRejectedValue(axiosError);

        await expect(service.synthesize(mockText)).rejects.toThrow(SynthesisError);
        await expect(service.synthesize(mockText)).rejects.toThrow('Voice not found');
      });

      it('should extract error message from array format', async () => {
        const errorResponse = {
          response: {
            status: 400,
            statusText: 'Bad Request',
            data: Buffer.from(JSON.stringify([{ msg: 'error1' }, { msg: 'error2' }])),
            headers: {},
            config: {},
          },
        };
        const axiosError = new Error('Request failed') as AxiosError;
        Object.assign(axiosError, errorResponse);
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);
        (mockAxiosInstance.request as jest.Mock).mockRejectedValue(axiosError);

        await expect(service.synthesize(mockText)).rejects.toThrow(SynthesisError);
        await expect(service.synthesize(mockText)).rejects.toThrow('error1; error2');
      });

      it('should extract error message from hash format with detail field', async () => {
        const errorResponse = {
          response: {
            status: 400,
            statusText: 'Bad Request',
            data: Buffer.from(JSON.stringify({ detail: 'Invalid request detail' })),
            headers: {},
            config: {},
          },
        };
        const axiosError = new Error('Request failed') as AxiosError;
        Object.assign(axiosError, errorResponse);
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);
        (mockAxiosInstance.request as jest.Mock).mockRejectedValue(axiosError);

        await expect(service.synthesize(mockText)).rejects.toThrow(SynthesisError);
        await expect(service.synthesize(mockText)).rejects.toThrow('Invalid request detail');
      });

      it('should extract error message from hash format with error field', async () => {
        const errorResponse = {
          response: {
            status: 400,
            statusText: 'Bad Request',
            data: Buffer.from(JSON.stringify({ error: 'Invalid request error' })),
            headers: {},
            config: {},
          },
        };
        const axiosError = new Error('Request failed') as AxiosError;
        Object.assign(axiosError, errorResponse);
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);
        (mockAxiosInstance.request as jest.Mock).mockRejectedValue(axiosError);

        await expect(service.synthesize(mockText)).rejects.toThrow(SynthesisError);
        await expect(service.synthesize(mockText)).rejects.toThrow('Invalid request error');
      });

      it('should extract error message from hash format with message field', async () => {
        const errorResponse = {
          response: {
            status: 400,
            statusText: 'Bad Request',
            data: Buffer.from(JSON.stringify({ message: 'Invalid request message' })),
            headers: {},
            config: {},
          },
        };
        const axiosError = new Error('Request failed') as AxiosError;
        Object.assign(axiosError, errorResponse);
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);
        (mockAxiosInstance.request as jest.Mock).mockRejectedValue(axiosError);

        await expect(service.synthesize(mockText)).rejects.toThrow(SynthesisError);
        await expect(service.synthesize(mockText)).rejects.toThrow('Invalid request message');
      });

      it('should extract error message from nested array in detail field', async () => {
        const errorResponse = {
          response: {
            status: 400,
            statusText: 'Bad Request',
            data: Buffer.from(JSON.stringify({ detail: [{ msg: 'nested error1' }, { msg: 'nested error2' }] })),
            headers: {},
            config: {},
          },
        };
        const axiosError = new Error('Request failed') as AxiosError;
        Object.assign(axiosError, errorResponse);
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);
        (mockAxiosInstance.request as jest.Mock).mockRejectedValue(axiosError);

        await expect(service.synthesize(mockText)).rejects.toThrow(SynthesisError);
        await expect(service.synthesize(mockText)).rejects.toThrow('nested error1; nested error2');
      });

      it('should join multiple error messages with semicolon separator', async () => {
        const errorResponse = {
          response: {
            status: 400,
            statusText: 'Bad Request',
            data: Buffer.from(JSON.stringify([{ msg: 'First error' }, { msg: 'Second error' }, { msg: 'Third error' }])),
            headers: {},
            config: {},
          },
        };
        const axiosError = new Error('Request failed') as AxiosError;
        Object.assign(axiosError, errorResponse);
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);
        (mockAxiosInstance.request as jest.Mock).mockRejectedValue(axiosError);

        await expect(service.synthesize(mockText)).rejects.toThrow(SynthesisError);
        await expect(service.synthesize(mockText)).rejects.toThrow('First error; Second error; Third error');
      });

      it('should fall back to default message when JSON parsing fails for error response', async () => {
        const errorResponse = {
          response: {
            status: 400,
            statusText: 'Bad Request',
            data: Buffer.from('invalid json response'),
            headers: {},
            config: {},
          },
        };
        const axiosError = new Error('Request failed') as AxiosError;
        Object.assign(axiosError, errorResponse);
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);
        (mockAxiosInstance.request as jest.Mock).mockRejectedValue(axiosError);

        await expect(service.synthesize(mockText)).rejects.toThrow(SynthesisError);
        await expect(service.synthesize(mockText)).rejects.toThrow('HTTP 400: Bad Request');
        expect(getMockLogger().error).toHaveBeenCalledWith('Failed to parse error response as JSON');
      });

      it('should handle missing error fields gracefully', async () => {
        const errorResponse = {
          response: {
            status: 400,
            statusText: 'Bad Request',
            data: Buffer.from(JSON.stringify({})),
            headers: {},
            config: {},
          },
        };
        const axiosError = new Error('Request failed') as AxiosError;
        Object.assign(axiosError, errorResponse);
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);
        (mockAxiosInstance.request as jest.Mock).mockRejectedValue(axiosError);

        await expect(service.synthesize(mockText)).rejects.toThrow(SynthesisError);
        await expect(service.synthesize(mockText)).rejects.toThrow('HTTP 400: Bad Request');
      });

      it('should handle non-Axios network errors', async () => {
        const networkError = new Error('Network error');
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(false);
        (mockAxiosInstance.request as jest.Mock).mockRejectedValue(networkError);

        await expect(service.synthesize(mockText)).rejects.toThrow('Network error');
      });

      it('should truncate error response body to 500 chars in log', async () => {
        const longErrorBody = 'x'.repeat(600);
        const errorResponse = {
          response: {
            status: 400,
            statusText: 'Bad Request',
            data: Buffer.from(JSON.stringify({ detail: longErrorBody })),
            headers: {},
            config: {},
          },
        };
        const axiosError = new Error('Request failed') as AxiosError;
        Object.assign(axiosError, errorResponse);
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);
        (mockAxiosInstance.request as jest.Mock).mockRejectedValue(axiosError);

        await expect(service.synthesize(mockText)).rejects.toThrow();

        const errorLogCall = getMockLogger().error.mock.calls.find((call) =>
          call[0].includes('ElevenLabs API error: 400')
        );
        expect(errorLogCall).toBeDefined();
        if (errorLogCall) {
          const logMessage = errorLogCall[0] as string;
          const bodyMatch = logMessage.match(/Response body: (.+)/);
          if (bodyMatch) {
            expect(bodyMatch[1].length).toBeLessThanOrEqual(500);
          }
        }
      });

      it('should throw InvalidResponseError for JSON parsing errors', async () => {
        const syntaxError = new SyntaxError('Unexpected token in JSON at position 0');
        // Make sure it's not treated as an Axios error
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(false);
        (mockAxiosInstance.request as jest.Mock).mockRejectedValue(syntaxError);

        await expect(service.synthesize(mockText)).rejects.toThrow(InvalidResponseError);
        await expect(service.synthesize(mockText)).rejects.toThrow('Failed to parse response');
      });
    });

    describe('logging', () => {
      let mockAxiosInstance: jest.Mocked<AxiosInstance>;

      beforeEach(() => {
        mockAxiosInstance = mockedAxios.create() as jest.Mocked<AxiosInstance>;
        (os.tmpdir as jest.Mock).mockReturnValue('/tmp');
        (crypto.randomBytes as jest.Mock).mockReturnValue({
          toString: jest.fn(() => 'a1b2c3d4e5f6g7h8'),
        });
      });

      it('should log request path', async () => {
        (mockAxiosInstance.request as jest.Mock).mockResolvedValue({
          status: 200,
          statusText: 'OK',
          data: mockAudioData,
          headers: {},
          config: {},
        });
        (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

        await service.synthesize(mockText);

        expect(getMockLogger().info).toHaveBeenCalledWith(
          expect.stringContaining('ElevenLabsTextToSpeechService: POST')
        );
      });

      it('should log response code', async () => {
        (mockAxiosInstance.request as jest.Mock).mockResolvedValue({
          status: 200,
          statusText: 'OK',
          data: mockAudioData,
          headers: {},
          config: {},
        });
        (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

        await service.synthesize(mockText);

        expect(getMockLogger().info).toHaveBeenCalledWith(
          expect.stringContaining('ElevenLabsTextToSpeechService: Response 200')
        );
      });

      it('should log error details for HTTP errors', async () => {
        const errorResponse = {
          response: {
            status: 400,
            statusText: 'Bad Request',
            data: Buffer.from(JSON.stringify({ detail: 'Invalid request' })),
            headers: {},
            config: {},
          },
        };
        const axiosError = new Error('Request failed') as AxiosError;
        Object.assign(axiosError, errorResponse);
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);
        (mockAxiosInstance.request as jest.Mock).mockRejectedValue(axiosError);

        await expect(service.synthesize(mockText)).rejects.toThrow();

        expect(getMockLogger().error).toHaveBeenCalledWith(
          expect.stringContaining('ElevenLabs API error: 400')
        );
      });

      it('should log error when JSON parsing fails for error response', async () => {
        const errorResponse = {
          response: {
            status: 400,
            statusText: 'Bad Request',
            data: Buffer.from('invalid json'),
            headers: {},
            config: {},
          },
        };
        const axiosError = new Error('Request failed') as AxiosError;
        Object.assign(axiosError, errorResponse);
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);
        (mockAxiosInstance.request as jest.Mock).mockRejectedValue(axiosError);

        await expect(service.synthesize(mockText)).rejects.toThrow();

        expect(getMockLogger().error).toHaveBeenCalledWith('Failed to parse error response as JSON');
      });
    });
  });

  describe('synthesizeToIo', () => {
    describe('parameter validation', () => {
      it('should throw Error if text is blank', async () => {
        await expect(service.synthesizeToIo('')).rejects.toThrow(ElevenLabsTextToSpeechServiceError);
        await expect(service.synthesizeToIo('   ')).rejects.toThrow(ElevenLabsTextToSpeechServiceError);
      });

      it('should throw Error if text is null', async () => {
        await expect(service.synthesizeToIo(null as any)).rejects.toThrow(ElevenLabsTextToSpeechServiceError);
      });

      it('should throw Error if text is undefined', async () => {
        await expect(service.synthesizeToIo(undefined as any)).rejects.toThrow(ElevenLabsTextToSpeechServiceError);
      });

      it('should throw Error if voice_id is not configured', async () => {
        // Create service with undefined voice_id and clear env var to ensure no default is used
        delete process.env.ELEVENLABS_VOICE_ID;
        // Mock the default voice_id to be empty by creating a service that would normally use default
        // but we'll manually set _voiceId to empty after construction
        const serviceWithoutVoiceId = new ElevenLabsTextToSpeechService(mockApiKey, mockTimeout, mockModelId, undefined);
        // Manually set voice_id to empty string to test validation
        (serviceWithoutVoiceId as any)._voiceId = '';
        await expect(serviceWithoutVoiceId.synthesizeToIo(mockText)).rejects.toThrow(
          ElevenLabsTextToSpeechServiceError
        );
        await expect(serviceWithoutVoiceId.synthesizeToIo(mockText)).rejects.toThrow(
          'ElevenLabs voice_id is not configured'
        );
      });
    });

    describe('request building', () => {
      let mockAxiosInstance: jest.Mocked<AxiosInstance>;

      beforeEach(() => {
        mockAxiosInstance = mockedAxios.create() as jest.Mocked<AxiosInstance>;
        (mockAxiosInstance.request as jest.Mock).mockResolvedValue({
          status: 200,
          statusText: 'OK',
          data: mockAudioData,
          headers: {},
          config: {},
        });
      });

      it('should build URI with voice_id in path', async () => {
        await service.synthesizeToIo(mockText);

        expect(mockedAxios.create).toHaveBeenCalled();
        const requestCall = (mockAxiosInstance.request as jest.Mock).mock.calls[0][0];
        expect(requestCall.url).toContain(`/v1/text-to-speech/${mockVoiceId}`);
      });

      it('should include correct headers in request', async () => {
        await service.synthesizeToIo(mockText);

        const requestCall = (mockAxiosInstance.request as jest.Mock).mock.calls[0][0];
        expect(requestCall.headers['xi-api-key']).toBe(mockApiKey);
        expect(requestCall.headers['Content-Type']).toBe('application/json');
        expect(requestCall.headers['Accept']).toBe('audio/mpeg');
      });

      it('should include text in request body', async () => {
        await service.synthesizeToIo(mockText);

        const requestCall = (mockAxiosInstance.request as jest.Mock).mock.calls[0][0];
        expect(requestCall.data.text).toBe(mockText);
        expect(requestCall.data.model_id).toBe(mockModelId);
        expect(requestCall.data.output_format).toBe('mp3_44100_128');
      });

      it('should include voice_settings in request body when provided', async () => {
        const voiceSettings = { stability: 0.5, similarity_boost: 0.75 };
        await service.synthesizeToIo(mockText, { voiceSettings });

        const requestCall = (mockAxiosInstance.request as jest.Mock).mock.calls[0][0];
        expect(requestCall.data.voice_settings).toEqual(voiceSettings);
      });

      it('should not include voice_settings in request body when not provided', async () => {
        await service.synthesizeToIo(mockText);

        const requestCall = (mockAxiosInstance.request as jest.Mock).mock.calls[0][0];
        expect(requestCall.data.voice_settings).toBeUndefined();
      });

      it('should use arraybuffer response type', async () => {
        await service.synthesizeToIo(mockText);

        const requestCall = (mockAxiosInstance.request as jest.Mock).mock.calls[0][0];
        expect(requestCall.responseType).toBe('arraybuffer');
      });

      it('should log request info with text preview', async () => {
        await service.synthesizeToIo(mockText);

        expect(getMockLogger().info).toHaveBeenCalledWith(
          expect.stringContaining('Sending text to ElevenLabs for synthesis:')
        );
        expect(getMockLogger().info).toHaveBeenCalledWith(expect.stringContaining(mockText.substring(0, 50)));
      });

      it('should truncate long text in log message', async () => {
        const longText = 'a'.repeat(100);
        await service.synthesizeToIo(longText);

        expect(getMockLogger().info).toHaveBeenCalledWith(
          expect.stringContaining('Sending text to ElevenLabs for synthesis:')
        );
        expect(getMockLogger().info).toHaveBeenCalledWith(expect.stringContaining('...'));
      });
    });

    describe('response handling', () => {
      let mockAxiosInstance: jest.Mocked<AxiosInstance>;

      beforeEach(() => {
        mockAxiosInstance = mockedAxios.create() as jest.Mocked<AxiosInstance>;
      });

      it('should return Buffer containing audio data', async () => {
        (mockAxiosInstance.request as jest.Mock).mockResolvedValue({
          status: 200,
          statusText: 'OK',
          data: mockAudioData,
          headers: {},
          config: {},
        });

        const result = await service.synthesizeToIo(mockText);

        expect(Buffer.isBuffer(result)).toBe(true);
        expect(result).toEqual(mockAudioData);
      });

      it('should return Buffer from response data', async () => {
        const audioBuffer = Buffer.from('test audio data');
        (mockAxiosInstance.request as jest.Mock).mockResolvedValue({
          status: 200,
          statusText: 'OK',
          data: audioBuffer,
          headers: {},
          config: {},
        });

        const result = await service.synthesizeToIo(mockText);

        expect(Buffer.isBuffer(result)).toBe(true);
        expect(result).toEqual(audioBuffer);
      });
    });

    describe('error handling', () => {
      let mockAxiosInstance: jest.Mocked<AxiosInstance>;

      beforeEach(() => {
        mockAxiosInstance = mockedAxios.create() as jest.Mocked<AxiosInstance>;
      });

      it('should throw SynthesisError for HTTP 400 error (as AxiosError)', async () => {
        const errorResponse = {
          response: {
            status: 400,
            statusText: 'Bad Request',
            data: Buffer.from(JSON.stringify({ detail: 'Invalid request' })),
            headers: {},
            config: {},
          },
        };
        const axiosError = new Error('Request failed') as AxiosError;
        Object.assign(axiosError, errorResponse);
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);
        (mockAxiosInstance.request as jest.Mock).mockRejectedValue(axiosError);

        await expect(service.synthesizeToIo(mockText)).rejects.toThrow(SynthesisError);
      });


      it('should handle error response with string data (not Buffer)', async () => {
        const errorResponse = {
          response: {
            status: 400,
            statusText: 'Bad Request',
            data: JSON.stringify({ detail: 'String error' }),
            headers: {},
            config: {},
          },
        };
        const axiosError = new Error('Request failed') as AxiosError;
        Object.assign(axiosError, errorResponse);
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);
        (mockAxiosInstance.request as jest.Mock).mockRejectedValue(axiosError);

        await expect(service.synthesizeToIo(mockText)).rejects.toThrow(SynthesisError);
        await expect(service.synthesizeToIo(mockText)).rejects.toThrow('String error');
      });

      it('should handle error response with object data (not Buffer/string)', async () => {
        const errorResponse = {
          response: {
            status: 400,
            statusText: 'Bad Request',
            data: { detail: 'Object error' },
            headers: {},
            config: {},
          },
        };
        const axiosError = new Error('Request failed') as AxiosError;
        Object.assign(axiosError, errorResponse);
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);
        (mockAxiosInstance.request as jest.Mock).mockRejectedValue(axiosError);

        await expect(service.synthesizeToIo(mockText)).rejects.toThrow(SynthesisError);
        await expect(service.synthesizeToIo(mockText)).rejects.toThrow('Object error');
      });

      it('should handle non-Axios network errors', async () => {
        const networkError = new Error('Network error');
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(false);
        (mockAxiosInstance.request as jest.Mock).mockRejectedValue(networkError);

        await expect(service.synthesizeToIo(mockText)).rejects.toThrow('Network error');
      });

      it('should throw SynthesisError for HTTP 401 error', async () => {
        const errorResponse = {
          response: {
            status: 401,
            statusText: 'Unauthorized',
            data: Buffer.from(JSON.stringify({ detail: 'Invalid API key' })),
            headers: {},
            config: {},
          },
        };
        const axiosError = new Error('Request failed') as AxiosError;
        Object.assign(axiosError, errorResponse);
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);
        (mockAxiosInstance.request as jest.Mock).mockRejectedValue(axiosError);

        await expect(service.synthesizeToIo(mockText)).rejects.toThrow(SynthesisError);
      });

      it('should throw TimeoutError for timeout errors (ECONNABORTED)', async () => {
        const axiosError = new Error('timeout of 60000ms exceeded') as AxiosError;
        axiosError.code = 'ECONNABORTED';
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);
        (mockAxiosInstance.request as jest.Mock).mockRejectedValue(axiosError);

        await expect(service.synthesizeToIo(mockText)).rejects.toThrow(TimeoutError);
      });

      it('should throw TimeoutError for timeout errors (ETIMEDOUT)', async () => {
        const axiosError = new Error('ETIMEDOUT') as AxiosError;
        axiosError.code = 'ETIMEDOUT';
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);
        (mockAxiosInstance.request as jest.Mock).mockRejectedValue(axiosError);

        await expect(service.synthesizeToIo(mockText)).rejects.toThrow(TimeoutError);
      });

      it('should throw TimeoutError for timeout errors (message includes timeout)', async () => {
        const axiosError = new Error('Request timeout occurred') as AxiosError;
        axiosError.code = 'UNKNOWN';
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);
        (mockAxiosInstance.request as jest.Mock).mockRejectedValue(axiosError);

        await expect(service.synthesizeToIo(mockText)).rejects.toThrow(TimeoutError);
      });

      it('should throw ConnectionError for connection refused errors', async () => {
        const axiosError = new Error('connect ECONNREFUSED') as AxiosError;
        axiosError.code = 'ECONNREFUSED';
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);
        (mockAxiosInstance.request as jest.Mock).mockRejectedValue(axiosError);

        await expect(service.synthesizeToIo(mockText)).rejects.toThrow(ConnectionError);
      });

      it('should throw ConnectionError for host unreachable errors', async () => {
        const axiosError = new Error('EHOSTUNREACH') as AxiosError;
        axiosError.code = 'EHOSTUNREACH';
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);
        (mockAxiosInstance.request as jest.Mock).mockRejectedValue(axiosError);

        await expect(service.synthesizeToIo(mockText)).rejects.toThrow(ConnectionError);
      });

      it('should throw ConnectionError for ENOTFOUND errors', async () => {
        const axiosError = new Error('getaddrinfo ENOTFOUND api.elevenlabs.io') as AxiosError;
        axiosError.code = 'ENOTFOUND';
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);
        (mockAxiosInstance.request as jest.Mock).mockRejectedValue(axiosError);

        await expect(service.synthesizeToIo(mockText)).rejects.toThrow(ConnectionError);
      });

      it('should throw ConnectionError for getaddrinfo errors', async () => {
        const axiosError = new Error('getaddrinfo failed') as AxiosError;
        axiosError.message = 'getaddrinfo failed';
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);
        (mockAxiosInstance.request as jest.Mock).mockRejectedValue(axiosError);

        await expect(service.synthesizeToIo(mockText)).rejects.toThrow(ConnectionError);
      });

      it('should throw SynthesisError for HTTP 500 error', async () => {
        const errorResponse = {
          response: {
            status: 500,
            statusText: 'Internal Server Error',
            data: Buffer.from(JSON.stringify({ error: 'Server error' })),
            headers: {},
            config: {},
          },
        };
        const axiosError = new Error('Request failed') as AxiosError;
        Object.assign(axiosError, errorResponse);
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);
        (mockAxiosInstance.request as jest.Mock).mockRejectedValue(axiosError);

        await expect(service.synthesizeToIo(mockText)).rejects.toThrow(SynthesisError);
        await expect(service.synthesizeToIo(mockText)).rejects.toThrow('Server error');
      });

      it('should extract error message from array format', async () => {
        const errorResponse = {
          response: {
            status: 400,
            statusText: 'Bad Request',
            data: Buffer.from(JSON.stringify([{ msg: 'error1' }, { msg: 'error2' }])),
            headers: {},
            config: {},
          },
        };
        const axiosError = new Error('Request failed') as AxiosError;
        Object.assign(axiosError, errorResponse);
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);
        (mockAxiosInstance.request as jest.Mock).mockRejectedValue(axiosError);

        await expect(service.synthesizeToIo(mockText)).rejects.toThrow(SynthesisError);
        await expect(service.synthesizeToIo(mockText)).rejects.toThrow('error1; error2');
      });

      it('should extract error message from hash format with detail field', async () => {
        const errorResponse = {
          response: {
            status: 400,
            statusText: 'Bad Request',
            data: Buffer.from(JSON.stringify({ detail: 'Invalid request detail' })),
            headers: {},
            config: {},
          },
        };
        const axiosError = new Error('Request failed') as AxiosError;
        Object.assign(axiosError, errorResponse);
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);
        (mockAxiosInstance.request as jest.Mock).mockRejectedValue(axiosError);

        await expect(service.synthesizeToIo(mockText)).rejects.toThrow(SynthesisError);
        await expect(service.synthesizeToIo(mockText)).rejects.toThrow('Invalid request detail');
      });

      it('should extract error message from hash format with error field', async () => {
        const errorResponse = {
          response: {
            status: 400,
            statusText: 'Bad Request',
            data: Buffer.from(JSON.stringify({ error: 'Invalid request error' })),
            headers: {},
            config: {},
          },
        };
        const axiosError = new Error('Request failed') as AxiosError;
        Object.assign(axiosError, errorResponse);
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);
        (mockAxiosInstance.request as jest.Mock).mockRejectedValue(axiosError);

        await expect(service.synthesizeToIo(mockText)).rejects.toThrow(SynthesisError);
        await expect(service.synthesizeToIo(mockText)).rejects.toThrow('Invalid request error');
      });

      it('should extract error message from hash format with message field', async () => {
        const errorResponse = {
          response: {
            status: 400,
            statusText: 'Bad Request',
            data: Buffer.from(JSON.stringify({ message: 'Invalid request message' })),
            headers: {},
            config: {},
          },
        };
        const axiosError = new Error('Request failed') as AxiosError;
        Object.assign(axiosError, errorResponse);
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);
        (mockAxiosInstance.request as jest.Mock).mockRejectedValue(axiosError);

        await expect(service.synthesizeToIo(mockText)).rejects.toThrow(SynthesisError);
        await expect(service.synthesizeToIo(mockText)).rejects.toThrow('Invalid request message');
      });

      it('should extract error message from nested array in detail field', async () => {
        const errorResponse = {
          response: {
            status: 400,
            statusText: 'Bad Request',
            data: Buffer.from(JSON.stringify({ detail: [{ msg: 'nested error1' }, { msg: 'nested error2' }] })),
            headers: {},
            config: {},
          },
        };
        const axiosError = new Error('Request failed') as AxiosError;
        Object.assign(axiosError, errorResponse);
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);
        (mockAxiosInstance.request as jest.Mock).mockRejectedValue(axiosError);

        await expect(service.synthesizeToIo(mockText)).rejects.toThrow(SynthesisError);
        await expect(service.synthesizeToIo(mockText)).rejects.toThrow('nested error1; nested error2');
      });

      it('should fall back to default message when JSON parsing fails for error response', async () => {
        const errorResponse = {
          response: {
            status: 400,
            statusText: 'Bad Request',
            data: Buffer.from('invalid json response'),
            headers: {},
            config: {},
          },
        };
        const axiosError = new Error('Request failed') as AxiosError;
        Object.assign(axiosError, errorResponse);
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);
        (mockAxiosInstance.request as jest.Mock).mockRejectedValue(axiosError);

        await expect(service.synthesizeToIo(mockText)).rejects.toThrow(SynthesisError);
        await expect(service.synthesizeToIo(mockText)).rejects.toThrow('HTTP 400: Bad Request');
        expect(getMockLogger().error).toHaveBeenCalledWith('Failed to parse error response as JSON');
      });

      it('should handle missing error fields gracefully', async () => {
        const errorResponse = {
          response: {
            status: 400,
            statusText: 'Bad Request',
            data: Buffer.from(JSON.stringify({})),
            headers: {},
            config: {},
          },
        };
        const axiosError = new Error('Request failed') as AxiosError;
        Object.assign(axiosError, errorResponse);
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);
        (mockAxiosInstance.request as jest.Mock).mockRejectedValue(axiosError);

        await expect(service.synthesizeToIo(mockText)).rejects.toThrow(SynthesisError);
        await expect(service.synthesizeToIo(mockText)).rejects.toThrow('HTTP 400: Bad Request');
      });

      it('should throw InvalidResponseError for JSON parsing errors', async () => {
        const syntaxError = new SyntaxError('Unexpected token in JSON at position 0');
        // Make sure it's not treated as an Axios error
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(false);
        (mockAxiosInstance.request as jest.Mock).mockRejectedValue(syntaxError);

        await expect(service.synthesizeToIo(mockText)).rejects.toThrow(InvalidResponseError);
        await expect(service.synthesizeToIo(mockText)).rejects.toThrow('Failed to parse response');
      });
    });

    describe('logging', () => {
      let mockAxiosInstance: jest.Mocked<AxiosInstance>;

      beforeEach(() => {
        mockAxiosInstance = mockedAxios.create() as jest.Mocked<AxiosInstance>;
      });

      it('should log request path', async () => {
        (mockAxiosInstance.request as jest.Mock).mockResolvedValue({
          status: 200,
          statusText: 'OK',
          data: mockAudioData,
          headers: {},
          config: {},
        });

        await service.synthesizeToIo(mockText);

        expect(getMockLogger().info).toHaveBeenCalledWith(
          expect.stringContaining('ElevenLabsTextToSpeechService: POST')
        );
      });

      it('should log response code', async () => {
        (mockAxiosInstance.request as jest.Mock).mockResolvedValue({
          status: 200,
          statusText: 'OK',
          data: mockAudioData,
          headers: {},
          config: {},
        });

        await service.synthesizeToIo(mockText);

        expect(getMockLogger().info).toHaveBeenCalledWith(
          expect.stringContaining('ElevenLabsTextToSpeechService: Response 200')
        );
      });

      it('should log error details for HTTP errors', async () => {
        const errorResponse = {
          response: {
            status: 400,
            statusText: 'Bad Request',
            data: Buffer.from(JSON.stringify({ detail: 'Invalid request' })),
            headers: {},
            config: {},
          },
        };
        const axiosError = new Error('Request failed') as AxiosError;
        Object.assign(axiosError, errorResponse);
        mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);
        (mockAxiosInstance.request as jest.Mock).mockRejectedValue(axiosError);

        await expect(service.synthesizeToIo(mockText)).rejects.toThrow();

        expect(getMockLogger().error).toHaveBeenCalledWith(
          expect.stringContaining('ElevenLabs API error: 400')
        );
      });

      it('should not save file to disk (only returns Buffer)', async () => {
        (mockAxiosInstance.request as jest.Mock).mockResolvedValue({
          status: 200,
          statusText: 'OK',
          data: mockAudioData,
          headers: {},
          config: {},
        });

        await service.synthesizeToIo(mockText);

        expect(fs.writeFile).not.toHaveBeenCalled();
      });
    });
  });
});
