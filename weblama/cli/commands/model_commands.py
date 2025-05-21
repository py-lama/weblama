#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Model Management Commands for WebLama CLI

This module provides commands for managing LLM models.
"""

from weblama.cli.commands import Command, registry
from weblama.cli.formatters import TableFormatter
from weblama.api.client import APIClient


class ListModelsCommand(Command):
    """Command to list available Ollama models."""
    
    def __init__(self, api_client=None, formatter=None):
        """
        Initialize the command.
        
        Args:
            api_client (APIClient, optional): The API client to use.
            formatter (TableFormatter, optional): The formatter to use.
        """
        super().__init__(api_client or APIClient(), formatter or TableFormatter())
    
    def add_arguments(self, parser):
        """
        Add command-specific arguments to the parser.
        
        Args:
            parser (argparse.ArgumentParser): The argument parser.
        """
        pass  # No additional arguments needed
    
    def execute(self, args):
        """
        Execute the command.
        
        Args:
            args (argparse.Namespace): The parsed command-line arguments.
            
        Returns:
            int: The exit code (0 for success, non-zero for failure).
        """
        try:
            # Get models from the API client
            result = self.api_client.list_ollama_models()
            
            if 'error' in result:
                self.formatter.format_error(result['error'])
                return 1
            
            # Display models
            models = result.get('models', [])
            if not models:
                self.formatter.format_text("No models available")
                return 0
            
            # Format as a table
            headers = ["Name", "Size", "Modified"]
            rows = [[model.get('name', ''), 
                    model.get('size', ''), 
                    model.get('modified', '')] 
                   for model in models]
            
            self.formatter.format_table(headers, rows, title="Available Ollama Models")
            return 0
        
        except Exception as e:
            self.formatter.format_error(str(e))
            return 1


class QueryModelCommand(Command):
    """Command to query an LLM model."""
    
    def __init__(self, api_client=None, formatter=None):
        """
        Initialize the command.
        
        Args:
            api_client (APIClient, optional): The API client to use.
            formatter (TableFormatter, optional): The formatter to use.
        """
        super().__init__(api_client or APIClient(), formatter or TableFormatter())
    
    def add_arguments(self, parser):
        """
        Add command-specific arguments to the parser.
        
        Args:
            parser (argparse.ArgumentParser): The argument parser.
        """
        parser.add_argument('-p', '--prompt', required=True, help='Prompt to send to the model')
        parser.add_argument('-m', '--model', default="llama3", help='Model to use')
        parser.add_argument('-t', '--temperature', type=float, default=0.7, help='Temperature for generation')
        parser.add_argument('-o', '--output', help='Output file for response')
    
    def execute(self, args):
        """
        Execute the command.
        
        Args:
            args (argparse.Namespace): The parsed command-line arguments.
            
        Returns:
            int: The exit code (0 for success, non-zero for failure).
        """
        try:
            # Query the model using the API client
            result = self.api_client.query_ollama(
                args.prompt, 
                model=args.model, 
                temperature=args.temperature
            )
            
            if 'error' in result:
                self.formatter.format_error(result['error'])
                return 1
            
            response = result.get('response', '')
            
            # Handle output
            if args.output:
                # Write to file
                with open(args.output, 'w') as f:
                    f.write(response)
                self.formatter.format_success(f"Response written to {args.output}")
            else:
                # Display response
                self.formatter.format_text("Model Response:")
                self.formatter.format_text(response)
            
            return 0
        
        except Exception as e:
            self.formatter.format_error(str(e))
            return 1


# Register commands
registry.register('models', ListModelsCommand)
registry.register('query', QueryModelCommand)
