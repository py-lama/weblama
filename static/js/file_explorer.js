/**
 * file_explorer.js - Handles the file system menu functionality
 * 
 * This file provides functions for:
 * - Loading markdown files from the server
 * - Displaying files in the sidebar
 * - Searching and filtering files
 * - Opening files for editing
 * - Creating new files
 */

// Store the current list of files
let markdownFiles = [];
let currentFile = null;
let lastSavedContent = '';

/**
 * Initialize the file explorer when the page loads
 */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize file explorer
    loadMarkdownFiles();
    
    // Set up event listeners
    document.getElementById('new-file-button').addEventListener('click', createNewFile);
    document.getElementById('file-search-input').addEventListener('input', filterFiles);
    
    // Listen for save events to auto-commit changes
    document.getElementById('save-button').addEventListener('click', () => {
        saveAndCommitChanges('Manual save');
    });
    
    // Connect execute button
    document.getElementById('execute-button').addEventListener('click', () => {
        // This will trigger the existing execute functionality in editor.js
        // We just need to make sure changes are committed after execution
        setTimeout(() => {
            if (hasUnsavedChanges()) {
                saveAndCommitChanges('Auto-commit after code execution');
            }
        }, 1000);
    });
    
    // Connect Git history and publish buttons
    document.getElementById('git-history-button').addEventListener('click', () => {
        // This will be handled by git_integration.js
        // Just make sure changes are committed first
        if (hasUnsavedChanges()) {
            saveAndCommitChanges('Auto-commit before viewing history');
        }
    });
    
    document.getElementById('git-publish-button').addEventListener('click', () => {
        // This will be handled by git_integration.js
        // Just make sure changes are committed first
        if (hasUnsavedChanges()) {
            saveAndCommitChanges('Auto-commit before publishing');
        }
    });
});

/**
 * Load all markdown files from the server
 */
async function loadMarkdownFiles() {
    try {
        const response = await fetch('/api/files');
        const data = await response.json();
        
        if (data.status === 'success') {
            markdownFiles = data.files;
            renderFileList(markdownFiles);
            
            // Load the first file if available
            if (markdownFiles.length > 0) {
                openFile(markdownFiles[0].path);
            }
        } else {
            showError('Failed to load files: ' + data.error);
        }
    } catch (error) {
        showError('Error loading files: ' + error.message);
    }
}

/**
 * Render the list of files in the sidebar
 * 
 * @param {Array} files - List of file objects with name and path properties
 */
function renderFileList(files) {
    const fileListElement = document.getElementById('markdown-files');
    
    // Clear the loading message
    fileListElement.innerHTML = '';
    
    if (files.length === 0) {
        fileListElement.innerHTML = '<div class="no-files">No markdown files found</div>';
        return;
    }
    
    // Create a file item for each file
    files.forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.dataset.path = file.path;
        
        // Add active class if this is the current file
        if (currentFile && currentFile === file.path) {
            fileItem.classList.add('active');
        }
        
        fileItem.innerHTML = `
            <span class="file-icon">📄</span>
            <div class="file-info">
                <span class="file-name">${file.name}</span>
                <span class="file-path">${file.path}</span>
            </div>
        `;
        
        fileItem.addEventListener('click', () => openFile(file.path));
        fileListElement.appendChild(fileItem);
    });
}

/**
 * Filter files based on search input
 */
function filterFiles() {
    const searchTerm = document.getElementById('file-search-input').value.toLowerCase();
    
    if (!searchTerm) {
        renderFileList(markdownFiles);
        return;
    }
    
    const filteredFiles = markdownFiles.filter(file => 
        file.name.toLowerCase().includes(searchTerm)
    );
    
    renderFileList(filteredFiles);
}

/**
 * Open a file for editing
 * 
 * @param {string} filePath - Path to the file to open
 */
async function openFile(filePath) {
    try {
        // First check if there are unsaved changes
        if (hasUnsavedChanges()) {
            const confirmOpen = confirm('You have unsaved changes. Do you want to save them before opening a new file?');
            if (confirmOpen) {
                await saveAndCommitChanges('Auto-save before opening new file');
            }
        }
        
        const response = await fetch(`/api/files/content?path=${encodeURIComponent(filePath)}`);
        const data = await response.json();
        
        if (data.success === true) {
            // Update the editor with the file content
            editor.setValue(data.content);
            
            // Store the content as the last saved version
            lastSavedContent = data.content;
            
            // Update the filename input
            document.getElementById('filename').value = data.name;
            
            // Update the current file
            currentFile = filePath;
            
            // Update the active file in the list
            const fileItems = document.querySelectorAll('.file-item');
            fileItems.forEach(item => {
                item.classList.remove('active');
                if (item.dataset.path === filePath) {
                    item.classList.add('active');
                }
            });
            
            // Update the preview
            if (window.updatePreview) {
                window.updatePreview();
            }
            
            // Automatically execute all Python code blocks
            setTimeout(() => {
                // First make sure the preview has rendered
                const executeButton = document.getElementById('execute-button');
                if (executeButton) {
                    executeButton.click();
                }
            }, 500);
        } else {
            showError('Failed to open file: ' + data.error);
        }
    } catch (error) {
        showError('Error opening file: ' + error.message);
    }
}

/**
 * Create a new markdown file
 */
async function createNewFile() {
    const fileName = prompt('Enter a name for the new file:', 'new-document.md');
    
    if (!fileName) return; // User cancelled
    
    // Add .md extension if not present
    const finalFileName = fileName.endsWith('.md') ? fileName : `${fileName}.md`;
    
    try {
        const response = await fetch('/api/files', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                path: finalFileName,
                content: '# New Document\n\nStart writing here...',
                commit_message: 'Create new file'
            })
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            // Reload the file list
            loadMarkdownFiles();
            
            // Open the new file
            setTimeout(() => {
                openFile(data.path);
            }, 500);
            
            showNotification('New file created successfully!', 'success');
        } else {
            showError('Failed to create file: ' + data.error);
        }
    } catch (error) {
        showError('Error creating file: ' + error.message);
    }
}

/**
 * Check if there are unsaved changes in the editor
 * 
 * @returns {boolean} True if there are unsaved changes
 */
function hasUnsavedChanges() {
    // This function depends on how you track changes in your editor
    // For CodeMirror, you might use editor.isClean() or similar
    return editor.getValue() !== lastSavedContent;
}

/**
 * Save the current file and commit changes to Git
 * 
 * @param {string} commitMessage - Message for the Git commit
 */
async function saveAndCommitChanges(commitMessage) {
    const content = editor.getValue();
    const filename = document.getElementById('filename').value;
    
    try {
        // Save the file and commit to Git in one operation
        const saveResponse = await fetch(`/api/files/${encodeURIComponent(filename)}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: content,
                commit_message: commitMessage || 'Update file'
            })
        });
        
        const saveData = await saveResponse.json();
        
        if (saveData.status === 'success') {
            // Update the last saved content
            lastSavedContent = content;
            
            // Show success message
            const messageElement = document.createElement('div');
            messageElement.className = 'success-message';
            messageElement.textContent = 'File saved and committed to Git';
            document.body.appendChild(messageElement);
            
            // Remove the message after 3 seconds
            setTimeout(() => {
                document.body.removeChild(messageElement);
            }, 3000);
            
            return true;
        } else {
            showError('Failed to save file: ' + saveData.error);
        }
    } catch (error) {
        showError('Error saving file: ' + error.message);
    }
    
    return false;
}

/**
 * Show a notification message
 * 
 * @param {string} message - The message to display
 * @param {string} type - The type of notification (success, error, info)
 */
function showNotification(message, type = 'info') {
    console.log(`${type.toUpperCase()}: ${message}`);
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add to the document
    const container = document.querySelector('.notification-container') || document.body;
    container.appendChild(notification);
    
    // Remove after a delay
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 3000);
}

/**
 * Show an error message
 * 
 * @param {string} message - The error message to display
 */
function showError(message) {
    console.error(message);
    showNotification(message, 'error');
}

// Make functions globally accessible
window.loadMarkdownFiles = loadMarkdownFiles;
window.openFile = openFile;
window.showNotification = showNotification;
window.showError = showError;
