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
    
    // Setup default responses
    this.mockSuccess('get', {
      status: 'success',
      files: [
        { name: 'test1.md', path: 'test1.md', size: 1024, modified: 1620000000 },
        { name: 'test2.md', path: 'test2.md', size: 2048, modified: 1620100000 }
      ]
    });
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

// Initialize with default responses
mockAxios.reset();

module.exports = mockAxios;

// Add a simple test to avoid the "no tests" error
describe('Axios Mock', () => {
  test('mockAxios object exists', () => {
    expect(mockAxios).toBeDefined();
  });
  
  test('mockAxios.get is a function', () => {
    expect(typeof mockAxios.get).toBe('function');
  });
  
  test('mockAxios.post is a function', () => {
    expect(typeof mockAxios.post).toBe('function');
  });
});
