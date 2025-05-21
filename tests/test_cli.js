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
    // Mock the axios response
    mockAxios.mockSuccess('get', {
      status: 'success',
      message: 'WebLama API is healthy',
      service: 'weblama'
    });

    // Execute the CLI command
    const output = execSync(`node ${CLI_PATH} health --api-url http://localhost:9080`).toString();

    // Verify axios was called with the correct URL
    expect(axios.get).toHaveBeenCalledWith('http://localhost:9080/api/weblama/health');

    // Verify the output contains the expected message
    expect(output).toContain('WebLama API is healthy');
  });

  test('list command should retrieve markdown files', async () => {
    // Mock the axios response
    mockAxios.mockSuccess('get', {
      status: 'success',
      files: [
        { name: 'welcome.md', path: 'welcome.md', size: 1024, modified: 1620000000 },
        { name: 'mermaid_example.md', path: 'mermaid_example.md', size: 2048, modified: 1620100000 }
      ]
    });

    // Execute the CLI command
    const output = execSync(`node ${CLI_PATH} list --api-url http://localhost:9080`).toString();

    // Verify axios was called with the correct URL
    expect(axios.get).toHaveBeenCalledWith('http://localhost:9080/api/weblama/markdown');

    // Verify the output contains the expected files
    expect(output).toContain('test1.md');
    expect(output).toContain('test2.md');
  });

  test('start command should start the web server', () => {
    // This is a more challenging test since it starts a server
    // We'll mock child_process.spawn and verify it's called correctly
    const spawn = jest.spyOn(require('child_process'), 'spawn').mockImplementation(() => {
      return {
        on: jest.fn(),
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() }
      };
    });

    // Execute the CLI command (this won't actually start the server due to our mock)
    try {
      execSync(`node ${CLI_PATH} start --port 9081 --api-url http://localhost:9080 --no-open`, { timeout: 1000 });
    } catch (e) {
      // Expected to timeout since the server would normally keep running
    }

    // Verify spawn was called with the correct command
    expect(spawn).toHaveBeenCalled();
    
    // Restore the original spawn function
    spawn.mockRestore();
  });
});
