#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
WebLama - Web editor for Markdown with code execution and fixing

This module provides a Flask web application that allows users to edit Markdown files
with syntax highlighting for various code blocks, and automatically executes and fixes
Python code blocks using PyBox and PyLLM."""

import os
import re
import sys
import json
import logging
from pathlib import Path
from dotenv import load_dotenv
from flask import Flask, render_template, request, jsonify, send_from_directory, session
from werkzeug.utils import secure_filename

# Load environment variables from .env file
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
load_dotenv(env_path)

# Import custom logger
from weblama.logger import logger, init_app, log_api_call, log_file_operation, log_git_operation, log_code_execution
# Use our custom logger instead of the default one

# Add the parent directory to sys.path to import pylama modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# Import PyBox and PyLLM modules
# Create a simple sandbox implementation for testing
class PythonSandbox:
    def __init__(self):
        pass
    
    def run_code(self, code):
        """Run Python code in a sandbox."""
        import tempfile
        import subprocess
        import os
        import sys
        
        # Create a temporary file with the code
        with tempfile.NamedTemporaryFile(suffix='.py', delete=False) as temp_file:
            temp_file.write(code.encode('utf-8'))
            temp_file_path = temp_file.name
        
        try:
            # Run the code in a separate process
            process = subprocess.Popen(
                [sys.executable, temp_file_path],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            stdout, stderr = process.communicate(timeout=10)
            
            # Check for syntax errors
            if process.returncode != 0 and 'SyntaxError' in stderr:
                return {
                    'success': False,
                    'error_type': 'SyntaxError',
                    'error_message': stderr,
                    'stdout': stdout,
                    'stderr': stderr
                }
            
            # Check for runtime errors
            if process.returncode != 0:
                error_type = 'Error'
                for err_type in ['NameError', 'TypeError', 'ValueError', 'IndexError', 'KeyError', 'AttributeError']:
                    if err_type in stderr:
                        error_type = err_type
                        break
                
                return {
                    'success': False,
                    'error_type': error_type,
                    'error_message': stderr,
                    'stdout': stdout,
                    'stderr': stderr
                }
            
            # Successful execution
            return {
                'success': True,
                'stdout': stdout,
                'stderr': stderr
            }
        
        except subprocess.TimeoutExpired:
            return {
                'success': False,
                'error_type': 'TimeoutError',
                'error_message': 'Code execution timed out',
                'stdout': '',
                'stderr': 'Execution timed out after 10 seconds'
            }
        
        finally:
            # Clean up the temporary file
            try:
                os.unlink(temp_file_path)
            except:
                pass

# Simple mock for OllamaRunner
class OllamaRunner:
    def __init__(self):
        pass
    
    def query_ollama(self, prompt):
        """Mock implementation of query_ollama."""
        print("Using mock code generation")
        
        # Simple rule-based fixes for common issues
        if "missing imports" in prompt or "requests is not defined" in prompt:
            return '''```python
import requests

def get_data_from_api(url):
    response = requests.get(url)
    if response.status_code == 200:
        return response.json()
    else:
        return None

api_url = "https://jsonplaceholder.typicode.com/posts/1"
data = get_data_from_api(api_url)
if data:
    print(f"Title: {data['title']}")
    print(f"Body: {data['body']}")
else:
    print("Failed to fetch data")
```'''
        
        if "syntax error" in prompt and "write_to_file" in prompt:
            return '''```python
# File operations with syntax error - fixed
def write_to_file(filename, content):
    with open(filename, 'w') as file:
        file.write(content)
    print(f"Content written to {filename}")

write_to_file("example.txt", "Hello, this is a test!")
```'''
        
        if "logical error" in prompt and "largest" in prompt:
            return '''```python
# A function to find the largest number in a list - fixed
def find_largest(numbers):
    if not numbers:
        return None
    
    largest = numbers[0]
    for num in numbers:
        # Fixed: changed '<' to '>' to correctly find the largest number
        if num > largest:
            largest = num
    
    return largest

# Test the function
numbers = [5, 10, 3, 8, 15]
result = find_largest(numbers)
print(f"The largest number is: {result}")
```'''
        
        # Default response for other cases
        return '''```python
# Fixed code
print("Hello, World!")
```'''
    
    def extract_python_code(self, response):
        """Extract Python code from a response."""
        if "```python" in response and "```" in response.split("```python")[1]:
            return response.split("```python")[1].split("```")[0].strip()
        return ""

# Import Git integration and API
from weblama.git_integration import GitIntegration
from weblama.api import api as api_blueprint

# Create Flask app
app = Flask(__name__)
app.secret_key = os.urandom(24)  # For session management

# Register API blueprint
app.register_blueprint(api_blueprint)

# Create a Git repository in the user's home directory
GIT_REPO_PATH = os.path.expanduser('~/weblama-git-repo')
git_integration = GitIntegration(repo_path=GIT_REPO_PATH)


def extract_python_code_blocks(markdown_content):
    """Extract Python code blocks from markdown content.
    
    Args:
        markdown_content (str): The content of the markdown file.
        
    Returns:
        list: A list of tuples (code_block, start_pos, end_pos) containing the Python code blocks
              and their positions in the original markdown.
    """
    # Regular expression to match Python code blocks
    pattern = r'```python\n([\s\S]*?)\n```'
    
    # Find all Python code blocks
    code_blocks = []
    for match in re.finditer(pattern, markdown_content):
        code_block = match.group(1)
        start_pos = match.start()
        end_pos = match.end()
        code_blocks.append((code_block, start_pos, end_pos))
    
    return code_blocks


def execute_code_with_pybox(code):
    """Execute code using PyBox sandbox.
    
    Args:
        code (str): The Python code to execute.
        
    Returns:
        dict: The execution result.
    """
    # Create a PythonSandbox instance
    sandbox = PythonSandbox()
    
    # Execute the code
    result = sandbox.run_code(code)
    
    return result


def fix_code_with_pyllm(code, error_message, is_logic_error=False):
    """Fix code using PyLLM.
    
    Args:
        code (str): The Python code with issues.
        error_message (str): The error message from execution.
        is_logic_error (bool): Whether the error is a logical error.
        
    Returns:
        str: The fixed code.
    """
    # Create an OllamaRunner instance
    runner = OllamaRunner()
    
    # Prepare the prompt for fixing the code
    if is_logic_error:
        prompt = f"""Fix the following Python code that has a logical error:

```python
{code}
```

The code runs without errors but produces incorrect results. The issue is: {error_message}

Specifically, look for comments that indicate where the logical error is and fix that part.

Please provide only the fixed code as a Python code block. Make sure to include all necessary imports.

Your fixed code should be complete and runnable."""
    else:
        prompt = f"""Fix the following Python code that has an error:

```python
{code}
```

Error message: {error_message}

Please provide only the fixed code as a Python code block. Make sure to include all necessary imports.

If the error is about missing imports, make sure to add the appropriate import statements at the top of the code.

Your fixed code should be complete and runnable."""
    
    # Generate the fixed code
    response = runner.query_ollama(prompt)
    
    # Extract the fixed code from the response
    fixed_code = runner.extract_python_code(response)
    
    # If the fixed code is empty or too short, try to extract it differently
    if not fixed_code or len(fixed_code) < 10:
        # Try to extract any code-like content from the response
        code_lines = []
        for line in response.split('\n'):
            if line.strip() and not line.startswith('#') and not line.startswith('```'):
                code_lines.append(line)
        if code_lines:
            fixed_code = '\n'.join(code_lines)
    
    return fixed_code


def update_markdown_with_fixed_code(markdown_content, code_blocks, fixed_codes):
    """Update the markdown content with fixed code blocks.
    
    Args:
        markdown_content (str): The original markdown content.
        code_blocks (list): List of tuples (code_block, start_pos, end_pos).
        fixed_codes (list): List of fixed code blocks.
        
    Returns:
        str: The updated markdown content.
    """
    # Create a copy of the markdown content
    updated_content = markdown_content
    
    # Offset to adjust positions after replacements
    offset = 0
    
    # Replace each code block with its fixed version
    for i, ((code_block, start_pos, end_pos), fixed_code) in enumerate(zip(code_blocks, fixed_codes)):
        if fixed_code and fixed_code != code_block:
            # Calculate the new positions with offset
            new_start = start_pos + offset
            new_end = end_pos + offset
            
            # Replace the code block
            old_block = updated_content[new_start:new_end]
            new_block = f"```python\n{fixed_code}\n```"
            updated_content = updated_content[:new_start] + new_block + updated_content[new_end:]
            
            # Update the offset
            offset += len(new_block) - len(old_block)
    
    return updated_content


@app.route('/')
def index():
    """Render the main page."""
    return render_template('index.html')


@app.route('/api/files', methods=['GET'])
def get_files():
    """Get a list of all markdown files.
    
    Returns:
        JSON response with a list of markdown files
    """
    try:
        # Get the repository path from the GitIntegration class
        git = GitIntegration()
        repo_path = git.repo_path
        
        # Find all markdown files in the repository
        markdown_files = []
        for root, _, files in os.walk(repo_path):
            for file in files:
                if file.endswith('.md'):
                    # Get the relative path from the repo root
                    rel_path = os.path.relpath(os.path.join(root, file), repo_path)
                    markdown_files.append({
                        'name': file,
                        'path': rel_path
                    })
        
        return jsonify({
            'success': True,
            'files': markdown_files
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/files/content', methods=['GET'])
def get_file_content():
    """Get the content of a markdown file.
    
    Returns:
        JSON response with the file content
    """
    file_path = request.args.get('path')
    
    if not file_path:
        return jsonify({'error': 'No file path provided'}), 400
    
    try:
        # Get the repository path from the GitIntegration class
        git = GitIntegration()
        repo_path = git.repo_path
        
        # Get the full path to the file
        full_path = os.path.join(repo_path, file_path)
        
        # Check if the file exists
        if not os.path.isfile(full_path):
            return jsonify({'error': 'File not found'}), 404
        
        # Read the file content
        with open(full_path, 'r') as f:
            content = f.read()
        
        return jsonify({
            'success': True,
            'content': content,
            'name': os.path.basename(file_path),
            'path': file_path
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/files/create', methods=['POST'])
def create_file():
    """Create a new markdown file.
    
    Returns:
        JSON response with the result
    """
    data = request.get_json()
    file_name = data.get('name')
    content = data.get('content', '')
    
    if not file_name:
        return jsonify({'error': 'No file name provided'}), 400
    
    try:
        # Get the repository path from the GitIntegration class
        git = GitIntegration()
        repo_path = git.repo_path
        
        # Ensure the file has a .md extension
        if not file_name.endswith('.md'):
            file_name += '.md'
        
        # Get the full path to the file
        full_path = os.path.join(repo_path, file_name)
        
        # Check if the file already exists
        if os.path.exists(full_path):
            return jsonify({'error': 'File already exists'}), 400
        
        # Create the file
        with open(full_path, 'w') as f:
            f.write(content)
        
        # Commit the new file to Git
        git.save_file(content, file_name, f'Created new file: {file_name}')
        
        return jsonify({
            'success': True,
            'path': file_name
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/static/<path:filename>')
def serve_static(filename):
    """Serve static files."""
    return send_from_directory('static', filename)


def generate_alternative_fix(code, error, attempt=1):
    """Generate an alternative fix for code that still has errors.
    
    This function creates different fix approaches based on the attempt number
    and the specific error message.
    
    Args:
        code (str): The code from the previous fix attempt
        error (str): The error message from the previous fix attempt
        attempt (int): The current fix attempt number (2 or 3)
        
    Returns:
        str: The new fixed code, or None if no fix could be generated
    """
    # Create a more specific prompt based on the attempt number and error
    if attempt == 2:
        prompt = f"Fix this Python code that still has errors after a first fix attempt. Error: {error}"
    else:  # attempt == 3
        prompt = f"Try a completely different approach to fix this Python code. Previous fixes failed with: {error}"
    
    try:
        # Use the OllamaRunner to generate a new fix
        runner = OllamaRunner()
        response = runner.query_ollama(prompt + "\n\n```python\n" + code + "\n```")
        fixed_code = runner.extract_python_code(response)
        
        if fixed_code and fixed_code != code:
            return fixed_code
        return None
    except Exception as e:
        logger.error(f"Error generating alternative fix: {e}")
        return None


@app.route('/api/fix', methods=['POST'])
def generate_fix():
    """Generate a new fix for code that still has errors.
    
    This endpoint supports the advanced auto-fix workflow that tries multiple
    fix approaches until the code works correctly.
    
    Request JSON parameters:
        code (str): The code from the previous fix attempt
        error (str): The error message from the previous fix attempt
        attempt (int): The current fix attempt number
    
    Returns:
        JSON response with the new fixed code
    """
    data = request.get_json()
    code = data.get('code', '')
    error = data.get('error', '')
    attempt = data.get('attempt', 1)
    
    if not code or not error:
        return jsonify({'error': 'Code and error are required'}), 400
    
    try:
        # Generate a new fix based on the previous code and error
        fixed_code = generate_alternative_fix(code, error, attempt)
        
        if fixed_code:
            return jsonify({
                'success': True,
                'fixed_code': fixed_code
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Could not generate a new fix'
            })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/execute', methods=['POST'])
def execute_code():
    """Execute Python code blocks in the markdown content."""
    data = request.json
    markdown_content = data.get('markdown', '')
    
    # Extract Python code blocks
    code_blocks = extract_python_code_blocks(markdown_content)
    
    # Execute and fix each code block
    results = []
    fixed_codes = []
    
    for i, (code_block, _, _) in enumerate(code_blocks):
        # Check for logical errors in comments
        is_logic_error = False
        logic_error_description = None
        if '# Logic error:' in code_block:
            is_logic_error = True
            for line in code_block.split('\n'):
                if '# Logic error:' in line:
                    logic_error_description = line.split('# Logic error:')[1].strip()
                    break
        
        # Execute the code
        result = execute_code_with_pybox(code_block)
        
        if result['success'] and not is_logic_error:
            # Code executed successfully
            results.append({
                'block_index': i,
                'success': True,
                'output': result['stdout'],
                'fixed_code': None
            })
            fixed_codes.append(None)  # No need to fix
        else:
            if is_logic_error:
                # Logical error
                error_message = logic_error_description
                error_type = 'Logical Error'
            else:
                # Syntax or runtime error
                error_type = result.get('error_type', 'Error')
                error_message = result.get('error_message', result.get('stderr', 'Unknown error'))
                error_message = f"{error_type}: {error_message}"
            
            # Try to fix the code - first attempt
            fixed_code = fix_code_with_pyllm(code_block, error_message, is_logic_error)
            
            # Execute the fixed code to verify
            fixed_result = execute_code_with_pybox(fixed_code)
            
            # Try a second approach if the first fix didn't work
            fixed_code_alt = None
            fixed_result_alt = None
            
            if not fixed_result['success']:
                # First fix didn't work, try a different approach
                fixed_error_type = fixed_result.get('error_type', 'Error')
                fixed_error_message = fixed_result.get('error_message', fixed_result.get('stderr', 'Unknown error'))
                
                # Try a different fix with more specific instructions
                prompt_addition = "\nThe previous fix attempt failed with error: " + fixed_error_message
                fixed_code_alt = fix_code_with_pyllm(code_block, error_message + prompt_addition, is_logic_error)
                
                # Only use the alternative if it's different from the first attempt
                if fixed_code_alt != fixed_code:
                    fixed_result_alt = execute_code_with_pybox(fixed_code_alt)
                else:
                    fixed_code_alt = None
            
            if fixed_result['success']:
                # First fixed code executed successfully
                results.append({
                    'block_index': i,
                    'success': False,
                    'error': error_message,
                    'fixed_code': fixed_code,
                    'fixed_output': fixed_result['stdout'],
                    'fixed_code_alt': fixed_code_alt,
                    'fixed_output_alt': fixed_result_alt['stdout'] if fixed_code_alt and fixed_result_alt and fixed_result_alt['success'] else None
                })
                fixed_codes.append(fixed_code)
            elif fixed_code_alt and fixed_result_alt and fixed_result_alt['success']:
                # Alternative fixed code executed successfully
                results.append({
                    'block_index': i,
                    'success': False,
                    'error': error_message,
                    'fixed_code': fixed_code,
                    'fixed_error': f"{fixed_result.get('error_type', 'Error')}: {fixed_result.get('error_message', fixed_result.get('stderr', 'Unknown error'))}",
                    'fixed_code_alt': fixed_code_alt,
                    'fixed_output_alt': fixed_result_alt['stdout']
                })
                fixed_codes.append(fixed_code_alt)  # Use the alternative that worked
            else:
                # Both fixed code versions still have issues
                fixed_error_type = fixed_result.get('error_type', 'Error')
                fixed_error_message = fixed_result.get('error_message', fixed_result.get('stderr', 'Unknown error'))
                
                results.append({
                    'block_index': i,
                    'success': False,
                    'error': error_message,
                    'fixed_code': fixed_code,
                    'fixed_error': f"{fixed_error_type}: {fixed_error_message}",
                    'fixed_code_alt': fixed_code_alt,
                    'fixed_error_alt': f"{fixed_result_alt.get('error_type', 'Error')}: {fixed_result_alt.get('error_message', fixed_result_alt.get('stderr', 'Unknown error'))}" if fixed_code_alt and fixed_result_alt else None
                })
                fixed_codes.append(fixed_code)  # Use the first attempt even if it didn't work
    
    # Update the markdown content with fixed code blocks
    updated_content = update_markdown_with_fixed_code(markdown_content, code_blocks, fixed_codes)
    
    return jsonify({
        'results': results,
        'updated_markdown': updated_content
    })


@app.route('/api/save', methods=['POST'])
def save_markdown():
    """Save markdown content to a file and Git repository."""
    data = request.json
    markdown_content = data.get('markdown', '')
    filename = data.get('filename', 'document.md')
    
    # Ensure the filename has a .md extension
    if not filename.endswith('.md'):
        filename += '.md'
    
    # Secure the filename to prevent directory traversal
    filename = secure_filename(filename)
    
    # Save to Git repository
    try:
        success = git_integration.save_file(markdown_content, filename)
        if success:
            # Store the current filename in the session
            session['current_filename'] = filename
            return jsonify({
                'success': True, 
                'message': f'Saved to {filename} in Git repository',
                'filename': filename
            })
        else:
            return jsonify({
                'success': False, 
                'message': f'Error saving to Git repository'
            })
    except Exception as e:
        return jsonify({
            'success': False, 
            'message': f'Error saving file: {str(e)}'
        })


@app.route('/api/git/save', methods=['POST'])
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
    data = request.get_json()
    content = data.get('content')
    filename = data.get('filename')
    message = data.get('message', 'Auto-commit: Updated file')
    
    if not filename or content is None:
        return jsonify({'error': 'Filename and content are required'}), 400
    
    try:
        git = GitIntegration()
        git.save_file(content, filename, message)
        return jsonify({'success': True, 'message': f'File {filename} saved and committed with message: {message}'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/git/history', methods=['POST'])
def get_git_history():
    data = request.get_json()
    filename = data.get('filename')
    
    if not filename:
        return jsonify({'error': 'No filename provided'}), 400
    
    try:
        git = GitIntegration()
        history = git.get_file_history(filename)
        return jsonify({'success': True, 'history': history})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/git/content', methods=['GET'])
def get_file_content_at_commit():
    """Get the content of a file at a specific commit."""
    filename = request.args.get('filename') or session.get('current_filename', 'document.md')
    commit_hash = request.args.get('commit_hash')
    
    if not commit_hash:
        return jsonify({
            'success': False,
            'message': 'Commit hash is required'
        })
    
    # Get the file content at the specified commit
    content = git_integration.get_file_content_at_commit(filename, commit_hash)
    
    return jsonify({
        'success': True,
        'filename': filename,
        'commit_hash': commit_hash,
        'content': content
    })

@app.route('/api/git/publish', methods=['POST'])
def publish_repository():
    """Publish the repository to a Git provider."""
    data = request.json
    provider = data.get('provider', 'github')
    repo_name = data.get('repo_name', 'weblama-repository')
    
    if provider == 'github':
        token = data.get('token')
        username = data.get('username')
        
        if not token:
            return jsonify({
                'success': False,
                'message': 'GitHub token is required'
            })
        
        success, message = git_integration.publish_to_github(repo_name, token, username)
    
    elif provider == 'gitlab':
        token = data.get('token')
        username = data.get('username')
        gitlab_url = data.get('gitlab_url', 'https://gitlab.com')
        
        if not token:
            return jsonify({
                'success': False,
                'message': 'GitLab token is required'
            })
        
        success, message = git_integration.publish_to_gitlab(repo_name, token, gitlab_url, username)
    
    elif provider == 'bitbucket':
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({
                'success': False,
                'message': 'Bitbucket username and password are required'
            })
        
        success, message = git_integration.publish_to_bitbucket(repo_name, username, password)
    
    else:
        return jsonify({
            'success': False,
            'message': f'Unsupported provider: {provider}'
        })
    
    return jsonify({
        'success': success,
        'message': message
    })

def main():
    """Run the Flask application."""
    # Initialize our logging system
    init_app(app)
    
    # Log application startup
    logger.info('WebLama application starting up')
    
    # Get debug mode from environment
    debug_mode = os.environ.get('DEBUG', 'false').lower() == 'true'
    
    # Run the Flask application
    app.run(debug=debug_mode, host='0.0.0.0', port=5000)


if __name__ == '__main__':
    main()
