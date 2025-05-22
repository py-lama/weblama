// WebLama - Markdown Editor with Code Execution

// Global variables
let currentFile = null;
let lastSavedContent = '';

// Global functions
window.updatePreview = function() {
    const content = window.editor.getValue();
    const previewElement = document.getElementById('preview');
    if (previewElement) {
        // Convert markdown to HTML
        previewElement.innerHTML = marked.parse(content);
        
        // Initialize mermaid diagrams
        if (window.mermaid) {
            window.mermaid.init(undefined, document.querySelectorAll('.language-mermaid'));
        }
        
        // Apply syntax highlighting to code blocks
        document.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightBlock(block);
        });
    }
};

// Initialize CodeMirror editor
window.editor = CodeMirror.fromTextArea(document.getElementById('editor'), {
    mode: 'markdown',
    theme: 'monokai',
    lineNumbers: true,
    lineWrapping: true,
    matchBrackets: true,
    autoCloseBrackets: true,
    indentUnit: 4,
    tabSize: 4,
    indentWithTabs: false,
    extraKeys: {
        'Tab': function(cm) {
            cm.replaceSelection('    ', 'end');
        }
    }
});

// Set initial content with example
const initialContent = `# WebLama Markdown Editor

## Mermaid Diagram Example

\`\`\`mermaid
graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> E[Fix Issue]
    E --> B
    C --> F[End]
\`\`\`

## Python Code Examples

### Example 1: Hello World

\`\`\`python
# A simple Hello World program
print("Hello, World!")
\`\`\`

### Example 2: File Operations with Syntax Error

\`\`\`python
# File operations with a syntax error
def write_to_file(filename, content)
    with open(filename, 'w') as file:
        file.write(content)
    print(f"Content written to {filename}")

write_to_file("example.txt", "Hello, this is a test!")
\`\`\`

### Example 3: Finding the Largest Number (Logical Error)

\`\`\`python
# A function to find the largest number in a list
def find_largest(numbers):
    if not numbers:
        return None
    
    largest = numbers[0]
    for num in numbers:
        # There's a logical error in this line
        if num < largest:
            largest = num
    
    return largest

# Test the function
numbers = [5, 10, 3, 8, 15]
result = find_largest(numbers)
print(f"The largest number is: {result}")
\`\`\`
`;

// Set the initial content if the editor is empty
if (!editor.getValue()) {
    editor.setValue(initialContent);
}

// Update preview when editor changes
editor.on('change', () => {
    updatePreview(editor);
});

// Initial preview update
updatePreview(editor);

// Execute all Python code blocks
document.getElementById('execute-button').addEventListener('click', async () => {
    const markdownContent = editor.getValue();
    await executeAllCodeBlocks(markdownContent);
});

// Show notification function
window.showNotification = function(message, type = 'info') {
    console.log(`Notification: ${message} (${type})`);
    // You could implement a proper notification system here
    alert(message);
};

// Execute all Python code blocks
async function executeAllCodeBlocks(markdownContent) {
    try {
        const response = await fetch(`${window.CONFIG.API_URL}/api/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: markdownContent
            })
        });
        
        const data = await response.json();
        
        if (data.results) {
            const resultsElement = document.getElementById('results');
            if (resultsElement) {
                resultsElement.innerHTML = '';
                
                data.results.forEach(result => {
                    const resultItem = document.createElement('div');
                    resultItem.className = `result-item ${result.success ? 'success' : 'error'}`;
                    
                    resultItem.innerHTML = `
                        <div class="result-code">${result.code}</div>
                        <div class="result-output">${result.output}</div>
                    `;
                    
                    resultsElement.appendChild(resultItem);
                });
                
                // Show the results container
                document.getElementById('results-container').classList.remove('hidden');
            }
            
            showNotification('Code executed successfully', 'success');
        } else {
            showNotification(`Error: ${data.error}`, 'error');
        }
    } catch (error) {
        showNotification(`Error executing code: ${error.message}`, 'error');
    }
}

// Save markdown content
document.getElementById('save-button').addEventListener('click', async () => {
    const markdownContent = editor.getValue();
    const filename = document.getElementById('filename').value.trim() || 'document.md';
    
    try {
        const response = await fetch(`${window.CONFIG.API_URL}/api/file`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                filename: filename,
                content: markdownContent
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('File saved successfully', 'success');
        } else {
            showNotification(`Error: ${data.error}`, 'error');
        }
    } catch (error) {
        showNotification(`Error: ${error.message}`, 'error');
    }
});

// Load file list
async function loadFileList() {
    try {
        const response = await fetch(`${window.CONFIG.API_URL}/api/files`);
        const files = await response.json();
        
        const fileList = document.getElementById('file-list');
        fileList.innerHTML = '';
        
        files.forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.textContent = file.name;
            fileItem.onclick = () => loadFile(file.name);
            fileList.appendChild(fileItem);
        });
    } catch (error) {
        showNotification(`Error loading files: ${error.message}`, 'error');
    }
}

// Load a file
async function loadFile(filename) {
    try {
        const response = await fetch(`${window.CONFIG.API_URL}/api/file?filename=${encodeURIComponent(filename)}`);
        const data = await response.json();
        
        if (data.content) {
            editor.setValue(data.content);
            document.getElementById('filename').value = filename;
            showNotification(`Loaded ${filename}`, 'success');
        } else {
            showNotification(`Error: ${data.error}`, 'error');
        }
    } catch (error) {
        showNotification(`Error loading file: ${error.message}`, 'error');
    }
}

// Load file list on page load
loadFileList();

// Refresh file list button
// No refresh button in current HTML

// New file button
document.getElementById('new-file-button').addEventListener('click', () => {
    editor.setValue('');
    document.getElementById('filename').value = '';
});

// Make global functions available for event handlers
window.executeCodeBlock = executeCodeBlock;
window.applyFixedCode = applyFixedCode;
window.switchTab = switchTab;
window.loadFile = loadFile;
