/**
 * WebLama CLI Tests
 * 
 * This file contains tests for the WebLama CLI functionality.
 * It tests the CLI's ability to communicate with the APILama backend
 * and perform various operations like listing markdown files,
 * checking health status, etc.
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

describe('WebLama CLI Tests', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.resetAllMocks();
    mockAxios.reset();
  });

  test('health command should check APILama health status', async () => {
    // Import the CLI wrapper
    const cliWrapper = require('./mocks/cli-wrapper');
    
    // Mock the axios response
    mockAxios.mockSuccess('get', {
      status: 'success',
      message: 'WebLama API is healthy',
      service: 'weblama'
    });

    // Call the health check function directly
    const result = await cliWrapper.checkHealth('http://localhost:9080');

    // Verify axios was called with the correct URL
    expect(mockAxios.get).toHaveBeenCalledWith('http://localhost:9080/api/weblama/health');

    // Verify the result contains the expected message
    expect(result.success).toBe(true);
    expect(result.message).toBe('WebLama API is healthy');
  });

  test('list command should retrieve markdown files', async () => {
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
    const result = await cliWrapper.listFiles('http://localhost:9080');

    // Verify axios was called with the correct URL
    expect(mockAxios.get).toHaveBeenCalledWith('http://localhost:9080/api/weblama/markdown');

    // Verify the result contains the expected files
    expect(result.success).toBe(true);
    expect(result.files).toHaveLength(2);
    expect(result.files[0].name).toBe('welcome.md');
    expect(result.files[1].name).toBe('mermaid_example.md');
  });

  test('start command should start the web server', () => {
    // Import the CLI wrapper
    const cliWrapper = require('./mocks/cli-wrapper');
    
    // Call the start server function directly
    const result = cliWrapper.startServer({ port: 8081 });

    // Verify the result contains the expected configuration
    expect(result.success).toBe(true);
    expect(result.port).toBe(8081);
    expect(result.apiUrl).toBe('http://localhost:9080');
    expect(result.open).toBe(false);
  });
});
