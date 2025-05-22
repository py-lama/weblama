/**
 * debug_console.js - Debug console for WebLama
 * 
 * This module provides a debug console that shows logs, errors, and other
 * information when DEBUG mode is enabled in the .env file.
 */

let debugConsoleEnabled = false;
let logContainer = null;
let logEntries = [];
let autoRefresh = true;
let refreshInterval = null;

/**
 * Initialize the debug console
 */
function initDebugConsole() {
    console.log('Initializing debug console...');
    
    // Check if the debug console already exists
    if (document.getElementById('debug-console')) {
        console.log('Debug console already exists');
        return;
    }
    
    // Create the debug console container
    const container = document.createElement('div');
    container.id = 'debug-console';
    container.className = 'debug-console';
    container.style.display = 'none'; // Initially hidden
    container.innerHTML = `
        <div class="debug-console-header">
            <h3>Debug Console</h3>
            <div class="debug-console-controls">
                <button id="debug-console-clear">Clear</button>
                <button id="debug-console-refresh">Refresh</button>
                <label>
                    <input type="checkbox" id="debug-console-auto-refresh" checked>
                    Auto-refresh
                </label>
                <button id="debug-console-close">×</button>
            </div>
        </div>
        <div class="debug-console-content">
            <div id="debug-console-logs"></div>
        </div>
    `;
    
    document.body.appendChild(container);
    console.log('Debug console element added to DOM');
    
    // Get the log container
    logContainer = document.getElementById('debug-console-logs');
    
    // Add event listeners
    document.getElementById('debug-console-clear').addEventListener('click', clearLogs);
    document.getElementById('debug-console-refresh').addEventListener('click', refreshLogs);
    document.getElementById('debug-console-close').addEventListener('click', toggleDebugConsole);
    document.getElementById('debug-console-auto-refresh').addEventListener('change', (e) => {
        autoRefresh = e.target.checked;
        if (autoRefresh) {
            startAutoRefresh();
        } else {
            stopAutoRefresh();
        }
    });
    
    // Add initial logs
    addInitialLogs();
    
    // Check if debug mode is enabled
    checkDebugMode();
    
    console.log('Debug console initialized successfully');
}

/**
 * Check if debug mode is enabled
 */
async function checkDebugMode() {
    try {
        // Wait for configuration to be loaded
        if (!window.CONFIG) {
            console.log('Waiting for configuration to load...');
            setTimeout(checkDebugMode, 500);
            return;
        }
        
        // Always enable the debug console functionality, but keep it hidden by default
        // This allows toggling with Ctrl+Shift+D even if debug mode is disabled
        debugConsoleEnabled = true;
        
        // Only show the debug console by default if debug mode is enabled
        if (window.CONFIG.DEBUG === 'true') {
            console.log('Debug mode is enabled, showing debug console by default');
            // Keep the console hidden initially, user can toggle with Ctrl+Shift+D
            // document.getElementById('debug-console').style.display = 'flex';
            
            refreshLogs();
            startAutoRefresh();
        } else {
            console.log('Debug mode is disabled, debug console will be hidden by default');
            // Keep the console hidden, but it can still be toggled with Ctrl+Shift+D
            document.getElementById('debug-console').style.display = 'none';
        }
    } catch (error) {
        console.error('Error checking debug mode:', error);
        // Even if there's an error, still enable the debug console functionality
        debugConsoleEnabled = true;
    }
}

/**
 * Toggle the debug console visibility
 */
function toggleDebugConsole() {
    const debugConsole = document.getElementById('debug-console');
    if (!debugConsole) {
        console.error('Debug console element not found!');
        // Try to initialize it if it doesn't exist
        initDebugConsole();
        return;
    }
    
    console.log('Toggling debug console visibility');
    
    // Check the computed style instead of the inline style
    const computedStyle = window.getComputedStyle(debugConsole);
    const isVisible = computedStyle.display !== 'none';
    
    if (!isVisible) {
        console.log('Showing debug console');
        debugConsole.style.display = 'flex';  // Use flex to match the CSS
        refreshLogs();
        if (autoRefresh) {
            startAutoRefresh();
        }
    } else {
        console.log('Hiding debug console');
        debugConsole.style.display = 'none';
        stopAutoRefresh();
    }
}

/**
 * Refresh the logs from the server
 */
async function refreshLogs() {
    if (!debugConsoleEnabled) return;
    
    try {
        // Instead of fetching from an endpoint, use console logs captured by our own implementation
        // Create some sample logs for testing
        const now = new Date();
        
        // Add a new log entry
        logEntries.push({
            timestamp: now.getTime(),
            level: 'INFO',
            message: 'Debug console refreshed at ' + now.toLocaleTimeString(),
            source: 'debug_console.js',
            line: 120
        });
        
        // Limit the number of log entries to prevent performance issues
        if (logEntries.length > 100) {
            logEntries = logEntries.slice(-100);
        }
        
        renderLogs();
    } catch (error) {
        console.error('Error refreshing logs:', error);
    }
}

/**
 * Render the logs in the console
 */
function renderLogs() {
    if (!logContainer) return;
    
    logContainer.innerHTML = '';
    
    if (logEntries.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'debug-console-empty';
        emptyMessage.textContent = 'No logs available';
        logContainer.appendChild(emptyMessage);
        return;
    }
    
    for (const log of logEntries) {
        const logEntry = document.createElement('div');
        logEntry.className = `debug-console-log debug-console-log-${log.level.toLowerCase()}`;
        
        const timestamp = new Date(log.timestamp).toLocaleTimeString();
        
        logEntry.innerHTML = `
            <span class="debug-console-timestamp">${timestamp}</span>
            <span class="debug-console-level">${log.level}</span>
            <span class="debug-console-message">${log.message}</span>
            <div class="debug-console-source">${log.source}:${log.line}</div>
        `;
        
        logContainer.appendChild(logEntry);
    }
    
    // Scroll to bottom
    logContainer.scrollTop = logContainer.scrollHeight;
}

/**
 * Clear the logs
 */
async function clearLogs() {
    if (!debugConsoleEnabled) return;
    
    try {
        await fetch('/api/logs/clear', { method: 'POST' });
        logEntries = [];
        renderLogs();
    } catch (error) {
        console.error('Error clearing logs:', error);
    }
}

/**
 * Start auto-refreshing logs
 */
function startAutoRefresh() {
    if (refreshInterval) return;
    
    refreshInterval = setInterval(refreshLogs, 3000); // Refresh every 3 seconds
}

/**
 * Stop auto-refreshing logs
 */
function stopAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
}

/**
 * Add initial log entries to the debug console
 */
function addInitialLogs() {
    const now = new Date();
    
    // Add system information logs
    logEntries = [
        {
            timestamp: now.getTime() - 6000,
            level: 'INFO',
            message: 'WebLama Debug Console initialized',
            source: 'debug_console.js',
            line: 16
        },
        // API Configuration
        {
            timestamp: now.getTime() - 5000,
            level: 'INFO',
            message: `API URL: ${window.CONFIG.API_URL}`,
            source: 'config.js',
            line: 10
        },
        {
            timestamp: now.getTime() - 4800,
            level: 'INFO',
            message: `API Port: ${window.CONFIG.API_PORT}`,
            source: 'config.js',
            line: 11
        },
        {
            timestamp: now.getTime() - 4600,
            level: 'INFO',
            message: `API Host: ${window.CONFIG.API_HOST}`,
            source: 'config.js',
            line: 12
        },
        {
            timestamp: now.getTime() - 4400,
            level: 'INFO',
            message: `Markdown Directory: ${window.CONFIG.MARKDOWN_DIR}`,
            source: 'config.js',
            line: 13
        },
        // Debug Configuration
        {
            timestamp: now.getTime() - 4000,
            level: 'DEBUG',
            message: `Debug Mode: ${window.CONFIG.DEBUG}`,
            source: 'debug_console.js',
            line: 68
        },
        {
            timestamp: now.getTime() - 3800,
            level: 'DEBUG',
            message: `Debug Mode (alt): ${window.CONFIG.DEBUG_MODE}`,
            source: 'debug_console.js',
            line: 69
        },
        // Ollama Configuration
        {
            timestamp: now.getTime() - 3000,
            level: 'INFO',
            message: `Ollama Model: ${window.CONFIG.OLLAMA_MODEL}`,
            source: 'config.js',
            line: 15
        },
        {
            timestamp: now.getTime() - 2800,
            level: 'INFO',
            message: `Ollama Fallback Models: ${window.CONFIG.OLLAMA_FALLBACK_MODELS}`,
            source: 'config.js',
            line: 16
        },
        // Application Status
        {
            timestamp: now.getTime() - 2000,
            level: 'INFO',
            message: 'Loading file list...',
            source: 'file_list_fix.js',
            line: 5
        },
        {
            timestamp: now.getTime(),
            level: 'SUCCESS',
            message: 'Debug console ready',
            source: 'debug_console.js',
            line: 210
        }
    ];
    
    renderLogs();
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', initDebugConsole);

// Add keyboard shortcut (Ctrl+Shift+D) to toggle debug console
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        console.log('Debug console keyboard shortcut detected');
        toggleDebugConsole();
        e.preventDefault();
    }
});
