import os
import json
from flask import Blueprint, request, jsonify
from .git_integration import GitIntegration
from .logger import logger, log_api_call, log_file_operation, log_git_operation

api = Blueprint('api', __name__)
git = GitIntegration()

@api.route('/api/files', methods=['GET'])
def list_files():
    """List all markdown files in the repository"""
    logger.info('API call: List files')
    try:
        files = []
        for root, _, filenames in os.walk(git.repo_path):
            for filename in filenames:
                if filename.endswith('.md'):
                    path = os.path.join(root, filename)
                    rel_path = os.path.relpath(path, git.repo_path)
                    files.append({
                        'name': filename,
                        'path': rel_path
                    })
        log_file_operation('list', 'all markdown files', True)
        return jsonify({'status': 'success', 'files': files})
    except Exception as e:
        logger.error(f'Error listing files: {str(e)}')
        log_file_operation('list', 'all markdown files', False, str(e))
        return jsonify({'status': 'error', 'error': str(e)}), 500

@api.route('/api/files/<path:file_path>', methods=['GET'])
def get_file(file_path):
    """Get the content of a specific file"""
    logger.info(f'API call: Get file {file_path}')
    try:
        # Ensure the path is relative to the repo
        full_path = os.path.join(git.repo_path, file_path)
        if not os.path.exists(full_path):
            logger.warning(f'File not found: {file_path}')
            log_file_operation('read', file_path, False, 'File not found')
            return jsonify({'status': 'error', 'error': 'File not found'}), 404
        
        with open(full_path, 'r') as f:
            content = f.read()
        
        log_file_operation('read', file_path, True)
        return jsonify({
            'status': 'success',
            'name': os.path.basename(file_path),
            'path': file_path,
            'content': content
        })
    except Exception as e:
        logger.error(f'Error reading file {file_path}: {str(e)}')
        log_file_operation('read', file_path, False, str(e))
        return jsonify({'status': 'error', 'error': str(e)}), 500

@api.route('/api/files/<path:file_path>', methods=['PUT'])
def save_file(file_path):
    """Save content to a specific file"""
    try:
        data = request.json
        if not data or 'content' not in data:
            return jsonify({'status': 'error', 'error': 'Content is required'}), 400
        
        content = data['content']
        commit_message = data.get('commit_message', f'Update {file_path}')
        
        # Save the file with git integration
        git.save_file(content, file_path, commit_message)
        
        return jsonify({'status': 'success', 'message': f'File {file_path} saved successfully'})
    except Exception as e:
        return jsonify({'status': 'error', 'error': str(e)}), 500

@api.route('/api/files', methods=['POST'])
def create_file():
    """Create a new file"""
    try:
        data = request.json
        if not data or 'path' not in data or 'content' not in data:
            return jsonify({'status': 'error', 'error': 'Path and content are required'}), 400
        
        file_path = data['path']
        content = data['content']
        commit_message = data.get('commit_message', f'Create {file_path}')
        
        # Check if file already exists
        full_path = os.path.join(git.repo_path, file_path)
        if os.path.exists(full_path):
            return jsonify({'status': 'error', 'error': 'File already exists'}), 409
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        
        # Save the file with git integration
        git.save_file(content, file_path, commit_message)
        
        return jsonify({'status': 'success', 'message': f'File {file_path} created successfully'})
    except Exception as e:
        return jsonify({'status': 'error', 'error': str(e)}), 500

@api.route('/api/execute', methods=['POST'])
def execute_code():
    """Execute Python code blocks in markdown content"""
    try:
        data = request.json
        if not data or 'content' not in data:
            return jsonify({'status': 'error', 'error': 'Content is required'}), 400
        
        # Import the necessary functions from app.py
        from .app import extract_python_code_blocks, execute_code_with_pybox, fix_code_with_pyllm
        
        # Extract Python code blocks
        code_blocks = extract_python_code_blocks(data['content'])
        
        # Execute each code block
        results = []
        for i, (code, _, _) in enumerate(code_blocks):
            # Execute the code
            result = execute_code_with_pybox(code)
            
            # Prepare the result object
            block_result = {
                'block_index': i,
                'success': result['success'],
                'output': result.get('output', ''),
                'error': result.get('error', '')
            }
            
            # If there's an error, try to fix it
            if not result['success']:
                try:
                    fixed_code = fix_code_with_pyllm(code, result['error'])
                    if fixed_code:
                        block_result['fixed_code'] = fixed_code
                except Exception as fix_error:
                    block_result['fix_error'] = str(fix_error)
            
            results.append(block_result)
        
        return jsonify({'status': 'success', 'result': results})
    except Exception as e:
        return jsonify({'status': 'error', 'error': str(e)}), 500

@api.route('/api/git/history/<path:file_path>', methods=['GET'])
def get_file_history(file_path):
    """Get the commit history for a specific file"""
    try:
        history = git.get_file_history(file_path)
        return jsonify({'status': 'success', 'history': history})
    except Exception as e:
        return jsonify({'status': 'error', 'error': str(e)}), 500

@api.route('/api/git/publish', methods=['POST'])
def publish_repository():
    """Publish the repository to a remote Git provider"""
    try:
        data = request.json
        if not data or 'remote_url' not in data:
            return jsonify({'status': 'error', 'error': 'Remote URL is required'}), 400
        
        remote_url = data['remote_url']
        remote_name = data.get('remote_name', 'origin')
        
        git.publish_to_remote(remote_url, remote_name)
        
        return jsonify({'status': 'success', 'message': f'Repository published to {remote_url}'})
    except Exception as e:
        return jsonify({'status': 'error', 'error': str(e)}), 500
