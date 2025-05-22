// WebLama Configuration

// Default values
window.CONFIG = {
    API_URL: 'http://localhost:8080',
    API_PORT: '8080',
    API_HOST: 'localhost',
    MARKDOWN_DIR: '~/github/py-lama/weblama/markdown'
};

// Function to load configuration from the server
async function loadConfig() {
    try {
        const response = await fetch('/config');
        if (response.ok) {
            const config = await response.json();
            // Update the configuration with values from the server
            window.CONFIG = { ...window.CONFIG, ...config };
            console.log('Configuration loaded:', window.CONFIG);
        } else {
            console.warn('Failed to load configuration from server, using defaults');
        }
    } catch (error) {
        console.warn('Error loading configuration:', error);
    }
}

// Load configuration when the script is loaded
loadConfig();
