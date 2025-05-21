#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Command classes for WebLama CLI

This module provides base classes for CLI commands.
"""

import argparse
from abc import ABC, abstractmethod
from weblama.cli.api_client import APIClient
from weblama.cli.formatters import BaseFormatter, CodeFormatter, FileFormatter, GitFormatter


class Command(ABC):
    """Base class for CLI commands."""
    
    def __init__(self, api_client=None, formatter=None):
        """Initialize the command.
        
        Args:
            api_client (APIClient, optional): The API client to use.
                Defaults to a new APIClient instance.
            formatter (BaseFormatter, optional): The formatter to use.
                Defaults to a new BaseFormatter instance.
        """
        self.api_client = api_client or APIClient()
        self.formatter = formatter or BaseFormatter()
    
    @abstractmethod
    def add_arguments(self, parser):
        """Add command-specific arguments to the parser.
        
        Args:
            parser (argparse.ArgumentParser): The argument parser.
        """
        pass
    
    @abstractmethod
    def execute(self, args):
        """Execute the command.
        
        Args:
            args (argparse.Namespace): The parsed command-line arguments.
            
        Returns:
            int: The exit code (0 for success, non-zero for failure).
        """
        pass


class CommandRegistry:
    """Registry for CLI commands."""
    
    def __init__(self):
        """Initialize the command registry."""
        self.commands = {}
    
    def register(self, name, command_class):
        """Register a command.
        
        Args:
            name (str): The name of the command.
            command_class (type): The command class to register.
        """
        self.commands[name] = command_class
    
    def get_command(self, name):
        """Get a command by name.
        
        Args:
            name (str): The name of the command.
            
        Returns:
            type: The command class, or None if not found.
        """
        return self.commands.get(name)
    
    def get_all_commands(self):
        """Get all registered commands.
        
        Returns:
            dict: A dictionary of command names to command classes.
        """
        return self.commands


# Create a global command registry
registry = CommandRegistry()
