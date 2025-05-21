#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Code Execution Commands for WebLama CLI

This module provides commands for executing and fixing code.
"""

import os
import sys
from weblama.cli.commands import Command, registry
from weblama.cli.formatters import CodeFormatter


class ExecuteCodeCommand(Command):
    """Command to execute Python code."""
    
    def __init__(self, api_client=None, formatter=None):
        """Initialize the command.
        
        Args:
            api_client (APIClient, optional): The API client to use.
            formatter (CodeFormatter, optional): The formatter to use.
        """
        super().__init__(api_client, formatter or CodeFormatter())
    
    def add_arguments(self, parser):
        """Add command-specific arguments to the parser.
        
        Args:
            parser (argparse.ArgumentParser): The argument parser.
        """
        parser.add_argument('-c', '--code', help='The Python code to execute')
        parser.add_argument('-f', '--file', help='File containing Python code or markdown with code blocks')
        parser.add_argument('-o', '--output', help='Output file for execution results')
    
    def execute(self, args):
        """Execute the command.
        
        Args:
            args (argparse.Namespace): The parsed command-line arguments.
            
        Returns:
            int: The exit code (0 for success, non-zero for failure).
        """
        try:
            # Get code from file or command-line argument
            content = ''
            if args.file:
                with open(args.file, 'r') as f:
                    content = f.read()
            elif args.code:
                content = args.code
            else:
                # Read from stdin if no code or file specified
                content = sys.stdin.read()
            
            # Execute the code
            result = self.api_client.execute_code(content)
            
            # Handle output
            if args.output:
                # Write to file
                with open(args.output, 'w') as f:
                    if 'results' in result:
                        # Multiple code blocks
                        for block_result in result['results']:
                            f.write(f"Block {block_result['block_id']}:\n")
                            f.write(f"Success: {block_result['success']}\n")
                            if block_result.get('stdout'):
                                f.write(f"Output:\n{block_result['stdout']}\n")
                            if block_result.get('stderr'):
                                f.write(f"Errors/Warnings:\n{block_result['stderr']}\n")
                            if block_result.get('fixed_code'):
                                f.write(f"Fixed code:\n{block_result['fixed_code']}\n")
                            f.write("\n")
                    else:
                        # Single code block
                        f.write(f"Success: {result['success']}\n")
                        if result.get('stdout'):
                            f.write(f"Output:\n{result['stdout']}\n")
                        if result.get('stderr'):
                            f.write(f"Errors/Warnings:\n{result['stderr']}\n")
                        if result.get('fixed_code'):
                            f.write(f"Fixed code:\n{result['fixed_code']}\n")
                
                self.formatter.format_success(f"Results written to {args.output}")
            else:
                # Display results
                if 'results' in result:
                    # Multiple code blocks
                    for block_result in result['results']:
                        self.formatter.format_text(f"\nBlock {block_result['block_id']}:")
                        self.formatter.format_execution_result(block_result)
                else:
                    # Single code block
                    self.formatter.format_execution_result(result)
            
            # Return success if all code blocks executed successfully
            if 'results' in result:
                return 0 if all(block['success'] for block in result['results']) else 1
            else:
                return 0 if result.get('success', False) else 1
        
        except Exception as e:
            self.formatter.format_error(str(e))
            return 1


# Register commands
registry.register('execute', ExecuteCodeCommand)
