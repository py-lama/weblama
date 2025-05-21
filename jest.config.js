/**
 * Jest configuration for WebLama tests
 */

module.exports = {
  // The test environment that will be used for testing
  testEnvironment: 'node',

  // The glob patterns Jest uses to detect test files
  testMatch: [
    '**/tests/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],

  // An array of regexp pattern strings that are matched against all test paths
  // matched tests are skipped
  testPathIgnorePatterns: [
    '/node_modules/'
  ],

  // Indicates whether each individual test should be reported during the run
  verbose: true,

  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // Automatically restore mocks between every test
  restoreMocks: true,

  // Automatically reset mocks between every test
  resetMocks: false,

  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',

  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: 'v8',

  // A list of paths to directories that Jest should use to search for files in
  roots: [
    '<rootDir>/tests'
  ],

  // The maximum amount of workers used to run your tests
  maxWorkers: '50%',

  // A map from regular expressions to paths to transformers
  transform: {},

  // A map from regular expressions to module names or to arrays of module names that allow to stub out resources
  moduleNameMapper: {
    '^axios$': '<rootDir>/tests/mocks/axios.js'
  },

  // Timeout for test cases in milliseconds
  testTimeout: 10000,
};
