# Navigation Test Suite

Comprehensive test suite for the mobile application's navigation system.

## Overview

This test suite provides extensive coverage for all navigation-related functionality in the mobile application, ensuring that users can navigate smoothly throughout the app without encountering broken links or unexpected behavior.

## Test Files

### 1. `navigation-history-context.test.tsx`
Tests the navigation history context that manages the back button and navigation stack.

**Coverage:**
- Navigation history tracking
- Back navigation functionality
- History clearing on auth routes
- History size limits (max 20 entries)
- Edge cases and error handling

**Key Tests:**
- Should track navigation history correctly
- Should not add duplicate consecutive routes
- Should clear history on auth routes
- Should limit history to 20 entries
- Should navigate back using router.back()
- Should navigate to home if no history exists

### 2. `navigation-utils.test.ts`
Tests navigation utility functions for filtering and accessing menu items.

**Coverage:**
- Icon mapping (getTablerIcon)
- Platform-based filtering (mobile vs web)
- Privilege-based filtering
- Route extraction and breadcrumb generation
- Menu item access control

**Key Tests:**
- Should return correct Tabler icons
- Should filter menu by platform
- Should filter menu by user privileges
- Should extract all routes from menu
- Should find menu items by path
- Should generate breadcrumbs for nested paths

### 3. `route-accessibility.test.ts`
Tests that all routes are properly defined and accessible.

**Coverage:**
- Route constant validation
- Route structure consistency
- Route mapper validation
- Menu item validation
- Route coverage
- Cross-module consistency

**Key Tests:**
- Should have all major module routes defined
- Should have consistent CRUD operation structure
- Should map Portuguese routes to English correctly
- Should handle dynamic route parameters
- Should have valid icon mappings for all menu items
- Should not have duplicate menu item IDs

### 4. `back-button.test.tsx`
Tests back button functionality across all screens.

**Coverage:**
- Basic back navigation
- Back navigation from different screens
- Back button with route parameters
- Back button state management
- Cross-module navigation
- Edge cases and error recovery

**Key Tests:**
- Should go back to previous route when history exists
- Should navigate to home when no history
- Should not show back button on home screen
- Should preserve route parameters when going back
- Should handle rapid back button presses
- Should not allow back to auth routes

### 5. `menu-visibility.test.ts`
Tests menu visibility logic based on privileges and platform.

**Coverage:**
- Privilege-based menu filtering
- Platform-based menu filtering (web/mobile)
- Combined filtering
- Children visibility
- Dynamic menu items
- Real-world scenarios for different user roles

**Key Tests:**
- Should show only public items for users without privileges
- Should show admin items for admin users
- Should exclude mobile-incompatible items
- Should filter children based on privileges
- Should show appropriate menu for production workers
- Should show full menu for admins

### 6. `deep-linking.test.ts`
Tests deep linking support and URL handling.

**Coverage:**
- App scheme configuration
- Deep link URL parsing
- Deep link URL generation
- Route mapping for deep links
- Deep links with parameters
- Cross-platform compatibility

**Key Tests:**
- Should have app scheme configured
- Should parse deep links with parameters
- Should generate valid deep links
- Should map Portuguese paths correctly
- Should handle nested resource deep links
- Should support universal links format

### 7. `navigation-flows.integration.test.tsx`
Integration tests for complete navigation flows through the app.

**Coverage:**
- Production module flows
- Inventory module flows
- Personal section flows
- Cross-module navigation
- Menu-based navigation
- Authentication flow integration
- Complex navigation patterns

**Key Tests:**
- Should navigate through production schedule flow
- Should navigate through product management flow
- Should navigate through personal profile flow
- Should navigate between different modules
- Should handle master-detail navigation pattern
- Should handle modal-like navigation pattern
- Should filter navigation based on privileges

## Running Tests

### Run all navigation tests:
```bash
npm test -- --testPathPattern=navigation
```

### Run specific test file:
```bash
npm test navigation-history-context.test
```

### Run with coverage:
```bash
npm test -- --coverage --testPathPattern=navigation
```

### Run in watch mode:
```bash
npm test -- --watch --testPathPattern=navigation
```

## Test Coverage Goals

- **Unit Tests:** 80%+ coverage for navigation utilities
- **Integration Tests:** Cover all major navigation flows
- **Edge Cases:** Test error handling and boundary conditions

## What These Tests Catch

1. **Broken Navigation Paths**
   - Non-existent routes
   - Incorrectly mapped paths
   - Missing route definitions

2. **Back Button Issues**
   - Back button not working
   - Back button navigating to wrong screen
   - Back button visible when it shouldn't be

3. **Menu Visibility Problems**
   - Users seeing menu items they shouldn't access
   - Missing menu items for privileged users
   - Platform-specific items showing incorrectly

4. **Deep Linking Failures**
   - Deep links not resolving to correct screens
   - Parameters not being parsed correctly
   - Auth-required screens accessible via deep links

5. **Navigation Flow Breaks**
   - Unable to complete common user workflows
   - Navigation getting stuck
   - History stack growing unbounded

6. **Route Inconsistencies**
   - Different naming patterns across modules
   - Missing CRUD operations
   - Inconsistent parameter handling

## Best Practices

1. **Add tests for new routes:** When adding a new route, add corresponding tests
2. **Test edge cases:** Always test with null, undefined, and unexpected inputs
3. **Test both platforms:** Ensure tests cover both mobile and web scenarios
4. **Test all user roles:** Test navigation with different privilege levels
5. **Keep tests isolated:** Each test should be independent and not rely on others

## Common Issues and Solutions

### Issue: Tests failing after route changes
**Solution:** Update the route constants in the test files to match new routes

### Issue: Menu visibility tests failing
**Solution:** Verify that privilege constants match between tests and implementation

### Issue: Deep linking tests failing
**Solution:** Check that app.json scheme is configured correctly

### Issue: Integration tests timing out
**Solution:** Ensure mock routers are responding correctly and increase timeout if needed

## Maintenance

- Review tests when adding new navigation features
- Update tests when changing route structure
- Add new test cases for new navigation patterns
- Keep test documentation up to date

## Related Files

- `/src/contexts/navigation-history-context.tsx` - Navigation history implementation
- `/src/utils/navigation.ts` - Navigation utility functions
- `/src/constants/routes.ts` - Route definitions
- `/src/constants/navigation.ts` - Menu items and navigation constants
- `/src/lib/route-mapper.ts` - Route mapping utilities
- `/src/app/(tabs)/_layout.tsx` - Main navigation layout

## Contributing

When adding new navigation features:

1. Write tests first (TDD approach recommended)
2. Ensure all tests pass before merging
3. Maintain or improve code coverage
4. Update this README if adding new test files
5. Document any new testing patterns or utilities
