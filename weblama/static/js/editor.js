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
    
    // Render Mermaid diagrams
    try {
        mermaid.init(undefined, document.querySelectorAll('.mermaid'));
    } catch (error) {
        console.error('Mermaid rendering error:', error);
    }
}

// Initial preview update
updatePreview();

// Execute Python code blocks
document.getElementById('execute-btn').addEventListener('click', async () => {
    const markdownContent = editor.getValue();
    const resultsContainer = document.getElementById('results-container');
    const resultsElement = document.getElementById('results');
    
    // Show loading state
    resultsContainer.classList.remove('hidden');
    resultsElement.innerHTML = '<div class="loading">Executing code blocks...</div>';
    
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
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/\n/g, '<br>');
}
