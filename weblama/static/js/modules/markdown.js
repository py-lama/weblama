/**
 * Markdown Processing Module for WebLama
 * 
 * This module provides functions for processing markdown content.
 */

// Import UI components
import { createTabbedInterface } from './ui-components.js';

// Import code execution functions
import { executeCodeBlock } from './code-execution.js';

/**
 * Update the preview with the current markdown content
 * 
 * @param {CodeMirror} editor - The CodeMirror editor instance
 */
function updatePreview(editor) {
    // Get the preview element
    const preview = document.getElementById('preview');
    if (!preview) return;
    
    // Get the markdown content
    const markdownContent = editor.getValue();
    
    // Convert markdown to HTML
    const html = marked.parse(markdownContent);
    
    // Update the preview
    preview.innerHTML = html;
    
    // Initialize Mermaid diagrams
    if (typeof mermaid !== 'undefined') {
        mermaid.init(undefined, document.querySelectorAll('.language-mermaid'));
    }
    
    // Convert Python code blocks to interactive blocks
    convertPythonCodeBlocks();
}

/**
 * Convert Python code blocks to interactive tabbed interfaces
 */
function convertPythonCodeBlocks() {
    // Get all code blocks
    const codeBlocks = document.querySelectorAll('pre > code.language-python');
    
    // Process each code block
    codeBlocks.forEach((codeBlock, index) => {
        // Get the parent pre element
        const preElement = codeBlock.parentElement;
        if (!preElement) return;
        
        // Get the code
        const code = codeBlock.textContent;
        
        // Create a unique ID for the block
        const blockId = index.toString();
        
        // Create a tabbed interface
        const tabbedInterface = createTabbedInterface(blockId, code);
        
        // Replace the pre element with the tabbed interface
        preElement.replaceWith(tabbedInterface);
        
        // Execute the code automatically
        executeCodeBlock(blockId);
    });
}

// Export markdown functions
export {
    updatePreview,
    convertPythonCodeBlocks
};
