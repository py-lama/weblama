#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
WebLama - Web editor for Markdown with code execution and fixing

This module provides a Flask web application that allows users to edit Markdown files
with syntax highlighting for various code blocks, and automatically executes and fixes
Python code blocks using PyBox and PyLLM.
"""

import os
import re
import sys
import json
import logging
from pathlib import Path
from flask import Flask, render_template, request, jsonify, send_from_directory

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Add the parent directory to sys.path to import pylama modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# Import PyBox and PyLLM modules
from pylama.pybox_wrapper import PythonSandbox
from pylama.OllamaRunner import OllamaRunner

# Create Flask app
app = Flask(__name__)


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


@app.route('/static/<path:filename>')
def serve_static(filename):
    """Serve static files."""
    return send_from_directory('static', filename)


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
            
            # Try to fix the code
            fixed_code = fix_code_with_pyllm(code_block, error_message, is_logic_error)
            
            # Execute the fixed code to verify
            fixed_result = execute_code_with_pybox(fixed_code)
            
            if fixed_result['success']:
                # Fixed code executed successfully
                results.append({
                    'block_index': i,
                    'success': False,
                    'error': error_message,
                    'fixed_code': fixed_code,
                    'fixed_output': fixed_result['stdout']
                })
                fixed_codes.append(fixed_code)
            else:
                # Fixed code still has issues
                fixed_error_type = fixed_result.get('error_type', 'Error')
                fixed_error_message = fixed_result.get('error_message', fixed_result.get('stderr', 'Unknown error'))
                
                results.append({
                    'block_index': i,
                    'success': False,
                    'error': error_message,
                    'fixed_code': fixed_code,
                    'fixed_error': f"{fixed_error_type}: {fixed_error_message}"
                })
                fixed_codes.append(fixed_code)
    
    # Update the markdown content with fixed code blocks
    updated_content = update_markdown_with_fixed_code(markdown_content, code_blocks, fixed_codes)
    
    return jsonify({
        'results': results,
        'updated_markdown': updated_content
    })


@app.route('/api/save', methods=['POST'])
def save_markdown():
    """Save markdown content to a file."""
    data = request.json
    markdown_content = data.get('markdown', '')
    filename = data.get('filename', 'document.md')
    
    # Ensure the filename has a .md extension
    if not filename.endswith('.md'):
        filename += '.md'
    
    # Save the markdown content to a file
    try:
        with open(filename, 'w') as f:
            f.write(markdown_content)
        return jsonify({'success': True, 'message': f'Saved to {filename}'})
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error saving file: {str(e)}'})


def main():
    """Run the Flask application."""
    app.run(debug=True, host='0.0.0.0', port=5000)


if __name__ == '__main__':
    main()
