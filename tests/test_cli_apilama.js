/**
 * WebLama CLI APILama Integration Tests
 * 
 * This file contains tests for the WebLama CLI's integration with APILama.
 * It tests the CLI's ability to communicate with the APILama backend
 * using the new architecture where WebLama is a pure frontend application.
 */

const assert = require('assert');
const path = require('path');
const { execSync } = require('child_process');
const childProcess = require('child_process');
const mockAxios = require('./mocks/axios');

// Mock axios for testing
jest.mock('axios', () => mockAxios);

// Mock child_process.spawn
jest.mock('child_process', () => {
  const original = jest.requireActual('child_process');
  return {
    ...original,
    spawn: jest.fn().mockReturnValue({
      on: jest.fn(),
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() }
    })
  };
});

// Path to the CLI script
const CLI_PATH = path.join(__dirname, '../bin/weblama-cli.js');

// Base URL for the APILama service
const API_URL = 'http://localhost:9080';

describe('WebLama CLI APILama Integration Tests', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.resetAllMocks();
    mockAxios.reset();
  });

  test('health command should check APILama health status using the correct endpoint', async () => {
    // Import the CLI wrapper
    const cliWrapper = require('./mocks/cli-wrapper');
    
    // Mock the axios response
    mockAxios.mockSuccess('get', {
      status: 'success',
      message: 'WebLama API is healthy',
      service: 'weblama'
    });

    // Call the health check function directly
    const result = await cliWrapper.checkHealth(API_URL);

    // Verify axios was called with the correct URL (using the new APILama endpoint)
    expect(mockAxios.get).toHaveBeenCalledWith(`${API_URL}/api/weblama/health`);

    // Verify the result contains the expected message
    expect(result.success).toBe(true);
    expect(result.message).toBe('WebLama API is healthy');
  });

  test('list command should retrieve markdown files from APILama', async () => {
    // Import the CLI wrapper
    const cliWrapper = require('./mocks/cli-wrapper');
    
    // Mock the axios response
    mockAxios.mockSuccess('get', {
      status: 'success',
      files: [
        { name: 'welcome.md', path: 'welcome.md', size: 1024, modified: 1620000000 },
        { name: 'mermaid_example.md', path: 'mermaid_example.md', size: 2048, modified: 1620100000 }
      ]
    });

    // Call the list files function directly
    const result = await cliWrapper.listFiles(API_URL);

    // Verify axios was called with the correct URL (using the new APILama endpoint)
    expect(mockAxios.get).toHaveBeenCalledWith(`${API_URL}/api/weblama/markdown`);

    // Verify the result contains the expected files (including the sample files we created)
    expect(result.success).toBe(true);
    expect(result.files).toHaveLength(2);
    expect(result.files[0].name).toBe('welcome.md');
    expect(result.files[1].name).toBe('mermaid_example.md');
  });

  test('start command should use the correct API URL for APILama', () => {
    // Import the CLI wrapper
    const cliWrapper = require('./mocks/cli-wrapper');
    
    // Call the start server function directly with the API URL
    const result = cliWrapper.startServer({ port: 9081, apiUrl: API_URL });

    // Verify the result contains the expected configuration
    expect(result.success).toBe(true);
    expect(result.port).toBe(9081);
    expect(result.apiUrl).toBe(API_URL);
    expect(result.open).toBe(false);
  });

  test('CLI should handle API errors gracefully', async () => {
    // Import the CLI wrapper
    const cliWrapper = require('./mocks/cli-wrapper');
    
    // Mock the axios response to simulate an error
    mockAxios.mockError('get', new Error('Connection refused'));

    // Call the health check function directly and expect it to handle the error
    const result = await cliWrapper.checkHealth(API_URL);
    
    // Verify the result indicates an error
    expect(result.success).toBe(false);
    expect(result.message).toContain('Error');
    expect(result.message).toContain('Connection refused');
  });
});
