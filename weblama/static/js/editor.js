// WebLama - Markdown Editor with Code Execution

// Initialize CodeMirror editor
const editor = CodeMirror.fromTextArea(document.getElementById('editor'), {
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

### Example 3: Function with Logic Error

\`\`\`python
# A function to find the largest number in a list
def find_largest(numbers):
    if not numbers:
        return None
    
    largest = numbers[0]
    for num in numbers:
        # Logic error: should be '>' instead of '<'
        if num < largest:
            largest = num
    
    return largest

# Test the function
numbers = [5, 10, 3, 8, 15]
result = find_largest(numbers)
print(f"The largest number is: {result}")
\`\`\`

### Example 4: API Request with Missing Import

\`\`\`python
# API request example with missing import

def get_data_from_api(url):
    response = requests.get(url)
    if response.status_code == 200:
        return response.json()
    else:
        return None

api_url = "https://jsonplaceholder.typicode.com/posts/1"
data = get_data_from_api(api_url)
if data:
    print(f"Title: {data['title']}")
    print(f"Body: {data['body']}")
else:
    print("Failed to fetch data")
\`\`\`
`;

editor.setValue(initialContent);

// Update preview when editor content changes
editor.on('change', updatePreview);

// Initialize Mermaid
mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
    flowchart: { curve: 'basis' }
});

// Store execution history for each code block
const codeBlockHistory = {};

// Update preview function
function updatePreview() {
    const markdownContent = editor.getValue();
    const previewElement = document.getElementById('preview');
    
    // Convert markdown to HTML using marked
    previewElement.innerHTML = marked.parse(markdownContent);
    
    // Apply syntax highlighting to code blocks
    document.querySelectorAll('#preview pre code').forEach((block) => {
        hljs.highlightElement(block);
    });
    
    // Convert Python code blocks to tabbed interfaces
    convertPythonCodeBlocks();
    
    // Render Mermaid diagrams
    try {
        mermaid.init(undefined, document.querySelectorAll('.mermaid'));
    } catch (error) {
        console.error('Mermaid rendering error:', error);
    }
}

// Convert Python code blocks to tabbed interfaces
function convertPythonCodeBlocks() {
    let blockIndex = 0;
    document.querySelectorAll('#preview pre code.language-python').forEach((codeBlock) => {
        const preElement = codeBlock.parentElement;
        const codeContent = codeBlock.textContent;
        
        // Create a unique ID for this code block
        const blockId = `python-block-${blockIndex}`;
        
        // Create the tabbed interface container
        const container = document.createElement('div');
        container.className = 'code-block-container';
        container.dataset.blockId = blockId;
        
        // Create the tabs
        const tabs = document.createElement('div');
        tabs.className = 'code-block-tabs';
        tabs.innerHTML = `
            <div class="code-block-tab active" data-tab="code" onclick="switchTab('${blockId}', 'code')">Code</div>
            <div class="code-block-tab" data-tab="console" onclick="switchTab('${blockId}', 'console')">Console</div>
            <button class="execute-button" onclick="executeCodeBlock('${blockId}')">Run</button>
        `;
        
        // Create the content panels
        const codePanel = document.createElement('div');
        codePanel.className = 'code-block-content active';
        codePanel.dataset.tab = 'code';
        codePanel.innerHTML = `<pre><code class="language-python">${escapeHtml(codeContent)}</code></pre>`;
        
        const consolePanel = document.createElement('div');
        consolePanel.className = 'code-block-content';
        consolePanel.dataset.tab = 'console';
        consolePanel.innerHTML = `
            <div class="code-block-output">Executing code...</div>
            <div class="code-block-history"></div>
        `;
        
        // Add the panels to the container
        container.appendChild(tabs);
        container.appendChild(codePanel);
        container.appendChild(consolePanel);
        
        // Replace the original pre element with the tabbed interface
        preElement.parentNode.replaceChild(container, preElement);
        
        // Initialize history for this block if not exists
        if (!codeBlockHistory[blockId]) {
            codeBlockHistory[blockId] = [];
        }
        
        // Apply syntax highlighting to the code in the code panel
        hljs.highlightElement(codePanel.querySelector('code'));
        
        // Schedule automatic execution after a short delay to ensure the UI is ready
        setTimeout(() => {
            executeCodeBlock(blockId);
        }, 100 * blockIndex); // Stagger execution to avoid overwhelming the server
        
        blockIndex++;
    });
}

// Switch between tabs
function switchTab(blockId, tabName) {
    const container = document.querySelector(`.code-block-container[data-block-id="${blockId}"]`);
    
    // Update active tab
    container.querySelectorAll('.code-block-tab').forEach(tab => {
        if (tab.dataset.tab === tabName) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // Update active content panel
    container.querySelectorAll('.code-block-content').forEach(panel => {
        if (panel.dataset.tab === tabName) {
            panel.classList.add('active');
        } else {
            panel.classList.remove('active');
        }
    });
}

// Execute a specific code block
async function executeCodeBlock(blockId) {
    const container = document.querySelector(`.code-block-container[data-block-id="${blockId}"]`);
    const codePanel = container.querySelector('.code-block-content[data-tab="code"]');
    const consolePanel = container.querySelector('.code-block-content[data-tab="console"]');
    const outputElement = consolePanel.querySelector('.code-block-output');
    const historyElement = consolePanel.querySelector('.code-block-history');
    
    // Get the code content
    const codeContent = codePanel.querySelector('code').textContent;
    
    // Show loading state
    outputElement.innerHTML = 'Executing code...';
    switchTab(blockId, 'console');
    
    try {
        // Send the code to the server for execution
        const response = await fetch('/api/execute', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ markdown: `\`\`\`python\n${codeContent}\n\`\`\`` })
        });
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        
        const data = await response.json();
        const result = data.results[0]; // We only sent one code block
        
        // Add to history
        const timestamp = new Date().toLocaleTimeString();
        codeBlockHistory[blockId].unshift({
            timestamp,
            success: result.success,
            output: result.success ? result.output : result.error,
            fixed_code: result.fixed_code
        });
        
        // Update history display
        updateHistoryDisplay(blockId, historyElement);
        
        if (result.success) {
            // Successful execution
            outputElement.innerHTML = escapeHtml(result.output) || 'No output';
        } else {
            // Failed execution
            outputElement.innerHTML = `<div class="code-block-error">${escapeHtml(result.error)}</div>`;
            
            // Add fixed code tabs if available
            if (result.fixed_code) {
                // Check if the fixed1 tab already exists
                let tabElement = container.querySelector('.code-block-tab[data-tab="fixed1"]');
                let panelElement = container.querySelector('.code-block-content[data-tab="fixed1"]');
                
                // Create the tab and panel if they don't exist
                if (!tabElement) {
                    // Add the tab
                    tabElement = document.createElement('div');
                    tabElement.className = 'code-block-tab';
                    tabElement.dataset.tab = 'fixed1';
                    tabElement.textContent = 'Fixed v1';
                    tabElement.onclick = function() { switchTab(blockId, 'fixed1'); };
                    
                    // Insert tab before the Run button
                    const executeButton = container.querySelector('.execute-button');
                    container.querySelector('.code-block-tabs').insertBefore(tabElement, executeButton);
                    
                    // Create the panel
                    panelElement = document.createElement('div');
                    panelElement.className = 'code-block-content';
                    panelElement.dataset.tab = 'fixed1';
                    container.appendChild(panelElement);
                }
                
                // Update the panel content
                panelElement.innerHTML = `
                    <pre><code class="language-python">${escapeHtml(result.fixed_code)}</code></pre>
                    <button class="execute-button" onclick="applyFixedCode('${blockId}', 'fixed1')">Apply Fix</button>
                `;
                // Apply syntax highlighting
                const codeElement = panelElement.querySelector('code');
                hljs.highlightElement(codeElement);
                // Ensure proper formatting
                codeElement.style.whiteSpace = 'pre';
                
                // Auto-apply the fixed code after a short delay
                setTimeout(() => {
                    applyFixedCode(blockId, 'fixed1');
                }, 500);
            }
            
            // Add alternative fixed version if available
            if (result.fixed_code_alt) {
                // Check if the fixed2 tab already exists
                let tabElement = container.querySelector('.code-block-tab[data-tab="fixed2"]');
                let panelElement = container.querySelector('.code-block-content[data-tab="fixed2"]');
                
                // Create the tab and panel if they don't exist
                if (!tabElement) {
                    // Add the tab
                    tabElement = document.createElement('div');
                    tabElement.className = 'code-block-tab';
                    tabElement.dataset.tab = 'fixed2';
                    tabElement.textContent = 'Fixed v2';
                    tabElement.onclick = function() { switchTab(blockId, 'fixed2'); };
                    
                    // Insert tab before the Run button
                    const executeButton = container.querySelector('.execute-button');
                    container.querySelector('.code-block-tabs').insertBefore(tabElement, executeButton);
                    
                    // Create the panel
                    panelElement = document.createElement('div');
                    panelElement.className = 'code-block-content';
                    panelElement.dataset.tab = 'fixed2';
                    container.appendChild(panelElement);
                }
                
                // Update the panel content
                panelElement.innerHTML = `
                    <pre><code class="language-python">${escapeHtml(result.fixed_code_alt)}</code></pre>
                    <button class="execute-button" onclick="applyFixedCode('${blockId}', 'fixed2')">Apply Fix</button>
                `;
                // Apply syntax highlighting
                const codeElement = panelElement.querySelector('code');
                hljs.highlightElement(codeElement);
                // Ensure proper formatting
                codeElement.style.whiteSpace = 'pre';
            }
        }
        
    } catch (error) {
        console.error('Error executing code:', error);
        outputElement.innerHTML = `<div class="code-block-error">${error.message}</div>`;
    }
}

// Update history display
function updateHistoryDisplay(blockId, historyElement) {
    const history = codeBlockHistory[blockId];
    
    if (history.length === 0) {
        historyElement.innerHTML = '<div class="no-history">No execution history yet.</div>';
        return;
    }
    
    let historyHtml = '<h4>Execution History</h4>';
    
    history.forEach((item, index) => {
        historyHtml += `
            <div class="history-item ${item.success ? 'success' : 'error'}">
                <div class="history-timestamp">${item.timestamp}</div>
                <div class="history-output">${escapeHtml(item.output)}</div>
            </div>
        `;
        
        // Limit history display to last 5 executions
        if (index >= 4) return;
    });
    
    historyElement.innerHTML = historyHtml;
}

// Apply fixed code to the original code block and auto-commit
function applyFixedCode(blockId, fixType) {
    const container = document.querySelector(`.code-block-container[data-block-id="${blockId}"]`);
    const fixedPanel = container.querySelector(`.code-block-content[data-tab="${fixType}"]`);
    const codePanel = container.querySelector('.code-block-content[data-tab="code"]');
    
    // Get the fixed code
    const fixedCode = fixedPanel.querySelector('code').textContent;
    
    // Update the original code block
    codePanel.innerHTML = `<pre><code class="language-python">${escapeHtml(fixedCode)}</code></pre>`;
    hljs.highlightElement(codePanel.querySelector('code'));
    
    // Switch to the code tab
    switchTab(blockId, 'code');
    
    // Update the editor content to reflect the changes
    updateEditorFromPreview();
    
    // Auto-commit the changes to Git
    saveAndCommitChanges(`Auto-fixed Python code block #${blockId}`);
    
    // Show a notification
    showNotification('Fixed code applied and committed successfully!', 'success');
}

// Function to show notifications
function showNotification(message, type = 'info') {
    // Create notification element if it doesn't exist
    let notificationContainer = document.getElementById('notification-container');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        document.body.appendChild(notificationContainer);
    }
    
    // Create the notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 3000);
}

// Function to save and commit changes to Git
function saveAndCommitChanges(commitMessage) {
    // First save the current content
    saveMarkdown();
    
    // Then commit the changes to Git
    const currentFilename = document.getElementById('filename').value;
    
    fetch('/api/git/save', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            content: editor.getValue(),
            filename: currentFilename,
            message: commitMessage
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Changes committed to Git:', data);
        } else {
            console.error('Failed to commit changes:', data.error);
        }
    })
    .catch(error => {
        console.error('Error committing changes:', error);
    });
}

// Update the editor content with fixed code
function updateEditorWithFixedCode(blockId, fixedCode) {
    const markdownContent = editor.getValue();
    const codeBlocks = extractPythonCodeBlocks(markdownContent);
    
    // Find the index of the code block to update
    const blockIndex = parseInt(blockId.split('-').pop());
    
    if (blockIndex < codeBlocks.length) {
        const block = codeBlocks[blockIndex];
        const startPos = block.startPos;
        const endPos = block.endPos;
        
        // Replace the code block in the editor
        const newContent = markdownContent.substring(0, startPos) + 
                          '```python\n' + fixedCode + '\n```' + 
                          markdownContent.substring(endPos);
        
        editor.setValue(newContent);
    }
}

// Extract Python code blocks from markdown content
function extractPythonCodeBlocks(markdownContent) {
    const pattern = /```python\n([\s\S]*?)\n```/g;
    const blocks = [];
    let match;
    
    while ((match = pattern.exec(markdownContent)) !== null) {
        blocks.push({
            code: match[1],
            startPos: match.index,
            endPos: match.index + match[0].length
        });
    }
    
    return blocks;
}

// Initial preview update
updatePreview();

// Execute all Python code blocks
document.getElementById('execute-btn').addEventListener('click', async () => {
    const markdownContent = editor.getValue();
    const resultsContainer = document.getElementById('results-container');
    const resultsElement = document.getElementById('results');
    
    // Show loading state
    resultsContainer.classList.remove('hidden');
    resultsElement.innerHTML = '<div class="loading">Executing all code blocks...</div>';
    
    try {
        // Send markdown content to server for execution
        const response = await fetch('/api/execute', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ markdown: markdownContent })
        });
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Update editor with fixed code if available
        if (data.updated_markdown && data.updated_markdown !== markdownContent) {
            editor.setValue(data.updated_markdown);
        }
        
        // Display execution results
        displayResults(data.results);
        
    } catch (error) {
        console.error('Error executing code:', error);
        resultsElement.innerHTML = `<div class="result-block result-error">
            <div class="result-header">Error</div>
            <div class="result-content">${error.message}</div>
        </div>`;
    }
});

// Display execution results
function displayResults(results) {
    const resultsElement = document.getElementById('results');
    resultsElement.innerHTML = '';
    
    if (results.length === 0) {
        resultsElement.innerHTML = '<div class="no-results">No Python code blocks found.</div>';
        return;
    }
    
    results.forEach((result, index) => {
        const resultBlock = document.createElement('div');
        resultBlock.className = `result-block ${result.success ? 'result-success' : 'result-error'}`;
        
        let resultContent = '';
        
        if (result.success) {
            // Successful execution
            resultContent = `
                <div class="result-header">Block ${index + 1}: Execution Successful</div>
                <div class="result-content">${escapeHtml(result.output || 'No output')}</div>
            `;
        } else {
            // Failed execution
            resultContent = `
                <div class="result-header">Block ${index + 1}: Execution Failed</div>
                <div class="result-content">${escapeHtml(result.error || 'Unknown error')}</div>
            `;
            
            // Add fixed code if available
            if (result.fixed_code) {
                resultContent += `
                    <div class="result-fixed">
                        <div class="result-header">Fixed Code</div>
                        <div class="result-content">${escapeHtml(result.fixed_code)}</div>
                    </div>
                `;
                
                // Add fixed output or error
                if (result.fixed_output) {
                    resultContent += `
                        <div class="result-success">
                            <div class="result-header">Fixed Code Output</div>
                            <div class="result-content">${escapeHtml(result.fixed_output)}</div>
                        </div>
                    `;
                } else if (result.fixed_error) {
                    resultContent += `
                        <div class="result-error">
                            <div class="result-header">Fixed Code Error</div>
                            <div class="result-content">${escapeHtml(result.fixed_error)}</div>
                        </div>
                    `;
                }
            }
        }
        
        resultBlock.innerHTML = resultContent;
        resultsElement.appendChild(resultBlock);
    });
}

// Save markdown content
document.getElementById('save-btn').addEventListener('click', async () => {
    const markdownContent = editor.getValue();
    const filename = document.getElementById('filename').value.trim() || 'document.md';
    
    try {
        const response = await fetch('/api/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ markdown: markdownContent, filename })
        });
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            alert(data.message);
        } else {
            throw new Error(data.message);
        }
        
    } catch (error) {
        console.error('Error saving file:', error);
        alert(`Error saving file: ${error.message}`);
    }
});

// Helper function to escape HTML
function escapeHtml(text) {
    if (!text) return '';
    // Preserve newlines but escape HTML
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    // Note: We're no longer replacing newlines with <br> tags
    // because we're using white-space: pre in CSS
}
