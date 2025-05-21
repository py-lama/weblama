#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
LLM integration module for WebLama

This module provides integration with language models for code generation and fixing.
"""

from weblama.logger import logger, log_code_execution


class OllamaRunner:
    def __init__(self):
        pass
    
    def query_ollama(self, prompt):
        """Mock implementation of query_ollama.
        
        Args:
            prompt (str): The prompt to send to the language model.
            
        Returns:
            str: The generated code response.
        """
        logger.debug(f"OllamaRunner.query_ollama called with prompt: {prompt[:50]}...")
        print("Using mock code generation")
        
        # Simple rule-based fixes for common issues
        if "missing imports" in prompt or "requests is not defined" in prompt:
            return '''```python
import requests

def get_data_from_api(url):
    response = requests.get(url)
    if response.status_code == 200:
        return response.json()
    else:
        return None

api_url = "https://jsonplaceholder.typicode.com/posts/1"
data = get_data_from_api(api_url)
if data:
    print(f"Title: {data['title']}")
    print(f"Body: {data['body']}")
else:
    print("Failed to fetch data")
```'''
        
        if "syntax error" in prompt and "write_to_file" in prompt:
            return '''```python
# File operations with syntax error - fixed
def write_to_file(filename, content):
    with open(filename, 'w') as file:
        file.write(content)
    print(f"Content written to {filename}")

write_to_file("example.txt", "Hello, this is a test!")
```'''
        
        if "logical error" in prompt and "largest" in prompt:
            return '''```python
# A function to find the largest number in a list - fixed
def find_largest(numbers):
    if not numbers:
        return None
    
    largest = numbers[0]
    for num in numbers:
        # Fixed: changed '<' to '>' to correctly find the largest number
        if num > largest:
            largest = num
    
    return largest

# Test the function
numbers = [5, 10, 3, 8, 15]
result = find_largest(numbers)
print(f"The largest number is: {result}")
```'''
        
        # Default response for other cases
        return '''```python
# Fixed code
print("Hello, World!")
```'''
    
    def extract_python_code(self, response):
        """Extract Python code from a response.
        
        Args:
            response (str): The response from the language model.
            
        Returns:
            str: The extracted Python code.
        """
        if "```python" in response and "```" in response.split("```python")[1]:
            return response.split("```python")[1].split("```")[0].strip()
        return ""
