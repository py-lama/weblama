#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
API routes for WebLama

This module provides Flask routes for code execution and fixing.
"""

import os
import json
from flask import Blueprint, request, jsonify, current_app
from weblama.logger import logger, log_api_call, log_code_execution
from weblama.core.markdown_utils import extract_python_code_blocks, update_markdown_with_fixed_code
from weblama.core.code_execution import execute_code_with_pybox, fix_code_with_pyllm, generate_alternative_fix

# Create a blueprint for API routes
api_routes = Blueprint('api_routes', __name__)


@api_routes.route('/api/execute', methods=['POST'])
def execute_code():
    """Execute Python code blocks in the markdown content."""
    log_api_call('execute', 'POST')
    
    data = request.json
    if not data:
        log_api_call('execute', 'POST', error='No JSON data provided')
        return jsonify({'error': 'No JSON data provided'}), 400
        
    # Accept both 'content' and 'markdown' parameters for backward compatibility
    markdown_content = data.get('markdown', data.get('content', ''))
    
    if not markdown_content:
        log_api_call('execute', 'POST', error='Missing content for code execution')
        return jsonify({'error': 'Missing content for code execution'}), 400
    
    # Extract Python code blocks
    code_blocks = extract_python_code_blocks(markdown_content)
    
    # Execute and fix each code block
    results = []
    fixed_codes = []
    updated_blocks = []

    for i, (code_block, _, _) in enumerate(code_blocks):
        # Skip empty code blocks
        if not code_block.strip():
            results.append({
                'block_id': i,
                'success': True,
                'stdout': '',
                'stderr': 'Empty code block',
                'output': '',
                'error': 'Empty code block',
                'fixed_code': None,
                'fixed_output': None
            })
            fixed_codes.append(None)
            updated_blocks.append(code_block)
            continue

        # Execute the code
        result = execute_code_with_pybox(code_block)

        # Always extract error message for response
        error_msg = result.get('error_message') or result.get('stderr') or result.get('error') or ''

        # If execution failed, try to fix the code
        fixed_code = None
        fixed_output = None
        if not result['success']:
            # Fix the code
            fixed_code = fix_code_with_pyllm(code_block, error_msg)
            # Execute the fixed code
            if fixed_code:
                fixed_result = execute_code_with_pybox(fixed_code)
                fixed_output = fixed_result.get('stdout', '') if fixed_result.get('success') else None
                # If the fixed code still fails, try a different approach
                if not fixed_result['success']:
                    # Try a different fix approach
                    alternative_fix = generate_alternative_fix(fixed_code, fixed_result.get('error_message') or fixed_result.get('stderr') or fixed_result.get('error') or '', attempt=2)
                    if alternative_fix:
                        # Execute the alternative fix
                        alt_result = execute_code_with_pybox(alternative_fix)
                        if alt_result['success']:
                            fixed_code = alternative_fix
                            fixed_result = alt_result
                            fixed_output = alt_result.get('stdout', '')
                        else:
                            final_fix = generate_alternative_fix(alternative_fix, alt_result.get('error_message') or alt_result.get('stderr') or alt_result.get('error') or '', attempt=3)
                            if final_fix:
                                final_result = execute_code_with_pybox(final_fix)
                                if final_result['success']:
                                    fixed_code = final_fix
                                    fixed_result = final_result
                                    fixed_output = final_result.get('stdout', '')
        # Build block result, always include 'error' and 'output' keys
        block_result = {
            'block_id': i,
            'success': result['success'],
            'stdout': result.get('stdout', ''),
            'stderr': result.get('stderr', ''),
            'output': result.get('stdout', ''),
            'error': result.get('stderr') or result.get('error_message') or result.get('error') or '',
            'fixed_code': fixed_code,
            'fixed_output': fixed_output
        }
        results.append(block_result)
        fixed_codes.append(fixed_code)
        updated_blocks.append(fixed_code if fixed_code else code_block)

    # Update the markdown content with fixed code
    updated_markdown = update_markdown_with_fixed_code(markdown_content, code_blocks, fixed_codes)

    # Build the response
    response = {
        'results': results,
        'updated_markdown': updated_markdown
    }
    return jsonify(response)


@api_routes.route('/api/fix', methods=['POST'])
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
    log_api_call('fix', 'POST')
    
    data = request.json
    if not data:
        log_api_call('fix', 'POST', error='No JSON data provided')
        return jsonify({'error': 'No JSON data provided'}), 400
    
    # Get the code, error, and attempt number
    code = data.get('code', '')
    error = data.get('error', '')
    attempt = data.get('attempt', 1)
    
    if not code or not error:
        log_api_call('fix', 'POST', error='Missing code or error message')
        return jsonify({'error': 'Missing code or error message'}), 400
    
    # Generate a new fix
    fixed_code = generate_alternative_fix(code, error, attempt)
    
    if not fixed_code:
        log_api_call('fix', 'POST', error='Failed to generate a new fix')
        return jsonify({'error': 'Failed to generate a new fix'}), 500
    
    # Execute the fixed code
    result = execute_code_with_pybox(fixed_code)
    
    # Return the result
    return jsonify({
        'fixed_code': fixed_code,
        'success': result['success'],
        'stdout': result.get('stdout', ''),
        'stderr': result.get('stderr', ''),
        'error_type': result.get('error_type', None) if not result['success'] else None,
        'error_message': result.get('error_message', None) if not result['success'] else None
    })
