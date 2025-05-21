# WebLama

A simple web application running in a Docker container using Node.js and Express.

## Building and Running the Docker Container

To build the Docker image, run the following command from the project directory:

```bash
docker build -t weblama .
```

To run the container, mapping port 8081 on the host to port 80 in the container:

```bash
docker run -p 8081:80 weblama
```

Once the container is running, you can access the application at [http://localhost:8081](http://localhost:8081)

## Project Structure

- `server.js` - The main Node.js application file
- `package.json` - Node.js dependencies and project configuration
- `public/index.html` - The HTML file served by the application
- `Dockerfile` - Instructions for building the Docker image
