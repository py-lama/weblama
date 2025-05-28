# WebLama

## PyLama Ecosystem Navigation

| Project | Description | Links |
|---------|-------------|-------|
| **WebLama** | Web application generation | [GitHub](https://github.com/py-lama/weblama) · [Docs](https://py-lama.github.io/weblama/) |
| **GetLLM** | LLM model management and code generation | [GitHub](https://github.com/py-lama/getllm) · [PyPI](https://pypi.org/project/getllm/) · [Docs](https://py-lama.github.io/getllm/) |
| **DevLama** | Python code generation with Ollama | [GitHub](https://github.com/py-lama/devlama) · [Docs](https://py-lama.github.io/devlama/) |
| **LogLama** | Centralized logging and environment management | [GitHub](https://github.com/py-lama/loglama) · [PyPI](https://pypi.org/project/loglama/) · [Docs](https://py-lama.github.io/loglama/) |
| **APILama** | API service for code generation | [GitHub](https://github.com/py-lama/apilama) · [Docs](https://py-lama.github.io/apilama/) |
| **BEXY** | Sandbox for executing generated code | [GitHub](https://github.com/py-lama/bexy) · [Docs](https://py-lama.github.io/bexy/) |
| **JSLama** | JavaScript code generation | [GitHub](https://github.com/py-lama/jslama) · [NPM](https://www.npmjs.com/package/jslama) · [Docs](https://py-lama.github.io/jslama/) |
| **JSBox** | JavaScript sandbox for executing code | [GitHub](https://github.com/py-lama/jsbox) · [NPM](https://www.npmjs.com/package/jsbox) · [Docs](https://py-lama.github.io/jsbox/) |
| **SheLLama** | Shell command generation | [GitHub](https://github.com/py-lama/shellama) · [PyPI](https://pypi.org/project/shellama/) · [Docs](https://py-lama.github.io/shellama/) |

---

A web frontend for the PyLama ecosystem that provides a user interface for interacting with the various PyLama services. WebLama integrates with LogLama as the primary service for centralized logging, environment management, and service orchestration.

## Installation

```bash
# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install the package in development mode
pip install -e .  # This is important! Always install in development mode before starting
```

> **IMPORTANT**: Always run `pip install -e .` before starting the project to ensure all dependencies are properly installed and the package is available in development mode.

## Building and Running the Docker Container

To build the Docker image, run the following command from the project directory:

```bash
docker build -t weblama .
```

To run the container, mapping port 8084 on the host to port 80 in the container:

```bash
docker run -p 8084:80 weblama
```

Once the container is running, you can access the application at [http://localhost:8084](http://localhost:8084)

## Project Structure

- `server.js` - The main Node.js application file
- `package.json` - Node.js dependencies and project configuration
- `public/index.html` - The HTML file served by the application
- `Dockerfile` - Instructions for building the Docker image

## LogLama Integration

WebLama integrates with LogLama as the primary service in the PyLama ecosystem. This integration provides:

- **Centralized Environment Management**: Environment variables are loaded from the central `.env` file in the `devlama` directory
- **Dependency Management**: Dependencies are validated and installed by LogLama
- **Service Orchestration**: WebLama is started after all backend services by LogLama
- **Centralized Logging**: All WebLama operations are logged to the central LogLama system
- **Structured Logging**: Logs include component context for better filtering and analysis
- **Health Monitoring**: LogLama monitors WebLama service health and availability

## Using the Makefile

WebLama includes a Makefile to simplify common development tasks:

```bash
# Set up the project (creates a virtual environment and installs dependencies)
make setup

# Run the web server (default port 8081)
make web

# Run the web server on a custom port
make web PORT=8080

# Run tests
make test

# Clean up project (remove __pycache__, etc.)
make clean

# Show all available commands
make help
```
