# Testing Setup Instructions

## Install Testing Dependencies

Run the following command to install all required testing dependencies:

```bash
npm install --save-dev jest jest-expo @testing-library/react-native @testing-library/jest-native @types/jest
```

## Verify Installation

After installation, verify that the dependencies are installed:

```bash
npm list jest jest-expo @testing-library/react-native
```

## Running Tests

### Run all tests:
```bash
npm test
```

### Run navigation tests only:
```bash
npm test -- --testPathPattern=navigation
```

### Run with coverage:
```bash
npm test -- --coverage
```

### Run in watch mode:
```bash
npm test -- --watch
```

### Run specific test file:
```bash
npm test navigation-history-context.test
```

## Test Scripts

The following scripts are available in package.json:

- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode (add this to package.json if needed)
- `npm run test:coverage` - Run tests with coverage report (add this to package.json if needed)

## Optional: Add Test Scripts to package.json

You can add these convenient scripts to your package.json:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:nav": "jest --testPathPattern=navigation",
    "test:verbose": "jest --verbose"
  }
}
```

## Troubleshooting

### Issue: "Cannot find module" errors
**Solution:** Make sure all dependencies are installed and the module paths in jest.config.js are correct

### Issue: Tests timeout
**Solution:** Increase the test timeout in jest.config.js or individual test files:
```javascript
jest.setTimeout(10000); // 10 seconds
```

### Issue: Mock errors with expo-router
**Solution:** Verify that the mocks in jest.setup.js are correct and match your expo-router version

### Issue: TypeScript errors in tests
**Solution:** Make sure @types/jest is installed and tsconfig.json includes test files

## Coverage Thresholds

The current coverage thresholds are set in jest.config.js:

- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

You can adjust these as needed.

## CI/CD Integration

To integrate these tests into your CI/CD pipeline:

### GitHub Actions Example:
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm ci
      - run: npm test -- --coverage
```

### GitLab CI Example:
```yaml
test:
  image: node:16
  script:
    - npm ci
    - npm test -- --coverage
  coverage: '/Lines\s*:\s*(\d+\.?\d*)%/'
```

## Test File Structure

All navigation tests are located in:
```
src/__tests__/navigation/
├── README.md
├── navigation-history-context.test.tsx
├── navigation-utils.test.ts
├── route-accessibility.test.ts
├── back-button.test.tsx
├── menu-visibility.test.ts
├── deep-linking.test.ts
└── navigation-flows.integration.test.tsx
```

## Next Steps

1. Install dependencies: `npm install --save-dev jest jest-expo @testing-library/react-native @testing-library/jest-native @types/jest`
2. Run tests: `npm test`
3. Review coverage: `npm test -- --coverage`
4. Add test scripts to package.json (optional)
5. Set up CI/CD integration (recommended)

## Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Expo Testing Guide](https://docs.expo.dev/guides/testing-with-jest/)
