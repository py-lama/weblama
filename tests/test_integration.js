/**
 * WebLama Integration Tests
 * 
 * This file contains integration tests for WebLama with APILama.
 * These tests make actual HTTP requests to the running services to verify
 * that they're working correctly together.
 */

const axios = require('axios');
const assert = require('assert');

// Base URLs for the services
const WEBLAMA_URL = 'http://localhost:9081';
const APILAMA_URL = 'http://localhost:9080';

// Skip these tests if the services aren't running
const skipIfServicesNotRunning = async () => {
  try {
    await axios.get(`${APILAMA_URL}/api/weblama/health`, { timeout: 1000 });
    return false; // Don't skip tests
  } catch (error) {
    console.warn('APILama service is not running. Skipping integration tests.');
    return true; // Skip tests
  }
};

describe('WebLama Integration Tests', () => {
  let shouldSkip = false;

  beforeAll(async () => {
    shouldSkip = await skipIfServicesNotRunning();
  });

  test('APILama health endpoint should be accessible', async () => {
    if (shouldSkip) {
      return;
    }

    const response = await axios.get(`${APILAMA_URL}/api/weblama/health`);
    expect(response.status).toBe(200);
    expect(response.data.status).toBe('success');
    expect(response.data.message).toBe('WebLama API is healthy');
  });

  test('WebLama should be able to list markdown files through APILama', async () => {
    if (shouldSkip) {
      return;
    }

    const response = await axios.get(`${APILAMA_URL}/api/weblama/markdown`);
    expect(response.status).toBe(200);
    expect(response.data.status).toBe('success');
    expect(Array.isArray(response.data.files)).toBe(true);
  });

  test('WebLama should be able to create, read, update, and delete markdown files', async () => {
    if (shouldSkip) {
      return;
    }

    const testFileName = `test_${Date.now()}.md`;
    const initialContent = '# Test File\n\nThis is a test file created by the integration tests.';
    const updatedContent = '# Updated Test File\n\nThis file has been updated by the integration tests.';

    // Create a new file
    const createResponse = await axios.post(`${APILAMA_URL}/api/weblama/markdown/${testFileName}`, {
      content: initialContent
    });
    expect(createResponse.status).toBe(200);
    expect(createResponse.data.status).toBe('success');

    // Read the file content
    const readResponse = await axios.get(`${APILAMA_URL}/api/weblama/markdown/${testFileName}`);
    expect(readResponse.status).toBe(200);
    expect(readResponse.data.status).toBe('success');
    expect(readResponse.data.content).toBe(initialContent);

    // Update the file content
    const updateResponse = await axios.post(`${APILAMA_URL}/api/weblama/markdown/${testFileName}`, {
      content: updatedContent
    });
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.data.status).toBe('success');

    // Read the updated file content
    const readUpdatedResponse = await axios.get(`${APILAMA_URL}/api/weblama/markdown/${testFileName}`);
    expect(readUpdatedResponse.status).toBe(200);
    expect(readUpdatedResponse.data.status).toBe('success');
    expect(readUpdatedResponse.data.content).toBe(updatedContent);

    // Delete the file
    const deleteResponse = await axios.delete(`${APILAMA_URL}/api/weblama/markdown/${testFileName}`);
    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.data.status).toBe('success');

    // Verify the file is deleted
    try {
      await axios.get(`${APILAMA_URL}/api/weblama/markdown/${testFileName}`);
      // If we get here, the file wasn't deleted
      throw new Error('File was not deleted');
    } catch (error) {
      // We expect a 404 error
      expect(error.response.status).toBe(404);
    }
  });
});
