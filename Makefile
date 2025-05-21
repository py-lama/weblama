# Makefile for WebLama

.PHONY: help web cli test setup

default: help

help:
	@echo "WebLama Makefile targets:"
	@echo "  setup      Install dependencies"
	@echo "  web        Start the WebLama web UI on port 8081 (default)"
	@echo "  web PORT=xxxx   Start the web UI on custom port"
	@echo "  cli        Show CLI usage help"
	@echo "  test       Run tests"

setup:
	@echo "Installing dependencies..."
	pip install -r requirements.txt

web: setup
	@echo "Starting WebLama web server..."
	@export PORT=${PORT:-8081} && export HOST=${HOST:-127.0.0.1} && \
	python3 -m weblama.app

cli: setup
	@weblama --help

test: setup
	pytest tests/
