#!/bin/bash

# Colors for output
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

# Create test-reports directory if it doesn't exist
mkdir -p test-reports

print_header() {
    echo -e "\n${BLUE}===========================================================${NC}"
    echo -e "${BLUE} $1 ${NC}"
    echo -e "${BLUE}===========================================================${NC}\n"
}

show_help() {
    echo -e "${YELLOW}WebLama Docker Testing Environment${NC}"
    echo -e "\nUsage: $0 [options]\n"
    echo -e "Options:"
    echo -e "  --build\t\tBuild Docker images before starting"
    echo -e "  --run-tests\t\tRun all tests automatically after starting"
    echo -e "  --dev\t\t\tStart development server with hot reloading"
    echo -e "  --stop\t\tStop and remove containers"
    echo -e "  --clean\t\tStop containers and remove volumes"
    echo -e "  --help\t\tShow this help message"
    echo -e "\nExamples:\n"
    echo -e "  $0 --build --run-tests\t# Build and run all tests"
    echo -e "  $0 --dev\t\t\t# Start development server"
    echo -e "  $0 --stop\t\t# Stop containers"
}

# Default options
BUILD=false
RUN_TESTS=false
DEV=false
STOP=false
CLEAN=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --build)
            BUILD=true
            shift
            ;;
        --run-tests)
            RUN_TESTS=true
            shift
            ;;
        --dev)
            DEV=true
            shift
            ;;
        --stop)
            STOP=true
            shift
            ;;
        --clean)
            CLEAN=true
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# Stop containers if requested
if [ "$STOP" = true ]; then
    print_header "Stopping Docker containers"
    docker-compose -f docker-compose.test.yml down
    echo -e "${GREEN}Containers stopped${NC}"
    exit 0
fi

# Clean containers and volumes if requested
if [ "$CLEAN" = true ]; then
    print_header "Cleaning Docker containers and volumes"
    docker-compose -f docker-compose.test.yml down -v
    echo -e "${GREEN}Containers and volumes removed${NC}"
    exit 0
fi

# Build and start containers
if [ "$BUILD" = true ]; then
    print_header "Building Docker images"
    docker-compose -f docker-compose.test.yml build
fi

# Run tests if requested
if [ "$RUN_TESTS" = true ]; then
    print_header "Running WebLama tests"
    docker-compose -f docker-compose.test.yml up weblama-test
    exit 0
fi

# Start development server if requested
if [ "$DEV" = true ]; then
    print_header "Starting WebLama development server"
    docker-compose -f docker-compose.test.yml up weblama-dev
    exit 0
fi

# If no specific action was requested, show help
if [ "$RUN_TESTS" = false -a "$DEV" = false ]; then
    show_help
fi

echo -e "\n${YELLOW}To stop the containers, run:${NC} $0 --stop"
echo -e "${YELLOW}To clean up containers and volumes, run:${NC} $0 --clean"
