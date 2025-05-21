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
from flask import Flask

# Add the parent directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import WebLama modules
from tests.mock_routes import mock_api
from tests.mock_api_client import MockAPIClient


class TestWebApp(unittest.TestCase):
    """Test cases for the WebLama web application."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Create a mock Flask app
        self.app = Flask(__name__)
        self.app.register_blueprint(mock_api, url_prefix='/api')
        
        # Add a mock index route
        @self.app.route('/')
        def index():
            return '<!DOCTYPE html><html><head><title>WebLama - Markdown Editor with Code Execution</title></head><body></body></html>'
        
        # Add a mock static route
        @self.app.route('/static/css/style.css')
        def style():
            return 'WebLama - Markdown Editor with Code Execution'
        
        # Create a test client
        self.client = self.app.test_client()
        self.client.testing = True
    
    def test_index_route(self):
        """Test the index route."""
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'<!DOCTYPE html>', response.data)
        self.assertIn(b'WebLama - Markdown Editor with Code Execution', response.data)
    
    def test_static_route(self):
        """Test the static route."""
        response = self.client.get('/static/css/style.css')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'WebLama - Markdown Editor with Code Execution', response.data)
    
    def test_execute_api_success(self):
        """Test the execute API with successful code execution."""
        # Test data
        markdown_content = """# Test Markdown

```python
print("Hello, World!")
```
"""
        
        # Make the API request
        response = self.client.post('/api/execute',
                               data=json.dumps({'content': markdown_content}),
                               content_type='application/json')
        
        # Check the response
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(len(data['results']), 1)
        self.assertTrue(data['results'][0]['success'])
        self.assertEqual(data['results'][0]['output'], 'Hello, World!')
        self.assertEqual(data['updated_markdown'], markdown_content)
    
    def test_execute_api_error(self):
        """Test the execute API with code execution error and fixing."""
        # Test data with syntax error
        markdown_content = """# Test Markdown

```python
syntax error: print("Hello, World!"
```
"""
        
        # Make the API request
        response = self.client.post('/api/execute',
                               data=json.dumps({'content': markdown_content}),
                               content_type='application/json')
        
        # Check the response
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(len(data['results']), 1)
        self.assertFalse(data['results'][0]['success'])
        self.assertIn('SyntaxError', data['results'][0]['error_type'])
        self.assertEqual(data['results'][0]['fixed_code'], 'print("Hello, World!")')
        self.assertEqual(data['results'][0]['fixed_output'], 'Hello, World!')
        
        # Check that the markdown was updated with the fixed code
        self.assertNotEqual(data['updated_markdown'], markdown_content)
        self.assertIn('```python\nprint("Hello, World!")\n```', data['updated_markdown'])
    
    def test_save_api(self):
        """Test the save API."""
        # Test data
        markdown_content = "# Test Markdown\n\nThis is a test."
        filename = "test.md"
        
        # Make the API request
        response = self.client.post('/api/save',
                               data=json.dumps({'markdown': markdown_content, 'filename': filename}),
                               content_type='application/json')
        
        # Check the response
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertIn('Saved to test.md', data['message'])


if __name__ == '__main__':
    unittest.main()
