#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Main entry point for WebLama CLI

This module provides the main entry point for the WebLama command-line interface.
"""

import os
import sys
import argparse
import importlib
from weblama.cli.commands import registry
from weblama.logger import logger

# Import command modules to register commands
import weblama.cli.commands.file_commands
import weblama.cli.commands.code_commands
import weblama.cli.commands.git_commands


def main():
    """Main entry point for the WebLama CLI.
    
    Returns:
        int: The exit code (0 for success, non-zero for failure).
    """
    # Create the argument parser
    parser = argparse.ArgumentParser(
        description='WebLama - Command-line interface for WebLama',
        prog='weblama'
    )
    
    # Add global arguments
    parser.add_argument('-v', '--verbose', action='store_true', help='Enable verbose output')
    parser.add_argument('--api-url', help='WebLama API URL')
    parser.add_argument('--no-color', action='store_true', help='Disable colored output')
    
    # Add subparsers for commands
    subparsers = parser.add_subparsers(dest='command', help='Command to execute')
    
    # Register all commands
    commands = {}
    for name, command_class in registry.get_all_commands().items():
        # Create a subparser for the command
        subparser = subparsers.add_parser(name, help=command_class.__doc__)
        
        # Create a command instance
        command = command_class()
        
        # Add command-specific arguments
        command.add_arguments(subparser)
        
        # Store the command instance
        commands[name] = command
    
    # Parse arguments
    args = parser.parse_args()
    
    # Configure logging
    if args.verbose:
        logger.setLevel('DEBUG')
    
    # If no command specified, show help and exit
    if not args.command:
        parser.print_help()
        return 0
    
    # Get the command
    command = commands[args.command]
    
    # Set API URL if specified
    if args.api_url:
        command.api_client.base_url = args.api_url
    
    # Set formatter options
    command.formatter.use_rich = not args.no_color
    
    # Execute the command
    return command.execute(args)


if __name__ == '__main__':
    sys.exit(main())
