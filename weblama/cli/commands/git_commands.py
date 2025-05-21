#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Git Commands for WebLama CLI

This module provides commands for Git operations.
"""

import os
import sys
from weblama.cli.commands import Command, registry
from weblama.cli.formatters import GitFormatter, FileFormatter


class GitHistoryCommand(Command):
    """Command to get the commit history for a file."""
    
    def __init__(self, api_client=None, formatter=None):
        """Initialize the command.
        
        Args:
            api_client (APIClient, optional): The API client to use.
            formatter (GitFormatter, optional): The formatter to use.
        """
        super().__init__(api_client, formatter or GitFormatter())
    
    def add_arguments(self, parser):
        """Add command-specific arguments to the parser.
        
        Args:
            parser (argparse.ArgumentParser): The argument parser.
        """
        parser.add_argument('filename', help='The name of the file')
        parser.add_argument('-o', '--output', help='Output file for history')
    
    def execute(self, args):
        """Execute the command.
        
        Args:
            args (argparse.Namespace): The parsed command-line arguments.
            
        Returns:
            int: The exit code (0 for success, non-zero for failure).
        """
        try:
            # Get the commit history
            history = self.api_client.get_git_history(args.filename)
            
            # Handle output
            if args.output:
                # Write to file
                with open(args.output, 'w') as f:
                    for commit in history:
                        f.write(f"{commit['hash']} - {commit['message']} ({commit['author']}, {commit['timestamp']})\n")
                
                self.formatter.format_success(f"History written to {args.output}")
            else:
                # Display history
                self.formatter.format_git_history(history, args.filename)
            
            return 0
        except Exception as e:
            self.formatter.format_error(str(e))
            return 1


class GitShowCommand(Command):
    """Command to get the content of a file at a specific commit."""
    
    def __init__(self, api_client=None, formatter=None):
        """Initialize the command.
        
        Args:
            api_client (APIClient, optional): The API client to use.
            formatter (FileFormatter, optional): The formatter to use.
        """
        super().__init__(api_client, formatter or FileFormatter())
    
    def add_arguments(self, parser):
        """Add command-specific arguments to the parser.
        
        Args:
            parser (argparse.ArgumentParser): The argument parser.
        """
        parser.add_argument('filename', help='The name of the file')
        parser.add_argument('commit', help='The commit hash')
        parser.add_argument('-o', '--output', help='Output file for content')
    
    def execute(self, args):
        """Execute the command.
        
        Args:
            args (argparse.Namespace): The parsed command-line arguments.
            
        Returns:
            int: The exit code (0 for success, non-zero for failure).
        """
        try:
            # Get the file content at the specified commit
            content = self.api_client.get_file_content_at_commit(args.filename, args.commit)
            
            # Handle output
            if args.output:
                # Write to file
                with open(args.output, 'w') as f:
                    f.write(content)
                
                self.formatter.format_success(f"Content written to {args.output}")
            else:
                # Display content
                self.formatter.format_file_content(content, f"{args.filename} at {args.commit}")
            
            return 0
        except Exception as e:
            self.formatter.format_error(str(e))
            return 1


class GitCommitCommand(Command):
    """Command to save content to a file and commit it to Git."""
    
    def __init__(self, api_client=None, formatter=None):
        """Initialize the command.
        
        Args:
            api_client (APIClient, optional): The API client to use.
            formatter (GitFormatter, optional): The formatter to use.
        """
        super().__init__(api_client, formatter or GitFormatter())
    
    def add_arguments(self, parser):
        """Add command-specific arguments to the parser.
        
        Args:
            parser (argparse.ArgumentParser): The argument parser.
        """
        parser.add_argument('filename', help='The name of the file to save')
        parser.add_argument('-c', '--content', help='The content of the file')
        parser.add_argument('-i', '--input', help='Input file')
        parser.add_argument('-m', '--message', help='Commit message', default='Auto-commit: Updated file')
    
    def execute(self, args):
        """Execute the command.
        
        Args:
            args (argparse.Namespace): The parsed command-line arguments.
            
        Returns:
            int: The exit code (0 for success, non-zero for failure).
        """
        try:
            # Get content from input file or command-line argument
            content = ''
            if args.input:
                with open(args.input, 'r') as f:
                    content = f.read()
            elif args.content:
                content = args.content
            else:
                # Read from stdin if no content or input file specified
                content = sys.stdin.read()
            
            # Save to Git
            result = self.api_client.save_to_git(args.filename, content, args.message)
            
            if result.get('success', False):
                self.formatter.format_success(result.get('message', 'File saved and committed successfully'))
                return 0
            else:
                self.formatter.format_error(result.get('error', 'Unknown error'))
                return 1
        except Exception as e:
            self.formatter.format_error(str(e))
            return 1


class GitPublishCommand(Command):
    """Command to publish the repository to a Git provider."""
    
    def __init__(self, api_client=None, formatter=None):
        """Initialize the command.
        
        Args:
            api_client (APIClient, optional): The API client to use.
            formatter (GitFormatter, optional): The formatter to use.
        """
        super().__init__(api_client, formatter or GitFormatter())
    
    def add_arguments(self, parser):
        """Add command-specific arguments to the parser.
        
        Args:
            parser (argparse.ArgumentParser): The argument parser.
        """
        parser.add_argument('provider', help='The Git provider (github, gitlab, bitbucket)')
        parser.add_argument('repo_name', help='The name of the repository')
        parser.add_argument('-d', '--description', help='The repository description')
        parser.add_argument('-p', '--private', action='store_true', help='Make the repository private')
        parser.add_argument('-t', '--token', help='The access token for the Git provider')
    
    def execute(self, args):
        """Execute the command.
        
        Args:
            args (argparse.Namespace): The parsed command-line arguments.
            
        Returns:
            int: The exit code (0 for success, non-zero for failure).
        """
        try:
            # Get token from environment variable if not provided
            token = args.token or os.environ.get(f"{args.provider.upper()}_TOKEN")
            if not token:
                self.formatter.format_error(f"No token provided for {args.provider}")
                return 1
            
            # Publish the repository
            result = self.api_client.publish_repository(
                args.provider,
                args.repo_name,
                args.description or '',
                args.private,
                token
            )
            
            if 'url' in result:
                self.formatter.format_success(f"Repository published at {result['url']}")
                return 0
            else:
                self.formatter.format_error(result.get('error', 'Unknown error'))
                return 1
        except Exception as e:
            self.formatter.format_error(str(e))
            return 1


# Register commands
registry.register('history', GitHistoryCommand)
registry.register('show', GitShowCommand)
registry.register('commit', GitCommitCommand)
registry.register('publish', GitPublishCommand)
