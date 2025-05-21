#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Output Formatters for WebLama CLI

This module provides formatters for displaying output in different formats.
"""

import json
import datetime
from rich.console import Console
from rich.table import Table
from rich.syntax import Syntax
from rich.panel import Panel
from rich.markdown import Markdown


class BaseFormatter:
    """Base class for formatters."""
    
    def __init__(self, use_rich=True):
        """Initialize the formatter.
        
        Args:
            use_rich (bool, optional): Whether to use rich formatting.
                Defaults to True.
        """
        self.use_rich = use_rich
        self.console = Console() if use_rich else None
    
    def format_text(self, text):
        """Format plain text.
        
        Args:
            text (str): The text to format.
            
        Returns:
            str: The formatted text.
        """
        if self.use_rich:
            self.console.print(text)
        else:
            print(text)
    
    def format_error(self, error):
        """Format an error message.
        
        Args:
            error (str): The error message.
            
        Returns:
            str: The formatted error message.
        """
        if self.use_rich:
            self.console.print(f"[bold red]Error:[/bold red] {error}")
        else:
            print(f"Error: {error}")
    
    def format_success(self, message):
        """Format a success message.
        
        Args:
            message (str): The success message.
            
        Returns:
            str: The formatted success message.
        """
        if self.use_rich:
            self.console.print(f"[bold green]Success:[/bold green] {message}")
        else:
            print(f"Success: {message}")
    
    def format_json(self, data):
        """Format JSON data.
        
        Args:
            data (dict): The JSON data to format.
            
        Returns:
            str: The formatted JSON data.
        """
        if self.use_rich:
            self.console.print_json(data=data)
        else:
            print(json.dumps(data, indent=2))


class CodeFormatter(BaseFormatter):
    """Formatter for code execution results."""
    
    def format_execution_result(self, result):
        """Format a code execution result.
        
        Args:
            result (dict): The execution result.
            
        Returns:
            str: The formatted execution result.
        """
        if not self.use_rich:
            if result.get('success', False):
                print("Execution successful")
                if result.get('stdout'):
                    print("\nOutput:")
                    print(result['stdout'])
                if result.get('stderr'):
                    print("\nWarnings:")
                    print(result['stderr'])
            else:
                print("Execution failed")
                error_type = result.get('error_type', 'Error')
                error_message = result.get('error_message', result.get('stderr', 'Unknown error'))
                print(f"\n{error_type}:")
                print(error_message)
                if result.get('fixed_code'):
                    print("\nFixed code:")
                    print(result['fixed_code'])
            return
        
        # Rich formatting
        if result.get('success', False):
            self.console.print("[bold green]Execution successful[/bold green]")
            if result.get('stdout'):
                self.console.print("\n[bold]Output:[/bold]")
                self.console.print(result['stdout'])
            if result.get('stderr'):
                self.console.print("\n[bold yellow]Warnings:[/bold yellow]")
                self.console.print(result['stderr'])
        else:
            self.console.print("[bold red]Execution failed[/bold red]")
            error_type = result.get('error_type', 'Error')
            error_message = result.get('error_message', result.get('stderr', 'Unknown error'))
            self.console.print(f"\n[bold red]{error_type}:[/bold red]")
            self.console.print(error_message)
            if result.get('fixed_code'):
                self.console.print("\n[bold green]Fixed code:[/bold green]")
                self.console.print(Syntax(result['fixed_code'], "python", theme="monokai"))
    
    def format_code(self, code, language="python"):
        """Format code with syntax highlighting.
        
        Args:
            code (str): The code to format.
            language (str, optional): The programming language.
                Defaults to "python".
            
        Returns:
            str: The formatted code.
        """
        if self.use_rich:
            self.console.print(Syntax(code, language, theme="monokai"))
        else:
            print(code)


class FileFormatter(BaseFormatter):
    """Formatter for file operations."""
    
    def format_file_list(self, files):
        """Format a list of files.
        
        Args:
            files (list): A list of file information dictionaries.
            
        Returns:
            str: The formatted file list.
        """
        if not self.use_rich:
            print("Files:")
            for file in files:
                modified = datetime.datetime.fromtimestamp(file['modified']).strftime('%Y-%m-%d %H:%M:%S')
                print(f"{file['name']} ({file['size']} bytes, modified {modified})")
            return
        
        # Rich formatting
        table = Table(title="Markdown Files")
        table.add_column("Name", style="cyan")
        table.add_column("Size", justify="right", style="green")
        table.add_column("Modified", style="magenta")
        
        for file in files:
            modified = datetime.datetime.fromtimestamp(file['modified']).strftime('%Y-%m-%d %H:%M:%S')
            table.add_row(file['name'], f"{file['size']} bytes", modified)
        
        self.console.print(table)
    
    def format_file_content(self, content, filename):
        """Format file content.
        
        Args:
            content (str): The file content.
            filename (str): The name of the file.
            
        Returns:
            str: The formatted file content.
        """
        if not self.use_rich:
            print(f"Content of {filename}:")
            print(content)
            return
        
        # Rich formatting
        if filename.endswith('.md'):
            self.console.print(Panel(Markdown(content), title=filename))
        else:
            self.console.print(Panel(content, title=filename))


class GitFormatter(BaseFormatter):
    """Formatter for Git operations."""
    
    def format_git_history(self, history, filename):
        """Format Git commit history.
        
        Args:
            history (list): A list of commit information dictionaries.
            filename (str): The name of the file.
            
        Returns:
            str: The formatted Git history.
        """
        if not self.use_rich:
            print(f"Commit history for {filename}:")
            for commit in history:
                date = datetime.datetime.fromtimestamp(commit['timestamp']).strftime('%Y-%m-%d %H:%M:%S')
                print(f"{commit['hash'][:7]} - {commit['message']} ({commit['author']}, {date})")
            return
        
        # Rich formatting
        table = Table(title=f"Commit History for {filename}")
        table.add_column("Hash", style="cyan")
        table.add_column("Message", style="green")
        table.add_column("Author", style="yellow")
        table.add_column("Date", style="magenta")
        
        for commit in history:
            date = datetime.datetime.fromtimestamp(commit['timestamp']).strftime('%Y-%m-%d %H:%M:%S')
            table.add_row(commit['hash'][:7], commit['message'], commit['author'], date)
        
        self.console.print(table)


class TableFormatter(BaseFormatter):
    """Formatter for displaying tabular data using rich.Table."""
    def format_table(self, headers, rows):
        if not self.use_rich:
            # Fallback: simple text table
            col_widths = [max(len(str(cell)) for cell in col) for col in zip(headers, *rows)]
            header_row = " | ".join(str(h).ljust(w) for h, w in zip(headers, col_widths))
            sep = "-+-".join('-' * w for w in col_widths)
            lines = [header_row, sep]
            for row in rows:
                lines.append(" | ".join(str(cell).ljust(w) for cell, w in zip(row, col_widths)))
            print("\n".join(lines))
            return
        table = Table(show_header=True, header_style="bold magenta")
        for header in headers:
            table.add_column(str(header))
        for row in rows:
            table.add_row(*[str(cell) for cell in row])
        self.console.print(table)
