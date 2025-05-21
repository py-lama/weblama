#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
File Commands for WebLama CLI

This module provides commands for file operations.
"""

import os
import sys
from weblama.cli.commands import Command, registry
from weblama.cli.formatters import FileFormatter


class ListFilesCommand(Command):
    """Command to list markdown files."""
    
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
        # No additional arguments needed
        pass
    
    def execute(self, args):
        """Execute the command.
        
        Args:
            args (argparse.Namespace): The parsed command-line arguments.
            
        Returns:
            int: The exit code (0 for success, non-zero for failure).
        """
        try:
            files = self.api_client.get_files()
            self.formatter.format_file_list(files)
            return 0
        except Exception as e:
            self.formatter.format_error(str(e))
            return 1


class GetFileCommand(Command):
    """Command to get the content of a markdown file."""
    
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
        parser.add_argument('filename', help='The name of the file to get')
        parser.add_argument('-o', '--output', help='Output file (default: stdout)')
    
    def execute(self, args):
        """Execute the command.
        
        Args:
            args (argparse.Namespace): The parsed command-line arguments.
            
        Returns:
            int: The exit code (0 for success, non-zero for failure).
        """
        try:
            content = self.api_client.get_file_content(args.filename)
            
            if args.output:
                # Write to file
                with open(args.output, 'w') as f:
                    f.write(content)
                self.formatter.format_success(f"Content written to {args.output}")
            else:
                # Display content
                self.formatter.format_file_content(content, args.filename)
            
            return 0
        except Exception as e:
            self.formatter.format_error(str(e))
            return 1


class CreateFileCommand(Command):
    """Command to create a new markdown file."""
    
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
        parser.add_argument('filename', help='The name of the file to create')
        parser.add_argument('-c', '--content', help='The content of the file')
        parser.add_argument('-i', '--input', help='Input file')
        parser.add_argument('-f', '--force', action='store_true', help='Overwrite existing file')
    
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
            
            # Create the file
            result = self.api_client.create_file(args.filename, content, args.force)
            
            if result.get('success', False):
                self.formatter.format_success(result.get('message', 'File created successfully'))
                return 0
            else:
                self.formatter.format_error(result.get('error', 'Unknown error'))
                return 1
        except Exception as e:
            self.formatter.format_error(str(e))
            return 1


# Register commands
registry.register('list', ListFilesCommand)
registry.register('get', GetFileCommand)
registry.register('create', CreateFileCommand)
