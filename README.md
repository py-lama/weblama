# WebLama

A command-line tool with syntax highlighting, Mermaid diagram support, automatic Python code execution and fixing, and Git integration.

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

**WebLama is a command-line tool, not a web server.**

To use WebLama, run one of the following commands:

```bash
weblama list           # List available files
weblama get <file>     # Get the content of a file
weblama models         # List available models
weblama query --help   # Query a model (see options)
```

Global options:
- `-v`, `--verbose`         Enable verbose output
- `--api-url <URL>`         Set the WebLama API URL
- `--no-color`              Disable colored output
- `--pybox-api-url <URL>`   Set PyBox API URL
- `--pyllm-api-url <URL>`   Set PyLLM API URL
- `--pylama-api-url <URL>`  Set PyLama API URL

**Do not use `--host` or `--port` with the `weblama` CLI.**
These options are not valid for CLI usage and will result in an error like:

```
weblama: error: argument command: invalid choice: '0.0.0.0' (choose from ...)
```

If you want to run a server, see the developer documentation for running the backend Flask app directly.

## Makefile Usage

You can use the included `Makefile` for common tasks:

- **Set up the project (creates a virtual environment and installs dependencies):**
  ```bash
  make setup
  ```

- **Start the Web UI on port 8081 (default):**
  ```bash
  make web
  ```
  This starts the WebLama web application. Open your browser at http://localhost:8081

- **Start the Web UI on a custom port:**
  ```bash
  make web PORT=8090
  ```
  This starts the app on port 8090. The command-line arguments are used to pass the port to the application.

- **Show CLI usage help:**
  ```bash
  make cli
  ```

- **Run tests:**
  ```bash
  make test
  ```

**Note:** The `weblama` CLI and the Web UI are separate. Use the Makefile to start the web server for browser access.

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

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
