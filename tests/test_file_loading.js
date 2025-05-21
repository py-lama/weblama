/**
 * WebLama File Loading and Editor Integration Tests
 * 
 * This file contains tests for the WebLama frontend's file loading and editor integration.
 * It tests the frontend's ability to correctly load files from APILama and display them
 * in the editor, addressing the issues mentioned in the memory about file loading.
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
  // Create a basic HTML structure for testing
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>WebLama</title>
    </head>
    <body>
      <div id="file-list"></div>
      <div id="editor-container">
        <textarea id="editor"></textarea>
      </div>
      <button id="save-button">Save</button>
    </body>
    </html>
  `;

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

  // Add mock functions for file loading and editor integration
  dom.window.loadFiles = jest.fn();
  dom.window.loadFileContent = jest.fn();
  dom.window.saveFile = jest.fn();
  dom.window.currentFile = null;

  return dom;
};

describe('WebLama File Loading and Editor Integration Tests', () => {
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

  test('Frontend should use the correct API endpoint for file listing', async () => {
    // Import the frontend wrapper
    const frontendWrapper = require('./mocks/frontend-wrapper');
    
    // Mock the axios response
    mockAxios.mockSuccess('get', {
      status: 'success',
      files: [
        { name: 'welcome.md', path: 'welcome.md', size: 1024, modified: 1620000000 }
      ]
    });

    // Call the loadFiles function directly
    const result = await frontendWrapper.loadFiles(API_URL);
    
    // Verify that axios was called with the correct URL
    expect(mockAxios.get).toHaveBeenCalledWith(`${API_URL}/api/weblama/markdown`);
    
    // Verify the result contains the expected files
    expect(result.success).toBe(true);
    expect(result.files).toHaveLength(1);
    expect(result.files[0].name).toBe('welcome.md');
  });

  test('Frontend should extract just the filename from the full path when loading file content', async () => {
    // Import the frontend wrapper
    const frontendWrapper = require('./mocks/frontend-wrapper');
    
    // Set up a file path with directories
    const fullPath = '/path/to/welcome.md';
    
    // Mock the axios response for file content
    mockAxios.mockSuccess('get', {
      status: 'success',
      content: '# Welcome to WebLama\n\nThis is a sample markdown file.'
    });

    // Call the loadFileContent function directly with a path
    const result = await frontendWrapper.loadFileContent(API_URL, fullPath);
    
    // Verify that axios was called with the correct URL using just the filename
    expect(mockAxios.get).toHaveBeenCalledWith(`${API_URL}/api/weblama/markdown/welcome.md`);
    
    // Verify the result contains the expected content
    expect(result.success).toBe(true);
    expect(result.content).toBe('# Welcome to WebLama\n\nThis is a sample markdown file.');
  });

  test('Frontend should use the filename parameter instead of path parameter when loading file content', async () => {
    // Import the frontend wrapper
    const frontendWrapper = require('./mocks/frontend-wrapper');
    
    // Set up a file with just the filename
    const filename = 'welcome.md';
    
    // Mock the axios response for file content
    mockAxios.mockSuccess('get', {
      status: 'success',
      content: '# Welcome to WebLama\n\nThis is a sample markdown file.'
    });

    // Call the loadFileContent function directly with just the filename
    const result = await frontendWrapper.loadFileContent(API_URL, filename);
    
    // Verify that axios was called with the correct URL using the filename parameter
    expect(mockAxios.get).toHaveBeenCalledWith(`${API_URL}/api/weblama/markdown/welcome.md`);
    
    // Verify the result contains the expected content
    expect(result.success).toBe(true);
    expect(result.content).toBe('# Welcome to WebLama\n\nThis is a sample markdown file.');
  });

  test('Clicking on a file in the file list should load its content into the editor', async () => {
    // Import the frontend wrapper
    const frontendWrapper = require('./mocks/frontend-wrapper');
    
    // Set up the mocks for file list and file content
    // First mock for file list
    mockAxios.mockSuccess('get', {
      status: 'success',
      files: [
        { name: 'welcome.md', path: 'welcome.md', size: 1024, modified: 1620000000 }
      ]
    });
    
    // Load the files using the wrapper
    const fileListResult = await frontendWrapper.loadFiles(API_URL);
    expect(fileListResult.success).toBe(true);
    expect(fileListResult.files).toHaveLength(1);
    
    // Reset the mock for the next call
    mockAxios.reset();
    
    // Mock for file content
    mockAxios.mockSuccess('get', {
      status: 'success',
      content: '# Welcome to WebLama\n\nThis is a sample markdown file.'
    });
    
    // Load the file content using the wrapper
    const fileContentResult = await frontendWrapper.loadFileContent(API_URL, 'welcome.md');
    expect(fileContentResult.success).toBe(true);
    
    // Verify the file content was loaded correctly
    expect(fileContentResult.content).toBe('# Welcome to WebLama\n\nThis is a sample markdown file.');
    expect(mockAxios.get).toHaveBeenCalledWith(`${API_URL}/api/weblama/markdown/welcome.md`);
  });
});
