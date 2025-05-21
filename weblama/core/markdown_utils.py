#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Markdown utilities for WebLama

This module provides utilities for processing markdown content, particularly
for extracting and updating Python code blocks.
"""

import re
from weblama.logger import logger


def extract_python_code_blocks(markdown_content):
    """Extract Python code blocks from markdown content.
    
    Args:
        markdown_content (str): The content of the markdown file.
        
    Returns:
        list: A list of tuples (code_block, start_pos, end_pos) containing the Python code blocks
              and their positions in the original markdown.
    """
    # Regular expression to match Python code blocks
    pattern = r'```python\n([\s\S]*?)\n```'
    
    # Find all Python code blocks
    code_blocks = []
    for match in re.finditer(pattern, markdown_content):
        code_block = match.group(1)
        start_pos = match.start()
        end_pos = match.end()
        code_blocks.append((code_block, start_pos, end_pos))
    
    logger.debug(f"Extracted {len(code_blocks)} Python code blocks from markdown")
    return code_blocks


def update_markdown_with_fixed_code(markdown_content, code_blocks, fixed_codes):
    """Update the markdown content with fixed code blocks.
    
    Args:
        markdown_content (str): The original markdown content.
        code_blocks (list): List of tuples (code_block, start_pos, end_pos).
        fixed_codes (list): List of fixed code blocks.
        
    Returns:
        str: The updated markdown content.
    """
    # Create a copy of the markdown content
    updated_content = markdown_content
    
    # Offset to adjust positions after replacements
    offset = 0
    
    # Replace each code block with its fixed version
    for i, ((code_block, start_pos, end_pos), fixed_code) in enumerate(zip(code_blocks, fixed_codes)):
        if fixed_code and fixed_code != code_block:
            # Calculate the new positions with offset
            new_start = start_pos + offset
            new_end = end_pos + offset
            
            # Replace the code block
            old_block = updated_content[new_start:new_end]
            new_block = f"```python\n{fixed_code}\n```"
            updated_content = updated_content[:new_start] + new_block + updated_content[new_end:]
            
            # Update the offset
            offset += len(new_block) - len(old_block)
            
            logger.debug(f"Updated code block {i+1} in markdown")
    
    return updated_content
