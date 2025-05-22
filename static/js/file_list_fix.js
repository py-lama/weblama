// Simple fix for the file list loading issue

// Function to load the file list directly
async function loadFileListDirect() {
    try {
        console.log('Loading file list directly...');
        
        // Get the file list element
        const fileListElement = document.getElementById('markdown-files');
        
        // Make sure we found the element
        if (!fileListElement) {
            console.error('Could not find file list element');
            return;
        }
        
        // Get API URL using the same function as file_explorer.js
        const apiUrl = typeof getApiUrl === 'function' ? getApiUrl() : 
                      (window.CONFIG && window.CONFIG.API_URL ? window.CONFIG.API_URL : 
                       (window.API_URL || 'http://localhost:8080'));
        
        // Fetch the file list from the API
        console.log('Fetching files from:', `${apiUrl}/api/files`);
        
        const response = await fetch(`${apiUrl}/api/files`);
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);
        
        // Check if we got a successful response
        if (data.status === 'success' && Array.isArray(data.files)) {
            // Store the files globally
            window.markdownFiles = data.files;
        
            // Clear the loading message
            fileListElement.innerHTML = '';
            
            // Check if we have any files
            if (data.files.length === 0) {
                fileListElement.innerHTML = '<div class="no-files">No markdown files found</div>';
                return;
            }
            
            // Create a file item for each file
            data.files.forEach(file => {
                createFileItem(fileListElement, file);
            });
        
            console.log('File list loaded successfully');
            
            // Load the first file if no file is currently open
            if (data.files.length > 0 && !window.currentFile) {
                openFileDirect(data.files[0].path);
            }
        } else {
            console.error('Failed to load files:', data.error || 'Unknown error');
            fileListElement.innerHTML = '<div class="error">Failed to load files</div>';
        }
    } catch (error) {
        console.error('Error loading files:', error);
        document.getElementById('markdown-files').innerHTML = 
            `<div class="error">Error loading files: ${error.message}</div>`;
    }
}

// Function to open a file directly
async function openFileDirect(filePath) {
    try {
        console.log('Opening file:', filePath);
        
        // Get API URL using the same function as above
        const apiUrl = typeof getApiUrl === 'function' ? getApiUrl() : 
                      (window.CONFIG && window.CONFIG.API_URL ? window.CONFIG.API_URL : 
                       (window.API_URL || 'http://localhost:8080'));
        
        // Fetch the file content from the API
        // Extract just the filename from the path
        const filename = filePath.split('/').pop();
        const response = await fetch(`${apiUrl}/api/file?filename=${encodeURIComponent(filename)}`);
        const data = await response.json();
        
        console.log('File content response:', data);
        
        if (data.content) {
            // Make sure the editor is available
            if (window.editor) {
                // Update the editor with the file content
                window.editor.setValue(data.content);
                
                // Store the content as the last saved version
                window.lastSavedContent = data.content;
                
                // Update the filename input
                const filenameInput = document.getElementById('filename');
                if (filenameInput) {
                    // Extract just the filename from the path
                    const filename = filePath.split('/').pop();
                    filenameInput.value = filename;
                }
                
                // Update the current file
                window.currentFile = filePath;
                
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
                
                console.log('File opened successfully');
            } else {
                console.error('Editor not available');
                alert('Editor not available. Please refresh the page.');
            }
        } else {
            console.error('Failed to open file:', data.error || 'Unknown error');
            alert('Failed to open file: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error opening file:', error);
        alert('Error opening file: ' + error.message);
    }
}

// Load the file list when the page is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, waiting for configuration to load...');
    
    // Wait for configuration to load before making API requests
    // Check every 100ms if the configuration has been loaded
    const configCheckInterval = setInterval(() => {
        if (window.CONFIG && window.CONFIG.API_URL) {
            clearInterval(configCheckInterval);
            console.log('Configuration loaded, API URL:', window.CONFIG.API_URL);
            loadFileListDirect();
        }
    }, 100);
    
    // Also add event listener for the new file button
    const newFileButton = document.getElementById('new-file-button');
    if (newFileButton) {
        newFileButton.addEventListener('click', () => {
            const fileName = prompt('Enter a name for the new file:', 'new-document.md');
            if (fileName) {
                // Add .md extension if not present
                const finalFileName = fileName.endsWith('.md') ? fileName : `${fileName}.md`;
                
                // Create the new file
                fetch(`${window.CONFIG.API_URL}/api/files`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        path: finalFileName,
                        content: '# New Document\n\nStart writing here...',
                        commit_message: 'Create new file'
                    })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'success') {
                        // Reload the file list
                        loadFileListDirect();
                        
                        // Open the new file
                        setTimeout(() => {
                            openFileDirect(data.path);
                        }, 500);
                        
                        alert('New file created successfully!');
                    } else {
                        alert('Failed to create file: ' + (data.error || 'Unknown error'));
                    }
                })
                .catch(error => {
                    alert('Error creating file: ' + error.message);
                });
            }
        });
    }
});

/**
 * Delete a file using the API
 * @param {string} filename - The name of the file to delete
 * @param {string} filePath - The full path of the file to delete
 */
async function deleteFile(filename, filePath) {
    console.log('deleteFile called with:', { filename, filePath });
    
    // Make sure we have a filename
    if (!filename) {
        console.error('No filename provided to deleteFile function');
        return;
    }
    
    // Extract just the filename if the full path was passed
    const actualFilename = filename.includes('/') ? filename.split('/').pop() : filename;
    console.log('Extracted filename:', actualFilename);
    
    // Ask for confirmation before deleting
    if (!confirm(`Are you sure you want to delete the file '${actualFilename}'?`)) {
        console.log('User cancelled file deletion');
        return;
    }
    
    try {
        console.log('Deleting file:', actualFilename);
        console.log('API URL:', window.CONFIG.API_URL);
        
        // Construct the API URL
        const apiUrl = `${window.CONFIG.API_URL}/api/file?filename=${encodeURIComponent(actualFilename)}`;
        console.log('Delete API URL:', apiUrl);
        
        // Call the API to delete the file
        const response = await fetch(apiUrl, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        // Check if the response is ok
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        
        // Parse the response
        const data = await response.json();
        console.log('Delete response:', data);
        
        if (data.status === 'success') {
            // Show success message
            console.log(`File '${actualFilename}' deleted successfully`);
            
            // If the deleted file was the current file, clear the editor
            if (window.currentFile && window.currentFile.includes(actualFilename)) {
                document.getElementById('markdown-editor').value = '';
                window.currentFile = null;
                console.log('Cleared editor because current file was deleted');
            }
            
            // Reload the file list
            console.log('Reloading file list after deletion');
            loadFileListDirect();
        } else {
            // Show error message
            const errorMessage = data.message || 'Unknown error';
            console.error(`Error deleting file: ${errorMessage}`);
            alert(`Error deleting file: ${errorMessage}`);
        }
    } catch (error) {
        console.error('Error deleting file:', error);
        alert(`Error deleting file: ${error.message}`);
    }
}

/**
 * Create a file item element and add it to the parent element
 * @param {HTMLElement} parentElement - The parent element to add the file item to
 * @param {Object} file - The file object with name and path properties
 */
function createFileItem(parentElement, file) {
    // Create the file item element
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    fileItem.dataset.path = file.path;
    fileItem.dataset.name = file.name;
    
    // Add active class if this is the current file
    if (window.currentFile && window.currentFile === file.path) {
        fileItem.classList.add('active');
    }
    
    // Create the file icon
    const fileIcon = document.createElement('span');
    fileIcon.className = 'file-icon';
    fileIcon.textContent = '📄';
    fileItem.appendChild(fileIcon);
    
    // Create the file info container
    const fileInfo = document.createElement('div');
    fileInfo.className = 'file-info';
    
    // Create the file name element
    const fileName = document.createElement('span');
    fileName.className = 'file-name';
    fileName.textContent = file.name;
    fileInfo.appendChild(fileName);
    
    // Create the file path element
    const filePath = document.createElement('span');
    filePath.className = 'file-path';
    filePath.textContent = file.path;
    fileInfo.appendChild(filePath);
    
    // Add the file info to the file item
    fileItem.appendChild(fileInfo);
    
    // Create the file actions container
    const fileActions = document.createElement('div');
    fileActions.className = 'file-actions';
    
    // Create the delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-file-btn';
    deleteBtn.title = 'Delete file';
    deleteBtn.textContent = '🗑️';
    
    // Add click event to the delete button
    deleteBtn.onclick = function(event) {
        event.stopPropagation();  // Prevent the file from opening
        console.log('Delete button clicked for file:', file.name);
        console.log('File path:', file.path);
        console.log('Event target:', event.target);
        console.log('Event currentTarget:', event.currentTarget);
        deleteFile(file.name, file.path);
    };
    
    // Add the delete button to the file actions
    fileActions.appendChild(deleteBtn);
    
    // Add the file actions to the file item
    fileItem.appendChild(fileActions);
    
    // Add click event to the file item to open the file
    fileItem.onclick = function(event) {
        // Don't open the file if the delete button was clicked
        if (event.target.closest('.delete-file-btn')) {
            return;
        }
        
        console.log('Clicked file:', file.path);
        openFileDirect(file.path);
    };
    
    // Add the file item to the parent element
    parentElement.appendChild(fileItem);
}

// Add a function to reload the file list
window.reloadFileList = loadFileListDirect;

// Log that the script has loaded
console.log('File list fix script loaded');
