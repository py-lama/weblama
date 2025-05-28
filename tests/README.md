# WebLama Tests

This directory contains tests for the WebLama frontend component of the PyLama ecosystem.

## Test Architecture

The WebLama tests are designed to verify that the WebLama frontend correctly integrates with the APILama backend and other services in the PyLama ecosystem. The tests are organized into several categories:

### CLI Tests
- `test_cli.js`: Tests the WebLama CLI functionality (health checks, file listing)
- `test_cli_apilama.js`: Tests the WebLama CLI's integration with APILama

### API Integration Tests
- `test_api_integration.js`: Tests WebLama's integration with APILama endpoints

### Frontend Tests
- `test_frontend.js`: Tests the WebLama frontend components
- `test_frontend_apilama.js`: Tests the WebLama frontend's interaction with APILama

### Integration Tests
- `test_integration.js`: Tests the full integration between WebLama and APILama
- `test_e2e.js`: End-to-end tests for the complete WebLama workflow

## Running Tests

### Prerequisites

- Node.js 14.0.0 or higher
- npm
- Docker (for running the full PyLama ecosystem)

### Running Individual Test Suites

You can run individual test suites using the following npm scripts:

```bash
# Run CLI tests
npm run test:cli

# Run API integration tests
npm run test:api

# Run frontend tests
npm run test:frontend

# Run integration tests
npm run test:integration

# Run end-to-end tests
npm run test:e2e
```

Or using the Makefile targets:

```bash
# Run CLI tests
make test-cli

# Run API integration tests
make test-api

# Run frontend tests
make test-frontend

# Run integration tests
make test-integration

# Run end-to-end tests
make test-e2e
```

### Running All Tests

To run all tests at once:

```bash
# Using npm
npm test

# Using the Makefile
make test
```

### Running Tests with Docker Services

For tests that require the full PyLama ecosystem running in Docker:

```bash
# Using npm
npm run test:all

# Using the Makefile
make test-docker
```

This will automatically start the required Docker services if they're not already running.

## Test Configuration

The tests are configured to use the following default URLs:

- WebLama: http://localhost:9081
- APILama: http://localhost:9080

These match the port mappings in the updated `docker-compose.yml` file.

## Adding New Tests

When adding new tests:

1. Create a new test file in the `tests` directory
2. Add the test file to the `testFiles` array in `run_tests.js`
3. Add a corresponding npm script in `package.json`
4. Add a corresponding Makefile target

## Troubleshooting

### Docker Services Not Running

If you see connection errors in your tests, make sure the Docker services are running:

```bash
../start-devlama.sh docker up
```

### Port Conflicts

If you encounter port conflicts, check if any services are already using the ports specified in `docker-compose.yml`.
