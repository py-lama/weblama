/**
 * Mock APILama server for testing
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

class MockAPILamaServer {
  constructor(port = 9080) {
    this.port = port;
    this.app = express();
    this.server = null;
    this.files = {
      'test.md': '# Test Markdown\n\nThis is a test markdown file.',
      'test2.md': '# Test 2\n\nThis is another test file.'
    };
    
    // Configure Express
    this.app.use(cors());
    this.app.use(bodyParser.json());
    
    // Set up routes
    this.setupRoutes();
  }
  
  setupRoutes() {
    // Health check endpoint
    this.app.get('/api/weblama/health', (req, res) => {
      res.json({
        status: 'success',
        message: 'WebLama API is healthy',
        service: 'weblama'
      });
    });
    
    // List markdown files endpoint
    this.app.get('/api/weblama/markdown', (req, res) => {
      const files = Object.keys(this.files).map(name => ({
        name,
        path: name,
        size: this.files[name].length,
        modified: Date.now()
      }));
      
      res.json({
        status: 'success',
        files
      });
    });
    
    // Get markdown file content endpoint
    this.app.get('/api/weblama/markdown/:filename', (req, res) => {
      const { filename } = req.params;
      
      if (this.files[filename]) {
        res.json({
          status: 'success',
          content: this.files[filename]
        });
      } else {
        res.status(404).json({
          status: 'error',
          message: `File ${filename} not found`
        });
      }
    });
    
    // Create/update markdown file endpoint
    this.app.post('/api/weblama/markdown/:filename', (req, res) => {
      const { filename } = req.params;
      const { content } = req.body;
      
      if (!content) {
        res.status(400).json({
          status: 'error',
          message: 'Content is required'
        });
        return;
      }
      
      this.files[filename] = content;
      
      res.json({
        status: 'success',
        message: 'File saved successfully'
      });
    });
    
    // Delete markdown file endpoint
    this.app.delete('/api/weblama/markdown/:filename', (req, res) => {
      const { filename } = req.params;
      
      if (this.files[filename]) {
        delete this.files[filename];
        
        res.json({
          status: 'success',
          message: 'File deleted successfully'
        });
      } else {
        res.status(404).json({
          status: 'error',
          message: `File ${filename} not found`
        });
      }
    });
  }
  
  start() {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, () => {
        console.log(`Mock APILama server running on port ${this.port}`);
        resolve(this);
      });
    });
  }
  
  stop() {
    return new Promise((resolve, reject) => {
      if (this.server) {
        this.server.close(() => {
          console.log('Mock APILama server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = { MockAPILamaServer };

// Add a simple test to avoid the "no tests" error
describe('MockAPILamaServer', () => {
  test('MockAPILamaServer class exists', () => {
    expect(typeof MockAPILamaServer).toBe('function');
  });
});
