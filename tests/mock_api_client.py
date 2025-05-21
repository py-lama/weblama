#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Mock API client for testing WebLama with the microservices architecture.
"""

from unittest.mock import MagicMock

class MockAPIClient:
    """
    Mock implementation of the APIClient for testing purposes.
    This allows tests to run without actual API dependencies.
    """
    
    def __init__(self):
        self.pybox_api_url = "http://mock-pybox:8000"
        self.pyllm_api_url = "http://mock-pyllm:8001"
        self.pylama_api_url = "http://mock-pylama:8002"
        
        # Set up default responses for common methods
        self._setup_default_responses()
    
    def _setup_default_responses(self):
        # Default response for execute_code
        self._execute_code_response = {
            'success': True,
            'stdout': 'Hello, World!',
            'stderr': '',
            'error_type': None,
            'error_message': None,
            'error': None
        }
        
        # Default response for fix_code
        self._fix_code_response = {
            'fixed_code': "print('Hello, World!')",
            'full_response': "Fixed code response"
        }
        
        # Default response for list_ollama_models
        self._list_models_response = {
            'models': [
                {'name': 'llama3', 'size': '4.1GB', 'modified': '2023-01-01'}
            ]
        }
        
        # Default response for query_ollama
        self._query_ollama_response = {
            'response': 'This is a response from the LLM model.'
        }
    
    def execute_code(self, code, timeout=10):
        """Mock implementation of execute_code"""
        # For testing different code scenarios
        if "syntax error" in code.lower():
            return {
                'success': False,
                'stdout': '',
                'stderr': 'SyntaxError: invalid syntax',
                'error_type': 'SyntaxError',
                'error_message': 'invalid syntax',
                'error': 'SyntaxError: invalid syntax'
            }
        elif "undefined_variable" in code.lower():
            return {
                'success': False,
                'stdout': '',
                'stderr': "NameError: name 'undefined_variable' is not defined",
                'error_type': 'NameError',
                'error_message': "name 'undefined_variable' is not defined",
                'error': "NameError: name 'undefined_variable' is not defined"
            }
        else:
            # For valid code, return the default success response
            return self._execute_code_response
    
    def fix_code(self, code, error_message, is_logic_error=False, attempt=1):
        """Mock implementation of fix_code"""
        # Customize the response based on the code and error
        if "missing import" in code.lower() or "requests" in code.lower():
            return {
                'fixed_code': "import requests\n\nresponse = requests.get('https://example.com')",
                'full_response': "Fixed code with imports"
            }
        elif "logic error" in code.lower() or is_logic_error:
            return {
                'fixed_code': """def find_largest(numbers):\n    if not numbers:\n        return None\n    \n    largest = numbers[0]\n    for num in numbers:\n        if num > largest:\n            largest = num\n    \n    return largest""",
                'full_response': "Fixed logic error"
            }
        elif "syntax error" in code.lower() or "SyntaxError" in error_message:
            return {
                'fixed_code': "print('Hello, World!')",
                'full_response': "Fixed syntax error"
            }
        else:
            # For general syntax errors
            return self._fix_code_response
    
    def list_ollama_models(self):
        """Mock implementation of list_ollama_models"""
        return self._list_models_response
    
    def query_ollama(self, prompt, model="llama3", temperature=0.7):
        """Mock implementation of query_ollama"""
        return self._query_ollama_response
    
    def query_llm(self, prompt, model="llama3", max_tokens=1000):
        """Mock implementation of query_llm"""
        return self._query_ollama_response
    
    def install_dependency(self, package_name, version=None):
        """Mock implementation of install_dependency"""
        return {'success': True, 'message': f'Installed {package_name}'}
