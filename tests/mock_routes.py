#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Mock routes for testing WebLama with the microservices architecture.
"""

from flask import Blueprint, jsonify, request
from tests.mock_api_client import MockAPIClient

# Create a mock API client
mock_api_client = MockAPIClient()

# Create a mock API blueprint
mock_api = Blueprint('mock_api', __name__)

@mock_api.route('/execute', methods=['POST'])
def execute():
    """Mock execute API endpoint."""
    data = request.get_json()
    content = data.get('content', '')
    
    # Extract Python code blocks from markdown
    import re
    code_blocks = re.findall(r'```python\n(.+?)\n```', content, re.DOTALL)
    
    results = []
    updated_markdown = content
    
    for i, code in enumerate(code_blocks):
        # Check for syntax error or runtime error keywords for testing
        if 'syntax error' in code.lower():
            result = {
                'success': False,
                'error_type': 'SyntaxError',
                'error_message': 'invalid syntax',
                'stderr': 'SyntaxError: invalid syntax',
                'block_id': i
            }
            
            # Generate fixed code
            fixed_code = 'print("Hello, World!")'
            fixed_result = {
                'success': True,
                'stdout': 'Hello, World!',
                'stderr': ''
            }
            
            # Add fixed code and output to result
            result['fixed_code'] = fixed_code
            result['fixed_output'] = fixed_result['stdout']
            
            # Update markdown with fixed code
            updated_markdown = updated_markdown.replace(
                f'```python\n{code}\n```',
                f'```python\n{fixed_code}\n```'
            )
        elif 'runtime error' in code.lower():
            result = {
                'success': False,
                'error_type': 'NameError',
                'error_message': 'name \'undefined_variable\' is not defined',
                'stderr': 'NameError: name \'undefined_variable\' is not defined',
                'block_id': i
            }
        else:
            result = {
                'success': True,
                'stdout': 'Hello, World!',
                'stderr': '',
                'block_id': i
            }
        
        # Add output to result
        result['output'] = result.get('stdout', '')
        
        # Add result to results
        results.append(result)
    
    return jsonify({
        'results': results,
        'updated_markdown': updated_markdown
    })

@mock_api.route('/save', methods=['POST'])
def save():
    """Mock save API endpoint."""
    data = request.get_json()
    markdown = data.get('markdown', '')
    filename = data.get('filename', 'untitled.md')
    
    return jsonify({
        'success': True,
        'message': f'Saved to {filename}'
    })
