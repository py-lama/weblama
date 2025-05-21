/**
 * CLI Wrapper for testing
 * 
 * This is a simplified version of the CLI script that we can use for testing.
 * It exposes the functions that the CLI script uses so we can test them directly
 * without having to execute the CLI script as a separate process.
 */

const axios = require('axios');

// Health check function
async function checkHealth(apiUrl) {
  try {
    const response = await axios.get(`${apiUrl}/api/weblama/health`);
    return {
      success: true,
      message: response.data.message,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      message: `Error: ${error.message}`,
      error
    };
  }
}

// List markdown files function
async function listFiles(apiUrl) {
  try {
    const response = await axios.get(`${apiUrl}/api/weblama/markdown`);
    return {
      success: true,
      files: response.data.files,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      message: `Error: ${error.message}`,
      error
    };
  }
}

// Start server function
function startServer(options = {}) {
  const { port = 9081, apiUrl = 'http://localhost:9080', open = false } = options;
  
  // In a real implementation, this would start a server
  // For testing, we just return the configuration
  return {
    success: true,
    port,
    apiUrl,
    open,
    message: `Server started on port ${port} with API URL ${apiUrl}`
  };
}

module.exports = {
  checkHealth,
  listFiles,
  startServer
};
