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
    // Create the debug console container
    const container = document.createElement('div');
    container.id = 'debug-console';
    container.className = 'debug-console';
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
    
    // Check if debug mode is enabled
    checkDebugMode();
}

/**
 * Check if debug mode is enabled
 */
async function checkDebugMode() {
    try {
        const response = await fetch('/api/logs');
        
        if (response.status === 200) {
            debugConsoleEnabled = true;
            document.getElementById('debug-console').style.display = 'block';
            refreshLogs();
            startAutoRefresh();
        } else {
            debugConsoleEnabled = false;
            document.getElementById('debug-console').style.display = 'none';
        }
    } catch (error) {
        console.error('Error checking debug mode:', error);
        debugConsoleEnabled = false;
        document.getElementById('debug-console').style.display = 'none';
    }
}

/**
 * Toggle the debug console visibility
 */
function toggleDebugConsole() {
    const console = document.getElementById('debug-console');
    if (console.style.display === 'none') {
        console.style.display = 'block';
        refreshLogs();
        if (autoRefresh) {
            startAutoRefresh();
        }
    } else {
        console.style.display = 'none';
        stopAutoRefresh();
    }
}

/**
 * Refresh the logs from the server
 */
async function refreshLogs() {
    if (!debugConsoleEnabled) return;
    
    try {
        const response = await fetch('/api/logs');
        const data = await response.json();
        
        if (data.logs) {
            logEntries = data.logs;
            renderLogs();
        }
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

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', initDebugConsole);

// Add keyboard shortcut (Ctrl+Shift+D) to toggle debug console
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        toggleDebugConsole();
        e.preventDefault();
    }
});
