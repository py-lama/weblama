/**
 * Frontend Wrapper for testing
 * 
 * This is a simplified version of the frontend code that we can use for testing.
 * It exposes the functions that the frontend code uses so we can test them directly.
 */

const axios = require('axios');

// Load files function
async function loadFiles(apiUrl) {
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

// Load file content function
async function loadFileContent(apiUrl, filename) {
  try {
    // Extract just the filename from the path if a full path is provided
    const extractedFilename = filename.split('/').pop();
    
    const response = await axios.get(`${apiUrl}/api/weblama/markdown/${extractedFilename}`);
    return {
      success: true,
      content: response.data.content,
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

// Save file function
async function saveFile(apiUrl, filename, content) {
  try {
    // Extract just the filename from the path if a full path is provided
    const extractedFilename = filename.split('/').pop();
    
    const response = await axios.post(`${apiUrl}/api/weblama/markdown/${extractedFilename}`, { content });
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

module.exports = {
  loadFiles,
  loadFileContent,
  saveFile
};
