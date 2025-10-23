# Navigation History System - Implementation Guide

## Overview

This document describes the robust navigation history tracking system implemented for the React Native mobile application. The system provides intelligent back button functionality, persistent navigation state, and helper utilities for common navigation patterns.

## Architecture

### Core Components

1. **NavigationHistoryContext** (`src/contexts/navigation-history-context.tsx`)
   - Central state management for navigation history
   - Persistent storage with AsyncStorage
   - Automatic history tracking
   - Smart back navigation with fallbacks

2. **Navigation Helpers** (`src/hooks/use-navigation-helpers.ts`)
   - Convenient hooks for common navigation patterns
   - CRUD operation navigation helpers
   - Deep link handling
   - Tab navigation utilities

3. **Back Button Integration** (`src/app/(tabs)/_layout.tsx`)
   - Automatic back button rendering
   - Integration with navigation history
   - Smart visibility logic

## Features

### 1. Automatic History Tracking

The system automatically tracks all navigation events and maintains a history stack:

```typescript
// History is tracked automatically when routes change
// No manual intervention needed in most cases
```

**Key Features:**
- Tracks path and optional parameters
- Prevents duplicate consecutive entries
- Limits history size to 50 entries
- Filters out auth routes and root path
- Removes stale entries (older than 24 hours)

### 2. Persistent Navigation State

Navigation history persists across app restarts using AsyncStorage:

```typescript
// Automatically persisted
const { getHistory } = useNavigationHistory();

// Restored on app launch
// Stale entries (>24 hours) are filtered out
```

### 3. Smart Back Navigation

The back button includes intelligent fallback handling:

```typescript
const { goBack } = useNavigationHistory();

// Go back with automatic home fallback
goBack();

// Go back with custom fallback
goBack("/(tabs)/custom-fallback");
```

**Fallback Logic:**
1. If history exists → Navigate to previous route
2. If previous route is invalid (auth) → Go to fallback or home
3. If no history → Go to fallback or home
4. Handles router.back() failures gracefully

### 4. Navigation Helper Functions

#### Basic Navigation

```typescript
import { useNavigationHelpers } from "@/hooks";

const { navigate, navigateBack, navigateToHome } = useNavigationHelpers();

// Navigate with history tracking (default)
navigate("/(tabs)/production");

// Navigate without history tracking
navigate("/(tabs)/production", { trackHistory: false });

// Navigate with replace
navigate("/(tabs)/production", { replace: true });

// Navigate with parameters
navigate("/(tabs)/production/details/123", { params: { id: "123" } });
```

#### CRUD Navigation Patterns

```typescript
const {
  navigateToDetail,
  navigateToEdit,
  navigateToCreate,
  navigateToList,
} = useNavigationHelpers();

// Navigate to detail page
navigateToDetail("/(tabs)/production/schedule", "123");

// Navigate to edit page
navigateToEdit("/(tabs)/production/schedule", "123");

// Navigate to create page
navigateToCreate("/(tabs)/production/schedule");

// Navigate to list with smart back detection
navigateToList("/(tabs)/production/schedule");
```

#### Post-Action Navigation

```typescript
const {
  handlePostSaveNavigation,
  handlePostDeleteNavigation,
} = useNavigationHelpers();

// After saving an edit form
handlePostSaveNavigation({
  entityId: "123",
  basePath: "/(tabs)/production/schedule",
  navigateToDetail: true, // Go to detail page
  fallbackToList: true,   // Fallback to list if no detail
});

// After deleting an entity
handlePostDeleteNavigation("/(tabs)/production/schedule");
```

#### Route Type Checking

```typescript
import { useRouteType } from "@/hooks";

const { checkRouteType } = useRouteType();

const routeInfo = checkRouteType(pathname);
// Returns:
// {
//   isList: boolean,
//   isDetail: boolean,
//   isEdit: boolean,
//   isCreate: boolean,
//   isHome: boolean,
//   isAuth: boolean,
//   isInitial: boolean,
// }
```

#### Deep Link Handling

```typescript
import { useDeepLinkNavigation } from "@/hooks";

const { handleDeepLink } = useDeepLinkNavigation();

// Handle deep link
handleDeepLink("myapp://production/schedule/details/123");

// Handle deep link and clear existing history
handleDeepLink("myapp://production/schedule/details/123", true);
```

### 5. Navigation State Queries

```typescript
const {
  canNavigateBack,
  getPreviousPath,
  isRootRoute,
  navigationDepth,
  getPreviousRoute,
} = useNavigationHelpers();

// Check if back navigation is available
if (canNavigateBack) {
  // Show back button
}

// Get previous path
const previousPath = getPreviousPath();

// Check if on root route
if (isRootRoute) {
  // Hide back button
}

// Get navigation depth
console.log("Navigation depth:", navigationDepth);

// Get previous route with params
const previousRoute = getPreviousRoute();
// Returns: { path: string, timestamp: number, params?: Record<string, any> } | null
```

## Integration Examples

### Example 1: Detail Page with Back Button

```typescript
import { useNavigationHelpers } from "@/hooks";

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams();
  const { navigateToEdit, navigateBack } = useNavigationHelpers();

  const handleEdit = () => {
    navigateToEdit("/(tabs)/administration/customers", id as string);
  };

  const handleBack = () => {
    navigateBack("/(tabs)/administration/customers/list");
  };

  return (
    <View>
      <Button onPress={handleBack}>Back</Button>
      <Button onPress={handleEdit}>Edit</Button>
      {/* ... content ... */}
    </View>
  );
}
```

### Example 2: Edit Form with Post-Save Navigation

```typescript
import { useNavigationHelpers } from "@/hooks";

export default function CustomerEditScreen() {
  const { id } = useLocalSearchParams();
  const { handlePostSaveNavigation } = useNavigationHelpers();
  const { update } = useCustomerMutations();

  const handleSave = async (data: CustomerInput) => {
    try {
      await update(id as string, data);

      // Navigate back to detail page
      handlePostSaveNavigation({
        entityId: id,
        basePath: "/(tabs)/administration/customers",
        navigateToDetail: true,
        fallbackToList: true,
      });
    } catch (error) {
      // Handle error
    }
  };

  return (
    <Form onSubmit={handleSave}>
      {/* ... form fields ... */}
    </Form>
  );
}
```

### Example 3: List Page with Create Button

```typescript
import { useNavigationHelpers } from "@/hooks";

export default function CustomerListScreen() {
  const { navigateToCreate, navigateToDetail } = useNavigationHelpers();

  const handleCreate = () => {
    navigateToCreate("/(tabs)/administration/customers");
  };

  const handleItemPress = (customerId: string) => {
    navigateToDetail("/(tabs)/administration/customers", customerId);
  };

  return (
    <View>
      <Button onPress={handleCreate}>Create Customer</Button>
      <FlatList
        data={customers}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => handleItemPress(item.id)}>
            <Text>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
```

### Example 4: Custom Back Button in Header

```typescript
// In _layout.tsx
import { useNavigationHistory } from "@/contexts/navigation-history-context";

function DrawerLayout() {
  const { canGoBack, goBack } = useNavigationHistory();
  const pathname = usePathname();

  const shouldShowBackButton = canGoBack && pathname !== "/(tabs)/home";

  return (
    <Drawer
      screenOptions={{
        headerLeft: shouldShowBackButton ? () => (
          <IconButton
            icon="arrow-left"
            onPress={() => goBack()}
          />
        ) : undefined,
      }}
    >
      {/* ... screens ... */}
    </Drawer>
  );
}
```

## Edge Cases Handled

### 1. Deep Linking

When users open the app via a deep link, the system:
- Initializes history with the deep link as first entry
- Provides fallback to home if back is pressed
- Can optionally clear existing history

### 2. Authentication Flow

When users log out:
- History is automatically cleared
- Auth routes don't appear in history
- Back navigation from auth routes is prevented

### 3. App Restart

On app restart:
- History is restored from AsyncStorage
- Stale entries (>24 hours) are filtered out
- Invalid routes are skipped

### 4. History Size Management

- Maximum 50 entries maintained
- Oldest entries are removed when limit is reached
- Prevents memory issues with long sessions

### 5. Consecutive Duplicates

- Same route pushed consecutively is ignored
- Unless parameters change
- Prevents accidental duplicate entries

### 6. Router Failures

If `router.back()` fails:
- Automatically falls back to `router.push(previousPath)`
- Logs error for debugging
- Ensures navigation always succeeds

## Testing

The navigation system includes comprehensive tests:

```bash
npm test src/__tests__/navigation/navigation-history-context.test.tsx
```

**Test Coverage:**
- Basic history tracking
- Persistence with AsyncStorage
- History hydration on mount
- Parameter tracking
- Navigation depth
- Smart back navigation
- Fallback handling
- Stale entry filtering
- History size limits

## Best Practices

### 1. Use Helper Functions

✅ **Good:**
```typescript
const { navigateToDetail } = useNavigationHelpers();
navigateToDetail(basePath, id);
```

❌ **Avoid:**
```typescript
router.push(`${basePath}/details/${id}`);
// Missing history tracking and error handling
```

### 2. Provide Fallbacks

✅ **Good:**
```typescript
goBack("/(tabs)/production/schedule/list");
```

❌ **Avoid:**
```typescript
goBack(); // Might go to unexpected location
```

### 3. Use Post-Action Helpers

✅ **Good:**
```typescript
handlePostSaveNavigation({
  entityId,
  basePath,
  navigateToDetail: true,
});
```

❌ **Avoid:**
```typescript
router.push(`${basePath}/details/${entityId}`);
// Missing history management
```

### 4. Check Navigation State

✅ **Good:**
```typescript
if (canNavigateBack) {
  return <BackButton onPress={goBack} />;
}
```

❌ **Avoid:**
```typescript
// Always showing back button
return <BackButton onPress={goBack} />;
```

## Performance Considerations

1. **History Size**: Limited to 50 entries to prevent memory issues
2. **Persistence**: Debounced writes to AsyncStorage
3. **Stale Entries**: Filtered on hydration, not on every operation
4. **Memoization**: All helper functions are memoized with useCallback
5. **Conditional Tracking**: Option to disable history tracking for specific navigations

## Troubleshooting

### Issue: Back button not showing

**Check:**
- Is `canGoBack` true?
- Is the current route not in INITIAL_ROUTES?
- Is the pathname not "/(tabs)/home"?

### Issue: History not persisting

**Check:**
- Is AsyncStorage working correctly?
- Are there any errors in console about persistence?
- Is the app in production mode (persistence disabled in dev for auth reasons)?

### Issue: Wrong navigation destination

**Check:**
- Is the previous route valid (not auth)?
- Is the history corrupted (clear AsyncStorage)?
- Are you providing proper fallbacks?

### Issue: History growing too large

**Check:**
- History is limited to 50 entries automatically
- Stale entries (>24h) are filtered
- If still an issue, call `clearHistory()` explicitly

## API Reference

### NavigationHistoryContext

```typescript
interface NavigationHistoryContextType {
  canGoBack: boolean;
  goBack: (fallbackPath?: string) => void;
  getBackPath: () => string | null;
  clearHistory: () => void;
  pushToHistory: (path: string, params?: Record<string, any>) => void;
  getHistory: () => NavigationEntry[];
  getPreviousRoute: () => NavigationEntry | null;
  isInitialRoute: () => boolean;
  navigateWithHistory: (path: string, params?: Record<string, any>) => void;
  replaceInHistory: (path: string, params?: Record<string, any>) => void;
  getNavigationDepth: () => number;
}
```

### useNavigationHelpers

See examples above for detailed usage of all helper functions.

## Future Enhancements

Potential improvements for future iterations:

1. **Navigation Analytics**: Track most common navigation paths
2. **Undo/Redo**: Support for navigation undo/redo
3. **Custom History Filters**: Allow filtering specific routes from history
4. **History Branching**: Support for multiple navigation branches
5. **Gesture Navigation**: Swipe to go back support
6. **Navigation Preloading**: Preload previous route data for instant back navigation

## Conclusion

This navigation history system provides a robust, production-ready solution for managing navigation state in React Native applications. It handles edge cases, provides helpful utilities, and maintains a clean, maintainable API.

For questions or issues, please refer to the test suite or create an issue in the project repository.
