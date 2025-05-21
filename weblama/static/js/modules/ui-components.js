/**
 * UI Components Module for WebLama
 * 
 * This module provides functions for creating and managing UI components.
 */

/**
 * Create a tabbed interface for a code block
 * 
 * @param {string} blockId - The unique identifier for the code block
 * @param {string} code - The Python code
 * @returns {HTMLElement} - The tabbed interface element
 */
function createTabbedInterface(blockId, code) {
    // Create the container
    const container = document.createElement('div');
    container.className = 'code-block-container';
    container.id = `container-${blockId}`;
    
    // Create the tabs
    const tabs = document.createElement('div');
    tabs.className = 'tabs';
    
    // Create the code tab
    const codeTab = document.createElement('div');
    codeTab.className = 'tab active';
    codeTab.textContent = 'Code';
    codeTab.onclick = () => switchTab(blockId, 'code');
    tabs.appendChild(codeTab);
    
    // Create the console tab
    const consoleTab = document.createElement('div');
    consoleTab.className = 'tab';
    consoleTab.textContent = 'Console';
    consoleTab.onclick = () => switchTab(blockId, 'console');
    tabs.appendChild(consoleTab);
    
    // Create the history tab
    const historyTab = document.createElement('div');
    historyTab.className = 'tab';
    historyTab.textContent = 'History';
    historyTab.onclick = () => switchTab(blockId, 'history');
    tabs.appendChild(historyTab);
    
    // Add the tabs to the container
    container.appendChild(tabs);
    
    // Create the content container
    const contentContainer = document.createElement('div');
    contentContainer.className = 'tab-content';
    
    // Create the code content
    const codeContent = document.createElement('div');
    codeContent.className = 'tab-pane active';
    codeContent.id = `code-${blockId}`;
    
    // Create the code display
    const codeDisplay = document.createElement('pre');
    codeDisplay.className = 'code-display';
    codeDisplay.textContent = code;
    codeContent.appendChild(codeDisplay);
    
    // Create the run button
    const runButton = document.createElement('button');
    runButton.className = 'run-button';
    runButton.textContent = 'Run';
    runButton.onclick = () => executeCodeBlock(blockId);
    codeContent.appendChild(runButton);
    
    // Add the code content to the container
    contentContainer.appendChild(codeContent);
    
    // Create the console content
    const consoleContent = document.createElement('div');
    consoleContent.className = 'tab-pane';
    consoleContent.id = `console-${blockId}`;
    consoleContent.innerHTML = '<div class="console-output">Click Run to execute the code.</div>';
    contentContainer.appendChild(consoleContent);
    
    // Create the history content
    const historyContent = document.createElement('div');
    historyContent.className = 'tab-pane';
    historyContent.id = `history-${blockId}`;
    historyContent.innerHTML = '<div class="history-list">No history available.</div>';
    contentContainer.appendChild(historyContent);
    
    // Add the content container to the main container
    container.appendChild(contentContainer);
    
    return container;
}

/**
 * Switch between tabs in a tabbed interface
 * 
 * @param {string} blockId - The unique identifier for the code block
 * @param {string} tabName - The name of the tab to switch to
 */
function switchTab(blockId, tabName) {
    // Get the container
    const container = document.getElementById(`container-${blockId}`);
    if (!container) return;
    
    // Get all tabs and tab panes
    const tabs = container.querySelectorAll('.tab');
    const tabPanes = container.querySelectorAll('.tab-pane');
    
    // Deactivate all tabs and tab panes
    tabs.forEach(tab => tab.classList.remove('active'));
    tabPanes.forEach(pane => pane.classList.remove('active'));
    
    // Activate the selected tab and tab pane
    const selectedTab = Array.from(tabs).find(tab => tab.textContent.toLowerCase() === tabName);
    const selectedPane = document.getElementById(`${tabName}-${blockId}`);
    
    if (selectedTab) selectedTab.classList.add('active');
    if (selectedPane) selectedPane.classList.add('active');
}

/**
 * Display execution results in the console tab
 * 
 * @param {Object} result - The execution result
 * @param {string} blockId - The unique identifier for the code block
 */
function displayConsoleOutput(result, blockId) {
    // Get the console output element
    const consoleOutput = document.querySelector(`#console-${blockId} .console-output`);
    if (!consoleOutput) return;
    
    // Clear the console output
    consoleOutput.innerHTML = '';
    
    // Display the result
    if (result.success) {
        // Display stdout
        if (result.stdout) {
            const stdoutElement = document.createElement('div');
            stdoutElement.className = 'stdout';
            stdoutElement.innerHTML = escapeHtml(result.stdout).replace(/\n/g, '<br>');
            consoleOutput.appendChild(stdoutElement);
        }
        
        // Display stderr (warnings)
        if (result.stderr) {
            const stderrElement = document.createElement('div');
            stderrElement.className = 'stderr warning';
            stderrElement.innerHTML = escapeHtml(result.stderr).replace(/\n/g, '<br>');
            consoleOutput.appendChild(stderrElement);
        }
        
        // If no output, display a message
        if (!result.stdout && !result.stderr) {
            const noOutputElement = document.createElement('div');
            noOutputElement.className = 'info';
            noOutputElement.textContent = 'Code executed successfully with no output.';
            consoleOutput.appendChild(noOutputElement);
        }
    } else {
        // Display error
        const errorElement = document.createElement('div');
        errorElement.className = 'stderr error';
        errorElement.innerHTML = escapeHtml(result.error_message || result.stderr).replace(/\n/g, '<br>');
        consoleOutput.appendChild(errorElement);
        
        // If there's a fixed code, display a message and create a tab for it
        if (result.fixed_code) {
            const fixedElement = document.createElement('div');
            fixedElement.className = 'fixed-code-message';
            fixedElement.innerHTML = 'A fixed version of the code is available. <button class="apply-fix-button" onclick="applyFixedCode(\'' + blockId + '\', \'fixed1\')">Apply Fix</button>';
            consoleOutput.appendChild(fixedElement);
            
            // Create a tab for the fixed code
            createFixTab(blockId, result.fixed_code, 'fixed1');
        }
    }
    
    // Switch to the console tab
    switchTab(blockId, 'console');
}

/**
 * Create a tab for fixed code
 * 
 * @param {string} blockId - The unique identifier for the code block
 * @param {string} fixedCode - The fixed code
 * @param {string} fixType - The type of fix (e.g., 'fixed1' or 'fixed2')
 */
function createFixTab(blockId, fixedCode, fixType) {
    // Get the container
    const container = document.getElementById(`container-${blockId}`);
    if (!container) return;
    
    // Check if the tab already exists
    const existingTab = container.querySelector(`.tab[data-fix-type="${fixType}"]`);
    if (existingTab) return;
    
    // Get the tabs container
    const tabs = container.querySelector('.tabs');
    
    // Create the fix tab
    const fixTab = document.createElement('div');
    fixTab.className = 'tab fix-tab';
    fixTab.textContent = `Fix ${fixType.replace('fixed', '')}`;
    fixTab.setAttribute('data-fix-type', fixType);
    fixTab.onclick = () => switchTab(blockId, fixType);
    tabs.appendChild(fixTab);
    
    // Get the content container
    const contentContainer = container.querySelector('.tab-content');
    
    // Create the fix content
    const fixContent = document.createElement('div');
    fixContent.className = 'tab-pane';
    fixContent.id = `${fixType}-${blockId}`;
    
    // Create the code display
    const codeDisplay = document.createElement('pre');
    codeDisplay.className = 'code-display';
    codeDisplay.textContent = fixedCode;
    fixContent.appendChild(codeDisplay);
    
    // Create the apply button
    const applyButton = document.createElement('button');
    applyButton.className = 'apply-button';
    applyButton.textContent = 'Apply Fix';
    applyButton.onclick = () => applyFixedCode(blockId, fixType);
    fixContent.appendChild(applyButton);
    
    // Add the fix content to the container
    contentContainer.appendChild(fixContent);
}

/**
 * Show a notification message
 * 
 * @param {string} message - The message to display
 * @param {string} type - The type of notification (info, success, error, warning)
 */
function showNotification(message, type = 'info') {
    // Create the notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add the notification to the container
    const container = document.getElementById('notification-container') || createNotificationContainer();
    container.appendChild(notification);
    
    // Remove the notification after 3 seconds
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            notification.remove();
            
            // Remove the container if it's empty
            if (container.children.length === 0) {
                container.remove();
            }
        }, 300);
    }, 3000);
}

/**
 * Create a notification container
 * 
 * @returns {HTMLElement} - The notification container
 */
function createNotificationContainer() {
    const container = document.createElement('div');
    container.id = 'notification-container';
    document.body.appendChild(container);
    return container;
}

/**
 * Escape HTML special characters
 * 
 * @param {string} text - The text to escape
 * @returns {string} - The escaped text
 */
function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Export all UI functions
export {
    createTabbedInterface,
    switchTab,
    displayConsoleOutput,
    createFixTab,
    showNotification,
    escapeHtml
};
