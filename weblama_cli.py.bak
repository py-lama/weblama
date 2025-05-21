#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
WebLama CLI - Command Line Interface for WebLama

This module provides a command-line interface for interacting with the WebLama API.
It allows users to manage markdown files, execute code, and interact with Git
functionality from the command line.
"""

import os
import sys
import json
import time
import logging
import argparse
import requests
from pathlib import Path
from dotenv import load_dotenv

# Try to import rich for better console output
try:
    from rich.console import Console
    from rich.logging import RichHandler
    from rich.table import Table
    from rich.panel import Panel
    from rich.syntax import Syntax
    from rich.progress import Progress, SpinnerColumn, TextColumn
    RICH_AVAILABLE = True
except ImportError:
    RICH_AVAILABLE = False

# Load environment variables from .env file
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
load_dotenv(env_path)

# Default API URL
API_URL = os.environ.get('WEBLAMA_API_URL', 'http://localhost:5000/api')

# Setup rich console for pretty output if available
if RICH_AVAILABLE:
    console = Console()
    # Configure logging with rich
    logging.basicConfig(
        level=logging.DEBUG if os.environ.get('DEBUG', 'false').lower() == 'true' else logging.INFO,
        format="%(message)s",
        datefmt="[%X]",
        handlers=[RichHandler(rich_tracebacks=True, console=console)]
    )
else:
    # Configure basic logging
    logging.basicConfig(
        level=logging.DEBUG if os.environ.get('DEBUG', 'false').lower() == 'true' else logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

logger = logging.getLogger("weblama_cli")

# Create logs directory
log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'logs')
os.makedirs(log_dir, exist_ok=True)

# Add file handler for logging to file
file_handler = logging.FileHandler(os.path.join(log_dir, 'weblama_cli.log'))
file_handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
logger.addHandler(file_handler)


class WebLamaCLI:
    """Command-line interface for WebLama"""
    
    def __init__(self, api_url=API_URL, verbose=False):
        """Initialize the CLI with the API URL"""
        self.api_url = api_url
        self.verbose = verbose
        logger.info(f"WebLama CLI initialized with API URL: {self.api_url}")
    
    def _request(self, method, endpoint, data=None, files=None, stream=False):
        """Make a request to the API with proper error handling and logging"""
        url = f"{self.api_url}/{endpoint}"
        logger.debug(f"Making {method} request to {url}")
        
        try:
            if RICH_AVAILABLE:
                with Progress(
                    SpinnerColumn(),
                    TextColumn("[bold blue]Making request..."),
                    transient=True
                ) as progress:
                    progress.add_task("request", total=None)
                    response = self._make_request(method, url, data, files, stream)
            else:
                response = self._make_request(method, url, data, files, stream)
            
            if response.status_code >= 400:
                error_msg = f"API request failed with status code {response.status_code}: {response.text}"
                logger.error(error_msg)
                if RICH_AVAILABLE:
                    console.print(f"[bold red]Error:[/bold red] {error_msg}")
                else:
                    print(f"Error: {error_msg}")
                return None
            
            return response
        except requests.exceptions.RequestException as e:
            error_msg = f"Request error: {str(e)}"
            logger.error(error_msg)
            if RICH_AVAILABLE:
                console.print(f"[bold red]Error:[/bold red] {str(e)}")
            else:
                print(f"Error: {str(e)}")
            return None
    
    def _make_request(self, method, url, data=None, files=None, stream=False):
        """Make the actual request to the API"""
        if method.lower() == 'get':
            return requests.get(url, stream=stream)
        elif method.lower() == 'post':
            return requests.post(url, json=data, files=files)
        elif method.lower() == 'put':
            return requests.put(url, json=data)
        elif method.lower() == 'delete':
            return requests.delete(url)
        else:
            raise ValueError(f"Unsupported HTTP method: {method}")
    
    def list_files(self):
        """List all markdown files"""
        logger.info("Listing all markdown files")
        
        response = self._request('get', 'files')
        if not response:
            return False
            
        data = response.json()
        if data['status'] == 'success':
            if RICH_AVAILABLE:
                table = Table(title="Available Markdown Files")
                table.add_column("Name", style="cyan")
                table.add_column("Path", style="green")
                
                for file in data['files']:
                    table.add_row(file['name'], file['path'])
                
                console.print(table)
            else:
                print("\nAvailable Markdown Files:")
                print("-" * 50)
                for file in data['files']:
                    print(f"{file['name']} - {file['path']}")
                print("-" * 50)
                
            logger.info(f"Found {len(data['files'])} markdown files")
            return True
        else:
            error_msg = data.get('error', 'Unknown error')
            if RICH_AVAILABLE:
                console.print(f"[bold red]Error:[/bold red] {error_msg}")
            else:
                print(f"Error: {error_msg}")
            logger.error(f"Failed to list files: {error_msg}")
            return False
    
    def get_file(self, file_path):
        """Get the content of a file"""
        logger.info(f"Getting file: {file_path}")
        
        response = self._request('get', f"files/{file_path}")
        if not response:
            return None
            
        data = response.json()
        if data['status'] == 'success':
            if RICH_AVAILABLE:
                # Create a panel with file info
                file_info = f"[bold cyan]{data['name']}[/bold cyan] ([italic]{data['path']}[/italic])"
                
                # Detect language for syntax highlighting
                language = "markdown"
                if data['name'].endswith('.py'):
                    language = "python"
                elif data['name'].endswith('.js'):
                    language = "javascript"
                elif data['name'].endswith('.html'):
                    language = "html"
                elif data['name'].endswith('.css'):
                    language = "css"
                
                # Create syntax highlighted content
                syntax = Syntax(data['content'], language, theme="monokai", line_numbers=True)
                
                # Display the file content in a panel
                console.print(Panel(syntax, title=file_info, border_style="blue"))
            else:
                print(f"\nFile: {data['name']} ({data['path']})")
                print("-" * 50)
                print(data['content'])
                print("-" * 50)
                
            logger.info(f"Successfully retrieved file: {file_path}")
            return data['content']
        else:
            error_msg = data.get('error', 'Unknown error')
            if RICH_AVAILABLE:
                console.print(f"[bold red]Error:[/bold red] {error_msg}")
            else:
                print(f"Error: {error_msg}")
            logger.error(f"Failed to get file {file_path}: {error_msg}")
            return None
    
    def save_file(self, file_path, content, commit_message=None):
        """Save content to a file"""
        logger.info(f"Saving file: {file_path}")
        
        # Create default commit message if not provided
        if not commit_message:
            commit_message = f"Update {file_path} via CLI"
        
        data = {
            'content': content,
            'commit_message': commit_message
        }
        
        response = self._request('put', f"files/{file_path}", data=data)
        if not response:
            return False
            
        data = response.json()
        if data['status'] == 'success':
            if RICH_AVAILABLE:
                console.print(f"[bold green]Success:[/bold green] File [cyan]{file_path}[/cyan] saved and committed with message: [italic]\"{commit_message}\"[/italic]")
            else:
                print(f"File saved successfully: {file_path} with commit message: {commit_message}")
                
            logger.info(f"Successfully saved file: {file_path} with commit message: {commit_message}")
            return True
        else:
            error_msg = data.get('error', 'Unknown error')
            if RICH_AVAILABLE:
                console.print(f"[bold red]Error:[/bold red] {error_msg}")
            else:
                print(f"Error: {error_msg}")
            logger.error(f"Failed to save file {file_path}: {error_msg}")
            return False
    
    def create_file(self, file_path, content="", commit_message=None):
        """Create a new file"""
        logger.info(f"Creating new file: {file_path}")
        
        # Create default commit message if not provided
        if not commit_message:
            commit_message = f"Create {file_path} via CLI"
        
        # If no content is provided, create a basic markdown template
        if not content.strip():
            filename_base = os.path.basename(file_path).split('.')[0]
            current_time = time.strftime('%Y-%m-%d %H:%M:%S')
            content = f"# {filename_base}\n\nCreated on {current_time}\n\n## Overview\n\nThis file was created using the WebLama CLI.\n\n## Content\n\nStart writing here...\n\n```python\n# Example Python code block\nprint(\"Hello from WebLama CLI!\")\n```"
        
        data = {
            'path': file_path,
            'content': content,
            'commit_message': commit_message
        }
        
        response = self._request('post', "files", data=data)
        if not response:
            return False
            
        data = response.json()
        if data['status'] == 'success':
            if RICH_AVAILABLE:
                console.print(f"[bold green]Success:[/bold green] File [cyan]{file_path}[/cyan] created and committed with message: [italic]\"{commit_message}\"[/italic]")
                
                # Show the file content
                if self.verbose:
                    console.print("\nFile content:")
                    language = "markdown" if file_path.endswith('.md') else "text"
                    syntax = Syntax(content, language, theme="monokai")
                    console.print(Panel(syntax, title=file_path, border_style="green"))
            else:
                print(f"File created successfully: {file_path}")
                if self.verbose:
                    print("\nFile content:")
                    print("-" * 50)
                    print(content)
                    print("-" * 50)
                    
            logger.info(f"Successfully created file: {file_path} with commit message: {commit_message}")
            return True
        else:
            error_msg = data.get('error', 'Unknown error')
            if RICH_AVAILABLE:
                console.print(f"[bold red]Error:[/bold red] {error_msg}")
            else:
                print(f"Error: {error_msg}")
            logger.error(f"Failed to create file {file_path}: {error_msg}")
            return False
    
    def execute_code(self, content):
        """Execute Python code blocks in markdown content"""
        logger.info("Executing Python code blocks")
        
        data = {'content': content}
        response = self._request('post', "execute", data=data)
        if not response:
            return False
            
        data = response.json()
        
        # Check if the response contains results
        if 'results' in data:
            if RICH_AVAILABLE:
                console.print("\n[bold]Execution Results:[/bold]")
                
                for result in data['results']:
                    block_num = result['block_index'] + 1
                    if result['success']:
                        console.print(f"[bold green]Block {block_num}:[/bold green] Success")
                        if 'output' in result and result['output'].strip():
                            console.print(Panel(result['output'], title=f"Output for Block {block_num}", border_style="green"))
                        else:
                            console.print("[dim]No output[/dim]")
                    else:
                        console.print(f"[bold red]Block {block_num}:[/bold red] Error")
                        if 'error' in result:
                            console.print(Panel(result['error'], title=f"Error in Block {block_num}", border_style="red"))
                        
                        if 'fixed_code' in result and result['fixed_code']:
                            console.print("[bold yellow]Fixed Code:[/bold yellow]")
                            syntax = Syntax(result['fixed_code'], "python", theme="monokai")
                            console.print(Panel(syntax, title=f"Fixed Code for Block {block_num}", border_style="yellow"))
                            
                            if 'fixed_output' in result and result['fixed_output']:
                                console.print("[bold green]Fixed Code Output:[/bold green]")
                                console.print(Panel(result['fixed_output'], title=f"Output from Fixed Code for Block {block_num}", border_style="green"))
                        
                        # Show alternative fix if available
                        if 'fixed_code_alt' in result and result['fixed_code_alt']:
                            console.print("[bold yellow]Alternative Fixed Code:[/bold yellow]")
                            syntax = Syntax(result['fixed_code_alt'], "python", theme="monokai")
                            console.print(Panel(syntax, title=f"Alternative Fix for Block {block_num}", border_style="yellow"))
                            
                            if 'fixed_output_alt' in result and result['fixed_output_alt']:
                                console.print("[bold green]Alternative Fix Output:[/bold green]")
                                console.print(Panel(result['fixed_output_alt'], title=f"Output from Alternative Fix for Block {block_num}", border_style="green"))
            else:
                print("\nExecution Results:")
                print("-" * 50)
                for result in data['results']:
                    print(f"Block {result['block_index'] + 1}:")
                    if result['success']:
                        print("Status: Success")
                        if 'output' in result:
                            print(f"Output:\n{result['output']}")
                    else:
                        print("Status: Error")
                        if 'error' in result:
                            print(f"Error: {result['error']}")
                        
                        if 'fixed_code' in result and result['fixed_code']:
                            print(f"Fixed Code:\n{result['fixed_code']}")
                            if 'fixed_output' in result and result['fixed_output']:
                                print(f"Fixed Code Output:\n{result['fixed_output']}")
                        
                        if 'fixed_code_alt' in result and result['fixed_code_alt']:
                            print(f"Alternative Fixed Code:\n{result['fixed_code_alt']}")
                            if 'fixed_output_alt' in result and result['fixed_output_alt']:
                                print(f"Alternative Fix Output:\n{result['fixed_output_alt']}")
                    print("-" * 30)
                    
            logger.info(f"Executed {len(data['results'])} code blocks")
            return True
        else:
            error_msg = data.get('error', 'Unknown error')
            if RICH_AVAILABLE:
                console.print(f"[bold red]Error:[/bold red] {error_msg}")
            else:
                print(f"Error: {error_msg}")
            logger.error(f"Failed to execute code: {error_msg}")
            return False
    
    def get_history(self, file_path):
        """Get the commit history for a file"""
        logger.info(f"Getting commit history for: {file_path}")
        
        # The API expects a POST request with the filename in the body
        data = {'filename': file_path}
        response = self._request('post', "git/history", data=data)
        if not response:
            return False
            
        data = response.json()
        if 'success' in data and data['success'] and 'history' in data:
            history = data['history']
            
            if RICH_AVAILABLE:
                table = Table(title=f"Commit History for {file_path}")
                table.add_column("Commit", style="cyan")
                table.add_column("Author", style="green")
                table.add_column("Date", style="yellow")
                table.add_column("Message", style="blue")
                
                for commit in history:
                    # The API returns commit_hash instead of hash
                    table.add_row(
                        commit['commit_hash'][:8],
                        commit['author'],
                        commit['date'],
                        commit['message']
                    )
                
                console.print(table)
            else:
                print(f"\nCommit History for {file_path}:")
                print("-" * 50)
                for commit in history:
                    print(f"Commit: {commit['commit_hash']}")
                    print(f"Author: {commit['author']}")
                    print(f"Date: {commit['date']}")
                    print(f"Message: {commit['message']}")
                    print("-" * 30)
                    
            logger.info(f"Retrieved {len(history)} commits for {file_path}")
            return True
        else:
            error_msg = data.get('error', 'Unknown error')
            if RICH_AVAILABLE:
                console.print(f"[bold red]Error:[/bold red] {error_msg}")
            else:
                print(f"Error: {error_msg}")
            logger.error(f"Failed to get history for {file_path}: {error_msg}")
            return False
    
    def publish_repository(self, remote_url, remote_name="origin"):
        """Publish the repository to a remote Git provider"""
        logger.info(f"Publishing repository to {remote_url} as {remote_name}")
        
        data = {
            'remote_url': remote_url,
            'remote_name': remote_name
        }
        
        response = self._request('post', "git/publish", data=data)
        if not response:
            return False
            
        data = response.json()
        if data['status'] == 'success':
            if RICH_AVAILABLE:
                console.print(f"[bold green]Success:[/bold green] Repository published to [cyan]{remote_url}[/cyan]")
            else:
                print(f"Repository published successfully to {remote_url}")
                
            logger.info(f"Successfully published repository to {remote_url}")
            return True
        else:
            error_msg = data.get('error', 'Unknown error')
            if RICH_AVAILABLE:
                console.print(f"[bold red]Error:[/bold red] {error_msg}")
            else:
                print(f"Error: {error_msg}")
            logger.error(f"Failed to publish repository: {error_msg}")
            return False
    
    def edit_file(self, file_path):
        """Open a file in the default editor and save changes"""
        logger.info(f"Opening file for editing: {file_path}")
        
        content = self.get_file(file_path)
        if content is None:
            return False
        
        # Create a temporary file
        temp_file = Path(f"/tmp/{os.path.basename(file_path)}")
        with open(temp_file, 'w') as f:
            f.write(content)
        
        # Open the file in the default editor
        editor = os.environ.get('EDITOR', 'nano')
        if RICH_AVAILABLE:
            console.print(f"\nOpening [cyan]{file_path}[/cyan] in [bold]{editor}[/bold]...")
        else:
            print(f"\nOpening {file_path} in {editor}...")
            
        os.system(f"{editor} {temp_file}")
        
        # Read the updated content
        with open(temp_file, 'r') as f:
            updated_content = f.read()
        
        # Save the updated content
        if updated_content != content:
            if RICH_AVAILABLE:
                console.print("\n[yellow]Changes detected.[/yellow] Saving file...")
            else:
                print("\nChanges detected. Saving file...")
                
            return self.save_file(file_path, updated_content, "Updated via CLI editor")
        else:
            if RICH_AVAILABLE:
                console.print("\n[dim]No changes made.[/dim]")
            else:
                print("\nNo changes made.")
                
            return True
    
    def test_buttons(self):
        """Test all buttons and functionality in the WebLama application"""
        logger.info("Testing all buttons and functionality")
        
        if RICH_AVAILABLE:
            console.print("[bold]Testing WebLama Functionality[/bold]")
            console.print("This will test all buttons and features of the WebLama application.")
        else:
            print("Testing WebLama Functionality")
            print("This will test all buttons and features of the WebLama application.")
        
        # Test file listing
        if RICH_AVAILABLE:
            console.print("\n[bold]1. Testing File Listing[/bold]")
        else:
            print("\n1. Testing File Listing")
            
        if not self.list_files():
            logger.error("File listing test failed")
            return False
        
        # Create a test file
        test_file = f"test_file_{int(time.time())}.md"
        if RICH_AVAILABLE:
            console.print(f"\n[bold]2. Creating Test File: [cyan]{test_file}[/cyan][/bold]")
        else:
            print(f"\n2. Creating Test File: {test_file}")
            
        if not self.create_file(test_file):
            logger.error("Create file test failed")
            return False
        
        # Get the test file
        if RICH_AVAILABLE:
            console.print(f"\n[bold]3. Getting Test File: [cyan]{test_file}[/cyan][/bold]")
        else:
            print(f"\n3. Getting Test File: {test_file}")
            
        content = self.get_file(test_file)
        if content is None:
            logger.error("Get file test failed")
            return False
        
        # Execute code in the test file
        if RICH_AVAILABLE:
            console.print("\n[bold]4. Executing Code in Test File[/bold]")
        else:
            print("\n4. Executing Code in Test File")
            
        if not self.execute_code(content):
            logger.error("Execute code test failed")
            return False
        
        # Update the test file
        if RICH_AVAILABLE:
            console.print(f"\n[bold]5. Updating Test File: [cyan]{test_file}[/cyan][/bold]")
        else:
            print(f"\n5. Updating Test File: {test_file}")
            
        updated_content = content + "\n\n## Updated Section\n\nThis file was updated during testing.\n"
        if not self.save_file(test_file, updated_content, "Update during testing"):
            logger.error("Save file test failed")
            return False
        
        # Get history for the test file
        if RICH_AVAILABLE:
            console.print(f"\n[bold]6. Getting History for Test File: [cyan]{test_file}[/cyan][/bold]")
        else:
            print(f"\n6. Getting History for Test File: {test_file}")
            
        if not self.get_history(test_file):
            logger.error("Get history test failed")
            return False
        
        if RICH_AVAILABLE:
            console.print("\n[bold green]All tests completed successfully![/bold green]")
        else:
            print("\nAll tests completed successfully!")
            
        logger.info("All button tests completed successfully")
        return True


def main():
    """Main entry point for the CLI"""
    parser = argparse.ArgumentParser(description="WebLama Command Line Interface")
    parser.add_argument("--verbose", "-v", action="store_true", help="Enable verbose output")
    parser.add_argument("--api-url", help="API URL", default=API_URL)
    subparsers = parser.add_subparsers(dest="command", help="Command to execute")
    
    # List files command
    list_parser = subparsers.add_parser("list", help="List all markdown files")
    
    # Get file command
    get_parser = subparsers.add_parser("get", help="Get the content of a file")
    get_parser.add_argument("path", help="Path to the file")
    
    # Save file command
    save_parser = subparsers.add_parser("save", help="Save content to a file")
    save_parser.add_argument("path", help="Path to the file")
    save_parser.add_argument("content", help="Content to save")
    save_parser.add_argument("--message", "-m", help="Commit message")
    
    # Create file command
    create_parser = subparsers.add_parser("create", help="Create a new file")
    create_parser.add_argument("path", help="Path to the file")
    create_parser.add_argument("--content", "-c", default="", help="Initial content")
    create_parser.add_argument("--message", "-m", help="Commit message")
    
    # Execute code command
    execute_parser = subparsers.add_parser("execute", help="Execute Python code blocks in markdown content")
    execute_parser.add_argument("--file", "-f", help="Path to the file to execute")
    execute_parser.add_argument("--content", "-c", help="Markdown content to execute")
    
    # Get history command
    history_parser = subparsers.add_parser("history", help="Get the commit history for a file")
    history_parser.add_argument("path", help="Path to the file")
    
    # Publish repository command
    publish_parser = subparsers.add_parser("publish", help="Publish the repository to a remote Git provider")
    publish_parser.add_argument("url", help="Remote URL")
    publish_parser.add_argument("--name", "-n", default="origin", help="Remote name")
    
    # Edit file command
    edit_parser = subparsers.add_parser("edit", help="Edit a file in the default editor")
    edit_parser.add_argument("path", help="Path to the file")
    
    # Test buttons command
    test_parser = subparsers.add_parser("test", help="Test all buttons and functionality")
    
    # Parse arguments
    args = parser.parse_args()
    
    # Initialize CLI
    cli = WebLamaCLI(api_url=args.api_url, verbose=args.verbose)
    
    # Execute command
    if args.command == "list":
        cli.list_files()
    elif args.command == "get":
        cli.get_file(args.path)
    elif args.command == "save":
        cli.save_file(args.path, args.content, args.message)
    elif args.command == "create":
        cli.create_file(args.path, args.content, args.message)
    elif args.command == "execute":
        if args.file:
            content = cli.get_file(args.file)
            if content:
                cli.execute_code(content)
        elif args.content:
            cli.execute_code(args.content)
        else:
            if RICH_AVAILABLE:
                console.print("[bold red]Error:[/bold red] Either --file or --content must be provided")
            else:
                print("Error: Either --file or --content must be provided")
    elif args.command == "history":
        cli.get_history(args.path)
    elif args.command == "publish":
        cli.publish_repository(args.url, args.name)
    elif args.command == "edit":
        cli.edit_file(args.path)
    elif args.command == "test":
        cli.test_buttons()
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
