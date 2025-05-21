# Stage 1: Build the static assets
FROM node:16-alpine as build

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the static files
COPY static/ ./static/

# Create dist directory
RUN mkdir -p dist

# Copy static files to dist directory
RUN cp -r static/* dist/

# Stage 2: Serve the static assets with nginx
FROM nginx:alpine

# Copy the built assets from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy the nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose the web server port
EXPOSE 80

# Command to run the web server
CMD ["nginx", "-g", "daemon off;"]

# Note: This assumes that the WebLama frontend is built with a modern JavaScript
# framework like React, Vue, or Angular. If it's still using the Flask-based
# approach, you'll need to modify this Dockerfile accordingly.
