/**
 * WebLama Logger
 * 
 * This module provides a unified logging interface for WebLama.
 * It will use the PyLogs bridge if available, otherwise fallback to console logging.
 */

// Configuration
let config = {
  enabled: false,
  useServer: false,
  serverUrl: '/log',
  consoleOutput: true,
  defaultLevel: 'info'
};

// Context information
let context = {
  app: 'weblama-frontend',
  version: '1.0.0'
};

/**
 * Initialize the logger with configuration.
 * 
 * @param {Object} options - Configuration options
 */
function initLogger(options = {}) {
  // Merge options with defaults
  config = { ...config, ...options };
  
  if (config.enabled) {
    console.log('Logger initialized:', config.useServer ? 'using server' : 'console only');
  }
}

/**
 * Set global context for all logs.
 * 
 * @param {Object} newContext - Context to add to all logs
 */
function setContext(newContext) {
  context = { ...context, ...newContext };
}

/**
 * Log a message with the specified level.
 * 
 * @param {string} level - Log level (debug, info, warning, error, critical)
 * @param {string} message - Message to log
 * @param {Object} additionalContext - Additional context for the log
 */
async function log(level, message, additionalContext = {}) {
  if (!config.enabled) return;
  
  // Combine global context with log-specific context
  const combinedContext = { ...context, ...additionalContext };
  
  // Always log to console if enabled
  if (config.consoleOutput) {
    const consoleMethod = {
      debug: 'debug',
      info: 'info',
      warning: 'warn',
      error: 'error',
      critical: 'error'
    }[level] || 'log';
    
    console[consoleMethod](`[${level.toUpperCase()}]`, message, combinedContext);
  }
  
  // If server logging is enabled, send to server
  if (config.useServer) {
    try {
      const response = await fetch(config.serverUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          level,
          message,
          context: combinedContext
        })
      });
      
      if (!response.ok) {
        console.error('Error sending log to server:', await response.text());
      }
    } catch (error) {
      console.error('Error sending log to server:', error.message);
    }
  }
}

// Convenience methods for different log levels
const debug = (message, context) => log('debug', message, context);
const info = (message, context) => log('info', message, context);
const warning = (message, context) => log('warning', message, context);
const error = (message, context) => log('error', message, context);
const critical = (message, context) => log('critical', message, context);

// Export the logger API
window.WebLamaLogger = {
  init: initLogger,
  setContext,
  log,
  debug,
  info,
  warning,
  error,
  critical
};

// Auto-initialize from config if available
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await fetch('/config');
    if (response.ok) {
      const config = await response.json();
      
      // Initialize logger with config
      WebLamaLogger.init({
        enabled: true,
        useServer: config.LOGLAMA_ENABLED === true,
        serverUrl: '/log',
        consoleOutput: true
      });
      
      // Set initial context
      WebLamaLogger.setContext({
        apiUrl: config.API_URL,
        debug: config.DEBUG === 'true'
      });
      
      WebLamaLogger.info('WebLama logger initialized');
    }
  } catch (error) {
    console.error('Error initializing WebLama logger:', error.message);
  }
});
