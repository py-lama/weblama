import os
import logging
import datetime
from logging.handlers import RotatingFileHandler
from flask import request, g

# Configure logging levels based on environment
def get_log_level():
    """Get the log level from environment variables"""
    debug = os.environ.get('DEBUG', 'false').lower() == 'true'
    return logging.DEBUG if debug else logging.INFO

# Create logger
logger = logging.getLogger('weblama')
logger.setLevel(get_log_level())

# Create console handler
console_handler = logging.StreamHandler()
console_handler.setLevel(get_log_level())

# Create file handler for persistent logs
log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs')
os.makedirs(log_dir, exist_ok=True)
file_handler = RotatingFileHandler(
    os.path.join(log_dir, 'weblama.log'),
    maxBytes=10485760,  # 10MB
    backupCount=10
)
file_handler.setLevel(get_log_level())

# Create formatter and add it to the handlers
class RequestFormatter(logging.Formatter):
    def format(self, record):
        # Safely check if we're in a Flask request context
        try:
            from flask import has_request_context
            if has_request_context():
                record.url = getattr(g, 'url', request.path)
                record.remote_addr = getattr(g, 'remote_addr', request.remote_addr)
                record.method = getattr(g, 'method', request.method)
            else:
                record.url = 'No URL'
                record.remote_addr = 'No IP'
                record.method = 'No Method'
        except Exception:
            # If anything goes wrong, use default values
            record.url = 'No URL'
            record.remote_addr = 'No IP'
            record.method = 'No Method'
        return super().format(record)

formatter = RequestFormatter(
    '[%(asctime)s] [%(levelname)s] [%(remote_addr)s] [%(method)s] [%(url)s] - %(message)s'
)
console_handler.setFormatter(formatter)
file_handler.setFormatter(formatter)

# Add the handlers to the logger
logger.addHandler(console_handler)
logger.addHandler(file_handler)

# Browser console handler for debug mode
import logging
class BrowserConsoleHandler(logging.Handler):
    """Custom handler to store logs for browser console"""
    def __init__(self, level=logging.NOTSET):
        super().__init__(level)
        self.logs = []
        self.max_logs = 100  # Maximum number of logs to keep
    
    def emit(self, record):
        log_entry = {
            'timestamp': datetime.datetime.now().isoformat(),
            'level': record.levelname,
            'message': record.getMessage(),
            'source': record.pathname,
            'line': record.lineno
        }
        self.logs.append(log_entry)
        
        # Keep only the last max_logs entries
        if len(self.logs) > self.max_logs:
            self.logs = self.logs[-self.max_logs:]
    
    def get_logs(self):
        return self.logs
    
    def clear(self):
        self.logs = []

# Create browser console handler
browser_handler = BrowserConsoleHandler()

# Add browser handler only in debug mode
if get_log_level() == logging.DEBUG:
    logger.addHandler(browser_handler)

def init_app(app):
    """Initialize the logger with the Flask app"""
    @app.before_request
    def before_request():
        g.url = request.path
        g.remote_addr = request.remote_addr
        g.method = request.method
        
    @app.after_request
    def after_request(response):
        # Log the response status
        logger.info(f"Response status: {response.status_code}")
        return response
    
    # Add endpoint to get logs in debug mode
    @app.route('/api/logs', methods=['GET'])
    def get_logs():
        if get_log_level() == logging.DEBUG:
            return {'logs': browser_handler.get_logs()}
        return {'error': 'Logs only available in debug mode'}, 403
    
    # Add endpoint to clear logs in debug mode
    @app.route('/api/logs/clear', methods=['POST'])
    def clear_logs():
        if get_log_level() == logging.DEBUG:
            browser_handler.clear()
            return {'status': 'success', 'message': 'Logs cleared'}
        return {'error': 'Logs only available in debug mode'}, 403

def log_api_call(endpoint, method, data=None, response=None, error=None):
    """Log API calls with request and response data"""
    log_data = {
        'endpoint': endpoint,
        'method': method
    }
    
    if data:
        log_data['request_data'] = data
    
    if response:
        log_data['response'] = response
    
    if error:
        log_data['error'] = str(error)
        logger.error(f"API call failed: {endpoint}", extra={'data': log_data})
    else:
        logger.info(f"API call: {endpoint}", extra={'data': log_data})

def log_file_operation(operation, filename=None, success=True, error=None):
    """Log file operations with default values for backward compatibility"""
    # Handle case where only operation is provided (for backward compatibility)
    if filename is None:
        filename = 'all_files'
        logger.info(f"File {operation} (using default parameters)")
    elif success:
        logger.info(f"File {operation}: {filename}")
    else:
        logger.error(f"File {operation} failed: {filename} - {error}")

def log_git_operation(operation, details, success, error=None):
    """Log Git operations"""
    if success:
        logger.info(f"Git {operation}: {details}")
    else:
        logger.error(f"Git {operation} failed: {details} - {error}")

def log_code_execution(code_block_index, success, output=None, error=None):
    """Log code execution"""
    if success:
        logger.info(f"Code block {code_block_index} executed successfully")
    else:
        logger.error(f"Code block {code_block_index} execution failed: {error}")
