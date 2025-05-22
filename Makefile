# Makefile for WebLama Frontend

.PHONY: help setup web dev build lint test collect-logs docker-test docker-build docker-dev docker-clean

default: help

help:
	@echo "WebLama Frontend Makefile targets:"
	@echo "  setup          Install npm dependencies"
	@echo "  web            Start the WebLama web UI on port 8084 (default)"
	@echo "  web PORT=xxxx  Start the web UI on custom port"
	@echo "  web COLLECT=1  Start the web UI with log collection enabled"
	@echo "  collect-logs   Start the LogLama log collector for WebLama logs"
	@echo "  dev            Start the development server with hot reloading"
	@echo "  build          Build the static assets for production"
	@echo "  lint           Run linting on JavaScript files"
	@echo "  test           Run all tests"
	@echo "  test-cli       Run CLI tests"
	@echo "  test-api       Run API integration tests"
	@echo "  test-frontend  Run frontend tests"
	@echo "  test-integration Run integration tests"
	@echo "  test-e2e       Run end-to-end tests"
	@echo "  test-docker    Run tests with Docker services"
	@echo "  docker-build   Build Docker test images"
	@echo "  docker-test    Run tests in Docker"
	@echo "  docker-dev     Start development server in Docker"
	@echo "  docker-clean   Clean Docker test environment"

# Default values
PORT ?= 8084
HOST ?= 127.0.0.1
COLLECT ?= 0
COLLECT_INTERVAL ?= 300

# Install npm dependencies
setup:
	@echo "Installing npm dependencies..."
	@npm install

# Start the LogLama log collector for WebLama logs
collect-logs:
	@echo "Starting LogLama log collector for WebLama logs..."
	@python3 scripts/start_log_collector.py --interval $(COLLECT_INTERVAL) $(if $(filter 1,$(VERBOSE)),--verbose,)

# Run the web server using http-server
web: setup
	@echo "Starting WebLama web server on port $(PORT)..."
	@if [ "$(COLLECT)" = "1" ]; then \
		echo "Starting with log collection enabled"; \
		python3 scripts/start_log_collector.py --interval $(COLLECT_INTERVAL) $(if $(filter 1,$(VERBOSE)),--verbose,); \
	fi
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

# Run specific test suites
test-cli: setup
	@echo "Running CLI tests..."
	@npm run test:cli

test-api: setup
	@echo "Running API integration tests..."
	@npm run test:api

test-frontend: setup
	@echo "Running frontend tests..."
	@npm run test:frontend

test-integration: setup
	@echo "Running integration tests..."
	@npm run test:integration

test-e2e: setup
	@echo "Running end-to-end tests..."
	@node tests/test_e2e.js

# Run tests with Docker services
test-docker: setup
	@echo "Running tests with Docker services..."
	@./run_tests.sh

# Docker testing targets
docker-build:
	@echo "Building Docker test images..."
	@./run_docker_tests.sh --build

docker-test: docker-build
	@echo "Running tests in Docker..."
	@./run_docker_tests.sh --run-tests

docker-dev: docker-build
	@echo "Starting development server in Docker..."
	@./run_docker_tests.sh --dev

docker-clean:
	@echo "Cleaning Docker test environment..."
	@./run_docker_tests.sh --clean

# This is now a frontend-only component that communicates with APILama
