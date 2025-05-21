#!/bin/bash

# Colors for console output
RESET="\033[0m"
BOLD="\033[1m"
RED="\033[31m"
GREEN="\033[32m"
YELLOW="\033[33m"
BLUE="\033[34m"
MAGENTA="\033[35m"

# Check if Docker is running
echo -e "${BOLD}${BLUE}Checking if Docker services are running...${RESET}"
docker ps | grep -q "py-lama-apilama"
if [ $? -ne 0 ]; then
  echo -e "${BOLD}${YELLOW}Docker services are not running. Starting them...${RESET}"
  cd "$(dirname "$0")/.." && ./start-pylama.sh docker up
  sleep 5  # Give services time to start
fi

# Run the tests
echo -e "${BOLD}${MAGENTA}Running WebLama Tests${RESET}"
echo -e "${BOLD}${BLUE}====================${RESET}"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo -e "${BOLD}${YELLOW}Installing dependencies...${RESET}"
  npm install
fi

# Run the tests
echo -e "\n${BOLD}${BLUE}Running CLI Tests${RESET}"
npm run test:cli
CLI_STATUS=$?

echo -e "\n${BOLD}${BLUE}Running API Integration Tests${RESET}"
npm run test:api
API_STATUS=$?

echo -e "\n${BOLD}${BLUE}Running Frontend Tests${RESET}"
npm run test:frontend
FRONTEND_STATUS=$?

echo -e "\n${BOLD}${BLUE}Running Integration Tests${RESET}"
npm run test:integration
INTEGRATION_STATUS=$?

# Print summary
echo -e "\n${BOLD}${MAGENTA}Test Summary${RESET}"
echo -e "${BOLD}${BLUE}====================${RESET}"

if [ $CLI_STATUS -eq 0 ]; then
  echo -e "${GREEN}CLI Tests: PASSED${RESET}"
else
  echo -e "${RED}CLI Tests: FAILED${RESET}"
fi

if [ $API_STATUS -eq 0 ]; then
  echo -e "${GREEN}API Integration Tests: PASSED${RESET}"
else
  echo -e "${RED}API Integration Tests: FAILED${RESET}"
fi

if [ $FRONTEND_STATUS -eq 0 ]; then
  echo -e "${GREEN}Frontend Tests: PASSED${RESET}"
else
  echo -e "${RED}Frontend Tests: FAILED${RESET}"
fi

if [ $INTEGRATION_STATUS -eq 0 ]; then
  echo -e "${GREEN}Integration Tests: PASSED${RESET}"
else
  echo -e "${RED}Integration Tests: FAILED${RESET}"
fi

# Calculate overall status
OVERALL_STATUS=$(($CLI_STATUS + $API_STATUS + $FRONTEND_STATUS + $INTEGRATION_STATUS))
if [ $OVERALL_STATUS -eq 0 ]; then
  echo -e "\n${BOLD}${GREEN}All tests passed!${RESET}"
  exit 0
else
  echo -e "\n${BOLD}${RED}Some tests failed!${RESET}"
  exit 1
fi
