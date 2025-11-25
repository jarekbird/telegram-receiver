// Manual mock for axios to avoid form-data mocking issues
// This provides a mock implementation that doesn't require the actual axios module

const createMockAxiosInstance = () => {
  return {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
    request: jest.fn(),
    defaults: {
      headers: {
        common: {},
      },
    },
    interceptors: {
      request: {
        use: jest.fn(),
        eject: jest.fn(),
      },
      response: {
        use: jest.fn(),
        eject: jest.fn(),
      },
    },
  };
};

const axios = jest.fn(() => createMockAxiosInstance());
axios.create = jest.fn(() => createMockAxiosInstance());
axios.get = jest.fn();
axios.post = jest.fn();
axios.put = jest.fn();
axios.delete = jest.fn();
axios.patch = jest.fn();
axios.request = jest.fn();
axios.defaults = {
  headers: {
    common: {},
  },
};
axios.interceptors = {
  request: {
    use: jest.fn(),
    eject: jest.fn(),
  },
  response: {
    use: jest.fn(),
    eject: jest.fn(),
  },
};

module.exports = axios;
module.exports.default = axios;
