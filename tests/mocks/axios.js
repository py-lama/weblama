/**
 * Mock implementation of axios for testing
 */

const mockAxios = {
  get: jest.fn(() => Promise.resolve({ data: {} })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} })),
  put: jest.fn(() => Promise.resolve({ data: {} })),
  patch: jest.fn(() => Promise.resolve({ data: {} })),
  
  // Helper method to reset all mocks
  reset: function() {
    this.get.mockReset();
    this.post.mockReset();
    this.delete.mockReset();
    this.put.mockReset();
    this.patch.mockReset();
  },
  
  // Helper method to set up a successful response
  mockSuccess: function(method, data) {
    this[method].mockImplementation(() => Promise.resolve({ data }));
  },
  
  // Helper method to set up an error response
  mockError: function(method, error) {
    this[method].mockImplementation(() => Promise.reject(error));
  }
};

module.exports = mockAxios;
