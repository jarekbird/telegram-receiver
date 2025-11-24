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

      it('should throw SynthesisError for HTTP 400 error', async () => {
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

      it('should throw TimeoutError for timeout errors', async () => {
        const axiosError = new Error('timeout of 60000ms exceeded') as AxiosError;
        axiosError.code = 'ECONNABORTED';
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
    });
  });
});
