/**
 * PyLogs JavaScript Client
 * 
 * This module provides a JavaScript client for the PyLogs logging system.
 * It communicates with the Python PyLogs bridge to log messages.
 */

class PyLogsClient {
  /**
   * Create a new PyLogsClient.
   * 
   * @param {Object} options - Configuration options
   * @param {string} options.url - URL of the PyLogs bridge API
   * @param {boolean} options.consoleOutput - Whether to also output logs to the console
   * @param {string} options.defaultLevel - Default log level
   */
  constructor(options = {}) {
    this.url = options.url || 'http://localhost:8085';
    this.consoleOutput = options.consoleOutput !== false;
    this.defaultLevel = options.defaultLevel || 'info';
    this.enabled = true;
    this.context = {};
    
    // Check if the bridge is available
    this.checkBridge();
  }

  /**
   * Check if the PyLogs bridge is available.
   * 
   * @returns {Promise<boolean>} - Whether the bridge is available
   */
  async checkBridge() {
    try {
      const response = await fetch(`${this.url}/health`);
      if (response.ok) {
        console.log('PyLogs bridge is available');
        this.enabled = true;
        return true;
      } else {
        console.warn('PyLogs bridge returned an error');
        this.enabled = false;
        return false;
      }
    } catch (error) {
      console.warn('PyLogs bridge is not available:', error.message);
      this.enabled = false;
      return false;
    }
  }

  /**
   * Set global context for all logs.
   * 
   * @param {Object} context - Context to add to all logs
   */
  setContext(context) {
    this.context = { ...this.context, ...context };
  }

  /**
   * Clear global context.
   */
  clearContext() {
    this.context = {};
  }

  /**
   * Log a message with the specified level.
   * 
   * @param {string} level - Log level (debug, info, warning, error, critical)
   * @param {string} message - Message to log
   * @param {Object} context - Additional context for the log
   * @returns {Promise<boolean>} - Whether the log was sent successfully
   */
  async log(level, message, context = {}) {
    // Combine global context with log-specific context
    const combinedContext = { ...this.context, ...context };
    
    // Also log to console if enabled
    if (this.consoleOutput) {
      const consoleMethod = {
        debug: 'debug',
        info: 'info',
        warning: 'warn',
        error: 'error',
        critical: 'error'
      }[level] || 'log';
      
      console[consoleMethod](`[${level.toUpperCase()}]`, message, combinedContext);
    }
    
    // If bridge is not available, just return
    if (!this.enabled) {
      return false;
    }
    
    try {
      const response = await fetch(`${this.url}`, {
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
      
      return response.ok;
    } catch (error) {
      if (this.consoleOutput) {
        console.error('Error sending log to PyLogs bridge:', error.message);
      }
      return false;
    }
  }

  /**
   * Log a debug message.
   * 
   * @param {string} message - Message to log
   * @param {Object} context - Additional context for the log
   * @returns {Promise<boolean>} - Whether the log was sent successfully
   */
  async debug(message, context = {}) {
    return this.log('debug', message, context);
  }

  /**
   * Log an info message.
   * 
   * @param {string} message - Message to log
   * @param {Object} context - Additional context for the log
   * @returns {Promise<boolean>} - Whether the log was sent successfully
   */
  async info(message, context = {}) {
    return this.log('info', message, context);
  }

  /**
   * Log a warning message.
   * 
   * @param {string} message - Message to log
   * @param {Object} context - Additional context for the log
   * @returns {Promise<boolean>} - Whether the log was sent successfully
   */
  async warning(message, context = {}) {
    return this.log('warning', message, context);
  }

  /**
   * Log an error message.
   * 
   * @param {string} message - Message to log
   * @param {Object} context - Additional context for the log
   * @returns {Promise<boolean>} - Whether the log was sent successfully
   */
  async error(message, context = {}) {
    return this.log('error', message, context);
  }

  /**
   * Log a critical message.
   * 
   * @param {string} message - Message to log
   * @param {Object} context - Additional context for the log
   * @returns {Promise<boolean>} - Whether the log was sent successfully
   */
  async critical(message, context = {}) {
    return this.log('critical', message, context);
  }
}

// Create a global instance with default settings
const loglama = new PyLogsClient();

// Export both the class and the default instance
export { PyLogsClient, loglama as default };
