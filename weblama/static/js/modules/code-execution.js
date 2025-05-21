/**
 * Code Execution Module for WebLama
 * 
 * This module provides functions for executing and fixing code.
 */

// Import API client functions
import { executeCode, executeMarkdown, generateFix, saveToGit } from './api.js';

// Import UI components
import { 
    switchTab, 
    displayConsoleOutput, 
    createFixTab, 
    showNotification 
} from './ui-components.js';

/**
 * Execute a Python code block
 * 
 * @param {string} blockId - The unique identifier for the code block
 */
async function executeCodeBlock(blockId) {
    // Get the code element
    const codeElement = document.getElementById(`code-${blockId}`);
    if (!codeElement) return;
    
    // Get the code display
    const codeDisplay = codeElement.querySelector('.code-display');
    if (!codeDisplay) return;
    
    // Get the code
    const code = codeDisplay.textContent;
    
    // Get the console element
    const consoleElement = document.getElementById(`console-${blockId}`);
    if (!consoleElement) return;
    
    // Show loading state
    consoleElement.innerHTML = '<div class="console-output"><div class="loading">Executing code...</div></div>';
    
    // Switch to the console tab
    switchTab(blockId, 'console');
    
    try {
        // Execute the code
        const response = await executeCode(code);
        
        // Get the result for this block
        const result = response.results ? response.results.find(r => r.block_id.toString() === blockId) : response;
        
        // Display the result
        displayConsoleOutput(result, blockId);
    } catch (error) {
        // Display the error
        consoleElement.innerHTML = `<div class="console-output"><div class="stderr error">Error: ${error.message}</div></div>`;
    }
}

/**
 * Execute all Python code blocks in the markdown content
 * 
 * @param {string} markdownContent - The markdown content containing code blocks
 */
async function executeAllCodeBlocks(markdownContent) {
    // Get the results container
    const resultsContainer = document.getElementById('results-container');
    const resultsElement = document.getElementById('results');
    
    if (!resultsContainer || !resultsElement) return;
    
    // Show loading state
    resultsContainer.classList.remove('hidden');
    resultsElement.innerHTML = '<div class="loading">Executing all code blocks...</div>';
    
    try {
        // Send markdown content to server for execution
        const response = await executeMarkdown(markdownContent);
        
        if (!response.results) {
            throw new Error('Invalid response from server');
        }
        
        // Display the results
        displayResults(response.results);
        
        // Update the editor content if there are fixed code blocks
        if (response.updated_content && response.updated_content !== markdownContent) {
            // Update the editor content
            editor.setValue(response.updated_content);
            
            // Show notification
            showNotification('Code blocks have been fixed and updated', 'success');
        }
    } catch (error) {
        // Display the error
        resultsElement.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    }
}

/**
 * Apply fixed code to the original code block
 * 
 * @param {string} blockId - The unique identifier for the code block
 * @param {string} fixType - The type of fix to apply (e.g., 'fixed1' or 'fixed2')
 * @param {number} fixAttempt - The current fix attempt number
 */
async function applyFixedCode(blockId, fixType, fixAttempt = 1) {
    // Get the code element
    const codeElement = document.getElementById(`code-${blockId}`);
    if (!codeElement) return;
    
    // Get the fix element
    const fixElement = document.getElementById(`${fixType}-${blockId}`);
    if (!fixElement) return;
    
    // Get the code display elements
    const codeDisplay = codeElement.querySelector('.code-display');
    const fixDisplay = fixElement.querySelector('.code-display');
    
    if (!codeDisplay || !fixDisplay) return;
    
    // Get the fixed code
    const fixedCode = fixDisplay.textContent;
    
    // Switch to the console tab to show execution results
    switchTab(blockId, 'console');
    
    try {
        // Execute the fixed code
        const response = await executeCode(fixedCode);
        
        // Get the result for this block
        const result = response.results ? response.results.find(r => r.block_id.toString() === blockId) : response;
        
        // If the fixed code works, update the original code
        if (result.success) {
            // Update the original code
            codeDisplay.textContent = fixedCode;
            
            // Remove all fix tabs
            const container = document.getElementById(`container-${blockId}`);
            if (container) {
                const fixTabs = container.querySelectorAll('.fix-tab');
                fixTabs.forEach(tab => tab.remove());
                
                const fixPanes = container.querySelectorAll('.tab-pane[id^="fixed"]');
                fixPanes.forEach(pane => pane.remove());
            }
            
            // Switch to the code tab
            switchTab(blockId, 'code');
            
            // Show notification
            showNotification('Fixed code applied successfully', 'success');
            
            // Update the editor with the fixed code
            updateEditorWithFixedCode(blockId, fixedCode);
            
            // Auto-commit the changes
            autoCommitChanges(blockId, fixType, fixAttempt);
        } else {
            // Display the result
            displayConsoleOutput(result, blockId);
            
            // If the fixed code still has errors, try to generate a new fix
            if (fixAttempt < 3) {
                await generateNewFixVersion(blockId, fixedCode, result.error_message || result.stderr, fixAttempt + 1);
            }
        }
    } catch (error) {
        // Get the console element
        const consoleElement = document.getElementById(`console-${blockId}`);
        if (consoleElement) {
            // Display the error
            consoleElement.innerHTML = `<div class="console-output"><div class="stderr error">Error: ${error.message}</div></div>`;
        }
    }
}

/**
 * Generate a new fix version based on the previous fix attempt
 * 
 * @param {string} blockId - The unique identifier for the code block
 * @param {string} previousCode - The code from the previous fix attempt
 * @param {string} error - The error message from the previous fix attempt
 * @param {number} fixAttempt - The current fix attempt number
 */
async function generateNewFixVersion(blockId, previousCode, error, fixAttempt) {
    // Get the container
    const container = document.getElementById(`container-${blockId}`);
    if (!container) return;
    
    // Get the console element
    const consoleElement = document.getElementById(`console-${blockId}`);
    if (!consoleElement) return;
    
    // Show loading state
    consoleElement.innerHTML += '<div class="loading">Generating new fix version...</div>';
    
    try {
        // Generate a new fix
        const result = await generateFix(previousCode, error, fixAttempt);
        
        if (!result.fixed_code) {
            throw new Error('Failed to generate a new fix');
        }
        
        // Create a tab for the new fix
        const fixType = `fixed${fixAttempt}`;
        createFixTab(blockId, result.fixed_code, fixType);
        
        // Switch to the new fix tab
        switchTab(blockId, fixType);
        
        // Show notification
        showNotification(`New fix version ${fixAttempt} generated`, 'info');
        
        // If the fix works, apply it automatically
        if (result.success) {
            await applyFixedCode(blockId, fixType, fixAttempt);
        }
    } catch (error) {
        // Display the error
        consoleElement.innerHTML += `<div class="stderr error">Error generating new fix: ${error.message}</div>`;
    }
}

/**
 * Auto-commit changes to Git
 * 
 * @param {string} blockId - The unique identifier for the code block
 * @param {string} fixType - The type of fix that was applied
 * @param {number} fixAttempt - The fix attempt number
 */
async function autoCommitChanges(blockId, fixType, fixAttempt) {
    // Get the filename
    const filename = document.getElementById('filename').value.trim() || 'document.md';
    
    // Get the editor content
    const markdownContent = editor.getValue();
    
    // Create a commit message
    const commitMessage = `Auto-fix: Applied ${fixType} to code block ${blockId} (attempt ${fixAttempt})`;
    
    try {
        // Save to Git
        await saveToGit(markdownContent, filename, commitMessage);
        
        // Show notification
        showNotification(`Changes committed to Git: ${commitMessage}`, 'success');
    } catch (error) {
        // Show error notification
        showNotification(`Error committing changes: ${error.message}`, 'error');
    }
}

/**
 * Update the editor content with fixed code
 * 
 * @param {string} blockId - The unique identifier for the code block
 * @param {string} fixedCode - The fixed code
 */
function updateEditorWithFixedCode(blockId, fixedCode) {
    // Get the editor content
    const markdownContent = editor.getValue();
    
    // Extract all Python code blocks
    const codeBlocks = extractPythonCodeBlocks(markdownContent);
    
    // Find the block to update
    const blockIndex = parseInt(blockId, 10);
    if (blockIndex >= 0 && blockIndex < codeBlocks.length) {
        // Get the block position
        const [_, start, end] = codeBlocks[blockIndex];
        
        // Update the content
        const newContent = markdownContent.substring(0, start) + 
                          '```python\n' + fixedCode + '\n```' + 
                          markdownContent.substring(end);
        
        // Update the editor
        editor.setValue(newContent);
    }
}

/**
 * Extract Python code blocks from markdown content
 * 
 * @param {string} markdownContent - The markdown content
 * @returns {Array} - Array of [code, start, end] tuples
 */
function extractPythonCodeBlocks(markdownContent) {
    const codeBlocks = [];
    const regex = /```python\n([\s\S]*?)\n```/g;
    
    let match;
    while ((match = regex.exec(markdownContent)) !== null) {
        codeBlocks.push([match[1], match.index, match.index + match[0].length]);
    }
    
    return codeBlocks;
}

/**
 * Display execution results for all code blocks
 * 
 * @param {Array} results - The execution results
 */
function displayResults(results) {
    // Get the results element
    const resultsElement = document.getElementById('results');
    if (!resultsElement) return;
    
    // Clear the results
    resultsElement.innerHTML = '';
    
    // Display the results
    results.forEach(result => {
        // Create a result container
        const resultContainer = document.createElement('div');
        resultContainer.className = 'result-container';
        
        // Create a header
        const header = document.createElement('div');
        header.className = 'result-header';
        header.textContent = `Block ${result.block_id + 1}: ${result.success ? 'Success' : 'Error'}`;
        resultContainer.appendChild(header);
        
        // Create the content
        const content = document.createElement('div');
        content.className = 'result-content';
        
        if (result.success) {
            // Display stdout
            if (result.stdout) {
                const stdoutElement = document.createElement('div');
                stdoutElement.className = 'stdout';
                stdoutElement.innerHTML = escapeHtml(result.stdout).replace(/\n/g, '<br>');
                content.appendChild(stdoutElement);
            }
            
            // Display stderr (warnings)
            if (result.stderr) {
                const stderrElement = document.createElement('div');
                stderrElement.className = 'stderr warning';
                stderrElement.innerHTML = escapeHtml(result.stderr).replace(/\n/g, '<br>');
                content.appendChild(stderrElement);
            }
        } else {
            // Display error
            const errorElement = document.createElement('div');
            errorElement.className = 'stderr error';
            errorElement.innerHTML = escapeHtml(result.error_message || result.stderr).replace(/\n/g, '<br>');
            content.appendChild(errorElement);
            
            // If there's a fixed code, display a message
            if (result.fixed_code) {
                const fixedElement = document.createElement('div');
                fixedElement.className = 'fixed-code-message';
                fixedElement.textContent = 'A fixed version of the code is available. The code has been updated.';
                content.appendChild(fixedElement);
            }
        }
        
        resultContainer.appendChild(content);
        resultsElement.appendChild(resultContainer);
    });
}

// Export all code execution functions
export {
    executeCodeBlock,
    executeAllCodeBlocks,
    applyFixedCode,
    generateNewFixVersion,
    updateEditorWithFixedCode,
    extractPythonCodeBlocks,
    displayResults
};
