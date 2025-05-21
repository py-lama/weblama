#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sandbox module for WebLama

This module provides sandbox implementations for executing Python code safely.
"""

import os
import sys
import tempfile
import subprocess
from weblama.logger import logger, log_code_execution


class PythonSandbox:
    def __init__(self):
        pass
    
    def run_code(self, code):
        """Run Python code in a sandbox.
        
        Args:
            code (str): The Python code to execute.
            
        Returns:
            dict: The execution result containing success status, stdout, stderr, and error details if any.
        """
        log_code_execution('PythonSandbox.run_code', code[:100] + '...' if len(code) > 100 else code)
        
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
