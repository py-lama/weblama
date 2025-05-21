/**
 * API Client Module for WebLama
 * 
 * This module provides functions for interacting with the WebLama API.
 */

/**
 * Execute code via the API
 * 
 * @param {string} code - The code to execute
 * @returns {Promise<Object>} - The execution result
 */
async function executeCode(code) {
    try {
        const response = await fetch('/api/execute', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: code
            })
        });
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error executing code:', error);
        throw error;
    }
}

/**
 * Execute all code blocks in markdown content
 * 
 * @param {string} markdownContent - The markdown content containing code blocks
 * @returns {Promise<Object>} - The execution results
 */
async function executeMarkdown(markdownContent) {
    try {
        const response = await fetch('/api/execute', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                markdown: markdownContent 
            })
        });
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error executing markdown:', error);
        throw error;
    }
}

/**
 * Generate a new fix for code that still has errors
 * 
 * @param {string} code - The code from the previous fix attempt
 * @param {string} error - The error message from the previous fix attempt
 * @param {number} attempt - The current fix attempt number
 * @returns {Promise<Object>} - The new fixed code and execution result
 */
async function generateFix(code, error, attempt = 1) {
    try {
        const response = await fetch('/api/fix', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                code: code,
                error: error,
                attempt: attempt
            })
        });
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error generating fix:', error);
        throw error;
    }
}

/**
 * Save content to a file and commit it to Git
 * 
 * @param {string} content - The content to save
 * @param {string} filename - The name of the file to save
 * @param {string} message - The commit message
 * @returns {Promise<Object>} - The result of the save operation
 */
async function saveToGit(content, filename, message = 'Auto-commit: Updated file') {
    try {
        const response = await fetch('/api/git/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: content,
                filename: filename,
                message: message
            })
        });
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error saving to Git:', error);
        throw error;
    }
}

/**
 * Get the commit history for a file
 * 
 * @param {string} filename - The name of the file
 * @returns {Promise<Array>} - The commit history
 */
async function getGitHistory(filename) {
    try {
        const response = await fetch(`/api/git/history?filename=${encodeURIComponent(filename)}`);
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error getting Git history:', error);
        throw error;
    }
}

/**
 * Get the content of a file at a specific commit
 * 
 * @param {string} filename - The name of the file
 * @param {string} commitHash - The commit hash
 * @returns {Promise<Object>} - The file content
 */
async function getFileContentAtCommit(filename, commitHash) {
    try {
        const response = await fetch(`/api/git/content?filename=${encodeURIComponent(filename)}&commit=${encodeURIComponent(commitHash)}`);
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error getting file content at commit:', error);
        throw error;
    }
}

// Export all API functions
export {
    executeCode,
    executeMarkdown,
    generateFix,
    saveToGit,
    getGitHistory,
    getFileContentAtCommit
};
