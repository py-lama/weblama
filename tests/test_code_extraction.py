#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Tests for the code extraction functionality in WebLama.
"""

import os
import sys
import unittest
from pathlib import Path

# Add the parent directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import WebLama modules
from weblama.app import extract_python_code_blocks


class TestCodeExtraction(unittest.TestCase):
    """Test cases for the code extraction functionality."""
    
    def test_extract_python_code_blocks(self):
        """Test extracting Python code blocks from markdown content."""
        # Test markdown content with Python code blocks
        markdown_content = """
# Test Markdown

```python
# Block 1
print("Hello, World!")
```

Some text in between.

```python
# Block 2
def add(a, b):
    return a + b

print(add(1, 2))
```

```javascript
// This is JavaScript, not Python
console.log("Hello, World!");
```

```python
# Block 3
for i in range(5):
    print(i)
```
"""
        
        # Extract Python code blocks
        code_blocks = extract_python_code_blocks(markdown_content)
        
        # Check the number of extracted blocks
        self.assertEqual(len(code_blocks), 3, "Should extract 3 Python code blocks")
        
        # Check the content of the first block
        self.assertEqual(code_blocks[0][0], "# Block 1\nprint(\"Hello, World!\")")
        
        # Check the content of the second block
        self.assertEqual(code_blocks[1][0], "# Block 2\ndef add(a, b):\n    return a + b\n\nprint(add(1, 2))")
        
        # Check the content of the third block
        self.assertEqual(code_blocks[2][0], "# Block 3\nfor i in range(5):\n    print(i)")
    
    def test_extract_no_python_code_blocks(self):
        """Test extracting Python code blocks from markdown content with no Python blocks."""
        # Test markdown content with no Python code blocks
        markdown_content = """
# Test Markdown

```javascript
// This is JavaScript, not Python
console.log("Hello, World!");
```

```sql
-- This is SQL, not Python
SELECT * FROM users;
```
"""
        
        # Extract Python code blocks
        code_blocks = extract_python_code_blocks(markdown_content)
        
        # Check the number of extracted blocks
        self.assertEqual(len(code_blocks), 0, "Should extract 0 Python code blocks")
    
    def test_extract_python_code_blocks_with_empty_blocks(self):
        """Test extracting Python code blocks from markdown content with empty blocks."""
        # Test markdown content with empty Python code blocks
        markdown_content = """
# Test Markdown

```python

```

```python
# Block 2
print("Hello, World!")
```
"""
        
        # Extract Python code blocks
        code_blocks = extract_python_code_blocks(markdown_content)
        
        # Check the number of extracted blocks
        self.assertEqual(len(code_blocks), 2, "Should extract 2 Python code blocks")
        
        # Check the content of the first block
        self.assertEqual(code_blocks[0][0], "")
        
        # Check the content of the second block
        self.assertEqual(code_blocks[1][0], "# Block 2\nprint(\"Hello, World!\")")


if __name__ == '__main__':
    unittest.main()
