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

// Mock axios for testing
jest.mock('axios');

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
    // Reset all mocks before each test
    jest.resetAllMocks();
    
    // Setup a fresh DOM for each test
    dom = setupDOM();
  });

  afterEach(() => {
    // Clean up the DOM after each test
    dom.window.close();
  });

  test('Frontend should load markdown files from APILama', async () => {
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

    // Trigger the loadFiles function (or DOMContentLoaded event)
    if (typeof dom.window.loadFiles === 'function') {
      dom.window.loadFiles();
    } else {
      dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
    }

    // Wait for the async operations to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify that axios was called with the correct URL
    expect(axios.get).toHaveBeenCalledWith(`${API_URL}/api/weblama/markdown`);
  });

  test('Frontend should load file content from APILama', async () => {
    // Mock the axios responses
    // First mock call for file list
    axios.get.mockImplementation((url) => {
      if (url === `${API_URL}/api/weblama/markdown`) {
        return Promise.resolve({
          data: {
            status: 'success',
            files: [
              { name: 'welcome.md', path: 'welcome.md', size: 1024, modified: 1620000000 }
            ]
          }
        });
      } else if (url === `${API_URL}/api/weblama/markdown/welcome.md`) {
        return Promise.resolve({
          data: {
            status: 'success',
            content: '# Welcome to WebLama\n\nThis is a sample markdown file.'
          }
        });
      }
      return Promise.resolve({ data: {} });
    });

    // Trigger the loadFiles function (or DOMContentLoaded event)
    if (typeof dom.window.loadFiles === 'function') {
      dom.window.loadFiles();
    } else {
      dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
    }

    // Wait for the async operations to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Simulate clicking on a file in the list
    const fileClickEvent = new dom.window.CustomEvent('fileClick', {
      detail: { filename: 'welcome.md' }
    });
    dom.window.document.dispatchEvent(fileClickEvent);

    // Wait for the async operations to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify that axios was called with the correct URL
    expect(axios.get).toHaveBeenCalledWith(`${API_URL}/api/weblama/markdown/welcome.md`);
  });

  test('Frontend should save file content to APILama', async () => {
    // Mock the axios response
    axios.post.mockImplementation(() => {
      return Promise.resolve({
        data: {
          status: 'success',
          message: 'File saved successfully'
        }
      });
    });

    // Set up the current file and editor content
    dom.window.currentFile = 'welcome.md';
    const editor = dom.window.document.querySelector('#editor');
    if (editor) {
      editor.value = '# Updated Welcome\n\nThis file has been updated.';
    }

    // Trigger the save function
    if (typeof dom.window.saveFile === 'function') {
      dom.window.saveFile();
    } else {
      // Find and click the save button
      const saveButton = dom.window.document.querySelector('#save-button');
      if (saveButton) {
        saveButton.click();
      }
    }

    // Wait for the async operations to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify that axios was called with the correct URL and data
    expect(axios.post).toHaveBeenCalledWith(
      `${API_URL}/api/weblama/markdown/welcome.md`,
      { content: '# Updated Welcome\n\nThis file has been updated.' }
    );
  });

  test('Frontend should handle API errors gracefully', async () => {
    // Mock the axios response to simulate an error
    axios.get.mockImplementation(() => {
      return Promise.reject(new Error('Connection refused'));
    });

    // Mock console.error to capture error messages
    const originalConsoleError = console.error;
    console.error = jest.fn();

    // Trigger the loadFiles function (or DOMContentLoaded event)
    if (typeof dom.window.loadFiles === 'function') {
      dom.window.loadFiles();
    } else {
      dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
    }

    // Wait for the async operations to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify that an error was logged
    expect(console.error).toHaveBeenCalled();

    // Restore the original console.error
    console.error = originalConsoleError;
  });
});
