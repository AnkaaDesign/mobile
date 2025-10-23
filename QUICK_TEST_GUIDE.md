# Quick Test Guide - Navigation Tests

## 🚀 Quick Start

### 1. Install Dependencies (First Time Only)
```bash
npm install --save-dev jest jest-expo @testing-library/react-native @testing-library/jest-native @types/jest
```

### 2. Run All Navigation Tests
```bash
npm test -- --testPathPattern=navigation
```

### 3. Run with Coverage
```bash
npm test -- --coverage --testPathPattern=navigation
```

---

## 📁 Test Files Overview

| File | Purpose | Tests |
|------|---------|-------|
| `navigation-history-context.test.tsx` | History & back button | ~15 |
| `navigation-utils.test.ts` | Utility functions | ~40 |
| `route-accessibility.test.ts` | Route validation | ~50 |
| `back-button.test.tsx` | Back navigation | ~30 |
| `menu-visibility.test.ts` | Menu filtering | ~35 |
| `deep-linking.test.ts` | Deep link support | ~40 |
| `navigation-flows.integration.test.tsx` | Full flows | ~30 |

**Total: 240+ tests**

---

## 🎯 Common Commands

### Run Specific Test File
```bash
npm test navigation-history-context.test
npm test navigation-utils.test
npm test route-accessibility.test
npm test back-button.test
npm test menu-visibility.test
npm test deep-linking.test
npm test navigation-flows.integration.test
```

### Development Mode (Watch)
```bash
npm test -- --watch --testPathPattern=navigation
```

### Verbose Output
```bash
npm test -- --verbose --testPathPattern=navigation
```

### Coverage Report
```bash
npm test -- --coverage --testPathPattern=navigation
```

---

## ✅ What Gets Tested

### Navigation History
- [x] History tracking
- [x] Back button functionality
- [x] History clearing
- [x] Size limits

### Navigation Utils
- [x] Icon mapping
- [x] Platform filtering
- [x] Privilege filtering
- [x] Route extraction

### Route Accessibility
- [x] Route definitions
- [x] Route consistency
- [x] Route mapping
- [x] Menu validation

### Back Button
- [x] Basic navigation
- [x] Parameter handling
- [x] Cross-module nav
- [x] Edge cases

### Menu Visibility
- [x] Privilege-based
- [x] Platform-based
- [x] Role scenarios
- [x] Children filtering

### Deep Linking
- [x] URL parsing
- [x] URL generation
- [x] Parameter handling
- [x] Cross-platform

### Navigation Flows
- [x] Module flows
- [x] CRUD patterns
- [x] Auth flows
- [x] Complex patterns

---

## 🐛 Troubleshooting

### Tests not running?
```bash
# Check dependencies
npm list jest

# Reinstall if needed
npm install
```

### Import errors?
```bash
# Check tsconfig includes test files
# Check jest.config.js moduleNameMapper
```

### Mock errors?
```bash
# Check jest.setup.js
# Verify expo-router mocks
```

### Coverage not meeting threshold?
```bash
# Run with coverage to see details
npm test -- --coverage

# Adjust threshold in jest.config.js if needed
```

---

## 📊 Coverage Goals

- **Branches:** 70%
- **Functions:** 70%
- **Lines:** 70%
- **Statements:** 70%

---

## 🎨 Test Patterns

### Unit Test Pattern
```typescript
describe("Feature Name", () => {
  it("should do something specific", () => {
    // Arrange
    const input = "test";

    // Act
    const result = myFunction(input);

    // Assert
    expect(result).toBe("expected");
  });
});
```

### Integration Test Pattern
```typescript
describe("Navigation Flow", () => {
  it("should navigate through module", async () => {
    const { result } = renderHook(() => useNavigationHistory(), { wrapper });

    act(() => {
      result.current.pushToHistory("/path1");
      result.current.pushToHistory("/path2");
    });

    expect(result.current.canGoBack).toBe(true);
  });
});
```

---

## 📚 Documentation

- **Detailed Docs:** `/src/__tests__/navigation/README.md`
- **Setup Guide:** `/TESTING_SETUP.md`
- **Full Summary:** `/NAVIGATION_TEST_SUITE_SUMMARY.md`

---

## 🔧 Adding New Tests

### 1. Create Test File
```typescript
// __tests__/navigation/my-feature.test.ts
import { myFunction } from "@/utils/my-feature";

describe("My Feature", () => {
  it("should work", () => {
    expect(myFunction()).toBeDefined();
  });
});
```

### 2. Run New Tests
```bash
npm test my-feature.test
```

### 3. Check Coverage
```bash
npm test -- --coverage my-feature.test
```

---

## 🚦 CI/CD Integration

### GitHub Actions
```yaml
- run: npm ci
- run: npm test -- --coverage
```

### GitLab CI
```yaml
test:
  script:
    - npm ci
    - npm test -- --coverage
```

---

## 💡 Pro Tips

1. **Run in watch mode** during development
2. **Check coverage** before committing
3. **Run all tests** before pushing
4. **Update tests** when changing routes
5. **Keep tests simple** and focused

---

## 📞 Need Help?

1. Check the detailed README
2. Review existing test patterns
3. Look at similar test cases
4. Check Jest documentation

---

**Happy Testing! 🎉**
