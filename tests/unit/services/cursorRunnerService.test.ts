/**
 * Unit tests for CursorRunnerService HTTP client utilities
 * Tests private methods: get, post, buildHttp, executeRequest, parseResponse
 * Also tests error classes: CursorRunnerServiceError, ConnectionError, TimeoutError, InvalidResponseError
 */

import CursorRunnerService, {
  CursorRunnerServiceError,
  ConnectionError,
  TimeoutError,
  InvalidResponseError,
} from '../../../src/services/cursorRunnerService';
import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { AxiosRequestConfig } from 'axios';
import { CursorExecuteResponse, CursorIterateResponse, GitCloneResponse, GitListRepositoriesResponse, GitCheckoutResponse } from '../../../src/types/cursor-runner';

// Mock logger - define inline to avoid hoisting issues
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

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Import logger after mocking (will be the mocked version)
import logger from '../../../src/utils/logger';
// Get the actual mock instance that jest created
const getMockLogger = () => logger as {
  info: jest.Mock;
  error: jest.Mock;
  warn: jest.Mock;
  debug: jest.Mock;
};

describe('CursorRunnerService', () => {
  let service: CursorRunnerService;
  const baseUrl = 'http://localhost:3001';
  const timeout = 5000;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    getMockLogger().info.mockClear();
    getMockLogger().error.mockClear();
    getMockLogger().warn.mockClear();
    getMockLogger().debug.mockClear();
    
    // Reset axios.create mock to return a basic mock instance
    const mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
    } as unknown as AxiosInstance;
    mockedAxios.create = jest.fn().mockReturnValue(mockAxiosInstance);
    mockedAxios.isAxiosError = jest.fn().mockImplementation((error) => {
      // Check if error has isAxiosError property or code property
      return error && (error.isAxiosError === true || ['ECONNREFUSED', 'EHOSTUNREACH', 'ENOTFOUND', 'ECONNABORTED', 'ECONNRESET'].includes((error as any).code));
    });
    
    service = new CursorRunnerService(baseUrl, timeout);
  });

  describe('Error Classes', () => {
    describe('CursorRunnerServiceError', () => {
      it('should create error with message', () => {
        const error = new CursorRunnerServiceError('Test error');
        expect(error.message).toBe('Test error');
        expect(error.name).toBe('CursorRunnerServiceError');
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(CursorRunnerServiceError);
      });
    });

    describe('ConnectionError', () => {
      it('should create connection error with message', () => {
        const error = new ConnectionError('Failed to connect to cursor-runner: Connection refused');
        expect(error.message).toBe('Failed to connect to cursor-runner: Connection refused');
        expect(error.name).toBe('ConnectionError');
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(CursorRunnerServiceError);
        expect(error).toBeInstanceOf(ConnectionError);
      });
    });

    describe('TimeoutError', () => {
      it('should create timeout error with message', () => {
        const error = new TimeoutError('Request to cursor-runner timed out: timeout of 5000ms exceeded');
        expect(error.message).toBe('Request to cursor-runner timed out: timeout of 5000ms exceeded');
        expect(error.name).toBe('TimeoutError');
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(CursorRunnerServiceError);
        expect(error).toBeInstanceOf(TimeoutError);
      });
    });

    describe('InvalidResponseError', () => {
      it('should create invalid response error with message', () => {
        const error = new InvalidResponseError('Failed to parse response: Unexpected token');
        expect(error.message).toBe('Failed to parse response: Unexpected token');
        expect(error.name).toBe('InvalidResponseError');
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(CursorRunnerServiceError);
        expect(error).toBeInstanceOf(InvalidResponseError);
      });
    });
  });

  describe('buildHttp', () => {
    it('should create axios instance with correct configuration', () => {
      const mockAxiosInstance = {
        get: jest.fn(),
        post: jest.fn(),
      } as unknown as AxiosInstance;

      mockedAxios.create = jest.fn().mockReturnValue(mockAxiosInstance);

      // Access private method using type assertion
      const buildHttp = (service as any).buildHttp.bind(service);
      const http = buildHttp('http://localhost:3001/test');

      expect(mockedAxios.create).toHaveBeenCalledWith({
        timeout: timeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      expect(http).toBe(mockAxiosInstance);
    });

    it('should handle http URLs', () => {
      const mockAxiosInstance = {} as AxiosInstance;
      mockedAxios.create = jest.fn().mockReturnValue(mockAxiosInstance);

      const buildHttp = (service as any).buildHttp.bind(service);
      buildHttp('http://localhost:3001/test');

      expect(mockedAxios.create).toHaveBeenCalled();
    });

    it('should handle https URLs', () => {
      const mockAxiosInstance = {} as AxiosInstance;
      mockedAxios.create = jest.fn().mockReturnValue(mockAxiosInstance);

      const buildHttp = (service as any).buildHttp.bind(service);
      buildHttp('https://example.com/test');

      expect(mockedAxios.create).toHaveBeenCalled();
    });

    it('should throw ConnectionError on ECONNREFUSED during setup', () => {
      const error = new Error('Connection refused') as NodeJS.ErrnoException;
      error.code = 'ECONNREFUSED';
      const originalCreate = mockedAxios.create;
      mockedAxios.create = jest.fn().mockImplementation(() => {
        throw error;
      });

      const buildHttp = (service as any).buildHttp.bind(service);
      expect(() => buildHttp('http://localhost:3001/test')).toThrow(ConnectionError);
      expect(() => buildHttp('http://localhost:3001/test')).toThrow('Failed to connect to cursor-runner: Connection refused');
      
      // Restore original
      mockedAxios.create = originalCreate;
    });

    it('should throw ConnectionError on EHOSTUNREACH during setup', () => {
      const error = new Error('Host unreachable') as NodeJS.ErrnoException;
      error.code = 'EHOSTUNREACH';
      const originalCreate = mockedAxios.create;
      mockedAxios.create = jest.fn().mockImplementation(() => {
        throw error;
      });

      const buildHttp = (service as any).buildHttp.bind(service);
      expect(() => buildHttp('http://localhost:3001/test')).toThrow(ConnectionError);
      
      // Restore original
      mockedAxios.create = originalCreate;
    });

    it('should throw TimeoutError on timeout during setup', () => {
      const error = new Error('ETIMEDOUT');
      const originalCreate = mockedAxios.create;
      mockedAxios.create = jest.fn().mockImplementation(() => {
        throw error;
      });

      const buildHttp = (service as any).buildHttp.bind(service);
      expect(() => buildHttp('http://localhost:3001/test')).toThrow(TimeoutError);
      
      // Restore original
      mockedAxios.create = originalCreate;
    });
  });

  describe('executeRequest', () => {
    let mockAxiosInstance: jest.Mocked<AxiosInstance>;
    let mockResponse: AxiosResponse;

    beforeEach(() => {
      mockAxiosInstance = {
        get: jest.fn(),
        post: jest.fn(),
      } as unknown as jest.Mocked<AxiosInstance>;

      mockResponse = {
        status: 200,
        statusText: 'OK',
        data: { success: true },
        headers: {},
        config: {} as AxiosRequestConfig,
      } as AxiosResponse;
    });

    it('should log request method and path for GET', async () => {
      mockAxiosInstance.get = jest.fn().mockResolvedValue(mockResponse);

      const executeRequest = (service as any).executeRequest.bind(service);
      await executeRequest(mockAxiosInstance, 'GET', '/test', 'http://localhost:3001/test');

      expect(getMockLogger().info).toHaveBeenCalledWith('CursorRunnerService: GET /test');
    });

    it('should log request method and path for POST', async () => {
      mockAxiosInstance.post = jest.fn().mockResolvedValue(mockResponse);

      const executeRequest = (service as any).executeRequest.bind(service);
      await executeRequest(mockAxiosInstance, 'POST', '/test', 'http://localhost:3001/test', '{"key":"value"}');

      expect(getMockLogger().info).toHaveBeenCalledWith('CursorRunnerService: POST /test');
    });

    it('should log response status and message', async () => {
      mockAxiosInstance.get = jest.fn().mockResolvedValue(mockResponse);

      const executeRequest = (service as any).executeRequest.bind(service);
      await executeRequest(mockAxiosInstance, 'GET', '/test', 'http://localhost:3001/test');

      expect(getMockLogger().info).toHaveBeenCalledWith('CursorRunnerService: Response 200 OK');
    });

    it('should return response for successful GET request', async () => {
      mockAxiosInstance.get = jest.fn().mockResolvedValue(mockResponse);

      const executeRequest = (service as any).executeRequest.bind(service);
      const result = await executeRequest(mockAxiosInstance, 'GET', '/test', 'http://localhost:3001/test');

      expect(result).toBe(mockResponse);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('http://localhost:3001/test');
    });

    it('should return response for successful POST request', async () => {
      mockAxiosInstance.post = jest.fn().mockResolvedValue(mockResponse);
      const body = '{"key":"value"}';

      const executeRequest = (service as any).executeRequest.bind(service);
      const result = await executeRequest(mockAxiosInstance, 'POST', '/test', 'http://localhost:3001/test', body);

      expect(result).toBe(mockResponse);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('http://localhost:3001/test', body);
    });

    it('should return 422 response without throwing error', async () => {
      const response422 = {
        ...mockResponse,
        status: 422,
        statusText: 'Unprocessable Entity',
      } as AxiosResponse;
      mockAxiosInstance.get = jest.fn().mockResolvedValue(response422);

      const executeRequest = (service as any).executeRequest.bind(service);
      const result = await executeRequest(mockAxiosInstance, 'GET', '/test', 'http://localhost:3001/test');

      expect(result).toBe(response422);
      expect(result.status).toBe(422);
    });

    it('should throw CursorRunnerServiceError for non-2xx status (except 422)', async () => {
      const response500 = {
        ...mockResponse,
        status: 500,
        statusText: 'Internal Server Error',
      } as AxiosResponse;
      mockAxiosInstance.get = jest.fn().mockResolvedValue(response500);

      const executeRequest = (service as any).executeRequest.bind(service);
      await expect(
        executeRequest(mockAxiosInstance, 'GET', '/test', 'http://localhost:3001/test')
      ).rejects.toThrow(CursorRunnerServiceError);
      await expect(
        executeRequest(mockAxiosInstance, 'GET', '/test', 'http://localhost:3001/test')
      ).rejects.toThrow('HTTP 500: Internal Server Error');
    });

    it('should extract error message from response body JSON', async () => {
      const response400 = {
        ...mockResponse,
        status: 400,
        statusText: 'Bad Request',
        data: { error: 'Custom error message from API' },
      } as AxiosResponse;
      mockAxiosInstance.get = jest.fn().mockResolvedValue(response400);

      const executeRequest = (service as any).executeRequest.bind(service);
      await expect(
        executeRequest(mockAxiosInstance, 'GET', '/test', 'http://localhost:3001/test')
      ).rejects.toThrow('Custom error message from API');
    });

    it('should use default error message when response body JSON parsing fails', async () => {
      const response400 = {
        ...mockResponse,
        status: 400,
        statusText: 'Bad Request',
        data: 'Invalid JSON string',
      } as AxiosResponse;
      mockAxiosInstance.get = jest.fn().mockResolvedValue(response400);

      const executeRequest = (service as any).executeRequest.bind(service);
      await expect(
        executeRequest(mockAxiosInstance, 'GET', '/test', 'http://localhost:3001/test')
      ).rejects.toThrow('HTTP 400: Bad Request');
    });

    it('should throw TimeoutError for axios timeout errors', async () => {
      const timeoutError = {
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded',
        isAxiosError: true,
      } as AxiosError;
      mockAxiosInstance.get = jest.fn().mockRejectedValue(timeoutError);
      mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);

      const executeRequest = (service as any).executeRequest.bind(service);
      await expect(
        executeRequest(mockAxiosInstance, 'GET', '/test', 'http://localhost:3001/test')
      ).rejects.toThrow(TimeoutError);
      await expect(
        executeRequest(mockAxiosInstance, 'GET', '/test', 'http://localhost:3001/test')
      ).rejects.toThrow('Request to cursor-runner timed out: timeout of 5000ms exceeded');
    });

    it('should throw ConnectionError for ECONNREFUSED', async () => {
      const connectionError = {
        code: 'ECONNREFUSED',
        message: 'Connection refused',
        isAxiosError: true,
      } as AxiosError;
      mockAxiosInstance.get = jest.fn().mockRejectedValue(connectionError);
      mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);

      const executeRequest = (service as any).executeRequest.bind(service);
      await expect(
        executeRequest(mockAxiosInstance, 'GET', '/test', 'http://localhost:3001/test')
      ).rejects.toThrow(ConnectionError);
      await expect(
        executeRequest(mockAxiosInstance, 'GET', '/test', 'http://localhost:3001/test')
      ).rejects.toThrow('Failed to connect to cursor-runner: Connection refused');
    });

    it('should throw ConnectionError for EHOSTUNREACH', async () => {
      const connectionError = {
        code: 'EHOSTUNREACH',
        message: 'Host unreachable',
        isAxiosError: true,
      } as AxiosError;
      mockAxiosInstance.get = jest.fn().mockRejectedValue(connectionError);
      mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);

      const executeRequest = (service as any).executeRequest.bind(service);
      await expect(
        executeRequest(mockAxiosInstance, 'GET', '/test', 'http://localhost:3001/test')
      ).rejects.toThrow(ConnectionError);
    });

    it('should throw ConnectionError for ENOTFOUND', async () => {
      const connectionError = {
        code: 'ENOTFOUND',
        message: 'getaddrinfo ENOTFOUND',
        isAxiosError: true,
      } as AxiosError;
      mockAxiosInstance.get = jest.fn().mockRejectedValue(connectionError);
      mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);

      const executeRequest = (service as any).executeRequest.bind(service);
      await expect(
        executeRequest(mockAxiosInstance, 'GET', '/test', 'http://localhost:3001/test')
      ).rejects.toThrow(ConnectionError);
    });

    it('should handle axios error with response status', async () => {
      const axiosError = {
        code: 'ERR_BAD_REQUEST',
        message: 'Request failed with status code 400',
        isAxiosError: true,
        response: {
          status: 400,
          statusText: 'Bad Request',
          data: { error: 'Error from response body' },
        },
      } as AxiosError;
      mockAxiosInstance.get = jest.fn().mockRejectedValue(axiosError);
      mockedAxios.isAxiosError = jest.fn().mockReturnValue(true);

      const executeRequest = (service as any).executeRequest.bind(service);
      await expect(
        executeRequest(mockAxiosInstance, 'GET', '/test', 'http://localhost:3001/test')
      ).rejects.toThrow(CursorRunnerServiceError);
      await expect(
        executeRequest(mockAxiosInstance, 'GET', '/test', 'http://localhost:3001/test')
      ).rejects.toThrow('Error from response body');
    });

    it('should handle Node.js system errors', async () => {
      const nodeError = new Error('Connection refused') as NodeJS.ErrnoException;
      nodeError.code = 'ECONNREFUSED';
      mockAxiosInstance.get = jest.fn().mockRejectedValue(nodeError);
      mockedAxios.isAxiosError = jest.fn().mockReturnValue(false);

      const executeRequest = (service as any).executeRequest.bind(service);
      await expect(
        executeRequest(mockAxiosInstance, 'GET', '/test', 'http://localhost:3001/test')
      ).rejects.toThrow(ConnectionError);
    });
  });

  describe('parseResponse', () => {
    it('should parse JSON object response', () => {
      const response = {
        data: { success: true, message: 'Test' },
      } as AxiosResponse;

      const parseResponse = (service as any).parseResponse.bind(service);
      const result = parseResponse(response);

      expect(result).toEqual({ success: true, message: 'Test' });
    });

    it('should parse JSON string response', () => {
      const response = {
        data: '{"success":true,"message":"Test"}',
      } as AxiosResponse;

      const parseResponse = (service as any).parseResponse.bind(service);
      const result = parseResponse(response);

      expect(result).toEqual({ success: true, message: 'Test' });
    });

    it('should return empty object for null response', () => {
      const response = {
        data: null,
      } as AxiosResponse;

      const parseResponse = (service as any).parseResponse.bind(service);
      const result = parseResponse(response);

      expect(result).toEqual({});
    });

    it('should return empty object for undefined response', () => {
      const response = {
        data: undefined,
      } as AxiosResponse;

      const parseResponse = (service as any).parseResponse.bind(service);
      const result = parseResponse(response);

      expect(result).toEqual({});
    });

    it('should throw InvalidResponseError for invalid JSON string', () => {
      const response = {
        data: 'invalid json{',
      } as AxiosResponse;

      const parseResponse = (service as any).parseResponse.bind(service);
      expect(() => parseResponse(response)).toThrow(InvalidResponseError);
      expect(() => parseResponse(response)).toThrow('Failed to parse response:');
    });

    it('should handle non-object, non-string, non-null data', () => {
      const response = {
        data: 123,
      } as AxiosResponse;

      const parseResponse = (service as any).parseResponse.bind(service);
      // Number is not an object, so it should return empty object
      const result = parseResponse(response);
      expect(result).toEqual({});
    });
  });

  describe('get method', () => {
    it('should build URI and call executeRequest', async () => {
      const mockAxiosInstance = {
        get: jest.fn(),
      } as unknown as AxiosInstance;
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        data: { success: true },
      } as AxiosResponse;

      mockedAxios.create = jest.fn().mockReturnValue(mockAxiosInstance);
      mockAxiosInstance.get = jest.fn().mockResolvedValue(mockResponse);

      // Mock buildHttp and executeRequest
      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockResolvedValue(mockResponse);

      const get = (service as any).get.bind(service);
      const result = await get('/test');

      expect(buildHttpSpy).toHaveBeenCalledWith(`${baseUrl}/test`);
      expect(executeRequestSpy).toHaveBeenCalledWith(mockAxiosInstance, 'GET', '/test', `${baseUrl}/test`);
      expect(result).toBe(mockResponse);

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
    });
  });

  describe('post method', () => {
    it('should build URI, convert body to JSON, and call executeRequest', async () => {
      const mockAxiosInstance = {
        post: jest.fn(),
      } as unknown as AxiosInstance;
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        data: { success: true },
      } as AxiosResponse;
      const body = { key: 'value', number: 123 };

      mockedAxios.create = jest.fn().mockReturnValue(mockAxiosInstance);
      mockAxiosInstance.post = jest.fn().mockResolvedValue(mockResponse);

      // Mock buildHttp and executeRequest
      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockResolvedValue(mockResponse);

      const post = (service as any).post.bind(service);
      const result = await post('/test', body);

      expect(buildHttpSpy).toHaveBeenCalledWith(`${baseUrl}/test`);
      expect(executeRequestSpy).toHaveBeenCalledWith(
        mockAxiosInstance,
        'POST',
        '/test',
        `${baseUrl}/test`,
        JSON.stringify(body)
      );
      expect(result).toBe(mockResponse);

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
    });
  });

  describe('execute method', () => {
    let mockAxiosInstance: jest.Mocked<AxiosInstance>;
    let mockResponse: AxiosResponse;

    beforeEach(() => {
      mockAxiosInstance = {
        get: jest.fn(),
        post: jest.fn(),
      } as unknown as jest.Mocked<AxiosInstance>;

      mockResponse = {
        status: 200,
        statusText: 'OK',
        data: {
          success: true,
          requestId: 'req-1234567890-a1b2c3d4',
          repository: 'test-repo',
          branchName: 'main',
          output: 'Command executed successfully',
          exitCode: 0,
        },
        headers: {},
        config: {} as AxiosRequestConfig,
      } as AxiosResponse;
    });

    it('should execute with all parameters provided', async () => {
      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockResolvedValue(mockResponse);
      const parseResponseSpy = jest.spyOn(service as any, 'parseResponse').mockReturnValue(mockResponse.data);

      const result = await service.execute({
        repository: 'test-repo',
        branchName: 'main',
        prompt: 'Test prompt',
        requestId: 'req-custom-id',
      });

      expect(buildHttpSpy).toHaveBeenCalledWith(`${baseUrl}/cursor/execute`);
      expect(executeRequestSpy).toHaveBeenCalledWith(
        mockAxiosInstance,
        'POST',
        '/cursor/execute',
        `${baseUrl}/cursor/execute`,
        JSON.stringify({
          repository: 'test-repo',
          branchName: 'main',
          prompt: 'Test prompt',
          id: 'req-custom-id',
        })
      );
      expect(parseResponseSpy).toHaveBeenCalledWith(mockResponse);
      expect(result).toEqual(mockResponse.data);

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
      parseResponseSpy.mockRestore();
    });

    it('should auto-generate requestId when not provided', async () => {
      const generateRequestIdSpy = jest.spyOn(service as any, 'generateRequestId').mockReturnValue('req-auto-generated');
      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockResolvedValue(mockResponse);
      const parseResponseSpy = jest.spyOn(service as any, 'parseResponse').mockReturnValue(mockResponse.data);

      const result = await service.execute({
        repository: 'test-repo',
        branchName: 'main',
        prompt: 'Test prompt',
      });

      expect(generateRequestIdSpy).toHaveBeenCalled();
      expect(executeRequestSpy).toHaveBeenCalledWith(
        mockAxiosInstance,
        'POST',
        '/cursor/execute',
        `${baseUrl}/cursor/execute`,
        JSON.stringify({
          repository: 'test-repo',
          branchName: 'main',
          prompt: 'Test prompt',
          id: 'req-auto-generated',
        })
      );
      expect(result).toEqual(mockResponse.data);

      generateRequestIdSpy.mockRestore();
      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
      parseResponseSpy.mockRestore();
    });

    it('should handle connection errors', async () => {
      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockRejectedValue(
        new ConnectionError('Failed to connect to cursor-runner: Connection refused')
      );

      await expect(
        service.execute({
          repository: 'test-repo',
          branchName: 'main',
          prompt: 'Test prompt',
        })
      ).rejects.toThrow(ConnectionError);
      await expect(
        service.execute({
          repository: 'test-repo',
          branchName: 'main',
          prompt: 'Test prompt',
        })
      ).rejects.toThrow('Failed to connect to cursor-runner: Connection refused');

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
    });

    it('should handle timeout errors', async () => {
      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockRejectedValue(
        new TimeoutError('Request to cursor-runner timed out: timeout of 5000ms exceeded')
      );

      await expect(
        service.execute({
          repository: 'test-repo',
          branchName: 'main',
          prompt: 'Test prompt',
        })
      ).rejects.toThrow(TimeoutError);
      await expect(
        service.execute({
          repository: 'test-repo',
          branchName: 'main',
          prompt: 'Test prompt',
        })
      ).rejects.toThrow('Request to cursor-runner timed out: timeout of 5000ms exceeded');

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
    });

    it('should handle HTTP error responses (non-2xx, except 422)', async () => {
      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockRejectedValue(
        new CursorRunnerServiceError('HTTP 500: Internal Server Error')
      );

      await expect(
        service.execute({
          repository: 'test-repo',
          branchName: 'main',
          prompt: 'Test prompt',
        })
      ).rejects.toThrow(CursorRunnerServiceError);
      await expect(
        service.execute({
          repository: 'test-repo',
          branchName: 'main',
          prompt: 'Test prompt',
        })
      ).rejects.toThrow('HTTP 500: Internal Server Error');

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
    });

    it('should handle 422 response as valid (not throw error)', async () => {
      const response422 = {
        ...mockResponse,
        status: 422,
        statusText: 'Unprocessable Entity',
        data: {
          success: false,
          requestId: 'req-1234567890-a1b2c3d4',
          repository: 'test-repo',
          branchName: 'main',
          output: '',
          error: 'Validation failed',
          exitCode: 1,
        },
      } as AxiosResponse;

      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockResolvedValue(response422);
      const parseResponseSpy = jest.spyOn(service as any, 'parseResponse').mockReturnValue(response422.data);

      const result = await service.execute({
        repository: 'test-repo',
        branchName: 'main',
        prompt: 'Test prompt',
      });

      expect(result).toEqual(response422.data);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
      parseResponseSpy.mockRestore();
    });

    it('should handle JSON parsing errors', async () => {
      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockResolvedValue(mockResponse);
      const parseResponseSpy = jest.spyOn(service as any, 'parseResponse').mockImplementation(() => {
        throw new InvalidResponseError('Failed to parse response: Unexpected token');
      });

      await expect(
        service.execute({
          repository: 'test-repo',
          branchName: 'main',
          prompt: 'Test prompt',
        })
      ).rejects.toThrow(InvalidResponseError);
      await expect(
        service.execute({
          repository: 'test-repo',
          branchName: 'main',
          prompt: 'Test prompt',
        })
      ).rejects.toThrow('Failed to parse response: Unexpected token');

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
      parseResponseSpy.mockRestore();
    });

    it('should use branchName in camelCase in request body', async () => {
      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockResolvedValue(mockResponse);
      const parseResponseSpy = jest.spyOn(service as any, 'parseResponse').mockReturnValue(mockResponse.data);

      await service.execute({
        repository: 'test-repo',
        branchName: 'feature-branch',
        prompt: 'Test prompt',
      });

      const requestBody = JSON.parse(executeRequestSpy.mock.calls[0][4] as string);
      expect(requestBody.branchName).toBe('feature-branch');
      expect(requestBody).not.toHaveProperty('branch_name');

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
      parseResponseSpy.mockRestore();
    });
  });

  describe('iterate method', () => {
    let mockAxiosInstance: jest.Mocked<AxiosInstance>;
    let mockResponse: AxiosResponse;

    beforeEach(() => {
      mockAxiosInstance = {
        get: jest.fn(),
        post: jest.fn(),
      } as unknown as jest.Mocked<AxiosInstance>;

      mockResponse = {
        status: 200,
        statusText: 'OK',
        data: {
          success: true,
          requestId: 'req-1234567890-a1b2c3d4',
          repository: 'test-repo',
          branchName: 'main',
          output: 'Iteration completed successfully',
          iterations: 5,
          maxIterations: 25,
          exitCode: 0,
          duration: '10.5s',
        },
        headers: {},
        config: {} as AxiosRequestConfig,
      } as AxiosResponse;
    });

    it('should iterate with all parameters provided', async () => {
      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockResolvedValue(mockResponse);
      const parseResponseSpy = jest.spyOn(service as any, 'parseResponse').mockReturnValue(mockResponse.data);

      const result = await service.iterate({
        repository: 'test-repo',
        branchName: 'main',
        prompt: 'Test prompt',
        maxIterations: 10,
        requestId: 'req-custom-id',
        callbackUrl: 'https://example.com/callback',
      });

      expect(buildHttpSpy).toHaveBeenCalledWith(`${baseUrl}/cursor/iterate`);
      expect(executeRequestSpy).toHaveBeenCalledWith(
        mockAxiosInstance,
        'POST',
        '/cursor/iterate',
        `${baseUrl}/cursor/iterate`,
        JSON.stringify({
          repository: 'test-repo',
          branchName: 'main',
          prompt: 'Test prompt',
          maxIterations: 10,
          id: 'req-custom-id',
          callbackUrl: 'https://example.com/callback',
        })
      );
      expect(parseResponseSpy).toHaveBeenCalledWith(mockResponse);
      expect(result).toEqual(mockResponse.data);

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
      parseResponseSpy.mockRestore();
    });

    it('should default maxIterations to 25 when omitted', async () => {
      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockResolvedValue(mockResponse);
      const parseResponseSpy = jest.spyOn(service as any, 'parseResponse').mockReturnValue(mockResponse.data);

      await service.iterate({
        repository: 'test-repo',
        branchName: 'main',
        prompt: 'Test prompt',
      });

      const requestBody = JSON.parse(executeRequestSpy.mock.calls[0][4] as string);
      expect(requestBody.maxIterations).toBe(25);

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
      parseResponseSpy.mockRestore();
    });

    it('should auto-generate requestId when not provided', async () => {
      const generateRequestIdSpy = jest.spyOn(service as any, 'generateRequestId').mockReturnValue('req-auto-generated');
      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockResolvedValue(mockResponse);
      const parseResponseSpy = jest.spyOn(service as any, 'parseResponse').mockReturnValue(mockResponse.data);

      const result = await service.iterate({
        repository: 'test-repo',
        branchName: 'main',
        prompt: 'Test prompt',
      });

      expect(generateRequestIdSpy).toHaveBeenCalled();
      expect(executeRequestSpy).toHaveBeenCalledWith(
        mockAxiosInstance,
        'POST',
        '/cursor/iterate',
        `${baseUrl}/cursor/iterate`,
        JSON.stringify({
          repository: 'test-repo',
          branchName: 'main',
          prompt: 'Test prompt',
          maxIterations: 25,
          id: 'req-auto-generated',
        })
      );
      expect(result).toEqual(mockResponse.data);

      generateRequestIdSpy.mockRestore();
      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
      parseResponseSpy.mockRestore();
    });

    it('should not include callbackUrl in request body when omitted', async () => {
      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockResolvedValue(mockResponse);
      const parseResponseSpy = jest.spyOn(service as any, 'parseResponse').mockReturnValue(mockResponse.data);

      await service.iterate({
        repository: 'test-repo',
        branchName: 'main',
        prompt: 'Test prompt',
      });

      const requestBody = JSON.parse(executeRequestSpy.mock.calls[0][4] as string);
      expect(requestBody).not.toHaveProperty('callbackUrl');

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
      parseResponseSpy.mockRestore();
    });

    it('should include callbackUrl in request body when provided', async () => {
      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockResolvedValue(mockResponse);
      const parseResponseSpy = jest.spyOn(service as any, 'parseResponse').mockReturnValue(mockResponse.data);

      await service.iterate({
        repository: 'test-repo',
        branchName: 'main',
        prompt: 'Test prompt',
        callbackUrl: 'https://example.com/callback',
      });

      const requestBody = JSON.parse(executeRequestSpy.mock.calls[0][4] as string);
      expect(requestBody.callbackUrl).toBe('https://example.com/callback');

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
      parseResponseSpy.mockRestore();
    });

    it('should handle connection errors', async () => {
      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockRejectedValue(
        new ConnectionError('Failed to connect to cursor-runner: Connection refused')
      );

      await expect(
        service.iterate({
          repository: 'test-repo',
          branchName: 'main',
          prompt: 'Test prompt',
        })
      ).rejects.toThrow(ConnectionError);
      await expect(
        service.iterate({
          repository: 'test-repo',
          branchName: 'main',
          prompt: 'Test prompt',
        })
      ).rejects.toThrow('Failed to connect to cursor-runner: Connection refused');

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
    });

    it('should handle timeout errors', async () => {
      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockRejectedValue(
        new TimeoutError('Request to cursor-runner timed out: timeout of 5000ms exceeded')
      );

      await expect(
        service.iterate({
          repository: 'test-repo',
          branchName: 'main',
          prompt: 'Test prompt',
        })
      ).rejects.toThrow(TimeoutError);
      await expect(
        service.iterate({
          repository: 'test-repo',
          branchName: 'main',
          prompt: 'Test prompt',
        })
      ).rejects.toThrow('Request to cursor-runner timed out: timeout of 5000ms exceeded');

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
    });

    it('should handle HTTP error responses (non-2xx, except 422)', async () => {
      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockRejectedValue(
        new CursorRunnerServiceError('HTTP 500: Internal Server Error')
      );

      await expect(
        service.iterate({
          repository: 'test-repo',
          branchName: 'main',
          prompt: 'Test prompt',
        })
      ).rejects.toThrow(CursorRunnerServiceError);
      await expect(
        service.iterate({
          repository: 'test-repo',
          branchName: 'main',
          prompt: 'Test prompt',
        })
      ).rejects.toThrow('HTTP 500: Internal Server Error');

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
    });

    it('should handle 422 response as valid (not throw error)', async () => {
      const response422 = {
        ...mockResponse,
        status: 422,
        statusText: 'Unprocessable Entity',
        data: {
          success: false,
          requestId: 'req-1234567890-a1b2c3d4',
          repository: 'test-repo',
          branchName: 'main',
          output: '',
          iterations: 0,
          maxIterations: 25,
          error: 'Validation failed',
          exitCode: 1,
        },
      } as AxiosResponse;

      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockResolvedValue(response422);
      const parseResponseSpy = jest.spyOn(service as any, 'parseResponse').mockReturnValue(response422.data);

      const result = await service.iterate({
        repository: 'test-repo',
        branchName: 'main',
        prompt: 'Test prompt',
      });

      expect(result).toEqual(response422.data);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
      parseResponseSpy.mockRestore();
    });

    it('should handle JSON parsing errors', async () => {
      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockResolvedValue(mockResponse);
      const parseResponseSpy = jest.spyOn(service as any, 'parseResponse').mockImplementation(() => {
        throw new InvalidResponseError('Failed to parse response: Unexpected token');
      });

      await expect(
        service.iterate({
          repository: 'test-repo',
          branchName: 'main',
          prompt: 'Test prompt',
        })
      ).rejects.toThrow(InvalidResponseError);
      await expect(
        service.iterate({
          repository: 'test-repo',
          branchName: 'main',
          prompt: 'Test prompt',
        })
      ).rejects.toThrow('Failed to parse response: Unexpected token');

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
      parseResponseSpy.mockRestore();
    });

    it('should use branchName in camelCase in request body', async () => {
      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockResolvedValue(mockResponse);
      const parseResponseSpy = jest.spyOn(service as any, 'parseResponse').mockReturnValue(mockResponse.data);

      await service.iterate({
        repository: 'test-repo',
        branchName: 'feature-branch',
        prompt: 'Test prompt',
      });

      const requestBody = JSON.parse(executeRequestSpy.mock.calls[0][4] as string);
      expect(requestBody.branchName).toBe('feature-branch');
      expect(requestBody).not.toHaveProperty('branch_name');

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
      parseResponseSpy.mockRestore();
    });

    it('should use maxIterations in camelCase in request body', async () => {
      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockResolvedValue(mockResponse);
      const parseResponseSpy = jest.spyOn(service as any, 'parseResponse').mockReturnValue(mockResponse.data);

      await service.iterate({
        repository: 'test-repo',
        branchName: 'main',
        prompt: 'Test prompt',
        maxIterations: 15,
      });

      const requestBody = JSON.parse(executeRequestSpy.mock.calls[0][4] as string);
      expect(requestBody.maxIterations).toBe(15);
      expect(requestBody).not.toHaveProperty('max_iterations');

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
      parseResponseSpy.mockRestore();
    });

    it('should POST to /cursor/iterate endpoint (not /cursor/iterate/async)', async () => {
      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockResolvedValue(mockResponse);
      const parseResponseSpy = jest.spyOn(service as any, 'parseResponse').mockReturnValue(mockResponse.data);

      await service.iterate({
        repository: 'test-repo',
        branchName: 'main',
        prompt: 'Test prompt',
      });

      expect(executeRequestSpy).toHaveBeenCalledWith(
        mockAxiosInstance,
        'POST',
        '/cursor/iterate',
        `${baseUrl}/cursor/iterate`,
        expect.any(String)
      );
      expect(executeRequestSpy).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        '/cursor/iterate/async',
        expect.anything(),
        expect.anything()
      );

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
      parseResponseSpy.mockRestore();
    });
  });

  describe('cloneRepository method', () => {
    let mockAxiosInstance: jest.Mocked<AxiosInstance>;
    let mockResponse: AxiosResponse;

    beforeEach(() => {
      mockAxiosInstance = {
        get: jest.fn(),
        post: jest.fn(),
      } as unknown as jest.Mocked<AxiosInstance>;

      mockResponse = {
        status: 200,
        statusText: 'OK',
        data: {
          success: true,
          repository: 'test-repo',
          message: 'Repository cloned successfully',
        },
        headers: {},
        config: {} as AxiosRequestConfig,
      } as AxiosResponse;
    });

    it('should clone repository with only repositoryUrl provided', async () => {
      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockResolvedValue(mockResponse);
      const parseResponseSpy = jest.spyOn(service as any, 'parseResponse').mockReturnValue(mockResponse.data);

      const result = await service.cloneRepository({
        repositoryUrl: 'https://github.com/user/repo.git',
      });

      expect(buildHttpSpy).toHaveBeenCalledWith(`${baseUrl}/git/clone`);
      expect(executeRequestSpy).toHaveBeenCalledWith(
        mockAxiosInstance,
        'POST',
        '/git/clone',
        `${baseUrl}/git/clone`,
        JSON.stringify({
          repositoryUrl: 'https://github.com/user/repo.git',
        })
      );
      expect(parseResponseSpy).toHaveBeenCalledWith(mockResponse);
      expect(result).toEqual(mockResponse.data);

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
      parseResponseSpy.mockRestore();
    });

    it('should clone repository with both repositoryUrl and repositoryName provided', async () => {
      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockResolvedValue(mockResponse);
      const parseResponseSpy = jest.spyOn(service as any, 'parseResponse').mockReturnValue(mockResponse.data);

      const result = await service.cloneRepository({
        repositoryUrl: 'https://github.com/user/repo.git',
        repositoryName: 'custom-repo-name',
      });

      expect(buildHttpSpy).toHaveBeenCalledWith(`${baseUrl}/git/clone`);
      expect(executeRequestSpy).toHaveBeenCalledWith(
        mockAxiosInstance,
        'POST',
        '/git/clone',
        `${baseUrl}/git/clone`,
        JSON.stringify({
          repositoryUrl: 'https://github.com/user/repo.git',
          repositoryName: 'custom-repo-name',
        })
      );
      expect(parseResponseSpy).toHaveBeenCalledWith(mockResponse);
      expect(result).toEqual(mockResponse.data);

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
      parseResponseSpy.mockRestore();
    });

    it('should not include repositoryName in request body when omitted', async () => {
      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockResolvedValue(mockResponse);
      const parseResponseSpy = jest.spyOn(service as any, 'parseResponse').mockReturnValue(mockResponse.data);

      await service.cloneRepository({
        repositoryUrl: 'https://github.com/user/repo.git',
      });

      const requestBody = JSON.parse(executeRequestSpy.mock.calls[0][4] as string);
      expect(requestBody).not.toHaveProperty('repositoryName');
      expect(requestBody.repositoryUrl).toBe('https://github.com/user/repo.git');

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
      parseResponseSpy.mockRestore();
    });

    it('should include repositoryName in request body when provided', async () => {
      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockResolvedValue(mockResponse);
      const parseResponseSpy = jest.spyOn(service as any, 'parseResponse').mockReturnValue(mockResponse.data);

      await service.cloneRepository({
        repositoryUrl: 'https://github.com/user/repo.git',
        repositoryName: 'custom-repo-name',
      });

      const requestBody = JSON.parse(executeRequestSpy.mock.calls[0][4] as string);
      expect(requestBody.repositoryName).toBe('custom-repo-name');
      expect(requestBody.repositoryUrl).toBe('https://github.com/user/repo.git');

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
      parseResponseSpy.mockRestore();
    });

    it('should use repositoryUrl in camelCase in request body', async () => {
      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockResolvedValue(mockResponse);
      const parseResponseSpy = jest.spyOn(service as any, 'parseResponse').mockReturnValue(mockResponse.data);

      await service.cloneRepository({
        repositoryUrl: 'https://github.com/user/repo.git',
      });

      const requestBody = JSON.parse(executeRequestSpy.mock.calls[0][4] as string);
      expect(requestBody.repositoryUrl).toBe('https://github.com/user/repo.git');
      expect(requestBody).not.toHaveProperty('repository_url');

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
      parseResponseSpy.mockRestore();
    });

    it('should use repositoryName in camelCase in request body', async () => {
      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockResolvedValue(mockResponse);
      const parseResponseSpy = jest.spyOn(service as any, 'parseResponse').mockReturnValue(mockResponse.data);

      await service.cloneRepository({
        repositoryUrl: 'https://github.com/user/repo.git',
        repositoryName: 'custom-repo-name',
      });

      const requestBody = JSON.parse(executeRequestSpy.mock.calls[0][4] as string);
      expect(requestBody.repositoryName).toBe('custom-repo-name');
      expect(requestBody).not.toHaveProperty('repository_name');

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
      parseResponseSpy.mockRestore();
    });

    it('should handle connection errors', async () => {
      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockRejectedValue(
        new ConnectionError('Failed to connect to cursor-runner: Connection refused')
      );

      await expect(
        service.cloneRepository({
          repositoryUrl: 'https://github.com/user/repo.git',
        })
      ).rejects.toThrow(ConnectionError);
      await expect(
        service.cloneRepository({
          repositoryUrl: 'https://github.com/user/repo.git',
        })
      ).rejects.toThrow('Failed to connect to cursor-runner: Connection refused');

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
    });

    it('should handle timeout errors', async () => {
      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockRejectedValue(
        new TimeoutError('Request to cursor-runner timed out: timeout of 5000ms exceeded')
      );

      await expect(
        service.cloneRepository({
          repositoryUrl: 'https://github.com/user/repo.git',
        })
      ).rejects.toThrow(TimeoutError);
      await expect(
        service.cloneRepository({
          repositoryUrl: 'https://github.com/user/repo.git',
        })
      ).rejects.toThrow('Request to cursor-runner timed out: timeout of 5000ms exceeded');

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
    });

    it('should handle HTTP error responses (non-2xx, except 422)', async () => {
      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockRejectedValue(
        new CursorRunnerServiceError('HTTP 500: Internal Server Error')
      );

      await expect(
        service.cloneRepository({
          repositoryUrl: 'https://github.com/user/repo.git',
        })
      ).rejects.toThrow(CursorRunnerServiceError);
      await expect(
        service.cloneRepository({
          repositoryUrl: 'https://github.com/user/repo.git',
        })
      ).rejects.toThrow('HTTP 500: Internal Server Error');

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
    });

    it('should handle 422 response as valid (not throw error)', async () => {
      const response422 = {
        ...mockResponse,
        status: 422,
        statusText: 'Unprocessable Entity',
        data: {
          success: false,
          repository: 'test-repo',
          message: 'Repository already exists',
        },
      } as AxiosResponse;

      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockResolvedValue(response422);
      const parseResponseSpy = jest.spyOn(service as any, 'parseResponse').mockReturnValue(response422.data);

      const result = await service.cloneRepository({
        repositoryUrl: 'https://github.com/user/repo.git',
      });

      expect(result).toEqual(response422.data);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Repository already exists');

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
      parseResponseSpy.mockRestore();
    });

    it('should handle JSON parsing errors', async () => {
      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockResolvedValue(mockResponse);
      const parseResponseSpy = jest.spyOn(service as any, 'parseResponse').mockImplementation(() => {
        throw new InvalidResponseError('Failed to parse response: Unexpected token');
      });

      await expect(
        service.cloneRepository({
          repositoryUrl: 'https://github.com/user/repo.git',
        })
      ).rejects.toThrow(InvalidResponseError);
      await expect(
        service.cloneRepository({
          repositoryUrl: 'https://github.com/user/repo.git',
        })
      ).rejects.toThrow('Failed to parse response: Unexpected token');

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
      parseResponseSpy.mockRestore();
    });
  });

  describe('listRepositories method', () => {
    let mockAxiosInstance: jest.Mocked<AxiosInstance>;
    let mockResponse: AxiosResponse;

    beforeEach(() => {
      mockAxiosInstance = {
        get: jest.fn(),
        post: jest.fn(),
      } as unknown as jest.Mocked<AxiosInstance>;

      mockResponse = {
        status: 200,
        statusText: 'OK',
        data: {
          success: true,
          repositories: ['repo1', 'repo2', 'repo3'],
          count: 3,
        },
        headers: {},
        config: {} as AxiosRequestConfig,
      } as AxiosResponse;
    });

    it('should list repositories successfully', async () => {
      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockResolvedValue(mockResponse);
      const parseResponseSpy = jest.spyOn(service as any, 'parseResponse').mockReturnValue(mockResponse.data);

      const result = await service.listRepositories();

      expect(buildHttpSpy).toHaveBeenCalledWith(`${baseUrl}/git/repositories`);
      expect(executeRequestSpy).toHaveBeenCalledWith(
        mockAxiosInstance,
        'GET',
        '/git/repositories',
        `${baseUrl}/git/repositories`
      );
      expect(parseResponseSpy).toHaveBeenCalledWith(mockResponse);
      expect(result).toEqual(mockResponse.data);
      expect(result.success).toBe(true);
      expect(result.repositories).toEqual(['repo1', 'repo2', 'repo3']);
      expect(result.count).toBe(3);

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
      parseResponseSpy.mockRestore();
    });

    it('should return repositories as string array', async () => {
      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockResolvedValue(mockResponse);
      const parseResponseSpy = jest.spyOn(service as any, 'parseResponse').mockReturnValue(mockResponse.data);

      const result = await service.listRepositories();

      expect(Array.isArray(result.repositories)).toBe(true);
      expect(result.repositories.every((repo) => typeof repo === 'string')).toBe(true);

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
      parseResponseSpy.mockRestore();
    });

    it('should handle empty repositories list', async () => {
      const emptyResponse = {
        ...mockResponse,
        data: {
          success: true,
          repositories: [],
          count: 0,
        },
      } as AxiosResponse;

      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockResolvedValue(emptyResponse);
      const parseResponseSpy = jest.spyOn(service as any, 'parseResponse').mockReturnValue(emptyResponse.data);

      const result = await service.listRepositories();

      expect(result.success).toBe(true);
      expect(result.repositories).toEqual([]);
      expect(result.count).toBe(0);

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
      parseResponseSpy.mockRestore();
    });

    it('should use GET method (not POST)', async () => {
      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockResolvedValue(mockResponse);
      const parseResponseSpy = jest.spyOn(service as any, 'parseResponse').mockReturnValue(mockResponse.data);

      await service.listRepositories();

      expect(executeRequestSpy).toHaveBeenCalledWith(
        mockAxiosInstance,
        'GET',
        '/git/repositories',
        `${baseUrl}/git/repositories`
      );

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
      parseResponseSpy.mockRestore();
    });

    it('should not send request body (GET request)', async () => {
      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockResolvedValue(mockResponse);
      const parseResponseSpy = jest.spyOn(service as any, 'parseResponse').mockReturnValue(mockResponse.data);

      await service.listRepositories();

      // Verify that no body is passed (5th parameter should not exist)
      expect(executeRequestSpy.mock.calls[0].length).toBe(4);

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
      parseResponseSpy.mockRestore();
    });

    it('should handle connection errors', async () => {
      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockRejectedValue(
        new ConnectionError('Failed to connect to cursor-runner: Connection refused')
      );

      await expect(service.listRepositories()).rejects.toThrow(ConnectionError);
      await expect(service.listRepositories()).rejects.toThrow('Failed to connect to cursor-runner: Connection refused');

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
    });

    it('should handle timeout errors', async () => {
      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockRejectedValue(
        new TimeoutError('Request to cursor-runner timed out: timeout of 5000ms exceeded')
      );

      await expect(service.listRepositories()).rejects.toThrow(TimeoutError);
      await expect(service.listRepositories()).rejects.toThrow('Request to cursor-runner timed out: timeout of 5000ms exceeded');

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
    });

    it('should handle HTTP error responses (non-2xx, except 422)', async () => {
      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockRejectedValue(
        new CursorRunnerServiceError('HTTP 500: Internal Server Error')
      );

      await expect(service.listRepositories()).rejects.toThrow(CursorRunnerServiceError);
      await expect(service.listRepositories()).rejects.toThrow('HTTP 500: Internal Server Error');

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
    });

    it('should handle 422 response as valid (not throw error)', async () => {
      const response422 = {
        ...mockResponse,
        status: 422,
        statusText: 'Unprocessable Entity',
        data: {
          success: false,
          repositories: [],
          count: 0,
          message: 'No repositories found',
        },
      } as AxiosResponse;

      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockResolvedValue(response422);
      const parseResponseSpy = jest.spyOn(service as any, 'parseResponse').mockReturnValue(response422.data);

      const result = await service.listRepositories();

      expect(result).toEqual(response422.data);
      expect(result.success).toBe(false);

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
      parseResponseSpy.mockRestore();
    });

    it('should handle JSON parsing errors', async () => {
      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockResolvedValue(mockResponse);
      const parseResponseSpy = jest.spyOn(service as any, 'parseResponse').mockImplementation(() => {
        throw new InvalidResponseError('Failed to parse response: Unexpected token');
      });

      await expect(service.listRepositories()).rejects.toThrow(InvalidResponseError);
      await expect(service.listRepositories()).rejects.toThrow('Failed to parse response: Unexpected token');

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
      parseResponseSpy.mockRestore();
    });
  });

  describe('checkoutBranch method', () => {
    let mockAxiosInstance: jest.Mocked<AxiosInstance>;
    let mockResponse: AxiosResponse;

    beforeEach(() => {
      mockAxiosInstance = {
        get: jest.fn(),
        post: jest.fn(),
      } as unknown as jest.Mocked<AxiosInstance>;

      mockResponse = {
        status: 200,
        statusText: 'OK',
        data: {
          success: true,
          message: 'Branch checked out successfully',
        },
        headers: {},
        config: {} as AxiosRequestConfig,
      } as AxiosResponse;
    });

    it('should checkout branch with repository and branch provided', async () => {
      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockResolvedValue(mockResponse);
      const parseResponseSpy = jest.spyOn(service as any, 'parseResponse').mockReturnValue(mockResponse.data);

      const result = await service.checkoutBranch({
        repository: 'test-repo',
        branch: 'feature-branch',
      });

      expect(buildHttpSpy).toHaveBeenCalledWith(`${baseUrl}/git/checkout`);
      expect(executeRequestSpy).toHaveBeenCalledWith(
        mockAxiosInstance,
        'POST',
        '/git/checkout',
        `${baseUrl}/git/checkout`,
        JSON.stringify({
          repository: 'test-repo',
          branch: 'feature-branch',
        })
      );
      expect(parseResponseSpy).toHaveBeenCalledWith(mockResponse);
      expect(result).toEqual(mockResponse.data);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Branch checked out successfully');

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
      parseResponseSpy.mockRestore();
    });

    it('should use repository and branch in lowercase strings in request body', async () => {
      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockResolvedValue(mockResponse);
      const parseResponseSpy = jest.spyOn(service as any, 'parseResponse').mockReturnValue(mockResponse.data);

      await service.checkoutBranch({
        repository: 'test-repo',
        branch: 'main',
      });

      const requestBody = JSON.parse(executeRequestSpy.mock.calls[0][4] as string);
      expect(requestBody.repository).toBe('test-repo');
      expect(requestBody.branch).toBe('main');
      expect(typeof requestBody.repository).toBe('string');
      expect(typeof requestBody.branch).toBe('string');

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
      parseResponseSpy.mockRestore();
    });

    it('should handle connection errors', async () => {
      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockRejectedValue(
        new ConnectionError('Failed to connect to cursor-runner: Connection refused')
      );

      await expect(
        service.checkoutBranch({
          repository: 'test-repo',
          branch: 'main',
        })
      ).rejects.toThrow(ConnectionError);
      await expect(
        service.checkoutBranch({
          repository: 'test-repo',
          branch: 'main',
        })
      ).rejects.toThrow('Failed to connect to cursor-runner: Connection refused');

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
    });

    it('should handle timeout errors', async () => {
      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockRejectedValue(
        new TimeoutError('Request to cursor-runner timed out: timeout of 5000ms exceeded')
      );

      await expect(
        service.checkoutBranch({
          repository: 'test-repo',
          branch: 'main',
        })
      ).rejects.toThrow(TimeoutError);
      await expect(
        service.checkoutBranch({
          repository: 'test-repo',
          branch: 'main',
        })
      ).rejects.toThrow('Request to cursor-runner timed out: timeout of 5000ms exceeded');

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
    });

    it('should handle HTTP error responses (non-2xx, except 422)', async () => {
      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockRejectedValue(
        new CursorRunnerServiceError('HTTP 500: Internal Server Error')
      );

      await expect(
        service.checkoutBranch({
          repository: 'test-repo',
          branch: 'main',
        })
      ).rejects.toThrow(CursorRunnerServiceError);
      await expect(
        service.checkoutBranch({
          repository: 'test-repo',
          branch: 'main',
        })
      ).rejects.toThrow('HTTP 500: Internal Server Error');

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
    });

    it('should handle 422 response as valid (not throw error)', async () => {
      const response422 = {
        ...mockResponse,
        status: 422,
        statusText: 'Unprocessable Entity',
        data: {
          success: false,
          message: 'Branch does not exist',
        },
      } as AxiosResponse;

      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockResolvedValue(response422);
      const parseResponseSpy = jest.spyOn(service as any, 'parseResponse').mockReturnValue(response422.data);

      const result = await service.checkoutBranch({
        repository: 'test-repo',
        branch: 'non-existent-branch',
      });

      expect(result).toEqual(response422.data);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Branch does not exist');

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
      parseResponseSpy.mockRestore();
    });

    it('should handle JSON parsing errors', async () => {
      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockResolvedValue(mockResponse);
      const parseResponseSpy = jest.spyOn(service as any, 'parseResponse').mockImplementation(() => {
        throw new InvalidResponseError('Failed to parse response: Unexpected token');
      });

      await expect(
        service.checkoutBranch({
          repository: 'test-repo',
          branch: 'main',
        })
      ).rejects.toThrow(InvalidResponseError);
      await expect(
        service.checkoutBranch({
          repository: 'test-repo',
          branch: 'main',
        })
      ).rejects.toThrow('Failed to parse response: Unexpected token');

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
      parseResponseSpy.mockRestore();
    });

    it('should POST to /git/checkout endpoint', async () => {
      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockResolvedValue(mockResponse);
      const parseResponseSpy = jest.spyOn(service as any, 'parseResponse').mockReturnValue(mockResponse.data);

      await service.checkoutBranch({
        repository: 'test-repo',
        branch: 'main',
      });

      expect(executeRequestSpy).toHaveBeenCalledWith(
        mockAxiosInstance,
        'POST',
        '/git/checkout',
        `${baseUrl}/git/checkout`,
        expect.any(String)
      );

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
      parseResponseSpy.mockRestore();
    });

    it('should include both repository and branch in request body', async () => {
      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockResolvedValue(mockResponse);
      const parseResponseSpy = jest.spyOn(service as any, 'parseResponse').mockReturnValue(mockResponse.data);

      await service.checkoutBranch({
        repository: 'my-repo',
        branch: 'develop',
      });

      const requestBody = JSON.parse(executeRequestSpy.mock.calls[0][4] as string);
      expect(requestBody).toHaveProperty('repository');
      expect(requestBody).toHaveProperty('branch');
      expect(requestBody.repository).toBe('my-repo');
      expect(requestBody.branch).toBe('develop');

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
      parseResponseSpy.mockRestore();
    });
  });

  describe('pushBranch method', () => {
    let mockAxiosInstance: jest.Mocked<AxiosInstance>;
    let mockResponse: AxiosResponse;

    beforeEach(() => {
      mockAxiosInstance = {
        get: jest.fn(),
        post: jest.fn(),
      } as unknown as jest.Mocked<AxiosInstance>;

      mockResponse = {
        status: 200,
        statusText: 'OK',
        data: {
          success: true,
          message: 'Branch pushed successfully',
        },
        headers: {},
        config: {} as AxiosRequestConfig,
      } as AxiosResponse;
    });

    it('should push branch with repository and branch provided', async () => {
      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockResolvedValue(mockResponse);
      const parseResponseSpy = jest.spyOn(service as any, 'parseResponse').mockReturnValue(mockResponse.data);

      const result = await service.pushBranch({
        repository: 'test-repo',
        branch: 'feature-branch',
      });

      expect(buildHttpSpy).toHaveBeenCalledWith(`${baseUrl}/git/push`);
      expect(executeRequestSpy).toHaveBeenCalledWith(
        mockAxiosInstance,
        'POST',
        '/git/push',
        `${baseUrl}/git/push`,
        JSON.stringify({
          repository: 'test-repo',
          branch: 'feature-branch',
        })
      );
      expect(parseResponseSpy).toHaveBeenCalledWith(mockResponse);
      expect(result).toEqual(mockResponse.data);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Branch pushed successfully');

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
      parseResponseSpy.mockRestore();
    });

    it('should use repository and branch in lowercase strings in request body', async () => {
      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockResolvedValue(mockResponse);
      const parseResponseSpy = jest.spyOn(service as any, 'parseResponse').mockReturnValue(mockResponse.data);

      await service.pushBranch({
        repository: 'test-repo',
        branch: 'main',
      });

      const requestBody = JSON.parse(executeRequestSpy.mock.calls[0][4] as string);
      expect(requestBody.repository).toBe('test-repo');
      expect(requestBody.branch).toBe('main');
      expect(typeof requestBody.repository).toBe('string');
      expect(typeof requestBody.branch).toBe('string');

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
      parseResponseSpy.mockRestore();
    });

    it('should handle connection errors', async () => {
      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockRejectedValue(
        new ConnectionError('Failed to connect to cursor-runner: Connection refused')
      );

      await expect(
        service.pushBranch({
          repository: 'test-repo',
          branch: 'main',
        })
      ).rejects.toThrow(ConnectionError);
      await expect(
        service.pushBranch({
          repository: 'test-repo',
          branch: 'main',
        })
      ).rejects.toThrow('Failed to connect to cursor-runner: Connection refused');

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
    });

    it('should handle timeout errors', async () => {
      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockRejectedValue(
        new TimeoutError('Request to cursor-runner timed out: timeout of 5000ms exceeded')
      );

      await expect(
        service.pushBranch({
          repository: 'test-repo',
          branch: 'main',
        })
      ).rejects.toThrow(TimeoutError);
      await expect(
        service.pushBranch({
          repository: 'test-repo',
          branch: 'main',
        })
      ).rejects.toThrow('Request to cursor-runner timed out: timeout of 5000ms exceeded');

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
    });

    it('should handle HTTP error responses (non-2xx, except 422)', async () => {
      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockRejectedValue(
        new CursorRunnerServiceError('HTTP 500: Internal Server Error')
      );

      await expect(
        service.pushBranch({
          repository: 'test-repo',
          branch: 'main',
        })
      ).rejects.toThrow(CursorRunnerServiceError);
      await expect(
        service.pushBranch({
          repository: 'test-repo',
          branch: 'main',
        })
      ).rejects.toThrow('HTTP 500: Internal Server Error');

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
    });

    it('should handle 422 response as valid (not throw error)', async () => {
      const response422 = {
        ...mockResponse,
        status: 422,
        statusText: 'Unprocessable Entity',
        data: {
          success: false,
          message: 'Branch push failed',
        },
      } as AxiosResponse;

      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockResolvedValue(response422);
      const parseResponseSpy = jest.spyOn(service as any, 'parseResponse').mockReturnValue(response422.data);

      const result = await service.pushBranch({
        repository: 'test-repo',
        branch: 'non-existent-branch',
      });

      expect(result).toEqual(response422.data);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Branch push failed');

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
      parseResponseSpy.mockRestore();
    });

    it('should handle JSON parsing errors', async () => {
      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockResolvedValue(mockResponse);
      const parseResponseSpy = jest.spyOn(service as any, 'parseResponse').mockImplementation(() => {
        throw new InvalidResponseError('Failed to parse response: Unexpected token');
      });

      await expect(
        service.pushBranch({
          repository: 'test-repo',
          branch: 'main',
        })
      ).rejects.toThrow(InvalidResponseError);
      await expect(
        service.pushBranch({
          repository: 'test-repo',
          branch: 'main',
        })
      ).rejects.toThrow('Failed to parse response: Unexpected token');

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
      parseResponseSpy.mockRestore();
    });

    it('should POST to /git/push endpoint', async () => {
      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockResolvedValue(mockResponse);
      const parseResponseSpy = jest.spyOn(service as any, 'parseResponse').mockReturnValue(mockResponse.data);

      await service.pushBranch({
        repository: 'test-repo',
        branch: 'main',
      });

      expect(executeRequestSpy).toHaveBeenCalledWith(
        mockAxiosInstance,
        'POST',
        '/git/push',
        `${baseUrl}/git/push`,
        expect.any(String)
      );

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
      parseResponseSpy.mockRestore();
    });

    it('should include both repository and branch in request body', async () => {
      const buildHttpSpy = jest.spyOn(service as any, 'buildHttp').mockReturnValue(mockAxiosInstance);
      const executeRequestSpy = jest.spyOn(service as any, 'executeRequest').mockResolvedValue(mockResponse);
      const parseResponseSpy = jest.spyOn(service as any, 'parseResponse').mockReturnValue(mockResponse.data);

      await service.pushBranch({
        repository: 'my-repo',
        branch: 'develop',
      });

      const requestBody = JSON.parse(executeRequestSpy.mock.calls[0][4] as string);
      expect(requestBody).toHaveProperty('repository');
      expect(requestBody).toHaveProperty('branch');
      expect(requestBody.repository).toBe('my-repo');
      expect(requestBody.branch).toBe('develop');

      buildHttpSpy.mockRestore();
      executeRequestSpy.mockRestore();
      parseResponseSpy.mockRestore();
    });
  });
});
