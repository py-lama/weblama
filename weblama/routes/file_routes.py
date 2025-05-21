#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
File handling routes for WebLama

This module provides Flask routes for file operations like listing, reading, and creating files.
"""

import os
import json
from pathlib import Path
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from weblama.logger import logger, log_file_operation

# Create a blueprint for file routes
file_routes = Blueprint('file_routes', __name__)


@file_routes.route('/api/files', methods=['GET'])
def get_files():
    """Get a list of all markdown files.
    
    Returns:
        JSON response with a list of markdown files
    """
    log_file_operation('list', 'all_markdown_files', True)
    
    # Get the markdown directory from the app config
    markdown_dir = current_app.config['MARKDOWN_DIR']
    
    # Create the directory if it doesn't exist
    os.makedirs(markdown_dir, exist_ok=True)
    
    # Get all markdown files
    markdown_files = []
    for file_path in Path(markdown_dir).glob('*.md'):
        # Get file stats
        stats = file_path.stat()
        
        # Add file info to the list
        markdown_files.append({
            'name': file_path.name,
            'path': str(file_path),
            'size': stats.st_size,
            'modified': stats.st_mtime
        })
    
    # Sort files by modification time (newest first)
    markdown_files.sort(key=lambda x: x['modified'], reverse=True)
    
    # Return in the format expected by the frontend
    return jsonify({
        'status': 'success',
        'files': markdown_files
    })


@file_routes.route('/api/file', methods=['GET'])
def get_file_content():
    """Get the content of a markdown file.
    
    Returns:
        JSON response with the file content
    """
    # Get the filename from the query parameters
    filename = request.args.get('filename')
    if not filename:
        log_file_operation('get_file_content', error='No filename provided')
        return jsonify({'error': 'No filename provided'}), 400
    
    log_file_operation('get_file_content', filename=filename)
    
    # Get the markdown directory from the app config
    markdown_dir = current_app.config['MARKDOWN_DIR']
    
    # Create the full file path
    file_path = os.path.join(markdown_dir, secure_filename(filename))
    
    # Check if the file exists
    if not os.path.exists(file_path):
        log_file_operation('get_file_content', filename=filename, error='File not found')
        return jsonify({'error': 'File not found'}), 404
    
    # Read the file content
    try:
        with open(file_path, 'r') as file:
            content = file.read()
        
        return jsonify({'content': content})
    
    except Exception as e:
        log_file_operation('get_file_content', filename=filename, error=str(e))
        return jsonify({'error': f'Error reading file: {str(e)}'}), 500


@file_routes.route('/api/file', methods=['POST'])
def create_file():
    """Create a new markdown file.
    
    Returns:
        JSON response with the result
    """
    # Get the data from the request
    data = request.json
    if not data:
        log_file_operation('create_file', error='No JSON data provided')
        return jsonify({'error': 'No JSON data provided'}), 400
    
    # Get the filename and content
    filename = data.get('filename')
    content = data.get('content', '')
    
    if not filename:
        log_file_operation('create_file', error='No filename provided')
        return jsonify({'error': 'No filename provided'}), 400
    
    log_file_operation('create_file', filename=filename)
    
    # Get the markdown directory from the app config
    markdown_dir = current_app.config['MARKDOWN_DIR']
    
    # Create the directory if it doesn't exist
    os.makedirs(markdown_dir, exist_ok=True)
    
    # Create the full file path
    file_path = os.path.join(markdown_dir, secure_filename(filename))
    
    # Check if the file already exists
    if os.path.exists(file_path) and not data.get('overwrite', False):
        log_file_operation('create_file', filename=filename, error='File already exists')
        return jsonify({'error': 'File already exists'}), 409
    
    # Write the content to the file
    try:
        with open(file_path, 'w') as file:
            file.write(content)
        
        return jsonify({'success': True, 'message': 'File created successfully'})
    
    except Exception as e:
        log_file_operation('create_file', filename=filename, error=str(e))
        return jsonify({'error': f'Error creating file: {str(e)}'}), 500
