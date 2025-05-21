#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Git Integration for WebLama

This module provides Git integration for the WebLama application,
allowing users to track changes to Markdown files and publish them
to different providers like GitHub, GitLab, and Bitbucket.
"""

import os
import sys
import subprocess
import tempfile
import logging
from pathlib import Path
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class GitIntegration:
    """Git integration for WebLama."""
    
    def __init__(self, repo_path=None):
        """Initialize the Git integration.
        
        Args:
            repo_path (str, optional): Path to the Git repository. If None, a temporary repository will be created.
        """
        self.repo_path = repo_path
        
        if not self.repo_path:
            # Create a temporary repository
            self.temp_dir = tempfile.TemporaryDirectory(prefix='weblama-git-')
            self.repo_path = self.temp_dir.name
            self._init_repo()
        elif not os.path.exists(os.path.join(self.repo_path, '.git')):
            # Initialize a new repository at the specified path
            self._init_repo()
    
    def _run_git_command(self, command, check=True):
        """Run a Git command.
        
        Args:
            command (list): Git command to run.
            check (bool, optional): Whether to check the return code.
            
        Returns:
            tuple: (stdout, stderr, return_code)
        """
        try:
            process = subprocess.Popen(
                command,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                cwd=self.repo_path
            )
            stdout, stderr = process.communicate()
            
            if check and process.returncode != 0:
                logger.error(f"Git command failed: {' '.join(command)}\nError: {stderr}")
            
            return stdout, stderr, process.returncode
        except Exception as e:
            logger.error(f"Error running Git command: {e}")
            return '', str(e), 1
    
    def _init_repo(self):
        """Initialize a new Git repository."""
        os.makedirs(self.repo_path, exist_ok=True)
        self._run_git_command(['git', 'init'])
        
        # Set up user info for commits
        self._run_git_command(['git', 'config', 'user.name', 'WebLama User'])
        self._run_git_command(['git', 'config', 'user.email', 'weblama@example.com'])
        
        # Create a README file
        readme_path = os.path.join(self.repo_path, 'README.md')
        with open(readme_path, 'w') as f:
            f.write('# WebLama Repository\n\nThis repository contains Markdown files with Mermaid diagrams created using WebLama.')
        
        # Commit the README file
        self._run_git_command(['git', 'add', 'README.md'])
        self._run_git_command(['git', 'commit', '-m', 'Initial commit'])
    
    def save_file(self, content, filename):
        """Save a file to the repository and commit it.
        
        Args:
            content (str): Content of the file.
            filename (str): Name of the file.
            
        Returns:
            bool: Whether the operation was successful.
        """
        try:
            # Ensure the file has a .md extension
            if not filename.endswith('.md'):
                filename += '.md'
            
            # Save the file
            file_path = os.path.join(self.repo_path, filename)
            with open(file_path, 'w') as f:
                f.write(content)
            
            # Add the file to Git
            self._run_git_command(['git', 'add', filename])
            
            # Commit the file
            timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            self._run_git_command(['git', 'commit', '-m', f'Update {filename} - {timestamp}'])
            
            return True
        except Exception as e:
            logger.error(f"Error saving file to Git repository: {e}")
            return False
    
    def get_file_history(self, filename):
        """Get the history of a file.
        
        Args:
            filename (str): Name of the file.
            
        Returns:
            list: List of dictionaries with commit information.
        """
        try:
            # Ensure the file has a .md extension
            if not filename.endswith('.md'):
                filename += '.md'
            
            # Get the commit history for the file
            stdout, stderr, returncode = self._run_git_command(
                ['git', 'log', '--pretty=format:%H|%an|%ad|%s', '--date=iso', '--', filename]
            )
            
            if returncode != 0:
                return []
            
            # Parse the commit history
            history = []
            for line in stdout.strip().split('\n'):
                if not line:
                    continue
                
                commit_hash, author, date, message = line.split('|', 3)
                history.append({
                    'commit_hash': commit_hash,
                    'author': author,
                    'date': date,
                    'message': message
                })
            
            return history
        except Exception as e:
            logger.error(f"Error getting file history: {e}")
            return []
    
    def get_file_content_at_commit(self, filename, commit_hash):
        """Get the content of a file at a specific commit.
        
        Args:
            filename (str): Name of the file.
            commit_hash (str): Commit hash.
            
        Returns:
            str: Content of the file at the specified commit.
        """
        try:
            # Ensure the file has a .md extension
            if not filename.endswith('.md'):
                filename += '.md'
            
            # Get the file content at the specified commit
            stdout, stderr, returncode = self._run_git_command(
                ['git', 'show', f'{commit_hash}:{filename}']
            )
            
            if returncode != 0:
                return ''
            
            return stdout
        except Exception as e:
            logger.error(f"Error getting file content at commit: {e}")
            return ''
    
    def publish_to_github(self, repo_name, token, username=None):
        """Publish the repository to GitHub.
        
        Args:
            repo_name (str): Name of the GitHub repository.
            token (str): GitHub personal access token.
            username (str, optional): GitHub username. If None, it will be extracted from the token.
            
        Returns:
            tuple: (success, message)
        """
        try:
            # Set up the remote URL with token authentication
            if username:
                remote_url = f'https://{username}:{token}@github.com/{username}/{repo_name}.git'
            else:
                # Extract username from token (this is a simplified approach)
                remote_url = f'https://{token}@github.com/{repo_name}.git'
            
            # Add the remote
            self._run_git_command(['git', 'remote', 'remove', 'origin'], check=False)  # Remove if exists
            stdout, stderr, returncode = self._run_git_command(['git', 'remote', 'add', 'origin', remote_url])
            
            if returncode != 0:
                return False, f"Error adding remote: {stderr}"
            
            # Push to GitHub
            stdout, stderr, returncode = self._run_git_command(['git', 'push', '-u', 'origin', 'master'])
            
            if returncode != 0:
                return False, f"Error pushing to GitHub: {stderr}"
            
            return True, f"Successfully published to GitHub: {username}/{repo_name}"
        except Exception as e:
            logger.error(f"Error publishing to GitHub: {e}")
            return False, f"Error publishing to GitHub: {str(e)}"
    
    def publish_to_gitlab(self, repo_name, token, gitlab_url='https://gitlab.com', username=None):
        """Publish the repository to GitLab.
        
        Args:
            repo_name (str): Name of the GitLab repository.
            token (str): GitLab personal access token.
            gitlab_url (str, optional): GitLab instance URL.
            username (str, optional): GitLab username. If None, it will be extracted from the token.
            
        Returns:
            tuple: (success, message)
        """
        try:
            # Set up the remote URL with token authentication
            if username:
                remote_url = f'{gitlab_url}/{username}/{repo_name}.git'
                remote_url = remote_url.replace('https://', f'https://oauth2:{token}@')
            else:
                # This is a simplified approach; in practice, you'd need the username
                remote_url = f'{gitlab_url}/{repo_name}.git'
                remote_url = remote_url.replace('https://', f'https://oauth2:{token}@')
            
            # Add the remote
            self._run_git_command(['git', 'remote', 'remove', 'origin'], check=False)  # Remove if exists
            stdout, stderr, returncode = self._run_git_command(['git', 'remote', 'add', 'origin', remote_url])
            
            if returncode != 0:
                return False, f"Error adding remote: {stderr}"
            
            # Push to GitLab
            stdout, stderr, returncode = self._run_git_command(['git', 'push', '-u', 'origin', 'master'])
            
            if returncode != 0:
                return False, f"Error pushing to GitLab: {stderr}"
            
            return True, f"Successfully published to GitLab: {gitlab_url}/{username}/{repo_name}"
        except Exception as e:
            logger.error(f"Error publishing to GitLab: {e}")
            return False, f"Error publishing to GitLab: {str(e)}"
    
    def publish_to_bitbucket(self, repo_name, username, password):
        """Publish the repository to Bitbucket.
        
        Args:
            repo_name (str): Name of the Bitbucket repository.
            username (str): Bitbucket username.
            password (str): Bitbucket app password.
            
        Returns:
            tuple: (success, message)
        """
        try:
            # Set up the remote URL with basic authentication
            remote_url = f'https://{username}:{password}@bitbucket.org/{username}/{repo_name}.git'
            
            # Add the remote
            self._run_git_command(['git', 'remote', 'remove', 'origin'], check=False)  # Remove if exists
            stdout, stderr, returncode = self._run_git_command(['git', 'remote', 'add', 'origin', remote_url])
            
            if returncode != 0:
                return False, f"Error adding remote: {stderr}"
            
            # Push to Bitbucket
            stdout, stderr, returncode = self._run_git_command(['git', 'push', '-u', 'origin', 'master'])
            
            if returncode != 0:
                return False, f"Error pushing to Bitbucket: {stderr}"
            
            return True, f"Successfully published to Bitbucket: {username}/{repo_name}"
        except Exception as e:
            logger.error(f"Error publishing to Bitbucket: {e}")
            return False, f"Error publishing to Bitbucket: {str(e)}"
