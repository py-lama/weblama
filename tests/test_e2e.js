/**
 * WebLama End-to-End Tests
 * 
 * This file contains end-to-end tests for the WebLama ecosystem.
 * It tests the complete workflow from the WebLama frontend through
 * the APILama gateway to the backend services.
 */

const axios = require('axios');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Base URLs for the services
const WEBLAMA_URL = 'http://localhost:9081';
const APILAMA_URL = 'http://localhost:9080';

// Skip these tests if the services aren't running
const skipIfServicesNotRunning = async () => {
  try {
    await axios.get(`${APILAMA_URL}/api/weblama/health`, { timeout: 2000 });
    console.log('APILama service is running. Proceeding with E2E tests.');
    return false; // Don't skip tests
  } catch (error) {
    console.warn('APILama service is not running. Skipping E2E tests.');
    console.warn('To run these tests, make sure the Docker services are running:');
    console.warn('  cd .. && ./start-devlama.sh docker up');
    return true; // Skip tests
  }
};

describe('WebLama End-to-End Tests', () => {
  let shouldSkip = false;
  const testFileName = `test_e2e_${Date.now()}.md`;
  
  beforeAll(async () => {
    shouldSkip = await skipIfServicesNotRunning();
  });
  
  afterAll(async () => {
    // Clean up any test files created during the tests
    if (!shouldSkip) {
      try {
        await axios.delete(`${APILAMA_URL}/api/weblama/markdown/${testFileName}`);
      } catch (error) {
        // Ignore errors during cleanup
      }
    }
  });

  test('Complete workflow: CLI health check, create file, view file, update file, delete file', async () => {
    if (shouldSkip) {
      return;
    }
    
    // Step 1: Check APILama health using the CLI
    console.log('Step 1: Checking APILama health using the CLI...');
    const healthOutput = execSync(`node ${path.join(__dirname, '../bin/weblama-cli.js')} health --api-url ${APILAMA_URL}`).toString();
    expect(healthOutput).toContain('WebLama API is healthy');
    
    // Step 2: List markdown files using the CLI
    console.log('Step 2: Listing markdown files using the CLI...');
    const initialListOutput = execSync(`node ${path.join(__dirname, '../bin/weblama-cli.js')} list --api-url ${APILAMA_URL}`).toString();
    const initialFileCount = initialListOutput.split('\n').filter(line => line.trim().length > 0).length;
    
    // Step 3: Create a new markdown file through the API
    console.log('Step 3: Creating a new markdown file through the API...');
    const createContent = '# E2E Test File\n\nThis file was created during end-to-end testing.';
    await axios.post(`${APILAMA_URL}/api/weblama/markdown/${testFileName}`, {
      content: createContent
    });
    
    // Step 4: Verify the file appears in the list
    console.log('Step 4: Verifying the file appears in the list...');
    const updatedListOutput = execSync(`node ${path.join(__dirname, '../bin/weblama-cli.js')} list --api-url ${APILAMA_URL}`).toString();
    expect(updatedListOutput).toContain(testFileName);
    const updatedFileCount = updatedListOutput.split('\n').filter(line => line.trim().length > 0).length;
    expect(updatedFileCount).toBeGreaterThan(initialFileCount);
    
    // Step 5: Read the file content through the API
    console.log('Step 5: Reading the file content through the API...');
    const readResponse = await axios.get(`${APILAMA_URL}/api/weblama/markdown/${testFileName}`);
    expect(readResponse.data.status).toBe('success');
    expect(readResponse.data.content).toBe(createContent);
    
    // Step 6: Update the file content through the API
    console.log('Step 6: Updating the file content through the API...');
    const updateContent = '# Updated E2E Test File\n\nThis file was updated during end-to-end testing.';
    const updateResponse = await axios.post(`${APILAMA_URL}/api/weblama/markdown/${testFileName}`, {
      content: updateContent
    });
    expect(updateResponse.data.status).toBe('success');
    
    // Step 7: Verify the file content was updated
    console.log('Step 7: Verifying the file content was updated...');
    const readUpdatedResponse = await axios.get(`${APILAMA_URL}/api/weblama/markdown/${testFileName}`);
    expect(readUpdatedResponse.data.status).toBe('success');
    expect(readUpdatedResponse.data.content).toBe(updateContent);
    
    // Step 8: Delete the file through the API
    console.log('Step 8: Deleting the file through the API...');
    const deleteResponse = await axios.delete(`${APILAMA_URL}/api/weblama/markdown/${testFileName}`);
    expect(deleteResponse.data.status).toBe('success');
    
    // Step 9: Verify the file is no longer in the list
    console.log('Step 9: Verifying the file is no longer in the list...');
    const finalListOutput = execSync(`node ${path.join(__dirname, '../bin/weblama-cli.js')} list --api-url ${APILAMA_URL}`).toString();
    expect(finalListOutput).not.toContain(testFileName);
    const finalFileCount = finalListOutput.split('\n').filter(line => line.trim().length > 0).length;
    expect(finalFileCount).toBe(initialFileCount);
  }, 30000); // Increase timeout for this test

  test('WebLama frontend can access APILama endpoints', async () => {
    if (shouldSkip) {
      return;
    }
    
    // Test direct API access from the frontend
    const healthResponse = await axios.get(`${APILAMA_URL}/api/weblama/health`);
    expect(healthResponse.data.status).toBe('success');
    expect(healthResponse.data.message).toBe('WebLama API is healthy');
    
    // Test file listing endpoint
    const listResponse = await axios.get(`${APILAMA_URL}/api/weblama/markdown`);
    expect(listResponse.data.status).toBe('success');
    expect(Array.isArray(listResponse.data.files)).toBe(true);
    
    // Test that sample files exist (from previous work)
    const fileNames = listResponse.data.files.map(file => file.name);
    const hasSampleFiles = fileNames.some(name => 
      name === 'welcome.md' || name === 'mermaid_example.md'
    );
    
    // If sample files don't exist, this test will be skipped but not fail
    if (!hasSampleFiles) {
      console.warn('Sample markdown files (welcome.md, mermaid_example.md) not found. Skipping file content test.');
      return;
    }
    
    // Test file content endpoint with one of the sample files
    const sampleFileName = fileNames.find(name => 
      name === 'welcome.md' || name === 'mermaid_example.md'
    );
    
    const contentResponse = await axios.get(`${APILAMA_URL}/api/weblama/markdown/${sampleFileName}`);
    expect(contentResponse.data.status).toBe('success');
    expect(contentResponse.data.content).toBeTruthy();
    expect(contentResponse.data.content.length).toBeGreaterThan(0);
  });
});
