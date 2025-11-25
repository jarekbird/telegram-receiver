// Manual mock for form-data to avoid Jest mocking issues
// Make it a jest.fn() so it can be used as a mock

const FormDataMock = jest.fn().mockImplementation(() => {
  return {
    append: jest.fn(),
    getHeaders: jest.fn(() => ({ 'content-type': 'multipart/form-data; boundary=boundary' })),
    getBoundary: jest.fn(() => 'boundary'),
    getLength: jest.fn(() => 0),
    getLengthSync: jest.fn(() => 0),
    hasKnownLength: jest.fn(() => true),
    submit: jest.fn(),
    pipe: jest.fn(),
    _getContentType: jest.fn(() => 'multipart/form-data'),
  };
});

// Add static methods if needed
FormDataMock.prototype = {};

module.exports = FormDataMock;
module.exports.default = FormDataMock;
