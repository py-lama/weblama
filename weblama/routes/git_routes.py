#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Git integration routes for WebLama

This module provides Flask routes for Git operations like commit history and publishing.
"""

import os
import json
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from weblama.logger import logger, log_git_operation
from weblama.git_integration import GitIntegration

# Create a blueprint for Git routes
git_routes = Blueprint('git_routes', __name__)


@git_routes.route('/api/git/save', methods=['POST'])
def save_to_git():
    """Save content to a file and commit it to Git with a custom message.
    
    This endpoint supports the auto-commit functionality for fixed code.
    When a Python code block is fixed, the changes are automatically committed
    to Git with a descriptive message.
    
    Request JSON parameters:
        content (str): The content to save to the file
        filename (str): The name of the file to save
        message (str, optional): Custom commit message. Defaults to 'Auto-commit: Updated file'
    
    Returns:
        JSON response with success status and message
    """
    log_git_operation('save_to_git')
    
    data = request.json
    if not data:
        log_git_operation('save_to_git', error='No JSON data provided')
        return jsonify({'error': 'No JSON data provided'}), 400
    
    # Get the content, filename, and commit message
    content = data.get('content', '')
    filename = data.get('filename', '')
    message = data.get('message', 'Auto-commit: Updated file')
    
    if not content or not filename:
        log_git_operation('save_to_git', error='Missing content or filename')
        return jsonify({'error': 'Missing content or filename'}), 400
    
    # Get the markdown directory from the app config
    markdown_dir = current_app.config['MARKDOWN_DIR']
    
    # Create the directory if it doesn't exist
    os.makedirs(markdown_dir, exist_ok=True)
    
    # Create the full file path
    file_path = os.path.join(markdown_dir, secure_filename(filename))
    
    # Write the content to the file
    try:
        with open(file_path, 'w') as file:
            file.write(content)
        
        # Initialize Git integration
        git = GitIntegration(markdown_dir)
        
        # Commit the changes
        git.commit_file(filename, message)
        
        return jsonify({
            'success': True,
            'message': f'File saved and committed with message: {message}'
        })
    
    except Exception as e:
        log_git_operation('save_to_git', error=str(e))
        return jsonify({'error': f'Error saving to Git: {str(e)}'}), 500


@git_routes.route('/api/git/history', methods=['GET'])
def get_git_history():
    """Get the commit history for a file.
    
    Returns:
        JSON response with the commit history
    """
    # Get the filename from the query parameters
    filename = request.args.get('filename')
    if not filename:
        log_git_operation('get_git_history', error='No filename provided')
        return jsonify({'error': 'No filename provided'}), 400
    
    log_git_operation('get_git_history', filename=filename)
    
    # Get the markdown directory from the app config
    markdown_dir = current_app.config['MARKDOWN_DIR']
    
    # Initialize Git integration
    git = GitIntegration(markdown_dir)
    
    # Get the commit history
    try:
        history = git.get_file_history(filename)
        return jsonify(history)
    
    except Exception as e:
        log_git_operation('get_git_history', filename=filename, error=str(e))
        return jsonify({'error': f'Error getting Git history: {str(e)}'}), 500


@git_routes.route('/api/git/content', methods=['GET'])
def get_file_content_at_commit():
    """Get the content of a file at a specific commit.
    
    Returns:
        JSON response with the file content
    """
    # Get the filename and commit hash from the query parameters
    filename = request.args.get('filename')
    commit_hash = request.args.get('commit')
    
    if not filename or not commit_hash:
        log_git_operation('get_file_content_at_commit', error='Missing filename or commit hash')
        return jsonify({'error': 'Missing filename or commit hash'}), 400
    
    log_git_operation('get_file_content_at_commit', filename=filename, commit=commit_hash)
    
    # Get the markdown directory from the app config
    markdown_dir = current_app.config['MARKDOWN_DIR']
    
    # Initialize Git integration
    git = GitIntegration(markdown_dir)
    
    # Get the file content at the specified commit
    try:
        content = git.get_file_content_at_commit(filename, commit_hash)
        return jsonify({'content': content})
    
    except Exception as e:
        log_git_operation('get_file_content_at_commit', filename=filename, commit=commit_hash, error=str(e))
        return jsonify({'error': f'Error getting file content: {str(e)}'}), 500


@git_routes.route('/api/git/publish', methods=['POST'])
def publish_repository():
    """Publish the repository to a Git provider.
    
    Request JSON parameters:
        provider (str): The Git provider (github, gitlab, bitbucket)
        repo_name (str): The name of the repository
        description (str, optional): The repository description
        private (bool, optional): Whether the repository should be private
        token (str): The access token for the Git provider
    
    Returns:
        JSON response with the repository URL
    """
    log_git_operation('publish_repository')
    
    data = request.json
    if not data:
        log_git_operation('publish_repository', error='No JSON data provided')
        return jsonify({'error': 'No JSON data provided'}), 400
    
    # Get the provider, repo name, and token
    provider = data.get('provider', '')
    repo_name = data.get('repo_name', '')
    description = data.get('description', '')
    private = data.get('private', True)
    token = data.get('token', '')
    
    if not provider or not repo_name or not token:
        log_git_operation('publish_repository', error='Missing provider, repo name, or token')
        return jsonify({'error': 'Missing provider, repo name, or token'}), 400
    
    # Get the markdown directory from the app config
    markdown_dir = current_app.config['MARKDOWN_DIR']
    
    # Initialize Git integration
    git = GitIntegration(markdown_dir)
    
    # Publish the repository
    try:
        result = git.publish_repository(provider, repo_name, description, private, token)
        return jsonify(result)
    
    except Exception as e:
        log_git_operation('publish_repository', error=str(e))
        return jsonify({'error': f'Error publishing repository: {str(e)}'}), 500
