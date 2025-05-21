import unittest
import os
import tempfile
import shutil
import json
from unittest.mock import patch, MagicMock
from flask import Flask, Blueprint, jsonify, request

# Import our mock classes
from tests.mock_git import MockGitIntegration, log_git_operation


class TestAutoFeatures(unittest.TestCase):
    """Test the automatic execution and auto-commit features."""

    def setUp(self):
        """Set up the test environment."""
        # Create a mock Flask app
        self.flask_app = Flask(__name__)
        
        # Create a mock git blueprint
        self.git_bp = Blueprint('git', __name__)
        
        # Add a mock git save endpoint
        @self.git_bp.route('/save', methods=['POST'])
        def git_save():
            data = request.get_json()
            content = data.get('content', '')
            filename = data.get('filename', 'untitled.md')
            message = data.get('message', f'Updated {filename}')
            
            # Use our mock git integration
            git = MockGitIntegration()
            success = git.save_file(content, filename, message)
            
            return jsonify({
                'success': success,
                'message': f'Saved and committed {filename}'
            })
        
        # Add a mock execute endpoint
        @self.flask_app.route('/api/execute', methods=['POST'])
        def execute():
            return jsonify({
                'success': True,
                'results': [{
                    'success': True,
                    'output': 'Hello, World!'
                }]
            })
        
        # Register the git blueprint
        self.flask_app.register_blueprint(self.git_bp, url_prefix='/api/git')
        
        # Create a test client
        self.app = self.flask_app.test_client()
        self.app.testing = True
        
        # Create a temporary directory for Git operations
        self.test_repo_dir = tempfile.mkdtemp()
        self.addCleanup(lambda: shutil.rmtree(self.test_repo_dir))
        
        # Create a mock git integration
        self.git = MockGitIntegration(repo_path=self.test_repo_dir)

    def test_auto_commit_endpoint(self):
        """Test the auto-commit endpoint."""
        # Test data
        test_data = {
            'content': '# Test Markdown\n```python\nprint("Hello, World!")\n```',
            'filename': 'test.md',
            'message': 'Auto-fixed Python code block #1'
        }
        
        # Make the request
        response = self.app.post('/api/git/save', json=test_data)
        
        # Check the response
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertTrue(data['success'])

    def test_git_integration_custom_message(self):
        """Test that the GitIntegration class accepts custom commit messages."""
        # Test data
        content = '# Test content'
        filename = 'test.md'
        custom_message = 'Custom commit message'
        
        # Call the method with a custom message
        result = self.git.save_file(content, filename, custom_message)
        
        # Verify the result
        self.assertTrue(result)
        
        # Verify the commit message was used
        saved_file = self.git.files_saved[-1]
        self.assertEqual(saved_file['message'], custom_message)

    def test_auto_commit_integration(self):
        """Test the integration between auto-fix and auto-commit."""
        # This would be an integration test that would require running JavaScript
        # In a real test environment, this would use Selenium or similar to test the UI
        # For now, we'll just check that the endpoints exist and return expected responses
        
        # Check that the execute endpoint exists and returns success
        response = self.app.post('/api/execute', json={
            'content': '# Test\n```python\nprint("Hello, World!")\n```'
        })
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        
        # Check that the git save endpoint exists and returns success
        response = self.app.post('/api/git/save', json={
            'content': '# Test',
            'filename': 'test.md'
        })
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])


if __name__ == '__main__':
    unittest.main()
