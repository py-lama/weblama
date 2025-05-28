/**
 * Mock DOM implementation for testing
 */

const { JSDOM } = require('jsdom');

// Create a function to get a fresh DOM for each test
function createDOM() {
  // Create a basic HTML template
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>WebLama</title>
    </head>
    <body>
      <div class="container">
        <header>
          <h1>WebLama</h1>
          <div class="buttons">
            <button id="new-file-btn">New File</button>
            <button id="save-btn">Save</button>
          </div>
        </header>
        <main>
          <div class="sidebar">
            <h2>Files</h2>
            <ul id="file-list"></ul>
          </div>
          <div class="editor-container">
            <div id="editor"></div>
          </div>
        </main>
      </div>
    </body>
    </html>
  `;
  
  const dom = new JSDOM(html, {
    url: 'http://localhost:9081',
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true
  });
  
  // Mock localStorage
  dom.window.localStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  };
  
  // Mock fetch API
  dom.window.fetch = jest.fn().mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        status: 'success',
        files: [
          { name: 'test1.md', path: 'test1.md', size: 1024, modified: 1620000000 },
          { name: 'test2.md', path: 'test2.md', size: 2048, modified: 1620100000 }
        ]
      })
    })
  );
  
  return dom;
}

// Export the createDOM function
module.exports = { createDOM };

// Add a simple test to avoid the "no tests" error
describe('DOM Mock', () => {
  test('createDOM function exists', () => {
    expect(typeof createDOM).toBe('function');
  });
  
  test('createDOM returns a JSDOM instance', () => {
    const dom = createDOM();
    expect(dom).toBeDefined();
    expect(dom.window).toBeDefined();
    expect(dom.window.document).toBeDefined();
  });
});
