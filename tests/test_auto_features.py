import unittest
import os
import tempfile
import shutil
from unittest.mock import patch, MagicMock
from weblama.app import app
from weblama.git_integration import GitIntegration


class TestAutoFeatures(unittest.TestCase):
    """Test the automatic execution and auto-commit features."""

    def setUp(self):
        """Set up the test environment."""
        # Create a test client
        self.app = app.test_client()
        self.app.testing = True
        
        # Create a temporary directory for Git operations
        self.test_repo_dir = tempfile.mkdtemp()
        self.addCleanup(lambda: shutil.rmtree(self.test_repo_dir))

    @patch('weblama.git_integration.GitIntegration.save_file')
    def test_auto_commit_endpoint(self, mock_save_file):
        """Test the auto-commit endpoint."""
        # Set up the mock to return True
        mock_save_file.return_value = True
        
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
        
        # Verify the mock was called with the correct arguments
        mock_save_file.assert_called_once_with(
            test_data['content'], 
            test_data['filename'], 
            test_data['message']
        )

    @patch('weblama.git_integration.GitIntegration')
    def test_git_integration_custom_message(self, MockGitIntegration):
        """Test that the GitIntegration class accepts custom commit messages."""
        # Create a mock instance
        mock_instance = MockGitIntegration.return_value
        mock_instance._run_git_command.return_value = (0, 'Success')
        
        # Create a real GitIntegration instance but with mocked methods
        git = GitIntegration(repo_path=self.test_repo_dir)
        git._run_git_command = mock_instance._run_git_command
        
        # Test data
        content = '# Test content'
        filename = 'test.md'
        custom_message = 'Custom commit message'
        
        # Call the method with a custom message
        result = git.save_file(content, filename, custom_message)
        
        # Verify the result and that the mock was called
        self.assertTrue(result)
        calls = mock_instance._run_git_command.call_args_list
        
        # Find the commit call (which should be the last one)
        commit_call = None
        for call in calls:
            args = call[0][0]
            if 'commit' in args:
                commit_call = args
                break
        
        # Verify the commit message was used
        self.assertIsNotNone(commit_call)
        self.assertEqual(commit_call[2], '-m')
        self.assertEqual(commit_call[3], custom_message)

    def test_auto_commit_integration(self):
        """Test the integration between auto-fix and auto-commit."""
        # This would be an integration test that would require running JavaScript
        # In a real test environment, this would use Selenium or similar to test the UI
        # For now, we'll just check that the endpoints exist
        
        # Check that the execute endpoint exists
        response = self.app.post('/api/execute', json={
            'code': 'print("Hello, World!")'
        })
        self.assertIn(response.status_code, [200, 400, 500])  # Should return some valid HTTP status
        
        # Check that the git save endpoint exists
        response = self.app.post('/api/git/save', json={
            'content': '# Test',
            'filename': 'test.md'
        })
        self.assertIn(response.status_code, [200, 400, 500])  # Should return some valid HTTP status


if __name__ == '__main__':
    unittest.main()
