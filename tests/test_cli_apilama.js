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
    // Mock the axios response
    mockAxios.mockSuccess('get', {
      status: 'success',
      message: 'WebLama API is healthy',
      service: 'weblama'
    });

    // Execute the CLI command
    const output = execSync(`node ${CLI_PATH} health --api-url ${API_URL}`).toString();

    // Verify axios was called with the correct URL (using the new APILama endpoint)
    expect(axios.get).toHaveBeenCalledWith(`${API_URL}/api/weblama/health`);

    // Verify the output contains the expected message
    expect(output).toContain('WebLama API is healthy');
  });

  test('list command should retrieve markdown files from APILama', async () => {
    // Mock the axios response
    mockAxios.mockSuccess('get', {
      status: 'success',
      files: [
        { name: 'welcome.md', path: 'welcome.md', size: 1024, modified: 1620000000 },
        { name: 'mermaid_example.md', path: 'mermaid_example.md', size: 2048, modified: 1620100000 }
      ]
    });

    // Execute the CLI command
    const output = execSync(`node ${CLI_PATH} list --api-url ${API_URL}`).toString();

    // Verify axios was called with the correct URL (using the new APILama endpoint)
    expect(axios.get).toHaveBeenCalledWith(`${API_URL}/api/weblama/markdown`);

    // Verify the output contains the expected files (including the sample files we created)
    expect(output).toContain('welcome.md');
    expect(output).toContain('mermaid_example.md');
  });

  test('start command should use the correct API URL for APILama', () => {
    // Mock child_process.spawn
    const spawn = jest.spyOn(require('child_process'), 'spawn').mockImplementation(() => {
      return {
        on: jest.fn(),
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() }
      };
    });

    // Execute the CLI command with the --api-url flag
    try {
      execSync(`node ${CLI_PATH} start --port 9081 --api-url ${API_URL} --no-open`, { timeout: 1000 });
    } catch (e) {
      // Expected to timeout since the server would normally keep running
    }

    // Verify spawn was called with the correct command and API URL
    expect(spawn).toHaveBeenCalled();
    const spawnArgs = spawn.mock.calls[0];
    expect(spawnArgs[1]).toContain('--port');
    expect(spawnArgs[1]).toContain('9081');
    expect(spawnArgs[1]).toContain('--cors');
    
    // Restore the original spawn function
    spawn.mockRestore();
  });

  test('CLI should handle API errors gracefully', async () => {
    // Mock the axios response to simulate an error
    mockAxios.mockError('get', new Error('Connection refused'));

    // Execute the CLI command and expect it to handle the error
    try {
      execSync(`node ${CLI_PATH} health --api-url ${API_URL}`).toString();
      // If we get here, the test should fail because the command should throw an error
      fail('Command should have thrown an error');
    } catch (error) {
      // Verify the error output contains a helpful message
      expect(error.stdout.toString()).toContain('Error');
      expect(error.stdout.toString()).toContain('Connection refused');
    }
  });
});
