# WebLama

A simple web application running in a Docker container using Node.js and Express.

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
