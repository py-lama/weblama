# WebLama

A web-based Markdown editor with syntax highlighting, Mermaid diagram support, automatic Python code execution and fixing, and Git integration.

![WebLama.png](weblama.png)

## Features

- **Rich Markdown Editor**: Syntax highlighting for various languages including Python, JavaScript, SQL, and Java
- **Live Preview**: Real-time rendering of Markdown content with syntax highlighting
- **Mermaid Diagram Support**: Create and visualize diagrams using Mermaid syntax
- **Automatic Python Code Execution**: Python code blocks are automatically executed when rendered
- **Automatic Code Fixing**: Detect and fix syntax errors, missing imports, and logical errors in Python code blocks
- **Auto-Commit Fixed Code**: Changes from fixed code are automatically committed to Git with descriptive messages
- **Git Version Control**: Track changes to your Markdown files and Mermaid diagrams
- **Publishing Options**: Publish your repository to GitHub, GitLab, or Bitbucket

## Installation

```bash
# Clone the repository
git clone https://github.com/py-lama/py-lama.git
cd py-lama/weblama

# Install the package
pip install -e .
```

## Usage

### Starting the Web Server

```bash
# Start the WebLama server
weblama

# Specify host and port
weblama --host 0.0.0.0 --port 8080

# Enable debug mode
weblama --debug
```

Then open your browser and navigate to http://localhost:5000 (or the specified host/port).

### Using the Editor

1. **Creating and Editing Documents**
   - Write Markdown content in the editor panel on the left
   - See the rendered preview in real-time on the right
   - Use the toolbar buttons for common formatting options
   - Enter a filename in the top bar and click "Save" to save your document

2. **Working with Python Code Blocks**
   - Create Python code blocks using triple backticks and the python language identifier:
     ````
     ```python
     print("Hello, World!")
     ```
     ````
   - All Python code blocks are automatically executed when rendered
   - Results appear in the "Console" tab below each code block
   - If there are errors, fixed versions are automatically generated and applied
   - You can manually run code again by clicking the "Run" button

3. **Using the Git Integration**
   - All changes are automatically tracked in Git
   - Fixed code is automatically committed with descriptive messages
   - Click the "History" button to view the commit history for the current file
   - Use the "Publish" button to push your repository to GitHub, GitLab, or Bitbucket
   - You can compare different versions of your document from the history view

4. **Creating Mermaid Diagrams**
   - Use Mermaid syntax within code blocks to create diagrams:
     ````
     ```mermaid
     graph TD;
         A-->B;
         A-->C;
         B-->D;
         C-->D;
     ```
     ````
   - Diagrams are automatically rendered in the preview pane
   - Changes to diagrams are tracked in Git like any other content

## Dependencies

- **Flask**: Web framework for the server
- **PyBox**: Python code sandbox for safe execution
- **PyLLM**: AI-powered code fixing
- **CodeMirror**: Rich text editor with syntax highlighting
- **Marked**: Markdown parser
- **Highlight.js**: Syntax highlighting for the preview
- **Mermaid**: Diagram visualization

## How It Works

1. **Automatic Code Execution & Fixing**:
   - Python code blocks are automatically executed as soon as they appear in the preview
   - Syntax errors, runtime errors, and logical errors are automatically detected
   - Fixed code versions are automatically generated and applied
   - Results are displayed in a tabbed interface with the original code, console output, and fixed versions
   - Fixed tabs only appear when fixes are available, keeping the interface clean

2. **Auto-Commit System**:
   - Changes from fixed code are automatically committed to Git
   - Each commit includes a descriptive message indicating which code block was fixed
   - Visual notifications confirm when changes are committed
   - All changes are tracked in the Git history for easy reference

3. **Git Integration**:
   - Changes to Markdown files are automatically tracked in a Git repository
   - View file history and compare different versions of your documents
   - Restore previous versions when needed
   - Publish your repository to GitHub, GitLab, or Bitbucket

## Development

### Project Structure

```
weblama/
├── weblama/
│   ├── __init__.py
│   ├── app.py           # Flask application
│   ├── cli.py           # Command-line interface
│   ├── git_integration.py # Git functionality
│   ├── templates/       # HTML templates
│   │   └── index.html   # Main editor page
│   └── static/          # Static assets
│       ├── css/         # CSS styles
│       └── js/          # JavaScript files
│           ├── editor.js      # Editor functionality
│           └── git_integration.js # Git UI functionality
├── tests/               # Test suite
├── setup.py             # Package setup
└── README.md            # This file
```

### Running Tests

```bash
pytest tests/
```

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
