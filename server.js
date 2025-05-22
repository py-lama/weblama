const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');
const { spawn } = require('child_process');
const axios = require('axios');

// Load environment variables from .env file
dotenv.config();

// Start the PyLogs bridge if enabled
let loglamaBridge = null;
const LOGLAMA_ENABLED = process.env.WEBLAMA_PYLOGS_ENABLED === 'true';
const LOGLAMA_PORT = parseInt(process.env.WEBLAMA_PYLOGS_PORT || '8085');
const LOGLAMA_HOST = process.env.WEBLAMA_PYLOGS_HOST || '127.0.0.1';

if (LOGLAMA_ENABLED) {
  console.log('Starting PyLogs bridge...');
  loglamaBridge = spawn('python3', [
    path.join(__dirname, 'weblama', 'bridge.py'),
    '--host', LOGLAMA_HOST,
    '--port', LOGLAMA_PORT.toString()
  ]);
  
  loglamaBridge.stdout.on('data', (data) => {
    console.log(`PyLogs bridge: ${data}`);
  });
  
  loglamaBridge.stderr.on('data', (data) => {
    console.error(`PyLogs bridge error: ${data}`);
  });
  
  loglamaBridge.on('close', (code) => {
    console.log(`PyLogs bridge exited with code ${code}`);
  });
  
  // Handle process exit
  process.on('exit', () => {
    if (loglamaBridge) {
      console.log('Stopping PyLogs bridge...');
      loglamaBridge.kill();
    }
  });
}

const app = express();
const port = process.env.PORT || 8084;

// Middleware for parsing JSON bodies
app.use(express.json());

// Serve static files from the static directory
app.use(express.static(path.join(__dirname, 'static')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'index.html'));
});

// Serve configuration from environment variables
app.get('/config', (req, res) => {
  // Only expose specific environment variables to the frontend
  const config = {
    // API Configuration
    API_URL: process.env.API_URL || 'http://localhost:8080',
    API_PORT: process.env.API_PORT || '8080',
    API_HOST: process.env.API_HOST || 'localhost',
    MARKDOWN_DIR: process.env.MARKDOWN_DIR || './markdown',
    
    // Debug Configuration
    DEBUG: process.env.DEBUG || 'false',
    DEBUG_MODE: process.env.DEBUG_MODE || 'false',
    
    // Ollama Configuration
    OLLAMA_MODEL: process.env.OLLAMA_MODEL || 'phi:2.7b',
    OLLAMA_FALLBACK_MODELS: process.env.OLLAMA_FALLBACK_MODELS || '',
    
    // PyLogs Configuration
    LOGLAMA_ENABLED: LOGLAMA_ENABLED,
    LOGLAMA_URL: `http://${LOGLAMA_HOST}:${LOGLAMA_PORT}`
  };
  
  res.json(config);
});

// Proxy for PyLogs bridge
app.post('/log', async (req, res) => {
  if (!LOGLAMA_ENABLED) {
    console.log('[LOG]', req.body.level, req.body.message);
    return res.json({ status: 'ok', message: 'Logging disabled' });
  }
  
  try {
    const response = await axios.post(`http://${LOGLAMA_HOST}:${LOGLAMA_PORT}`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Error forwarding log to PyLogs bridge:', error.message);
    res.status(500).json({ 
      error: 'Failed to forward log to PyLogs bridge',
      message: error.message 
    });
  }
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`WebLama app listening at http://localhost:${port}`);
  
  if (LOGLAMA_ENABLED) {
    console.log(`PyLogs bridge available at http://${LOGLAMA_HOST}:${LOGLAMA_PORT}`);
  } else {
    console.log('PyLogs bridge is disabled');
  }
});
