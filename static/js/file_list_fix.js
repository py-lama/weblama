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
        
        // Fetch the file list from the API
        console.log('Fetching files from:', `${window.CONFIG.API_URL}/api/files`);
            const response = await fetch(`${window.CONFIG.API_URL}/api/files`);
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
                    const fileItem = document.createElement('div');
                    fileItem.className = 'file-item';
                    fileItem.dataset.path = file.path;
                
                    // Add active class if this is the current file
                    if (window.currentFile && window.currentFile === file.path) {
                        fileItem.classList.add('active');
                    }
                    
                    fileItem.innerHTML = `
                        <span class="file-icon">📄</span>
                        <div class="file-info">
                            <span class="file-name">${file.name}</span>
                            <span class="file-path">${file.path}</span>
                        </div>
                    `;
                    
                    // Add click event to open the file
                    fileItem.addEventListener('click', () => {
                        console.log('Clicked file:', file.path);
                        openFileDirect(file.path);
                    });
                    
                    fileListElement.appendChild(fileItem);
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
        
        // Fetch the file content from the API
        // Extract just the filename from the path
        const filename = filePath.split('/').pop();
        const response = await fetch(`${window.CONFIG.API_URL}/api/file?filename=${encodeURIComponent(filename)}`);
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

// Add a function to reload the file list
window.reloadFileList = loadFileListDirect;

// Log that the script has loaded
console.log('File list fix script loaded');
