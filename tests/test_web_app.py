#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Tests for the WebLama web application.
"""

import os
import sys
import json
import unittest
from unittest.mock import patch, MagicMock
from pathlib import Path

# Add the parent directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import WebLama modules
from weblama.app import app


class TestWebApp(unittest.TestCase):
    """Test cases for the WebLama web application."""
    
    def setUp(self):
        """Set up the test client."""
        self.app = app.test_client()
        self.app.testing = True
    
    def test_index_route(self):
        """Test the index route."""
        response = self.app.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'<!DOCTYPE html>', response.data)
        self.assertIn(b'WebLama - Markdown Editor with Code Execution', response.data)
    
    def test_static_route(self):
        """Test the static route."""
        response = self.app.get('/static/css/style.css')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'WebLama - Markdown Editor with Code Execution', response.data)
    
    @patch('weblama.app.execute_code_with_pybox')
    @patch('weblama.app.fix_code_with_pyllm')
    def test_execute_api_success(self, mock_fix_code, mock_execute_code):
        """Test the execute API with successful code execution."""
        # Set up the mocks
        mock_execute_code.return_value = {
            'success': True,
            'stdout': 'Hello, World!',
            'stderr': ''
        }
        
        # Test data
        markdown_content = """# Test Markdown

```python
print("Hello, World!")
```
"""
        
        # Make the API request
        response = self.app.post('/api/execute',
                               data=json.dumps({'markdown': markdown_content}),
                               content_type='application/json')
        
        # Check the response
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(len(data['results']), 1)
        self.assertTrue(data['results'][0]['success'])
        self.assertEqual(data['results'][0]['output'], 'Hello, World!')
        self.assertEqual(data['updated_markdown'], markdown_content)
    
    @patch('weblama.app.execute_code_with_pybox')
    @patch('weblama.app.fix_code_with_pyllm')
    def test_execute_api_error(self, mock_fix_code, mock_execute_code):
        """Test the execute API with code execution error and fixing."""
        # Set up the mocks
        mock_execute_code.side_effect = [
            # First execution (original code) fails
            {
                'success': False,
                'error_type': 'SyntaxError',
                'error_message': 'invalid syntax',
                'stderr': 'SyntaxError: invalid syntax'
            },
            # Second execution (fixed code) succeeds
            {
                'success': True,
                'stdout': 'Hello, World!',
                'stderr': ''
            }
        ]
        
        # Mock the code fixing
        mock_fix_code.return_value = 'print("Hello, World!")'
        
        # Test data
        markdown_content = """# Test Markdown

```python
print("Hello, World!"
```
"""
        
        # Make the API request
        response = self.app.post('/api/execute',
                               data=json.dumps({'markdown': markdown_content}),
                               content_type='application/json')
        
        # Check the response
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(len(data['results']), 1)
        self.assertFalse(data['results'][0]['success'])
        self.assertIn('SyntaxError', data['results'][0]['error'])
        self.assertEqual(data['results'][0]['fixed_code'], 'print("Hello, World!")')
        self.assertEqual(data['results'][0]['fixed_output'], 'Hello, World!')
        
        # Check that the markdown was updated with the fixed code
        self.assertNotEqual(data['updated_markdown'], markdown_content)
        self.assertIn('```python\nprint("Hello, World!")\n```', data['updated_markdown'])
    
    @patch('builtins.open', new_callable=unittest.mock.mock_open)
    def test_save_api(self, mock_open):
        """Test the save API."""
        # Test data
        markdown_content = "# Test Markdown\n\nThis is a test."
        filename = "test.md"
        
        # Make the API request
        response = self.app.post('/api/save',
                               data=json.dumps({'markdown': markdown_content, 'filename': filename}),
                               content_type='application/json')
        
        # Check the response
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertIn('Saved to test.md', data['message'])
        
        # Check that the file was opened for writing
        mock_open.assert_called_once_with(filename, 'w')
        
        # Check that the content was written to the file
        mock_open().write.assert_called_once_with(markdown_content)


if __name__ == '__main__':
    unittest.main()
