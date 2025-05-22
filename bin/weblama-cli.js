#!/usr/bin/env node

/**
 * WebLama CLI - Command-line interface for WebLama
 * 
 * This script provides a command-line interface for interacting with the WebLama web application.
 * It can start the WebLama frontend server and communicate with APILama.
 */

const { program } = require('commander');
const http = require('http-server');
const open = require('open');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const chalk = require('chalk');

// Get the package version
const packageJson = require('../package.json');
const version = packageJson.version;

// Default configuration
const DEFAULT_PORT = 8081;
const DEFAULT_API_URL = 'http://localhost:9130';

// Configure the CLI
program
  .name('weblama')
  .description('WebLama - Markdown Editor with Code Execution')
  .version(version);

// Start command - starts the WebLama frontend server
program
  .command('start')
  .description('Start the WebLama frontend server')
  .option('-p, --port <port>', 'Port to run the server on', DEFAULT_PORT)
  .option('-a, --api-url <url>', 'URL of the APILama backend', DEFAULT_API_URL)
  .option('-o, --open', 'Open the browser after starting the server', false)
  .action(async (options) => {
    const port = options.port;
    const apiUrl = options.apiUrl;
    
    console.log(chalk.blue('Starting WebLama frontend server...'));
    console.log(chalk.gray(`Port: ${port}`));
    console.log(chalk.gray(`API URL: ${apiUrl}`));
    
    // Create a simple server to serve static files
    const server = http.createServer({
      root: path.join(__dirname, '../static'),
      cache: -1,
      cors: true,
      before: [(req, res) => {
        // Inject the API URL into the window object
        if (req.url === '/' || req.url === '/index.html') {
          const indexPath = path.join(__dirname, '../static/index.html');
          const content = fs.readFileSync(indexPath, 'utf8');
          const injectedContent = content.replace(
            '<head>',
            `<head>\n    <script>window.API_URL = "${apiUrl}";</script>`
          );
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(injectedContent);
          return true; // Skip the default handler
        }
        return false; // Continue with the default handler
      }]
    });
    
    // Start the server
    server.listen(port, () => {
      console.log(chalk.green(`WebLama frontend server running at http://localhost:${port}`));
      
      // Check if APILama is running
      checkApiLama(apiUrl).then(isRunning => {
        if (isRunning) {
          console.log(chalk.green('✓ APILama is running'));
        } else {
          console.log(chalk.yellow('⚠ APILama is not running. Some features may not work.'));
          console.log(chalk.yellow(`  Start APILama with: cd ../apilama && python -m apilama.app --port ${apiUrl.split(':')[2]}`));
        }
        
        // Open the browser if requested
        if (options.open) {
          console.log(chalk.blue('Opening browser...'));
          open(`http://localhost:${port}`);
        }
      });
    });
  });

// Health command - checks if APILama is running
program
  .command('health')
  .description('Check if APILama is running')
  .option('-a, --api-url <url>', 'URL of the APILama backend', DEFAULT_API_URL)
  .action(async (options) => {
    const apiUrl = options.apiUrl;
    
    console.log(chalk.blue('Checking APILama health...'));
    
    const isRunning = await checkApiLama(apiUrl);
    if (isRunning) {
      console.log(chalk.green('✓ APILama is running'));
    } else {
      console.log(chalk.red('✗ APILama is not running'));
      console.log(chalk.yellow(`  Start APILama with: cd ../apilama && python -m apilama.app --port ${apiUrl.split(':')[2]}`));
    }
  });

// List files command - lists all markdown files
program
  .command('list')
  .description('List all markdown files')
  .option('-a, --api-url <url>', 'URL of the APILama backend', DEFAULT_API_URL)
  .action(async (options) => {
    const apiUrl = options.apiUrl;
    
    console.log(chalk.blue('Listing markdown files...'));
    
    try {
      const response = await axios.get(`${apiUrl}/api/weblama/markdown`);
      if (response.data.status === 'success') {
        const files = response.data.files;
        if (files.length === 0) {
          console.log(chalk.yellow('No markdown files found.'));
        } else {
          console.log(chalk.green(`Found ${files.length} markdown files:`));
          files.forEach(file => {
            console.log(`  - ${file.name}`);
          });
        }
      } else {
        console.log(chalk.red(`Error: ${response.data.message}`));
      }
    } catch (error) {
      console.log(chalk.red(`Error: ${error.message}`));
      if (error.code === 'ECONNREFUSED') {
        console.log(chalk.yellow(`  Make sure APILama is running at ${apiUrl}`));
      }
    }
  });

// Helper function to check if APILama is running
async function checkApiLama(apiUrl) {
  try {
    const response = await axios.get(`${apiUrl}/health`, { timeout: 2000 });
    return response.data.status === 'ok';
  } catch (error) {
    return false;
  }
}

// Parse command line arguments
program.parse(process.argv);

// If no arguments are provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
