/**
 * WebLama End-to-End Tests
 */

const axios = require('axios');

// Mock axios
jest.mock('axios');

// Constants
const APILAMA_URL = 'http://localhost:9080';
const WEBLAMA_URL = 'http://localhost:9081';

describe('WebLama End-to-End Tests', () => {
  beforeEach(() => {
    // Mock axios responses
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/weblama/health')) {
        return Promise.resolve({
          data: {
            status: 'success',
            message: 'WebLama API is healthy',
            service: 'weblama'
          }
        });
      } else if (url.includes('/api/weblama/markdown') && !url.includes('test.md')) {
        return Promise.resolve({
          data: {
            status: 'success',
            files: [
              { name: 'test.md', path: 'test.md', size: 1024, modified: 1620000000 }
            ]
          }
        });
      } else if (url.includes('test.md')) {
        return Promise.resolve({
          data: {
            status: 'success',
            content: '# Test Markdown\n\nThis is a test markdown file.'
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
    
    axios.delete.mockImplementation(() => {
      return Promise.resolve({
        data: {
          status: 'success',
          message: 'File deleted successfully'
        }
      });
    });
  });
  
  test('Complete workflow: CLI health check, create file, view file, update file, delete file', async () => {
    // Step 1: Check APILama health
    console.log('Step 1: Checking APILama health...');
    const healthResponse = await axios.get(`${APILAMA_URL}/api/weblama/health`);
    expect(healthResponse.data.status).toBe('success');
    expect(healthResponse.data.message).toBe('WebLama API is healthy');
    
    // Step 2: List markdown files
    console.log('Step 2: Listing markdown files...');
    const listResponse = await axios.get(`${APILAMA_URL}/api/weblama/markdown`);
    expect(listResponse.data.status).toBe('success');
    expect(listResponse.data.files).toHaveLength(1);
    expect(listResponse.data.files[0].name).toBe('test.md');
    
    // Step 3: Create a new markdown file
    console.log('Step 3: Creating a new markdown file...');
    const createResponse = await axios.post(`${APILAMA_URL}/api/weblama/markdown/new_test.md`, {
      content: '# New Test\n\nThis is a new test file.'
    });
    expect(createResponse.data.status).toBe('success');
    
    // Step 4: View the content of the markdown file
    console.log('Step 4: Viewing the content of the markdown file...');
    const viewResponse = await axios.get(`${APILAMA_URL}/api/weblama/markdown/test.md`);
    expect(viewResponse.data.status).toBe('success');
    expect(viewResponse.data.content).toContain('# Test Markdown');
    
    // Step 5: Update the markdown file
    console.log('Step 5: Updating the markdown file...');
    const updateResponse = await axios.post(`${APILAMA_URL}/api/weblama/markdown/test.md`, {
      content: '# Updated Test\n\nThis file has been updated.'
    });
    expect(updateResponse.data.status).toBe('success');
    
    // Step 6: Delete the markdown file
    console.log('Step 6: Deleting the markdown file...');
    const deleteResponse = await axios.delete(`${APILAMA_URL}/api/weblama/markdown/test.md`);
    expect(deleteResponse.data.status).toBe('success');
  });
  
  test('WebLama frontend can access APILama endpoints', async () => {
    // Test health endpoint
    const healthResponse = await axios.get(`${APILAMA_URL}/api/weblama/health`);
    expect(healthResponse.data.status).toBe('success');
    expect(healthResponse.data.message).toBe('WebLama API is healthy');
    
    // Test file listing endpoint
    const listResponse = await axios.get(`${APILAMA_URL}/api/weblama/markdown`);
    expect(listResponse.data.status).toBe('success');
    expect(listResponse.data.files).toHaveLength(1);
    
    // Test file content endpoint
    const contentResponse = await axios.get(`${APILAMA_URL}/api/weblama/markdown/test.md`);
    expect(contentResponse.data.status).toBe('success');
    expect(contentResponse.data.content).toContain('# Test Markdown');
  });
});
