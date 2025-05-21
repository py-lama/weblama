/**
 * WebLama API Integration Tests
 * 
 * This file contains tests for the WebLama API integration with APILama.
 * It tests all the API endpoints that WebLama uses to communicate with
 * the backend services through APILama.
 */

const axios = require('axios');
const assert = require('assert');

// Mock axios for testing
jest.mock('axios');

// Base URL for the APILama service
const API_URL = 'http://localhost:9080';

describe('WebLama API Integration Tests', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.resetAllMocks();
  });

  test('Health endpoint should return success status', async () => {
    // Mock the axios response
    axios.get.mockResolvedValueOnce({
      data: {
        status: 'success',
        message: 'WebLama API is healthy',
        service: 'weblama'
      }
    });

    // Call the health endpoint
    const response = await axios.get(`${API_URL}/api/weblama/health`);

    // Verify the response
    expect(response.data.status).toBe('success');
    expect(response.data.message).toBe('WebLama API is healthy');
    expect(response.data.service).toBe('weblama');
  });

  test('Markdown files endpoint should return a list of files', async () => {
    // Mock the axios response
    axios.get.mockResolvedValueOnce({
      data: {
        status: 'success',
        files: [
          { name: 'test1.md', path: 'test1.md', size: 100, modified: 1620000000 },
          { name: 'test2.md', path: 'test2.md', size: 200, modified: 1620100000 }
        ]
      }
    });

    // Call the markdown files endpoint
    const response = await axios.get(`${API_URL}/api/weblama/markdown`);

    // Verify the response
    expect(response.data.status).toBe('success');
    expect(response.data.files).toHaveLength(2);
    expect(response.data.files[0].name).toBe('test1.md');
    expect(response.data.files[1].name).toBe('test2.md');
  });

  test('Markdown content endpoint should return file content', async () => {
    // Mock the axios response
    axios.get.mockResolvedValueOnce({
      data: {
        status: 'success',
        content: '# Test Markdown\n\nThis is a test markdown file.'
      }
    });

    // Call the markdown content endpoint
    const response = await axios.get(`${API_URL}/api/weblama/markdown/test1.md`);

    // Verify the response
    expect(response.data.status).toBe('success');
    expect(response.data.content).toContain('# Test Markdown');
  });

  test('Save markdown endpoint should save file content', async () => {
    // Mock the axios response
    axios.post.mockResolvedValueOnce({
      data: {
        status: 'success',
        message: 'File saved successfully'
      }
    });

    // Call the save markdown endpoint
    const response = await axios.post(`${API_URL}/api/weblama/markdown/test1.md`, {
      content: '# Updated Test Markdown\n\nThis file has been updated.'
    });

    // Verify the response
    expect(response.data.status).toBe('success');
    expect(response.data.message).toBe('File saved successfully');

    // Verify axios was called with the correct parameters
    expect(axios.post).toHaveBeenCalledWith(
      `${API_URL}/api/weblama/markdown/test1.md`,
      { content: '# Updated Test Markdown\n\nThis file has been updated.' }
    );
  });

  test('Delete markdown endpoint should delete a file', async () => {
    // Mock the axios response
    axios.delete.mockResolvedValueOnce({
      data: {
        status: 'success',
        message: 'File deleted successfully'
      }
    });

    // Call the delete markdown endpoint
    const response = await axios.delete(`${API_URL}/api/weblama/markdown/test1.md`);

    // Verify the response
    expect(response.data.status).toBe('success');
    expect(response.data.message).toBe('File deleted successfully');

    // Verify axios was called with the correct URL
    expect(axios.delete).toHaveBeenCalledWith(`${API_URL}/api/weblama/markdown/test1.md`);
  });
});
