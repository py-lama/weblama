/**
 * WebLama Frontend APILama Integration Tests
 * 
 * This file contains tests for the WebLama frontend's integration with APILama.
 * It tests the frontend JavaScript code's ability to communicate with the
 * APILama backend using the new architecture where WebLama is a pure frontend application.
 */

const { JSDOM } = require('jsdom');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Import our mock implementation
const mockAxios = require('./mocks/axios');

// Base URL for the APILama service
const API_URL = 'http://localhost:9080';

// Create a simple DOM environment for testing
const setupDOM = () => {
  // Read the index.html file
  const html = fs.readFileSync(path.join(__dirname, '../static/index.html'), 'utf-8');
  const dom = new JSDOM(html, {
    url: 'http://localhost:9081',
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true
  });

  // Add global variables that the frontend code expects
  global.window = dom.window;
  global.document = dom.window.document;
  global.navigator = dom.window.navigator;
  global.location = dom.window.location;

  // Mock the API_URL in the frontend code
  dom.window.API_URL = API_URL;

  return dom;
};

describe('WebLama Frontend APILama Integration Tests', () => {
  let dom;

  beforeEach(() => {
    // Set up a fresh DOM for each test
    dom = setupDOM();
    // Reset the mock before each test
    mockAxios.reset();
  });

  afterEach(() => {
    // Clean up the DOM after each test
    dom.window.close();
  });

  test('Frontend should load markdown files from APILama', async () => {
    // Import the frontend wrapper
    const frontendWrapper = require('./mocks/frontend-wrapper');
    
    // Mock the axios response for the file list
    mockAxios.mockSuccess('get', {
      status: 'success',
      files: [
        { name: 'welcome.md', path: 'welcome.md', size: 1024, modified: 1620000000 },
        { name: 'mermaid_example.md', path: 'mermaid_example.md', size: 2048, modified: 1620100000 }
      ]
    });

    // Call the loadFiles function directly
    const result = await frontendWrapper.loadFiles(API_URL);
    
    // Verify that axios was called with the correct URL
    expect(mockAxios.get).toHaveBeenCalledWith(`${API_URL}/api/weblama/markdown`);
    
    // Verify the result contains the expected files
    expect(result.success).toBe(true);
    expect(result.files).toHaveLength(2);
    expect(result.files[0].name).toBe('welcome.md');
    expect(result.files[1].name).toBe('mermaid_example.md');
  });

  test('Frontend should load file content from APILama', async () => {
    // Import the frontend wrapper
    const frontendWrapper = require('./mocks/frontend-wrapper');
    
    // Mock the axios responses for file content
    mockAxios.mockSuccess('get', {
      status: 'success',
      content: '# Welcome to WebLama\n\nThis is a sample markdown file.'
    });

    // Call the loadFileContent function directly
    const result = await frontendWrapper.loadFileContent(API_URL, 'welcome.md');
    
    // Verify that axios was called with the correct URL
    expect(mockAxios.get).toHaveBeenCalledWith(`${API_URL}/api/weblama/markdown/welcome.md`);
    
    // Verify the result contains the expected content
    expect(result.success).toBe(true);
    expect(result.content).toBe('# Welcome to WebLama\n\nThis is a sample markdown file.');
  });

  test('Frontend should save file content to APILama', async () => {
    // Import the frontend wrapper
    const frontendWrapper = require('./mocks/frontend-wrapper');
    
    // Mock the axios response
    mockAxios.mockSuccess('post', {
      status: 'success',
      message: 'File saved successfully'
    });

    // Define the file and content to save
    const filename = 'welcome.md';
    const content = '# Updated Welcome\n\nThis file has been updated.';

    // Call the saveFile function directly
    const result = await frontendWrapper.saveFile(API_URL, filename, content);
    
    // Verify that axios was called with the correct URL and data
    expect(mockAxios.post).toHaveBeenCalledWith(
      `${API_URL}/api/weblama/markdown/welcome.md`,
      { content: content }
    );
    
    // Verify the result indicates success
    expect(result.success).toBe(true);
    expect(result.message).toBe('File saved successfully');
  });

  test('Frontend should handle API errors gracefully', async () => {
    // Import the frontend wrapper
    const frontendWrapper = require('./mocks/frontend-wrapper');
    
    // Mock the axios response to simulate an error
    mockAxios.mockError('get', new Error('Connection refused'));

    // Call the loadFiles function directly and expect it to handle the error
    const result = await frontendWrapper.loadFiles(API_URL);
    
    // Verify the result indicates an error
    expect(result.success).toBe(false);
    expect(result.message).toContain('Error');
    expect(result.message).toContain('Connection refused');
  });
});
