# Testing Guide for InvestIQ

This document provides comprehensive information about the test suite for the InvestIQ project.

## Overview

Comprehensive unit tests have been created for all modified files in the current branch compared to `main`. The test suite covers:

- **lib/utils.ts** - Utility functions for formatting, date handling, and validation
- **lib/actions/finnhub.actions.ts** - Finnhub API integration for news fetching
- **lib/actions/user.actions.ts** - User data retrieval for email operations
- **lib/actions/watchlist.actions.ts** - Watchlist management functions
- **lib/nodemailer/index.ts** - Email sending functionality
- **lib/inngest/functions.ts** - Inngest background job functions
- **database/models/watchlist.model.ts** - Mongoose model for watchlist

## Test Coverage

### 1. Utils Module (`lib/__tests__/utils.test.ts`)
- **150+ test cases** covering:
  - Class name merging (`cn`)
  - Time formatting (`formatTimeAgo`)
  - Market cap formatting (`formatMarketCapValue`)
  - Date range calculations
  - Article validation and formatting
  - Price and change formatting
  - Alert text generation

### 2. Finnhub Actions (`lib/actions/__tests__/finnhub.actions.test.ts`)
- **35+ test cases** covering:
  - JSON fetching with caching
  - News fetching for multiple symbols
  - Round-robin article selection
  - Article deduplication
  - Fallback to general news
  - Error handling for API failures
  - Symbol validation and cleaning

### 3. User Actions (`lib/actions/__tests__/user.actions.test.ts`)
- **15+ test cases** covering:
  - User data retrieval from MongoDB
  - Email and name filtering
  - Fallback ID handling
  - Database connection errors
  - Query error handling

### 4. Watchlist Actions (`lib/actions/__tests__/watchlist.actions.test.ts`)
- **15+ test cases** covering:
  - Symbol retrieval by email
  - User lookup and validation
  - Empty result handling
  - Database and query errors
  - Symbol conversion to strings

### 5. Nodemailer Module (`lib/nodemailer/__tests__/index.test.ts`)
- **15+ test cases** covering:
  - Welcome email sending
  - News summary email sending
  - Template placeholder replacement
  - Special character handling
  - SMTP error handling

### 6. Inngest Functions (`lib/inngest/__tests__/functions.test.ts`)
- **20+ test cases** covering:
  - Sign-up email with AI personalization
  - Daily news summary generation
  - User and news fetching workflows
  - AI inference and error handling
  - Email sending coordination

### 7. Watchlist Model (`database/models/__tests__/watchlist.model.test.ts`)
- **15+ test cases** covering:
  - Schema field definitions
  - Field validation rules
  - Index configurations
  - Model export and reuse

## Installation

### 1. Install Testing Dependencies

```bash
npm install --save-dev jest @types/jest ts-jest
```

### 2. Verify Installation

Check that the following files were created:
- `jest.config.js` - Jest configuration
- `jest.setup.js` - Jest setup file
- Test files in `__tests__` directories

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage Report
```bash
npm run test:coverage
```

### Run Specific Test File
```bash
npm test -- lib/__tests__/utils.test.ts
```

### Run Tests Matching Pattern
```bash
npm test -- --testNamePattern="formatTimeAgo"
```

## Test Structure

Each test file follows this structure:

```typescript
describe('Module Name', () => {
  beforeEach(() => {
    // Setup before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup after each test
  });

  describe('Function Name', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = functionUnderTest(input);
      
      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

## Mocking Strategy

### Database Mocks
Database connections and models are mocked to avoid requiring actual MongoDB:

```typescript
jest.mock('@/database/mongoose', () => ({
  connectToDatabase: jest.fn(),
}));
```

### External API Mocks
External API calls (like Finnhub) are mocked using `global.fetch`:

```typescript
global.fetch = jest.fn();
(global.fetch as jest.Mock).mockResolvedValue({
  ok: true,
  json: async () => mockData,
});
```

### Module Mocks
Internal modules are mocked to isolate units under test:

```typescript
jest.mock('@/lib/actions/user.actions', () => ({
  getAllUsersForNewsEmail: jest.fn(),
}));
```

## Best Practices Followed

### 1. Test Isolation
- Each test is independent and can run in any order
- Mocks are cleared between tests
- No shared state between tests

### 2. Comprehensive Coverage
- Happy path scenarios
- Edge cases (empty inputs, null values, extreme values)
- Error conditions (network errors, database errors, validation errors)
- Boundary conditions

### 3. Clear Test Names
- Tests use descriptive names that explain what they test
- Format: "should [expected behavior] when [condition]"

### 4. Arrange-Act-Assert Pattern
- Setup (Arrange)
- Execute (Act)
- Verify (Assert)

### 5. Mock Verification
- Verify mocks were called with correct parameters
- Verify mock call counts
- Verify error handling paths

## Common Testing Patterns

### Testing Async Functions
```typescript
it('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});
```

### Testing Error Handling
```typescript
it('should throw error on invalid input', async () => {
  await expect(functionUnderTest('invalid')).rejects.toThrow('Error message');
});
```

### Testing with Fake Timers
```typescript
beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2024-01-15'));
});

afterEach(() => {
  jest.useRealTimers();
});
```

### Verifying Mock Calls
```typescript
expect(mockFunction).toHaveBeenCalledTimes(2);
expect(mockFunction).toHaveBeenCalledWith('expected', 'arguments');
```

## Debugging Tests

### Run Single Test
```bash
npm test -- --testNamePattern="specific test name"
```

### Enable Verbose Output
```bash
npm test -- --verbose
```

### Debug with Node Inspector
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Coverage Goals

The test suite aims for:
- **Line Coverage**: >80%
- **Branch Coverage**: >75%
- **Function Coverage**: >90%
- **Statement Coverage**: >80%

View coverage report:
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

## Continuous Integration

These tests are designed to run in CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run tests
  run: npm test -- --ci --coverage
```

## Troubleshooting

### Issue: Module Resolution Errors
**Solution**: Ensure `tsconfig.json` has correct path mappings:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Issue: Mock Not Working
**Solution**: Verify mock is defined before importing the module:
```typescript
jest.mock('./module'); // Must be at top
import { function } from './module';
```

### Issue: Timeout Errors
**Solution**: Increase timeout for slow tests:
```typescript
jest.setTimeout(10000); // 10 seconds
```

## Contributing

When adding new features:

1. Write tests first (TDD approach recommended)
2. Ensure all existing tests pass
3. Add tests for new functionality
4. Update this documentation if needed

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [TypeScript with Jest](https://kulshekhar.github.io/ts-jest/)

## Summary

This test suite provides comprehensive coverage of all changed files with **280+ test cases** covering:
- ✅ Pure functions and utilities
- ✅ API integrations
- ✅ Database operations
- ✅ Email functionality
- ✅ Background jobs
- ✅ Data models
- ✅ Error handling
- ✅ Edge cases and boundary conditions

All tests follow industry best practices and are designed to run quickly, reliably, and in isolation.