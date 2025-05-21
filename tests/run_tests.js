/**
 * WebLama Test Runner
 * 
 * This script runs all the WebLama tests and reports the results.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Test files to run
const testFiles = [
  'test_cli.js',
  'test_cli_apilama.js',
  'test_api_integration.js',
  'test_frontend.js',
  'test_frontend_apilama.js',
  'test_file_loading.js',
  'test_integration.js',
  'test_e2e.js'
];

// Function to run a test file
const runTest = (testFile) => {
  console.log(`${colors.bright}${colors.blue}Running ${testFile}...${colors.reset}`);
  
  try {
    const output = execSync(`npx jest ${testFile}`, {
      cwd: path.join(__dirname),
      stdio: 'pipe'
    }).toString();
    
    console.log(`${colors.green}${output}${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}${error.stdout.toString()}${colors.reset}`);
    return false;
  }
};

// Main function to run all tests
const runAllTests = () => {
  console.log(`${colors.bright}${colors.magenta}WebLama Test Runner${colors.reset}`);
  console.log(`${colors.dim}Running tests at ${new Date().toISOString()}${colors.reset}\n`);
  
  let passedTests = 0;
  let failedTests = 0;
  
  for (const testFile of testFiles) {
    const passed = runTest(testFile);
    if (passed) {
      passedTests++;
    } else {
      failedTests++;
    }
    console.log(''); // Add a blank line between test files
  }
  
  // Print summary
  console.log(`${colors.bright}${colors.blue}Test Summary:${colors.reset}`);
  console.log(`${colors.green}Passed: ${passedTests}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failedTests}${colors.reset}`);
  
  // Return exit code based on test results
  process.exit(failedTests > 0 ? 1 : 0);
};

// Run all tests
runAllTests();
