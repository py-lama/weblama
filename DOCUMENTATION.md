# WebLama Documentation

## Table of Contents

1. [Introduction](#introduction)
2. [Installation](#installation)
3. [Getting Started](#getting-started)
4. [Markdown Editor](#markdown-editor)
5. [Python Code Execution](#python-code-execution)
6. [Auto-Fixing and Auto-Commit](#auto-fixing-and-auto-commit)
7. [Git Integration](#git-integration)
8. [Mermaid Diagrams](#mermaid-diagrams)
9. [Configuration](#configuration)
10. [Troubleshooting](#troubleshooting)
11. [API Reference](#api-reference)

## Introduction

WebLama is a web-based Markdown editor with integrated Python code execution, automatic code fixing, and Git version control. It's designed to make it easy to create, edit, and share documents that contain executable Python code blocks and Mermaid diagrams.

## Installation

### Prerequisites

- Python 3.8 or higher
- Git
- pip (Python package manager)

### Installation Steps

```bash
# Clone the repository
git clone https://github.com/py-lama/pylama.git
cd py-lama/weblama

# Install the package
pip install -e .
```

## Getting Started

### Starting the Web Server

Once installed, you can start the WebLama server using the following command:

```bash
weblama
```

This will start the server on the default host (localhost) and port (5000). You can customize these settings:

```bash
# Specify host and port
weblama --host 0.0.0.0 --port 8080

# Enable debug mode
weblama --debug
```

After starting the server, open your browser and navigate to http://localhost:5000 (or your specified host/port).

## Markdown Editor

### Interface Overview

The WebLama interface consists of:

- **Editor Panel**: Left side, where you write Markdown content
- **Preview Panel**: Right side, showing the rendered Markdown
- **Toolbar**: Top of the editor, with formatting buttons and file operations
- **Status Bar**: Bottom of the editor, showing current status and notifications

### Markdown Syntax

WebLama supports standard Markdown syntax plus some extensions:

- **Headers**: Use `#` for headers (e.g., `# Heading 1`, `## Heading 2`)
- **Emphasis**: Use `*italic*` for *italic* and `**bold**` for **bold**
- **Lists**: Use `-` or `*` for unordered lists, and `1.`, `2.`, etc. for ordered lists
- **Links**: Use `[text](url)` for links
- **Images**: Use `![alt text](image-url)` for images
- **Code**: Use `` `code` `` for inline code and triple backticks for code blocks
- **Tables**: Use Markdown table syntax
- **Blockquotes**: Use `>` for blockquotes

## Python Code Execution

### Creating Python Code Blocks

To create a Python code block, use triple backticks with the `python` language identifier:

````
```python
print("Hello, World!")
```
````

### Automatic Execution

All Python code blocks are automatically executed when they appear in the preview pane. You'll see:

1. The original code in the "Code" tab
2. Execution results in the "Console" tab
3. If there are errors, fixed versions in the "Fixed v1" and possibly "Fixed v2" tabs

### Manual Execution

You can also manually execute code blocks by clicking the "Run" button next to each code block. This is useful if you've made changes to the code and want to run it again.

### Execution Environment

Code is executed in a sandboxed environment using Bexy. This provides isolation and security. The execution environment includes:

- Standard Python libraries
- Common data science libraries (if installed)
- Access to the console for output

## Auto-Fixing and Auto-Commit

### Automatic Code Fixing

When a Python code block contains errors, WebLama automatically:

1. Detects the type of error (syntax, runtime, logical)
2. Generates one or more fixed versions of the code
3. Applies the best fix to the code block
4. Shows the fixed code in the editor

### Auto-Commit System

Whenever a code block is fixed, the changes are automatically:

1. Applied to the original code
2. Saved to the document
3. Committed to Git with a descriptive message (e.g., "Auto-fixed Python code block #1")
4. Confirmed with a visual notification

This creates a complete history of all fixes and changes to your document.

## Git Integration

### Version Control

All changes to your documents are automatically tracked in Git. This includes:

- Manual edits you make to the document
- Automatic fixes applied to code blocks
- Changes to Mermaid diagrams

### Viewing History

To view the history of a document:

1. Click the "History" button in the toolbar
2. A modal will appear showing all commits for the current file
3. Click on any commit to view the document at that point in time
4. Use the "Compare" button to see differences between versions

### Publishing

To publish your repository to a Git hosting service:

1. Click the "Publish" button in the toolbar
2. Select the hosting service (GitHub, GitLab, or Bitbucket)
3. Enter your credentials and repository details
4. Click "Publish" to push your repository

## Mermaid Diagrams

### Creating Diagrams

To create a Mermaid diagram, use triple backticks with the `mermaid` language identifier:

````
```mermaid
graph TD;
    A-->B;
    A-->C;
    B-->D;
    C-->D;
```
````

### Diagram Types

WebLama supports all Mermaid diagram types, including:

- Flowcharts
- Sequence diagrams
- Class diagrams
- State diagrams
- Entity-Relationship diagrams
- User Journey diagrams
- Gantt charts
- Pie charts

### Editing Diagrams

Diagrams are edited directly in the Markdown editor. As you type, the preview updates in real-time to show your changes.

## Configuration

### Server Configuration

You can configure the WebLama server using command-line options:

```bash
weblama --host 0.0.0.0 --port 8080 --debug
```

Available options:

- `--host`: The host address to bind to (default: 127.0.0.1)
- `--port`: The port to listen on (default: 5000)
- `--debug`: Enable debug mode (default: False)

### Git Configuration

WebLama uses your global Git configuration for commits. Make sure your Git user name and email are configured:

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## Troubleshooting

### Common Issues

#### Python Code Execution Fails

- **Issue**: Python code blocks fail to execute
- **Solution**: Check that Bexy is properly installed and configured

#### Git Integration Issues

- **Issue**: Git commits fail
- **Solution**: Ensure Git is installed and your user name and email are configured

#### Mermaid Diagrams Not Rendering

- **Issue**: Mermaid diagrams don't appear in the preview
- **Solution**: Check that the Mermaid syntax is correct

### Getting Help

If you encounter issues not covered in this documentation:

1. Check the GitHub repository for known issues
2. Open a new issue on GitHub with details about your problem
3. Join the community discussion on the project's discussion forum

## API Reference

### REST API Endpoints

WebLama provides a REST API for programmatic access:

#### Code Execution

- `POST /api/execute`: Execute Python code
  - Request body: `{"code": "print('Hello')"}`
  - Response: `{"success": true, "output": "Hello\n", "error": null, "fixed_code": null}`

#### File Operations

- `POST /api/save`: Save a Markdown document
  - Request body: `{"content": "# Title", "filename": "document.md"}`
  - Response: `{"success": true}`

#### Git Operations

- `POST /api/git/save`: Save and commit changes
  - Request body: `{"content": "# Updated", "filename": "document.md", "message": "Update document"}`
  - Response: `{"success": true}`

- `POST /api/git/history`: Get file history
  - Request body: `{"filename": "document.md"}`
  - Response: `{"success": true, "history": [...]}`

- `GET /api/git/content`: Get file content at a specific commit
  - Query parameters: `?commit=<commit_hash>&filename=<filename>`
  - Response: `{"success": true, "content": "..."}`

- `POST /api/git/publish`: Publish repository
  - Request body: `{"provider": "github", "repo": "username/repo", "token": "..."}`
  - Response: `{"success": true, "url": "https://github.com/username/repo"}`
