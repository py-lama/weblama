#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
WebLama CLI - Command-line interface for WebLama

This module provides a command-line interface for starting the WebLama web application.
"""

import os
import sys
import argparse
from pathlib import Path

# Add the parent directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import WebLama app
from weblama.app import app


def main():
    """Main entry point for the WebLama CLI."""
    parser = argparse.ArgumentParser(description='WebLama - Web editor for Markdown with code execution')
    parser.add_argument('--host', type=str, default='127.0.0.1', help='Host to bind the server to')
    parser.add_argument('--port', type=int, default=5000, help='Port to bind the server to')
    parser.add_argument('--debug', action='store_true', help='Enable debug mode')
    
    args = parser.parse_args()
    
    print(f"Starting WebLama server at http://{args.host}:{args.port}")
    app.run(debug=args.debug, host=args.host, port=args.port)


if __name__ == '__main__':
    main()
