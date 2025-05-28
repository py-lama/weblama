#!/usr/bin/env python3

"""
WebLama LogLama Bridge

This module provides a bridge between the JavaScript WebLama application
and the Python LogLama logging system. It exposes a simple HTTP API
that the JavaScript application can use to log messages.
"""

import json
import os
import sys
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse
import threading

# Import logging configuration
from weblama.logging_config import init_logging, get_logger

# Initialize logging with LogLama
init_logging()

# Get a logger
logger = get_logger('bridge')


class LoggingRequestHandler(BaseHTTPRequestHandler):
    """
    HTTP request handler for logging API.
    
    This handler accepts POST requests to log messages at different levels.
    """
    
    def _set_response(self, status_code=200, content_type='application/json'):
        self.send_response(status_code)
        self.send_header('Content-type', content_type)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_OPTIONS(self):
        self._set_response()
    
    def do_GET(self):
        """Handle GET requests for health check."""
        if self.path == '/health':
            self._set_response()
            self.wfile.write(json.dumps({'status': 'ok'}).encode('utf-8'))
        else:
            self._set_response(404)
            self.wfile.write(json.dumps({'error': 'Not found'}).encode('utf-8'))
    
    def do_POST(self):
        """Handle POST requests for logging."""
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        try:
            data = json.loads(post_data.decode('utf-8'))
            level = data.get('level', 'info').lower()
            message = data.get('message', '')
            context = data.get('context', {})
            
            # Log the message with the appropriate level
            if level == 'debug':
                logger.debug(message, **context)
            elif level == 'info':
                logger.info(message, **context)
            elif level == 'warning':
                logger.warning(message, **context)
            elif level == 'error':
                logger.error(message, **context)
            elif level == 'critical':
                logger.critical(message, **context)
            else:
                logger.info(message, **context)
            
            self._set_response()
            self.wfile.write(json.dumps({'status': 'ok'}).encode('utf-8'))
        except json.JSONDecodeError:
            self._set_response(400)
            self.wfile.write(json.dumps({'error': 'Invalid JSON'}).encode('utf-8'))
        except Exception as e:
            logger.error(f"Error processing log request: {str(e)}")
            self._set_response(500)
            self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))


def start_logging_server(host='127.0.0.1', port=8085):
    """
    Start the logging server.
    
    Args:
        host (str): Host to bind to.
        port (int): Port to listen on.
    
    Returns:
        HTTPServer: The server instance.
    """
    server_address = (host, port)
    httpd = HTTPServer(server_address, LoggingRequestHandler)
    logger.info(f"Starting logging server on {host}:{port}")
    return httpd


def run_server_in_thread(host='127.0.0.1', port=8085):
    """
    Run the logging server in a separate thread.
    
    Args:
        host (str): Host to bind to.
        port (int): Port to listen on.
    
    Returns:
        threading.Thread: The thread running the server.
    """
    server = start_logging_server(host, port)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    logger.info(f"Logging server thread started")
    return thread, server


def main():
    """
    Main entry point for the logging bridge.
    """
    import argparse
    
    parser = argparse.ArgumentParser(description='WebLama LogLama Bridge')
    parser.add_argument('--host', default='127.0.0.1', help='Host to bind to')
    parser.add_argument('--port', type=int, default=8085, help='Port to listen on')
    args = parser.parse_args()
    
    try:
        server = start_logging_server(args.host, args.port)
        logger.info(f"Logging server started on {args.host}:{args.port}")
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("Shutting down logging server")
        server.shutdown()
    except Exception as e:
        logger.error(f"Error starting logging server: {str(e)}")
        sys.exit(1)


if __name__ == '__main__':
    main()
