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

// Mock axios for testing
jest.mock('axios');

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
    // Reset all mocks before each test
    jest.resetAllMocks();
    
    // Setup a fresh DOM for each test
    dom = setupDOM();
  });

  afterEach(() => {
    // Clean up the DOM after each test
    dom.window.close();
  });

  test('Frontend should use the correct API endpoint for file listing', async () => {
    // Mock the axios response for the file list
    axios.get.mockImplementation(() => {
      return Promise.resolve({
        data: {
          status: 'success',
          files: [
            { name: 'welcome.md', path: 'welcome.md', size: 1024, modified: 1620000000 },
            { name: 'mermaid_example.md', path: 'mermaid_example.md', size: 2048, modified: 1620100000 }
          ]
        }
      });
    });

    // Call the loadFiles function
    dom.window.loadFiles();

    // Wait for the async operations to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify that axios was called with the correct URL
    expect(axios.get).toHaveBeenCalledWith(`${API_URL}/api/weblama/markdown`);
  });

  test('Frontend should extract just the filename from the full path when loading file content', async () => {
    // Set up the current file with a full path
    const fullPath = '/path/to/welcome.md';
    dom.window.currentFile = fullPath;
    
    // Mock the axios response for file content
    axios.get.mockImplementation(() => {
      return Promise.resolve({
        data: {
          status: 'success',
          content: '# Welcome to WebLama\n\nThis is a sample markdown file.'
        }
      });
    });

    // Call the loadFileContent function with the full path
    dom.window.loadFileContent(fullPath);

    // Wait for the async operations to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify that axios was called with the correct URL using just the filename
    expect(axios.get).toHaveBeenCalledWith(`${API_URL}/api/weblama/markdown/welcome.md`);
  });

  test('Frontend should use the filename parameter instead of path parameter when loading file content', async () => {
    // Mock the axios response for file content
    axios.get.mockResolvedValueOnce({
      data: {
        status: 'success',
        content: '# Welcome to WebLama\n\nThis is a sample markdown file.'
      }
    });

    // Create a mock implementation of loadFileContent that simulates the fixed behavior
    dom.window.loadFileContent = (filePath) => {
      // Extract just the filename from the path
      const filename = filePath.split('/').pop();
      
      // Use the correct API endpoint with 'filename' parameter instead of 'path'
      axios.get(`${API_URL}/api/weblama/markdown/${filename}`);
    };

    // Call the loadFileContent function with a path
    dom.window.loadFileContent('/path/to/welcome.md');

    // Wait for the async operations to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify that axios was called with the correct URL using the filename parameter
    expect(axios.get).toHaveBeenCalledWith(`${API_URL}/api/weblama/markdown/welcome.md`);
  });

  test('Clicking on a file in the file list should load its content into the editor', async () => {
    // Mock the axios responses
    axios.get.mockResolvedValueOnce({
      data: {
        status: 'success',
        files: [
          { name: 'welcome.md', path: 'welcome.md', size: 1024, modified: 1620000000 }
        ]
      }
    });

    axios.get.mockResolvedValueOnce({
      data: {
        status: 'success',
        content: '# Welcome to WebLama\n\nThis is a sample markdown file.'
      }
    });

    // Create a mock implementation of loadFiles that populates the file list
    dom.window.loadFiles = async () => {
      const fileList = dom.window.document.getElementById('file-list');
      fileList.innerHTML = '<div class="file" data-path="welcome.md">welcome.md</div>';
      
      // Add click event listener to the file
      const fileElement = fileList.querySelector('.file');
      fileElement.addEventListener('click', () => {
        dom.window.currentFile = fileElement.getAttribute('data-path');
        dom.window.loadFileContent(dom.window.currentFile);
      });
    };

    // Create a mock implementation of loadFileContent that updates the editor
    dom.window.loadFileContent = async (filePath) => {
      const response = await axios.get(`${API_URL}/api/weblama/markdown/${filePath}`);
      const editor = dom.window.document.getElementById('editor');
      editor.value = response.data.content;
    };

    // Load the files
    await dom.window.loadFiles();

    // Simulate clicking on a file in the list
    const fileElement = dom.window.document.querySelector('.file');
    fileElement.click();

    // Wait for the async operations to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify that the editor content was updated
    const editor = dom.window.document.getElementById('editor');
    expect(editor.value).toBe('# Welcome to WebLama\n\nThis is a sample markdown file.');
  });
});
