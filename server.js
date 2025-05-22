const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 8084;

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
    API_URL: process.env.API_URL || 'http://localhost:8080',
    API_PORT: process.env.API_PORT || '8080',
    API_HOST: process.env.API_HOST || 'localhost',
    MARKDOWN_DIR: process.env.MARKDOWN_DIR || './markdown'
  };
  
  res.json(config);
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`WebLama app listening at http://localhost:${port}`);
});
