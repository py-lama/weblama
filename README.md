# WebLama

A frontend web application for the PyLama ecosystem with syntax highlighting, Mermaid diagram support, and markdown rendering capabilities.

![WebLama.png](weblama.png)

## Features

- **Rich Markdown Editor**: Syntax highlighting for various languages including Python, JavaScript, SQL, and Java
- **Live Preview**: Real-time rendering of Markdown content with syntax highlighting
- **Mermaid Diagram Support**: Create and visualize diagrams using Mermaid syntax
- **Code Display**: Display code with syntax highlighting
- **Responsive Design**: Works on desktop and mobile devices
- **File Explorer**: Browse and manage markdown files
- **Integration with APILama**: Communicates with backend services through the APILama gateway

## Installation

### Using npm

```bash
# Clone the repository
git clone https://github.com/py-lama/py-lama.git
cd py-lama/weblama

# Install dependencies
npm install
```

### Using Docker

```bash
# Build the Docker image
docker build -t weblama .

# Run the container
docker run -p 8081:80 weblama
```

## Usage

**WebLama is a frontend web application that communicates with the APILama backend.**

To start the WebLama frontend server:

```bash
# Start using npm
npm start
```

This will start a web server on port 8081 by default. You can access the WebLama interface by opening your browser and navigating to:

```
http://localhost:8081
```

You can customize the port by setting the PORT environment variable:

```bash
# Start on a custom port
PORT=8090 npm start
```

### Environment Variables

- `PORT`: The port to run the web server on (default: 8081)
- `API_URL`: The URL of the APILama backend (default: http://localhost:8080)

You can set these variables in a `.env` file or pass them directly when starting the server.

## Makefile Usage

You can use the included `Makefile` for common tasks:

- **Set up the project (installs npm dependencies):**
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
  This starts the app on port 8090. The PORT environment variable is used to configure the server.

- **Build the static assets:**
  ```bash
  make build
  ```
  This creates a `dist` directory with all the static assets ready for deployment.

- **Run linting:**
  ```bash
  make lint
  ```

- **Run tests:**
  ```bash
  make test
  ```

**Note:** WebLama is now a frontend-only component that communicates with the APILama backend API gateway.

## Markdown Files

WebLama looks for markdown files in the `markdown` directory located at:

```
/home/tom/github/py-lama/weblama/markdown/
```

If you don't see any files when you first start WebLama, you may need to create some markdown files in this directory. Two sample files are included:

1. `welcome.md` - A basic introduction with a Python code example
2. `mermaid_example.md` - Examples of Mermaid diagrams

You can add your own markdown files to this directory, and they will appear in the WebLama interface.

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
