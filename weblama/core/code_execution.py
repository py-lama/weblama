#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Code execution module for WebLama

This module provides functionality for executing and fixing Python code.
"""

import os
import requests
from weblama.logger import logger, log_code_execution
from weblama.api.client import APIClient


def execute_code_with_pybox(code):
    """Execute code using PyBox API.
    
    Args:
        code (str): The Python code to execute.
        
    Returns:
        dict: The execution result.
    """
    log_code_execution('execute_code_with_pybox', code[:100] + '...' if len(code) > 100 else code)
    
    # Create an API client instance
    api_client = APIClient()
    
    # Execute the code using the PyBox API
    result = api_client.execute_code(code, timeout=10)
    
    return result


def fix_code_with_pyllm(code, error_message, is_logic_error=False):
    """Fix code using PyLLM API.
    
    Args:
        code (str): The Python code with issues.
        error_message (str): The error message from execution.
        is_logic_error (bool): Whether the error is a logical error.
        
    Returns:
        str: The fixed code.
    """
    log_code_execution('fix_code_with_pyllm', 
                     f"Code: {code[:50]}... Error: {error_message[:50]}... Logic Error: {is_logic_error}")
    
    # Create an API client instance
    api_client = APIClient()
    
    # Call the PyLLM API to fix the code
    result = api_client.fix_code(code, error_message, is_logic_error=is_logic_error)
    
    # Extract the fixed code from the response
    fixed_code = result.get('fixed_code', '')
    
    logger.debug(f"Generated fixed code of length {len(fixed_code)}")
    return fixed_code


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
    log_code_execution('generate_alternative_fix', 
                     f"Attempt: {attempt}, Code: {code[:50]}... Error: {error[:50]}...")
    
    # Only proceed for attempts 2 or 3
    if attempt not in [2, 3]:
        return None
    
    # Create an API client instance
    api_client = APIClient()
    
    # Call the PyLLM API to fix the code with the specific attempt number
    result = api_client.fix_code(code, error, is_logic_error=False, attempt=attempt)
    
    # Extract the fixed code from the response
    fixed_code = result.get('fixed_code', '')
    
    logger.debug(f"Generated alternative fix (attempt {attempt}) of length {len(fixed_code)}")
    return fixed_code
