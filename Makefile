# Makefile for WebLama

.PHONY: help web cli test setup venv

default: help

help:
	@echo "WebLama Makefile targets:"
	@echo "  setup      Install dependencies"
	@echo "  web        Start the WebLama web UI on port 8081 (default)"
	@echo "  web PORT=xxxx   Start the web UI on custom port"
	@echo "  cli        Show CLI usage help"
	@echo "  test       Run tests"

# Default values
PORT ?= 8081
HOST ?= 127.0.0.1

# Create virtual environment if it doesn't exist
venv:
	@test -d venv || python3 -m venv venv

# Install dependencies in the virtual environment
setup: venv
	@echo "Installing dependencies..."
	@. venv/bin/activate && pip install -r requirements.txt

# Run the web server using the virtual environment
web: setup
	@echo "Starting WebLama web server on port $(PORT)..."
	@. venv/bin/activate && python -m weblama.app --port $(PORT) --host $(HOST)

# Run the CLI using the virtual environment
cli: setup
	@. venv/bin/activate && python -m weblama_cli --help

# Run tests using the virtual environment
test: setup
	@. venv/bin/activate && pytest tests/
