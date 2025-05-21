#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Code execution module for WebLama

This module provides functionality for executing and fixing Python code.
"""

from weblama.core.sandbox import PythonSandbox
from weblama.core.llm import OllamaRunner
from weblama.logger import logger, log_code_execution


def execute_code_with_pybox(code):
    """Execute code using PyBox sandbox.
    
    Args:
        code (str): The Python code to execute.
        
    Returns:
        dict: The execution result.
    """
    log_code_execution('execute_code_with_pybox', code[:100] + '...' if len(code) > 100 else code)
    
    # Create a PythonSandbox instance
    sandbox = PythonSandbox()
    
    # Execute the code
    result = sandbox.run_code(code)
    
    return result


def fix_code_with_pyllm(code, error_message, is_logic_error=False):
    """Fix code using PyLLM.
    
    Args:
        code (str): The Python code with issues.
        error_message (str): The error message from execution.
        is_logic_error (bool): Whether the error is a logical error.
        
    Returns:
        str: The fixed code.
    """
    log_code_execution('fix_code_with_pyllm', 
                     f"Code: {code[:50]}... Error: {error_message[:50]}... Logic Error: {is_logic_error}")
    
    # Create an OllamaRunner instance
    runner = OllamaRunner()
    
    # Prepare the prompt for fixing the code
    if is_logic_error:
        prompt = f"""Fix the following Python code that has a logical error:

```python
{code}
```

The code runs without errors but produces incorrect results. The issue is: {error_message}

Specifically, look for comments that indicate where the logical error is and fix that part.

Please provide only the fixed code as a Python code block. Make sure to include all necessary imports.

Your fixed code should be complete and runnable."""
    else:
        prompt = f"""Fix the following Python code that has an error:

```python
{code}
```

Error message: {error_message}

Please provide only the fixed code as a Python code block. Make sure to include all necessary imports.

If the error is about missing imports, make sure to add the appropriate import statements at the top of the code.

Your fixed code should be complete and runnable."""
    
    # Generate the fixed code
    response = runner.query_ollama(prompt)
    
    # Extract the fixed code from the response
    fixed_code = runner.extract_python_code(response)
    
    # If the fixed code is empty or too short, try to extract it differently
    if not fixed_code or len(fixed_code) < 10:
        # Try to extract any code-like content from the response
        code_lines = []
        for line in response.split('\n'):
            if line.strip() and not line.startswith('#') and not line.startswith('```'):
                code_lines.append(line)
        if code_lines:
            fixed_code = '\n'.join(code_lines)
    
    logger.debug(f"Generated fixed code of length {len(fixed_code)}")
    return fixed_code


def generate_alternative_fix(code, error, attempt=1):
    """Generate an alternative fix for code that still has errors.
    
    This function creates different fix approaches based on the attempt number
    and the specific error message.
    
    Args:
        code (str): The code from the previous fix attempt
        error (str): The error message from the previous fix attempt
        attempt (int): The current fix attempt number (2 or 3)
        
    Returns:
        str: The new fixed code, or None if no fix could be generated
    """
    log_code_execution('generate_alternative_fix', 
                     f"Attempt: {attempt}, Code: {code[:50]}... Error: {error[:50]}...")
    
    # For the second attempt, focus on specific error types
    if attempt == 2:
        # Create a more detailed prompt based on the error type
        if "ModuleNotFoundError" in error or "ImportError" in error:
            prompt = f"""Fix the following Python code that has an import error:

```python
{code}
```

Error message: {error}

Please focus on fixing the imports. Consider using standard library alternatives if a package is not available.
Provide only the fixed code as a Python code block."""
        elif "SyntaxError" in error:
            prompt = f"""Fix the following Python code that has a syntax error:

```python
{code}
```

Error message: {error}

Please carefully check for syntax issues like missing colons, parentheses, or indentation.
Provide only the fixed code as a Python code block."""
        else:
            prompt = f"""Fix the following Python code that still has an error after a previous fix attempt:

```python
{code}
```

Error message: {error}

Please try a completely different approach to fix this code.
Provide only the fixed code as a Python code block."""
    
    # For the third attempt, try a more radical approach
    elif attempt == 3:
        prompt = f"""This Python code has been fixed twice but still has errors:

```python
{code}
```

Error message: {error}

Please rewrite this code completely from scratch to achieve the same goal but with a simpler approach.
Focus on using only the standard library and basic Python features.
Provide only the fixed code as a Python code block."""
    
    else:
        return None
    
    # Generate the fixed code
    runner = OllamaRunner()
    response = runner.query_ollama(prompt)
    fixed_code = runner.extract_python_code(response)
    
    logger.debug(f"Generated alternative fix (attempt {attempt}) of length {len(fixed_code)}")
    return fixed_code
