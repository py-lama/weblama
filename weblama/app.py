#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
WebLama - Web editor for Markdown with code execution and fixing

This module provides a Flask web application that allows users to edit Markdown files
with syntax highlighting for various code blocks, and automatically executes and fixes
Python code blocks using PyBox and PyLLM.
"""

import os
import sys
import logging
from pathlib import Path
from dotenv import load_dotenv
from flask import Flask, session

# Load environment variables from .env file
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
load_dotenv(env_path)

# Import custom logger
from weblama.logger import logger, init_app

# Add the parent directory to sys.path to import pylama modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# Import blueprints
from weblama.routes.ui_routes import ui_routes
from weblama.routes.file_routes import file_routes
from weblama.routes.git_routes import git_routes
from weblama.routes.api_routes import api_routes


def create_app(test_config=None):
    """Create and configure the Flask application.
    
    Args:
        test_config (dict, optional): Test configuration to override default config.
        
    Returns:
        Flask: The configured Flask application.
    """
    # Create and configure the app
    app = Flask(__name__, instance_relative_config=True)
    
    # Set default configuration
    app.config.from_mapping(
        SECRET_KEY=os.environ.get('SECRET_KEY', 'dev'),
        MARKDOWN_DIR=os.environ.get('MARKDOWN_DIR', os.path.join(os.path.dirname(os.path.dirname(__file__)), 'markdown')),
        DEBUG=os.environ.get('DEBUG', 'false').lower() == 'true',
    )
    
    # Override config with test config if provided
    if test_config is not None:
        app.config.update(test_config)
    
    # Initialize the logger
    init_app(app)
    
    # Create the markdown directory if it doesn't exist
    os.makedirs(app.config['MARKDOWN_DIR'], exist_ok=True)
    
    # Register blueprints
    app.register_blueprint(ui_routes)
    app.register_blueprint(file_routes)
    app.register_blueprint(git_routes)
    app.register_blueprint(api_routes)
    
    # Log app initialization
    logger.info(f"WebLama initialized with markdown directory: {app.config['MARKDOWN_DIR']}")
    logger.info(f"Debug mode: {app.config['DEBUG']}")
    
    return app


def main():
    """Run the Flask application.
    
    This function is the entry point for the application when run directly.
    """
    # Create the app
    app = create_app()
    
    # Run the app
    host = os.environ.get('HOST', '127.0.0.1')
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('DEBUG', 'false').lower() == 'true'
    
    app.run(host=host, port=port, debug=debug)


if __name__ == '__main__':
    main()

# Export the Flask app instance for testing and CLI
app = create_app()

# Re-export code utilities for tests and API
from weblama.core.code_execution import execute_code_with_pybox, fix_code_with_pyllm
from weblama.core.markdown_utils import extract_python_code_blocks
