/**
 * WebLama Frontend Tests
 * 
 * This file contains tests for the WebLama frontend components.
 * It tests the UI components and their interaction with the API.
 */

const { JSDOM } = require('jsdom');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Mock axios for testing
jest.mock('axios');

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

  return dom;
};

describe('WebLama Frontend Tests', () => {
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

  test('File list should be populated when the page loads', async () => {
    // Mock the axios response for the file list
    axios.get.mockResolvedValueOnce({
      data: {
        status: 'success',
        files: [
          { name: 'test1.md', path: 'test1.md', size: 100, modified: 1620000000 },
          { name: 'test2.md', path: 'test2.md', size: 200, modified: 1620100000 }
        ]
      }
    });

    // Trigger the page load event
    dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));

    // Wait for the async operations to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify that the file list is populated
    const fileListItems = dom.window.document.querySelectorAll('#file-list li');
    expect(fileListItems.length).toBe(2);
    expect(fileListItems[0].textContent).toContain('test1.md');
    expect(fileListItems[1].textContent).toContain('test2.md');
  });

  test('Clicking on a file should load its content', async () => {
    // Mock the axios responses
    axios.get.mockResolvedValueOnce({
      data: {
        status: 'success',
        files: [
          { name: 'test1.md', path: 'test1.md', size: 100, modified: 1620000000 }
        ]
      }
    });

    axios.get.mockResolvedValueOnce({
      data: {
        status: 'success',
        content: '# Test Markdown\n\nThis is a test markdown file.'
      }
    });

    // Trigger the page load event
    dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));

    // Wait for the async operations to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Click on the file in the list
    const fileListItem = dom.window.document.querySelector('#file-list li');
    fileListItem.click();

    // Wait for the async operations to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify that the editor content is updated
    const editor = dom.window.document.querySelector('#editor');
    expect(editor.value).toBe('# Test Markdown\n\nThis is a test markdown file.');
  });

  test('Save button should save the file content', async () => {
    // Mock the axios responses
    axios.post.mockResolvedValueOnce({
      data: {
        status: 'success',
        message: 'File saved successfully'
      }
    });

    // Setup the editor with content and filename
    const editor = dom.window.document.querySelector('#editor');
    editor.value = '# Updated Test Markdown\n\nThis file has been updated.';
    dom.window.currentFile = 'test1.md';

    // Click the save button
    const saveButton = dom.window.document.querySelector('#save-button');
    saveButton.click();

    // Wait for the async operations to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify that axios.post was called with the correct parameters
    expect(axios.post).toHaveBeenCalledWith(
      'http://localhost:9081/api/weblama/markdown/test1.md',
      { content: '# Updated Test Markdown\n\nThis file has been updated.' }
    );
  });

  test('New file button should create a new file', async () => {
    // Mock the window.prompt to return a filename
    dom.window.prompt = jest.fn().mockReturnValue('new_file.md');

    // Mock the axios response
    axios.post.mockResolvedValueOnce({
      data: {
        status: 'success',
        message: 'File created successfully'
      }
    });

    // Click the new file button
    const newFileButton = dom.window.document.querySelector('#new-file-button');
    newFileButton.click();

    // Wait for the async operations to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify that axios.post was called with the correct parameters
    expect(axios.post).toHaveBeenCalledWith(
      'http://localhost:9081/api/weblama/markdown/new_file.md',
      { content: '# New File\n\nEnter your markdown content here.' }
    );

    // Verify that the editor is updated with the new file template
    const editor = dom.window.document.querySelector('#editor');
    expect(editor.value).toBe('# New File\n\nEnter your markdown content here.');
    expect(dom.window.currentFile).toBe('new_file.md');
  });
});
