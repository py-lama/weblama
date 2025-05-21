# WebLama

A web-based Markdown editor with syntax highlighting, Mermaid diagram support, and automatic Python code execution and fixing.

## Features

- **Rich Markdown Editor**: Syntax highlighting for various languages including Python, JavaScript, SQL, and Java
- **Live Preview**: Real-time rendering of Markdown content with syntax highlighting
- **Mermaid Diagram Support**: Create and visualize diagrams using Mermaid syntax
- **Python Code Execution**: Execute Python code blocks directly from the editor
- **Automatic Code Fixing**: Detect and fix syntax errors, missing imports, and logical errors in Python code blocks
- **Sandboxed Execution**: Safely execute Python code using PyBox
- **AI-Powered Fixes**: Leverage PyLLM to generate fixes for code issues

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

1. **Code Extraction**: Python code blocks are extracted from the Markdown content
2. **Execution**: Each code block is executed in a sandboxed environment using PyBox
3. **Error Detection**: Syntax errors, runtime errors, and logical errors are detected
4. **Code Fixing**: Issues are fixed using a combination of rule-based fixes and PyLLM
5. **Result Display**: Execution results and fixed code are displayed to the user
6. **Markdown Update**: The original Markdown is updated with the fixed code blocks

## Development

### Project Structure

```
weblama/
├── weblama/
│   ├── __init__.py
│   ├── app.py           # Flask application
│   ├── cli.py           # Command-line interface
│   ├── templates/       # HTML templates
│   │   └── index.html   # Main editor page
│   └── static/          # Static assets
│       ├── css/         # CSS styles
│       └── js/          # JavaScript files
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
