#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Mock Git integration for testing WebLama with the microservices architecture.
"""

class MockGitIntegration:
    """
    Mock implementation of the GitIntegration class for testing purposes.
    """
    
    def __init__(self, repo_path=None):
        self.repo_path = repo_path or '/mock/repo/path'
        self.files_saved = []
    
    def save_file(self, content, filename, message=None):
        """
        Mock implementation of save_file method.
        
        Args:
            content (str): The content to save to the file.
            filename (str): The name of the file to save.
            message (str, optional): The commit message to use.
            
        Returns:
            bool: True if the file was saved successfully, False otherwise.
        """
        self.files_saved.append({
            'content': content,
            'filename': filename,
            'message': message or f'Updated {filename}'
        })
        return True
    
    def _run_git_command(self, args, cwd=None):
        """
        Mock implementation of _run_git_command method.
        
        Args:
            args (list): The command arguments.
            cwd (str, optional): The working directory.
            
        Returns:
            tuple: (return_code, output)
        """
        return (0, 'Success')


def log_git_operation(operation, details, success):
    """
    Mock implementation of log_git_operation function.
    
    Args:
        operation (str): The Git operation being performed.
        details (str): Details about the operation.
        success (bool): Whether the operation was successful.
        
    Returns:
        None
    """
    pass
