#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
API Client for WebLama CLI

This module provides a client for interacting with the WebLama API.
"""

import os
import json
import requests
from urllib.parse import urljoin
from weblama.logger import logger


class APIClient:
    """Client for interacting with the WebLama API."""
    
    def __init__(self, base_url=None):
        """Initialize the API client.
        
        Args:
            base_url (str, optional): The base URL of the WebLama API.
                Defaults to http://localhost:5000 or the value of the WEBLAMA_API_URL environment variable.
        """
        self.base_url = base_url or os.environ.get('WEBLAMA_API_URL', 'http://localhost:5000')
        logger.debug(f"Initialized API client with base URL: {self.base_url}")
    
    def execute_code(self, content):
        """Execute Python code via the API.
        
        Args:
            content (str): The markdown content or Python code to execute.
            
        Returns:
            dict: The execution results.
            
        Raises:
            requests.RequestException: If the API request fails.
        """
        url = urljoin(self.base_url, '/api/execute')
        logger.debug(f"Executing code via API: {url}")
        
        response = requests.post(
            url,
            json={'content': content},
            headers={'Content-Type': 'application/json'}
        )
        
        response.raise_for_status()
        return response.json()
    
    def get_files(self):
        """Get a list of markdown files.
        
        Returns:
            list: A list of file information dictionaries.
            
        Raises:
            requests.RequestException: If the API request fails.
        """
        url = urljoin(self.base_url, '/api/files')
        logger.debug(f"Getting files via API: {url}")
        
        response = requests.get(url)
        response.raise_for_status()
        return response.json()
    
    def get_file_content(self, filename):
        """Get the content of a markdown file.
        
        Args:
            filename (str): The name of the file to get.
            
        Returns:
            str: The content of the file.
            
        Raises:
            requests.RequestException: If the API request fails.
        """
        url = urljoin(self.base_url, f'/api/file?filename={filename}')
        logger.debug(f"Getting file content via API: {url}")
        
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        
        if 'error' in data:
            raise ValueError(data['error'])
        
        return data['content']
    
    def create_file(self, filename, content, overwrite=False):
        """Create a new markdown file.
        
        Args:
            filename (str): The name of the file to create.
            content (str): The content of the file.
            overwrite (bool, optional): Whether to overwrite an existing file.
                Defaults to False.
            
        Returns:
            dict: The result of the operation.
            
        Raises:
            requests.RequestException: If the API request fails.
        """
        url = urljoin(self.base_url, '/api/file')
        logger.debug(f"Creating file via API: {url}")
        
        response = requests.post(
            url,
            json={
                'filename': filename,
                'content': content,
                'overwrite': overwrite
            },
            headers={'Content-Type': 'application/json'}
        )
        
        response.raise_for_status()
        return response.json()
    
    def save_to_git(self, filename, content, message='Auto-commit: Updated file'):
        """Save content to a file and commit it to Git.
        
        Args:
            filename (str): The name of the file to save.
            content (str): The content of the file.
            message (str, optional): The commit message.
                Defaults to 'Auto-commit: Updated file'.
            
        Returns:
            dict: The result of the operation.
            
        Raises:
            requests.RequestException: If the API request fails.
        """
        url = urljoin(self.base_url, '/api/git/save')
        logger.debug(f"Saving to Git via API: {url}")
        
        response = requests.post(
            url,
            json={
                'filename': filename,
                'content': content,
                'message': message
            },
            headers={'Content-Type': 'application/json'}
        )
        
        response.raise_for_status()
        return response.json()
    
    def get_git_history(self, filename):
        """Get the commit history for a file.
        
        Args:
            filename (str): The name of the file.
            
        Returns:
            list: A list of commit information dictionaries.
            
        Raises:
            requests.RequestException: If the API request fails.
        """
        url = urljoin(self.base_url, f'/api/git/history?filename={filename}')
        logger.debug(f"Getting Git history via API: {url}")
        
        response = requests.get(url)
        response.raise_for_status()
        return response.json()
    
    def get_file_content_at_commit(self, filename, commit_hash):
        """Get the content of a file at a specific commit.
        
        Args:
            filename (str): The name of the file.
            commit_hash (str): The commit hash.
            
        Returns:
            str: The content of the file at the specified commit.
            
        Raises:
            requests.RequestException: If the API request fails.
        """
        url = urljoin(self.base_url, f'/api/git/content?filename={filename}&commit={commit_hash}')
        logger.debug(f"Getting file content at commit via API: {url}")
        
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        
        if 'error' in data:
            raise ValueError(data['error'])
        
        return data['content']
    
    def publish_repository(self, provider, repo_name, description='', private=True, token=''):
        """Publish the repository to a Git provider.
        
        Args:
            provider (str): The Git provider (github, gitlab, bitbucket).
            repo_name (str): The name of the repository.
            description (str, optional): The repository description.
                Defaults to ''.
            private (bool, optional): Whether the repository should be private.
                Defaults to True.
            token (str, optional): The access token for the Git provider.
                Defaults to ''.
            
        Returns:
            dict: The result of the operation.
            
        Raises:
            requests.RequestException: If the API request fails.
        """
        url = urljoin(self.base_url, '/api/git/publish')
        logger.debug(f"Publishing repository via API: {url}")
        
        response = requests.post(
            url,
            json={
                'provider': provider,
                'repo_name': repo_name,
                'description': description,
                'private': private,
                'token': token
            },
            headers={'Content-Type': 'application/json'}
        )
        
        response.raise_for_status()
        return response.json()
