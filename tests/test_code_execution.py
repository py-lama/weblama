#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Tests for the code execution functionality in WebLama.
"""

import os
import sys
import unittest
from unittest.mock import patch, MagicMock
from pathlib import Path

# Add the parent directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import WebLama modules
from weblama.core.code_execution import execute_code_with_pybox, fix_code_with_pyllm, generate_alternative_fix
from tests.mock_api_client import MockAPIClient


class TestCodeExecution(unittest.TestCase):
    """Test cases for the code execution functionality."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Create a mock API client
        self.mock_api_client = MockAPIClient()
        
        # Create a patcher for the APIClient class
        self.api_client_patcher = patch('weblama.api.client.APIClient', return_value=self.mock_api_client)
        
        # Start the patcher
        self.mock_api_client_class = self.api_client_patcher.start()
    
    def tearDown(self):
        """Tear down test fixtures."""
        # Stop the patcher
        self.api_client_patcher.stop()
    
    def test_execute_valid_code(self):
        """Test executing valid Python code."""
        # Valid Python code
        code = "print('Hello, World!')"
        
        # Execute the code with the mock API client
        result = execute_code_with_pybox(code, api_client=self.mock_api_client)
        
        # Check the execution result
        self.assertTrue(result['success'], "Execution should succeed")
        self.assertEqual(result['stdout'].strip(), "Hello, World!", "Output should match")
        self.assertEqual(result['stderr'], "", "No error output expected")
    
    def test_execute_syntax_error(self):
        """Test executing Python code with syntax errors."""
        # Python code with syntax error
        code = "syntax error: print('Hello, World!'  # Missing closing parenthesis"
        
        # Execute the code with the mock API client
        result = execute_code_with_pybox(code, api_client=self.mock_api_client)
        
        # Check the execution result
        self.assertFalse(result['success'], "Execution should fail")
        self.assertIn('SyntaxError', result['error_type'], "Should be a syntax error")
    
    def test_execute_runtime_error(self):
        """Test executing Python code with runtime errors."""
        # Python code with runtime error
        code = "print(undefined_variable)"
        
        # Execute the code with the mock API client
        result = execute_code_with_pybox(code, api_client=self.mock_api_client)
        
        # Check the execution result
        self.assertFalse(result['success'], "Execution should fail")
        self.assertIn('NameError', result['error_type'], "Should be a name error")
    
    def test_fix_syntax_error(self):
        """Test fixing Python code with syntax errors."""
        # Python code with syntax error
        code = "print('Hello, World!'  # Missing closing parenthesis"
        error_message = "SyntaxError: unexpected EOF while parsing"
        
        # Fix the code with the mock API client
        fixed_code = fix_code_with_pyllm(code, error_message, api_client=self.mock_api_client)
        
        # Check the fixed code
        self.assertEqual(fixed_code, "print('Hello, World!')")

    
    def test_fix_missing_import(self):
        """Test fixing Python code with missing imports."""
        # Python code with missing import
        code = "response = requests.get('https://example.com')"
        error_message = "NameError: name 'requests' is not defined"
        
        # Fix the code with the mock API client
        fixed_code = fix_code_with_pyllm(code, error_message, api_client=self.mock_api_client)
        
        # Check the fixed code
        self.assertEqual(fixed_code, "import requests\n\nresponse = requests.get('https://example.com')")
    
    def test_fix_logic_error(self):
        """Test fixing Python code with logical errors."""
        # Python code with logical error
        code = "logic error: def find_largest(numbers):\n    if not numbers:\n        return None\n    \n    largest = numbers[0]\n    for num in numbers:\n        if num < largest:\n            largest = num\n    \n    return largest"
        error_message = "The function is finding the smallest number instead of the largest"
        
        # Fix the code with the mock API client
        fixed_code = fix_code_with_pyllm(code, error_message, is_logic_error=True, api_client=self.mock_api_client)
        
        # Check the fixed code
        self.assertIn("if num > largest:", fixed_code)


if __name__ == '__main__':
    unittest.main()
