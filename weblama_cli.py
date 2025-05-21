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
import argparse
import requests
from pathlib import Path

# Default API URL
API_URL = "http://localhost:5000/api"

class WebLamaCLI:
    """Command-line interface for WebLama"""
    
    def __init__(self, api_url=API_URL):
        """Initialize the CLI with the API URL"""
        self.api_url = api_url
    
    def list_files(self):
        """List all markdown files"""
        response = requests.get(f"{self.api_url}/files")
        if response.status_code == 200:
            data = response.json()
            if data['status'] == 'success':
                print("\nAvailable Markdown Files:")
                print("-" * 50)
                for file in data['files']:
                    print(f"{file['name']} - {file['path']}")
                print("-" * 50)
                return True
            else:
                print(f"Error: {data.get('error', 'Unknown error')}")
        else:
            print(f"Error: Failed to get files (Status code: {response.status_code})")
        return False
    
    def get_file(self, file_path):
        """Get the content of a file"""
        response = requests.get(f"{self.api_url}/files/{file_path}")
        if response.status_code == 200:
            data = response.json()
            if data['status'] == 'success':
                print(f"\nFile: {data['name']} ({data['path']})")
                print("-" * 50)
                print(data['content'])
                print("-" * 50)
                return data['content']
            else:
                print(f"Error: {data.get('error', 'Unknown error')}")
        else:
            print(f"Error: Failed to get file (Status code: {response.status_code})")
        return None
    
    def save_file(self, file_path, content, commit_message=None):
        """Save content to a file"""
        data = {
            'content': content,
            'commit_message': commit_message or f"Update {file_path}"
        }
        response = requests.put(f"{self.api_url}/files/{file_path}", json=data)
        if response.status_code == 200:
            data = response.json()
            if data['status'] == 'success':
                print(f"File saved successfully: {file_path}")
                return True
            else:
                print(f"Error: {data.get('error', 'Unknown error')}")
        else:
            print(f"Error: Failed to save file (Status code: {response.status_code})")
        return False
    
    def create_file(self, file_path, content="", commit_message=None):
        """Create a new file"""
        data = {
            'path': file_path,
            'content': content,
            'commit_message': commit_message or f"Create {file_path}"
        }
        response = requests.post(f"{self.api_url}/files", json=data)
        if response.status_code == 200:
            data = response.json()
            if data['status'] == 'success':
                print(f"File created successfully: {file_path}")
                return True
            else:
                print(f"Error: {data.get('error', 'Unknown error')}")
        else:
            print(f"Error: Failed to create file (Status code: {response.status_code})")
        return False
    
    def execute_code(self, content):
        """Execute Python code blocks in markdown content"""
        data = {'content': content}
        response = requests.post(f"{self.api_url}/execute", json=data)
        if response.status_code == 200:
            data = response.json()
            if data['status'] == 'success':
                print("\nExecution Results:")
                print("-" * 50)
                for result in data['result']:
                    print(f"Block {result['block_index'] + 1}:")
                    if result['success']:
                        print("Status: Success")
                        print(f"Output:\n{result['output']}")
                    else:
                        print("Status: Error")
                        print(f"Error: {result['error']}")
                        if 'fixed_code' in result:
                            print(f"Fixed Code:\n{result['fixed_code']}")
                    print("-" * 30)
                return True
            else:
                print(f"Error: {data.get('error', 'Unknown error')}")
        else:
            print(f"Error: Failed to execute code (Status code: {response.status_code})")
        return False
    
    def get_history(self, file_path):
        """Get the commit history for a file"""
        response = requests.get(f"{self.api_url}/git/history/{file_path}")
        if response.status_code == 200:
            data = response.json()
            if data['status'] == 'success':
                print(f"\nCommit History for {file_path}:")
                print("-" * 50)
                for commit in data['history']:
                    print(f"Commit: {commit['hash']}")
                    print(f"Author: {commit['author']}")
                    print(f"Date: {commit['date']}")
                    print(f"Message: {commit['message']}")
                    print("-" * 30)
                return True
            else:
                print(f"Error: {data.get('error', 'Unknown error')}")
        else:
            print(f"Error: Failed to get history (Status code: {response.status_code})")
        return False
    
    def publish_repository(self, remote_url, remote_name="origin"):
        """Publish the repository to a remote Git provider"""
        data = {
            'remote_url': remote_url,
            'remote_name': remote_name
        }
        response = requests.post(f"{self.api_url}/git/publish", json=data)
        if response.status_code == 200:
            data = response.json()
            if data['status'] == 'success':
                print(f"Repository published successfully to {remote_url}")
                return True
            else:
                print(f"Error: {data.get('error', 'Unknown error')}")
        else:
            print(f"Error: Failed to publish repository (Status code: {response.status_code})")
        return False
    
    def edit_file(self, file_path):
        """Open a file in the default editor and save changes"""
        content = self.get_file(file_path)
        if content is None:
            return False
        
        # Create a temporary file
        temp_file = Path(f"/tmp/{os.path.basename(file_path)}")
        with open(temp_file, 'w') as f:
            f.write(content)
        
        # Open the file in the default editor
        editor = os.environ.get('EDITOR', 'nano')
        os.system(f"{editor} {temp_file}")
        
        # Read the updated content
        with open(temp_file, 'r') as f:
            updated_content = f.read()
        
        # Save the updated content
        if updated_content != content:
            return self.save_file(file_path, updated_content, "Updated via CLI editor")
        else:
            print("No changes made.")
            return True

def main():
    """Main entry point for the CLI"""
    parser = argparse.ArgumentParser(description="WebLama Command Line Interface")
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
    
    # Parse arguments
    args = parser.parse_args()
    
    # Initialize CLI
    cli = WebLamaCLI()
    
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
            print("Error: Either --file or --content must be provided")
    elif args.command == "history":
        cli.get_history(args.path)
    elif args.command == "publish":
        cli.publish_repository(args.url, args.name)
    elif args.command == "edit":
        cli.edit_file(args.path)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
