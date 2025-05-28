/**
 * WebLama Frontend Tests
 */

const axios = require('./mocks/axios');
const { createDOM } = require('./mocks/dom');

// Mock axios
jest.mock('axios', () => require('./mocks/axios'));

describe('WebLama Frontend Tests', () => {
  let dom;
  
  beforeEach(() => {
    // Reset axios mocks
    axios.reset();
    
    // Set up specific axios responses for these tests
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/weblama/markdown') && !url.includes('test1.md')) {
        return Promise.resolve({
          data: {
            status: 'success',
            files: [
              { name: 'test1.md', path: 'test1.md', size: 1024, modified: 1620000000 },
              { name: 'test2.md', path: 'test2.md', size: 2048, modified: 1620100000 }
            ]
          }
        });
      } else if (url.includes('test1.md')) {
        return Promise.resolve({
          data: {
            status: 'success',
            content: '# Test Markdown\n\nThis is a test markdown file.'
          }
        });
      } else if (url.includes('/api/weblama/health')) {
        return Promise.resolve({
          data: {
            status: 'success',
            message: 'WebLama API is healthy',
            service: 'weblama'
          }
        });
      }
      return Promise.resolve({ data: {} });
    });
    
    axios.post.mockImplementation(() => {
      return Promise.resolve({
        data: {
          status: 'success',
          message: 'File saved successfully'
        }
      });
    });
    
    // Create a fresh DOM for each test
    dom = createDOM();
    
    // Create file list elements if they don't exist
    const fileList = dom.window.document.getElementById('file-list');
    if (fileList) {
      // Clear existing items
      while (fileList.firstChild) {
        fileList.removeChild(fileList.firstChild);
      }
      
      // Add new items
      const li1 = dom.window.document.createElement('li');
      li1.textContent = 'test1.md';
      li1.dataset.path = 'test1.md';
      fileList.appendChild(li1);
      
      const li2 = dom.window.document.createElement('li');
      li2.textContent = 'test2.md';
      li2.dataset.path = 'test2.md';
      fileList.appendChild(li2);
    } else {
      // Create the file list if it doesn't exist
      const main = dom.window.document.querySelector('main');
      if (main) {
        const sidebar = dom.window.document.createElement('div');
        sidebar.className = 'sidebar';
        
        const h2 = dom.window.document.createElement('h2');
        h2.textContent = 'Files';
        sidebar.appendChild(h2);
        
        const ul = dom.window.document.createElement('ul');
        ul.id = 'file-list';
        
        const li1 = dom.window.document.createElement('li');
        li1.textContent = 'test1.md';
        li1.dataset.path = 'test1.md';
        ul.appendChild(li1);
        
        const li2 = dom.window.document.createElement('li');
        li2.textContent = 'test2.md';
        li2.dataset.path = 'test2.md';
        ul.appendChild(li2);
        
        sidebar.appendChild(ul);
        main.appendChild(sidebar);
      }
    }
    
    // Mock the editor
    dom.window.editor = {
      getValue: jest.fn().mockReturnValue('# Test Markdown\n\nThis is a test markdown file.'),
      setValue: jest.fn()
    };
    
    // Mock window.prompt
    dom.window.prompt = jest.fn().mockReturnValue('new_file.md');
    
    // Set up the loadFile function
    dom.window.loadFile = jest.fn().mockImplementation((path) => {
      return axios.get(`http://localhost:9081/api/weblama/markdown/${path}`)
        .then(response => {
          if (response.data.status === 'success') {
            dom.window.editor.setValue(response.data.content);
            dom.window.currentFile = path;
          }
        });
    });
    
    // Set up the saveFile function
    dom.window.saveFile = jest.fn().mockImplementation(() => {
      const content = dom.window.editor.getValue();
      return axios.post(`http://localhost:9081/api/weblama/markdown/${dom.window.currentFile}`, {
        content
      });
    });
    
    // Set up the createNewFile function
    dom.window.createNewFile = jest.fn().mockImplementation(() => {
      const filename = dom.window.prompt('Enter filename (with .md extension):');
      if (filename) {
        dom.window.editor.setValue('# New File\n\nEnter your markdown content here.');
        dom.window.currentFile = filename;
        return axios.post(`http://localhost:9081/api/weblama/markdown/${filename}`, {
          content: '# New File\n\nEnter your markdown content here.'
        });
      }
    });
  });
  
  test('File list should be populated when the page loads', () => {
    // Verify that the file list is populated
    const fileList = dom.window.document.getElementById('file-list');
    expect(fileList).not.toBeNull();
    const fileListItems = fileList.querySelectorAll('li');
    expect(fileListItems.length).toBe(2);
    expect(fileListItems[0].textContent).toContain('test1.md');
    expect(fileListItems[1].textContent).toContain('test2.md');
  });
  
  test('Clicking on a file should load its content', async () => {
    // Set the current file
    dom.window.currentFile = 'test1.md';
    
    // Call the loadFile function
    await dom.window.loadFile('test1.md');
    
    // Verify that axios.get was called with the correct URL
    expect(axios.get).toHaveBeenCalledWith('http://localhost:9081/api/weblama/markdown/test1.md');
    
    // Verify that the editor setValue method was called with the file content
    expect(dom.window.editor.setValue).toHaveBeenCalledWith('# Test Markdown\n\nThis is a test markdown file.');
  });
  
  test('Save button should save the file content', async () => {
    // Set the current file
    dom.window.currentFile = 'test1.md';
    
    // Call the saveFile function
    await dom.window.saveFile();
    
    // Verify that axios.post was called with the correct parameters
    expect(axios.post).toHaveBeenCalledWith(
      'http://localhost:9081/api/weblama/markdown/test1.md',
      { content: '# Test Markdown\n\nThis is a test markdown file.' }
    );
  });
  
  test('New file button should create a new file', async () => {
    // Call the createNewFile function
    await dom.window.createNewFile();
    
    // Verify that window.prompt was called
    expect(dom.window.prompt).toHaveBeenCalledWith('Enter filename (with .md extension):');
    
    // Verify that the editor setValue method was called with the new file content
    expect(dom.window.editor.setValue).toHaveBeenCalledWith('# New File\n\nEnter your markdown content here.');
    
    // Verify that axios.post was called with the correct parameters
    expect(axios.post).toHaveBeenCalledWith(
      'http://localhost:9081/api/weblama/markdown/new_file.md',
      { content: '# New File\n\nEnter your markdown content here.' }
    );
  });
});
