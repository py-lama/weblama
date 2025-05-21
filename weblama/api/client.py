import os
import requests
from urllib.parse import urljoin
from weblama.logger import logger

class APIClient:
    """Client for interacting with the various microservice APIs."""
    
    def __init__(self):
        """Initialize the API client with service URLs from environment variables."""
        self.pybox_api_url = os.getenv("PYBOX_API_URL", "http://localhost:8000")
        self.pyllm_api_url = os.getenv("PYLLM_API_URL", "http://localhost:8001")
        self.pylama_api_url = os.getenv("PYLAMA_API_URL", "http://localhost:8002")
    
    def _make_request(self, method, url, service, endpoint, **kwargs):
        """Make a request to a service API.
        
        Args:
            method (str): HTTP method (get, post, etc.)
            url (str): Base URL for the service
            service (str): Service name for logging
            endpoint (str): API endpoint
            **kwargs: Additional arguments for requests
            
        Returns:
            dict: Response JSON or error information
        """
        full_url = urljoin(url, endpoint)
        try:
            response = getattr(requests, method.lower())(full_url, **kwargs)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            logger.error(f"Error calling {service} API ({endpoint}): {str(e)}")
            return {"error": str(e), "success": False}
    
    # PyBox API methods
    def execute_code(self, code, timeout=10):
        """Execute Python code using PyBox API."""
        return self._make_request(
            "post", 
            self.pybox_api_url, 
            "PyBox", 
            "/execute",
            json={"code": code, "timeout": timeout}
        )
    
    def install_dependency(self, package_name, version=None):
        """Install a Python package in the sandbox environment."""
        return self._make_request(
            "post", 
            self.pybox_api_url, 
            "PyBox", 
            "/dependencies/install",
            json={"package_name": package_name, "version": version}
        )
    
    # PyLLM API methods
    def fix_code(self, code, error_message, is_logic_error=False, attempt=1):
        """Fix Python code using PyLLM API."""
        return self._make_request(
            "post", 
            self.pyllm_api_url, 
            "PyLLM", 
            "/fix-code",
            json={
                "code": code,
                "error_message": error_message,
                "is_logic_error": is_logic_error,
                "attempt": attempt
            }
        )
    
    def query_llm(self, prompt, model="llama3", max_tokens=1000):
        """Query an LLM model with a prompt."""
        return self._make_request(
            "post", 
            self.pyllm_api_url, 
            "PyLLM", 
            "/query",
            json={"prompt": prompt, "model": model, "max_tokens": max_tokens}
        )
    
    # PyLama API methods
    def list_ollama_models(self):
        """List all available Ollama models."""
        return self._make_request(
            "get", 
            self.pylama_api_url, 
            "PyLama", 
            "/models"
        )
    
    def query_ollama(self, prompt, model="llama3", temperature=0.7):
        """Query an Ollama model with a prompt."""
        return self._make_request(
            "post", 
            self.pylama_api_url, 
            "PyLama", 
            "/query",
            json={"prompt": prompt, "model": model, "temperature": temperature}
        )
