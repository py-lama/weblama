# WebLama

A web-based Markdown editor with syntax highlighting, Mermaid diagram support, automatic Python code execution and fixing, and Git integration.

![WebLama.png](weblama.png)

## Features

- **Rich Markdown Editor**: Syntax highlighting for various languages including Python, JavaScript, SQL, and Java
- **Live Preview**: Real-time rendering of Markdown content with syntax highlighting
- **Mermaid Diagram Support**: Create and visualize diagrams using Mermaid syntax
- **Python Code Execution**: Execute Python code blocks directly from the editor
- **Automatic Code Fixing**: Detect and fix syntax errors, missing imports, and logical errors in Python code blocks
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

1. Write Markdown content in the editor panel
2. See the rendered preview in real-time
3. Click "Execute Python Code Blocks" to run and fix Python code
4. Review execution results and apply fixes
5. Save your document using the "Save" button

## Dependencies

- **Flask**: Web framework for the server
- **PyBox**: Python code sandbox for safe execution
- **PyLLM**: AI-powered code fixing
- **CodeMirror**: Rich text editor with syntax highlighting
- **Marked**: Markdown parser
- **Highlight.js**: Syntax highlighting for the preview
- **Mermaid**: Diagram visualization

## How It Works

1. **Code Execution & Fixing**:
   - Python code blocks are executed directly in the preview pane
   - Syntax errors, runtime errors, and logical errors are automatically detected and fixed
   - Results are displayed in a tabbed interface with the original code, console output, and fixed versions

2. **Git Integration**:
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
