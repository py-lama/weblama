# Makefile for WebLama Frontend

.PHONY: help setup web dev build lint test

default: help

help:
	@echo "WebLama Frontend Makefile targets:"
	@echo "  setup      Install npm dependencies"
	@echo "  web        Start the WebLama web UI on port 8081 (default)"
	@echo "  web PORT=xxxx   Start the web UI on custom port"
	@echo "  dev        Start the development server with hot reloading"
	@echo "  build      Build the static assets for production"
	@echo "  lint       Run linting on JavaScript files"
	@echo "  test       Run tests"

# Default values
PORT ?= 8081
HOST ?= 127.0.0.1

# Install npm dependencies
setup:
	@echo "Installing npm dependencies..."
	@npm install

# Run the web server using http-server
web: setup
	@echo "Starting WebLama web server on port $(PORT)..."
	@PORT=$(PORT) npm start

# Run the development server with hot reloading
dev: setup
	@echo "Starting WebLama development server on port $(PORT)..."
	@PORT=$(PORT) npm run dev

# Build the static assets for production
build: setup
	@echo "Building WebLama static assets..."
	@npm run build

# Run linting on JavaScript files
lint: setup
	@echo "Running linting on JavaScript files..."
	@npm run lint

# Run tests
test: setup
	@echo "Running tests..."
	@npm test

# This is now a frontend-only component, no CLI or Python tests
