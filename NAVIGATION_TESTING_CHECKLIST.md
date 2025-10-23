# Navigation Testing Checklist

## Overview
This checklist ensures comprehensive testing of all navigation flows in the mobile application. Use this document to verify that navigation features are working correctly before deployment.

---

## Pre-Test Setup

### Environment Setup
- [ ] All dependencies installed (`npm install`)
- [ ] Jest configuration verified (`jest.config.js` present)
- [ ] Test setup file exists (`jest.setup.js`)
- [ ] TypeScript configuration supports tests
- [ ] All test files are discoverable

### Test Execution
- [ ] Can run all tests (`npm test`)
- [ ] Can run navigation tests specifically (`npm test -- --testPathPattern=navigation`)
- [ ] Can run tests in watch mode (`npm test -- --watch`)
- [ ] Can generate coverage reports (`npm test -- --coverage`)

---

## Test Categories

## 1. Back Button Navigation

### Basic Back Navigation
- [ ] Back button appears when navigation history exists
- [ ] Back button hidden on home screen
- [ ] Back button navigates to previous route
- [ ] Back button falls back to home when no history

### Back from Different Screens
- [ ] Back from production schedule to production module
- [ ] Back from detail page to list page
- [ ] Back from edit page to detail page
- [ ] Back from create page to list page

### Back with Parameters
- [ ] Back navigation preserves route parameters (UUIDs)
- [ ] Back navigation with multiple parameters works correctly
- [ ] Back from nested routes maintains parameter chain

### Edge Cases
- [ ] Cannot back to auth routes
- [ ] Deep navigation stacks work correctly
- [ ] Rapid back button presses handled
- [ ] Back button state updates correctly

**Test File:** `back-button.test.tsx`

---

## 2. Navigation from Schedule to Detail

### Schedule List to Detail
- [ ] Navigate from schedule list to detail page
- [ ] Navigate back from detail to schedule list
- [ ] Schedule ID preserved in navigation
- [ ] Back button shows correct previous route

### Complete Schedule Flow
- [ ] Home → Production → Schedule → Details flow works
- [ ] Can navigate back through each step
- [ ] History stack maintains correct order

### Schedule CRUD Operations
- [ ] List → Create new schedule
- [ ] Detail → Edit schedule
- [ ] Back to list after creating
- [ ] Back to detail after editing

### Schedule Deep Linking
- [ ] Deep link directly to schedule detail
- [ ] Navigation continues after deep link
- [ ] Invalid schedule IDs handled gracefully

### Schedule Context Switching
- [ ] Switch between different schedule items
- [ ] Navigate between schedule and list repeatedly
- [ ] History maintains correct sequence

### Schedule Integration
- [ ] Navigate from schedule to other modules
- [ ] Navigate back to schedule from other modules
- [ ] Cross-module navigation maintains history

**Test File:** `schedule-navigation.test.tsx`

---

## 3. Menu Conditional Display Logic

### Privilege-Based Display
- [ ] Public items visible to all users
- [ ] Admin items only visible to admins
- [ ] Production items visible to production users
- [ ] Warehouse items visible to warehouse users
- [ ] HR items visible to HR users
- [ ] Leader items visible to leaders

### Platform-Based Display
- [ ] All items visible on web
- [ ] Mobile-excluded items hidden on mobile
- [ ] Nested items filtered correctly
- [ ] Children filtering works properly

### Combined Filtering
- [ ] Both platform and privilege filters apply
- [ ] Correct items shown for each user type
- [ ] Parent items removed if all children filtered

### Menu Children
- [ ] Children filtered by privileges
- [ ] Children filtered by platform
- [ ] Empty parents removed appropriately
- [ ] Parents with paths kept even if children filtered

**Test File:** `menu-visibility.test.ts`

---

## 4. Navigation to All Major Routes

### Production Module
- [ ] Production root accessible
- [ ] Schedule routes accessible
- [ ] Airbrushings routes accessible
- [ ] Garages routes accessible
- [ ] Trucks routes accessible

### Inventory Module
- [ ] Inventory root accessible
- [ ] Products routes accessible
- [ ] Suppliers routes accessible
- [ ] Orders routes accessible
- [ ] Movements routes accessible

### Painting Module
- [ ] Painting root accessible
- [ ] Catalog routes accessible
- [ ] Formulas routes accessible
- [ ] Components routes accessible

### HR Module
- [ ] HR root accessible
- [ ] Employees routes accessible
- [ ] Payroll routes accessible
- [ ] Sectors routes accessible
- [ ] Performance levels accessible

### Administration Module
- [ ] Administration root accessible
- [ ] Customers routes accessible
- [ ] Users routes accessible
- [ ] Settings routes accessible

### Personal Module
- [ ] Personal root accessible
- [ ] My profile accessible
- [ ] My notifications accessible
- [ ] My vacations accessible
- [ ] Preferences accessible

### Authentication Routes
- [ ] Login route accessible
- [ ] Register route accessible
- [ ] Recover password accessible
- [ ] Verify code accessible
- [ ] Reset password accessible

**Test File:** `route-accessibility.test.ts`

---

## 5. Error Handling for Non-Existent Routes

### Non-Existent Route Scenarios
- [ ] Navigate to non-existent route doesn't crash
- [ ] Back from non-existent route works
- [ ] Fallback to home from invalid route

### Invalid Route Parameters
- [ ] Invalid UUID format handled
- [ ] Missing required parameters handled
- [ ] Extra parameters handled
- [ ] Special characters handled

### Malformed Paths
- [ ] Routes without (tabs) prefix work
- [ ] Double slashes handled
- [ ] Trailing slashes handled
- [ ] Empty route strings handled

### Navigation Stack Corruption
- [ ] Recovery from corrupted stack
- [ ] Undefined/null values handled
- [ ] Clear and restart after corruption

### Race Conditions
- [ ] Rapid navigation changes handled
- [ ] Simultaneous back requests handled
- [ ] Navigation during navigation handled

### Memory Management
- [ ] History limited to prevent leaks
- [ ] Duplicate consecutive routes prevented
- [ ] Memory usage stable

**Test File:** `error-handling.test.tsx`

---

## 6. Deep Linking Scenarios

### App Scheme Configuration
- [ ] App scheme configured in app.json
- [ ] Scheme follows naming conventions
- [ ] Scheme is valid format

### Deep Link Parsing
- [ ] Simple deep links parse correctly
- [ ] Deep links with parameters parse correctly
- [ ] Authentication deep links work
- [ ] Password reset links work

### Deep Link URL Generation
- [ ] Production module deep links generated
- [ ] Inventory module deep links generated
- [ ] Personal module deep links generated
- [ ] UUID parameters included correctly

### Route Mapping
- [ ] Portuguese paths map to English
- [ ] Nested Portuguese paths map correctly
- [ ] CRUD operation paths map correctly

### Deep Link Validation
- [ ] All production routes generate valid links
- [ ] All inventory routes generate valid links
- [ ] All personal routes generate valid links

### Nested Resources
- [ ] Nested resource deep links work
- [ ] Deeply nested detail pages work
- [ ] Formula components paths work

### Cross-Platform
- [ ] iOS-compatible deep links
- [ ] Android-compatible deep links
- [ ] URL encoding works correctly

**Test File:** `deep-linking.test.ts`

---

## 7. Navigation Flows (Integration)

### Production Flows
- [ ] Complete schedule workflow
- [ ] Schedule creation flow
- [ ] Schedule edit flow
- [ ] Airbrush management flow

### Inventory Flows
- [ ] Product management flow
- [ ] Order creation flow
- [ ] Order items management
- [ ] Supplier management flow

### Personal Flows
- [ ] Profile management flow
- [ ] Notifications flow
- [ ] Vacations flow
- [ ] Preferences flow

### Cross-Module Flows
- [ ] Navigate between different modules
- [ ] Return to original module
- [ ] Module switching maintains history

### Authentication Flows
- [ ] Login flow clears history
- [ ] Navigate to home after login
- [ ] Password recovery flow
- [ ] Logout clears history

### Complex Patterns
- [ ] Master-detail pattern works
- [ ] Modal-like navigation works
- [ ] Tab switching works
- [ ] Deep link integration works

**Test File:** `navigation-flows.integration.test.tsx`

---

## 8. Navigation Utils & Route Structure

### Icon Mapping
- [ ] All menu items have valid icons
- [ ] Unknown icons fallback correctly
- [ ] Icon mapping is consistent

### Platform Filtering
- [ ] Web includes all items
- [ ] Mobile excludes specified items
- [ ] Nested filtering works

### Privilege Filtering
- [ ] Public items always visible
- [ ] Privilege matching works
- [ ] Array of privileges handled
- [ ] Children filtered correctly

### Route Extraction
- [ ] All routes extracted from menu
- [ ] Static routes included
- [ ] Dynamic routes excluded appropriately
- [ ] No undefined routes

### Breadcrumb Generation
- [ ] Top-level breadcrumbs correct
- [ ] Nested breadcrumbs correct
- [ ] Dynamic routes in breadcrumbs
- [ ] Empty array for non-existent paths

### Access Control
- [ ] Items without privileges accessible
- [ ] Privilege matching accurate
- [ ] Array of privileges works

**Test File:** `navigation-utils.test.ts`

---

## 9. Navigation History Context

### History Tracking
- [ ] Initializes with empty history
- [ ] Tracks navigation correctly
- [ ] No duplicate consecutive routes
- [ ] Limited to max entries (20)
- [ ] Clears on auth routes

### Back Navigation
- [ ] Uses router.back() correctly
- [ ] Falls back to home when needed
- [ ] Doesn't go back to auth routes
- [ ] Gets back path correctly

### History Management
- [ ] Can clear history
- [ ] Can get back path
- [ ] canGoBack accurate
- [ ] pushToHistory works

### Edge Cases
- [ ] Root path handled
- [ ] Context outside provider throws error
- [ ] Auth route handling
- [ ] History limits enforced

**Test File:** `navigation-history-context.test.tsx`

---

## Coverage Requirements

### Minimum Coverage Thresholds
- [ ] Branches: 70%
- [ ] Functions: 70%
- [ ] Lines: 70%
- [ ] Statements: 70%

### Test File Coverage
- [ ] All navigation test files passing
- [ ] Integration tests passing
- [ ] Unit tests passing
- [ ] Edge case tests passing

### Code Coverage
- [ ] Navigation context covered
- [ ] Navigation utils covered
- [ ] Route constants covered
- [ ] Route mapper covered

---

## Pre-Deployment Checklist

### Test Execution
- [ ] All tests pass locally
- [ ] All tests pass in CI/CD
- [ ] No flaky tests
- [ ] No skipped tests (unless documented)

### Coverage
- [ ] Coverage thresholds met
- [ ] Critical paths fully covered
- [ ] Edge cases tested
- [ ] Error scenarios tested

### Documentation
- [ ] Test README up to date
- [ ] Test files documented
- [ ] New tests documented
- [ ] Maintenance notes updated

### Integration
- [ ] Tests run in CI/CD pipeline
- [ ] Coverage reports generated
- [ ] Test results visible
- [ ] Failures block deployment

---

## Regression Testing

### After Navigation Changes
- [ ] Run full navigation test suite
- [ ] Verify all flows still work
- [ ] Check coverage hasn't decreased
- [ ] Test on multiple platforms

### After Route Changes
- [ ] Update route accessibility tests
- [ ] Verify deep links still work
- [ ] Check menu visibility
- [ ] Test navigation flows

### After Privilege Changes
- [ ] Update menu visibility tests
- [ ] Verify access control
- [ ] Test all user roles
- [ ] Check route filtering

---

## Performance Testing

### Navigation Speed
- [ ] Navigation completes quickly
- [ ] No unnecessary re-renders
- [ ] History updates are fast
- [ ] Menu filtering is performant

### Memory Usage
- [ ] History doesn't grow unbounded
- [ ] No memory leaks in navigation
- [ ] Context cleanup works
- [ ] Routes cleanup properly

---

## Accessibility Testing

### Navigation Accessibility
- [ ] All routes keyboard accessible
- [ ] Screen reader support
- [ ] Focus management correct
- [ ] ARIA labels present

---

## Manual Testing Verification

### Real Device Testing
- [ ] Test on iOS device
- [ ] Test on Android device
- [ ] Test on web browser
- [ ] Test on tablet

### User Scenarios
- [ ] New user onboarding flow
- [ ] Returning user flow
- [ ] Deep link from notification
- [ ] Deep link from email

### Error Recovery
- [ ] Network error during navigation
- [ ] App backgrounded during navigation
- [ ] App force closed and reopened
- [ ] Token expired during navigation

---

## Maintenance

### Regular Review
- [ ] Review tests quarterly
- [ ] Update for new features
- [ ] Remove obsolete tests
- [ ] Refactor duplicated code

### Documentation
- [ ] Keep README current
- [ ] Update examples
- [ ] Document new patterns
- [ ] Maintain this checklist

---

## Test Execution Commands

```bash
# Run all tests
npm test

# Run navigation tests only
npm test -- --testPathPattern=navigation

# Run specific test file
npm test back-button.test.tsx

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch

# Run in CI mode
npm test -- --ci --coverage --maxWorkers=2

# Run with verbose output
npm test -- --verbose

# Update snapshots
npm test -- -u
```

---

## Success Criteria

### All Tests Passing
- ✅ 9 test suites pass
- ✅ 300+ tests pass
- ✅ 0 tests fail
- ✅ 0 tests skipped

### Coverage Met
- ✅ 70%+ coverage on all metrics
- ✅ Critical paths 100% covered
- ✅ Edge cases tested
- ✅ Error handling tested

### Documentation Complete
- ✅ All test files documented
- ✅ README up to date
- ✅ Checklist completed
- ✅ Examples provided

### Integration Ready
- ✅ CI/CD configured
- ✅ Tests run automatically
- ✅ Reports generated
- ✅ Team trained

---

## Notes

### Common Issues
1. **Tests fail due to missing dependencies**: Run `npm install`
2. **Coverage below threshold**: Add more test cases
3. **Flaky tests**: Check for timing issues, use `waitFor`
4. **Mock issues**: Verify expo-router mocks are correct

### Best Practices
1. Always run tests before committing
2. Maintain coverage above thresholds
3. Write tests for new features
4. Keep documentation current
5. Review and refactor regularly

---

## Completion Status

Date: _______________

Tested By: _______________

- [ ] All checklist items completed
- [ ] All tests passing
- [ ] Coverage requirements met
- [ ] Documentation updated
- [ ] Ready for production

Signature: _______________
