# PyLogs Integration in WebLama

This document explains how PyLogs has been integrated into the WebLama component of the PyLama ecosystem.

## Overview

WebLama now includes a comprehensive logging system that leverages PyLogs for advanced logging capabilities. The integration consists of:

1. A Python bridge that provides a logging API for the JavaScript frontend
2. JavaScript utilities for logging from the frontend
3. Configuration options in `.env` files

## Components

### 1. Python Bridge (`weblama/bridge.py`)

The Python bridge provides an HTTP API that the JavaScript frontend can use to send logs to PyLogs. It:

- Initializes PyLogs with the configuration from environment variables
- Exposes an HTTP server on port 8085 (configurable)
- Accepts log messages via HTTP POST requests
- Forwards logs to PyLogs with appropriate levels and context

### 2. JavaScript Logger (`static/js/utils/logger.js`)

The JavaScript logger provides a unified logging interface for the WebLama frontend. It:

- Automatically initializes from the server configuration
- Provides methods for different log levels (debug, info, warning, error, critical)
- Supports context information for structured logging
- Falls back to console logging if the PyLogs bridge is not available

### 3. Server Integration (`server.js`)

The Node.js server has been updated to:

- Start the PyLogs bridge when the server starts (if enabled)
- Provide a proxy endpoint for logging from the frontend
- Include PyLogs configuration in the server configuration API

## Configuration

PyLogs integration can be configured through environment variables in the `.env` file:

```
# PyLogs Integration
WEBLAMA_PYLOGS_ENABLED=true     # Enable or disable the PyLogs bridge
WEBLAMA_PYLOGS_PORT=8085        # Port for the PyLogs bridge server
WEBLAMA_PYLOGS_HOST=127.0.0.1   # Host for the PyLogs bridge server

# PyLogs configuration
WEBLAMA_LOG_LEVEL=INFO          # Logging level
WEBLAMA_LOG_DIR=./logs          # Directory for log files
WEBLAMA_DB_LOGGING=true         # Enable database logging
WEBLAMA_DB_PATH=./logs/weblama.db  # Path to the SQLite database for logs
WEBLAMA_JSON_LOGS=false         # Use JSON format for logs
```

## Using the Logger in JavaScript

The logger is automatically initialized when the page loads. You can use it in your JavaScript code like this:

```javascript
// Log a message with different levels
WebLamaLogger.debug('Debug message');
WebLamaLogger.info('Info message');
WebLamaLogger.warning('Warning message');
WebLamaLogger.error('Error message');
WebLamaLogger.critical('Critical message');

// Add context information
WebLamaLogger.info('User action', { 
  action: 'save_file', 
  filename: 'document.md',
  user: 'anonymous' 
});

// Set global context for all logs
WebLamaLogger.setContext({
  page: 'editor',
  session: 'abc123'
});
```

## Benefits

1. **Consistent Logging**: All PyLama components now use the same logging system
2. **Structured Logging**: Context information makes logs more useful for debugging
3. **Multiple Outputs**: Logs can be sent to console, files, and database
4. **Query Capability**: Database logging allows for advanced querying and analysis
5. **Early Environment Loading**: Environment variables are loaded before any other libraries

## Troubleshooting

If you encounter issues with the PyLogs integration:

1. Check if the PyLogs bridge is running (look for messages in the server console)
2. Verify that the configuration in `.env` is correct
3. Check the logs directory for log files
4. Try disabling database logging if there are performance issues

## Future Improvements

1. Add a web interface for viewing and querying logs
2. Implement log rotation for better disk space management
3. Add support for remote logging to a central server
4. Integrate with monitoring systems for alerts on critical errors
