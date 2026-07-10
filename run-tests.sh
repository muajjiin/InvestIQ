#!/usr/bin/env bash
# shellcheck shell=bash

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== InvestIQ Test Suite ===${NC}\n"

# Check if jest is installed
if ! command -v jest &> /dev/null && ! [ -f "node_modules/.bin/jest" ]; then
    echo -e "${RED}Error: Jest is not installed${NC}"
    echo -e "${YELLOW}Please run: npm install --save-dev jest @types/jest ts-jest${NC}\n"
    exit 1
fi

echo -e "${GREEN}Running all tests...${NC}\n"

# Run tests
npm test

TEST_EXIT_CODE=$?

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "\n${GREEN}✓ All tests passed\!${NC}"
else
    echo -e "\n${RED}✗ Some tests failed${NC}"
    exit 1
fi