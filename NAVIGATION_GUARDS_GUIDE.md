# Navigation Guards System - Implementation Guide

## Overview

The Navigation Guards System provides comprehensive route validation, safe navigation, and error handling for the mobile application. It prevents navigation to invalid routes, handles navigation errors gracefully, and provides debugging utilities.

## Features

- **Route Validation**: Validates routes before navigation attempts
- **Route Existence Checking**: Checks if routes exist in the application
- **Safe Navigation Helpers**: Provides safe wrappers around router functions
- **Error Handling**: Gracefully handles navigation errors with fallbacks
- **Permission Checking**: Validates route permissions before navigation
- **Navigation Logging**: Logs navigation attempts for debugging
- **Navigation Recovery**: Automatically recovers from failed navigation

## Core Components

### 1. Navigation Guards Utilities (`utils/navigation-guards.ts`)

Core utility functions for route validation and safe navigation.

### 2. Navigation Guard Hook (`hooks/use-navigation-guard.ts`)

React hook that provides safe navigation functions for use in components.

## Installation

The navigation guards are already integrated into the application. Simply import and use them in your components.

```typescript
import { useNavigationGuard } from '@/hooks';
// or
import { safeNavigate, routeExists } from '@/utils/navigation-guards';
```

## Usage Examples

### Basic Navigation with Validation

```typescript
import { useNavigationGuard } from '@/hooks';

function MyComponent() {
  const { navigate, canNavigateTo } = useNavigationGuard();

  const handleNavigate = () => {
    // Check if navigation is possible
    if (canNavigateTo('/producao/cronograma')) {
      // Safe navigation with automatic validation
      navigate('/producao/cronograma');
    } else {
      console.warn('Cannot navigate to route');
    }
  };

  return (
    <Button onPress={handleNavigate}>
      Go to Schedule
    </Button>
  );
}
```

### Safe Back Navigation

```typescript
import { useNavigationGuard } from '@/hooks';

function DetailScreen() {
  const { goBack } = useNavigationGuard();

  return (
    <Button onPress={() => goBack('/(tabs)/home')}>
      Back
    </Button>
  );
}
```

Or use the simpler `useGuardedBack` hook:

```typescript
import { useGuardedBack } from '@/hooks';

function DetailScreen() {
  const goBack = useGuardedBack('/(tabs)/home');

  return <Button onPress={goBack}>Back</Button>;
}
```

### Route Validation

```typescript
import { useNavigationGuard } from '@/hooks';

function NavigationComponent() {
  const { validateRoute, getRouteInfo } = useNavigationGuard();

  const checkRoute = (route: string) => {
    // Validate route
    const validation = validateRoute(route);

    if (!validation.isValid) {
      console.error('Invalid route:', validation.reason);
      console.log('Suggested route:', validation.suggestedRoute);
      return;
    }

    // Get detailed route information
    const info = getRouteInfo(route);
    console.log('Route info:', {
      exists: info.exists,
      isDynamic: info.isDynamic,
      requiresAuth: info.requiresAuth,
      requiredPrivilege: info.requiredPrivilege,
    });
  };

  return <Button onPress={() => checkRoute('/producao/cronograma')}>Check Route</Button>;
}
```

### Dynamic Route Building

```typescript
import { useDynamicRoutes } from '@/hooks';

function ScheduleList() {
  const { toDetail, toEdit, toCreate } = useDynamicRoutes('/producao/cronograma');
  const { navigate } = useNavigationGuard();

  const scheduleId = '123e4567-e89b-12d3-a456-426614174000';

  return (
    <View>
      {/* Navigate to detail: /producao/cronograma/details/123... */}
      <Button onPress={() => navigate(toDetail(scheduleId))}>
        View Details
      </Button>

      {/* Navigate to edit: /producao/cronograma/edit/123... */}
      <Button onPress={() => navigate(toEdit(scheduleId))}>
        Edit
      </Button>

      {/* Navigate to create: /producao/cronograma/create */}
      <Button onPress={() => navigate(toCreate())}>
        Create New
      </Button>
    </View>
  );
}
```

### Route Type Checking

```typescript
import { useNavigationGuard } from '@/hooks';

function NavigationBreadcrumb() {
  const {
    currentRoute,
    isDetailRoute,
    isListRoute,
    getParentRoute
  } = useNavigationGuard();

  if (isDetailRoute()) {
    const parentRoute = getParentRoute();
    return (
      <View>
        <Text>Current: {currentRoute}</Text>
        <Text>Parent: {parentRoute}</Text>
      </View>
    );
  }

  return <Text>List View: {currentRoute}</Text>;
}
```

### Conditional Navigation

```typescript
import { useConditionalNavigation } from '@/hooks';

function AdminButton({ hasAdminAccess }: { hasAdminAccess: boolean }) {
  const { navigate, canNavigate } = useConditionalNavigation(
    '/administracao/usuarios',
    hasAdminAccess
  );

  return (
    <Button
      onPress={navigate}
      disabled={!canNavigate}
      style={!canNavigate && styles.disabled}
    >
      Admin Panel
    </Button>
  );
}
```

### Using Direct Utility Functions

For non-component usage or advanced scenarios:

```typescript
import {
  safeNavigate,
  safeGoBack,
  routeExists,
  validateRoute,
  getNavigationStats
} from '@/utils/navigation-guards';

// Safe navigation without hook
function navigateToSchedule() {
  const success = safeNavigate('/producao/cronograma');
  if (!success) {
    console.error('Navigation failed');
  }
}

// Check if route exists
if (routeExists('/producao/cronograma')) {
  console.log('Route exists');
}

// Get navigation statistics (for debugging)
const stats = getNavigationStats();
console.log('Navigation stats:', stats);
```

## Navigation Logging

The system automatically logs navigation attempts in development mode. You can access the logs:

```typescript
import {
  getNavigationHistory,
  getFailedNavigations,
  debugNavigation
} from '@/utils/navigation-guards';

// Get all navigation attempts
const history = getNavigationHistory();

// Get only failed attempts
const failures = getFailedNavigations();

// Print comprehensive debug info
debugNavigation();
```

## Route Validation Rules

The navigation guard validates routes against:

1. **Static Routes**: Routes defined in MENU_ITEMS constant
2. **Dynamic Routes**: Routes with parameters (`:id`, `[id]`)
3. **Routes Constant**: All routes defined in `constants/routes.ts`
4. **System Routes**: Special routes like `/`, `/(tabs)`, `/(auth)`

### Valid Route Examples

```typescript
// Static routes
'/producao/cronograma'
'/(tabs)/home'
'/administracao/clientes'

// Dynamic routes
'/producao/cronograma/details/123e4567-...'
'/administracao/clientes/edit/456e7890-...'

// Portuguese routes (automatically converted)
'/administracao/clientes'  // -> 'administration/customers'
'/producao/cronograma'     // -> 'production/schedule'
```

### Invalid Route Examples

```typescript
// Non-existent routes
'/invalid/route'
'/producao/nonexistent'

// Malformed routes
''
null
undefined

// Missing IDs in dynamic routes
'/producao/cronograma/details/'  // Missing ID
```

## Error Handling

When navigation fails, the system:

1. **Logs the error** (in development mode)
2. **Records the attempt** in navigation history
3. **Suggests a fallback route**
4. **Automatically navigates to fallback** if available

### Fallback Routes

Default fallback routes:
- **Authenticated**: `/(tabs)/home`
- **Unauthenticated**: `/(auth)/login`
- **Error**: `/(tabs)/home`

### Custom Fallback

```typescript
// Provide custom fallback
goBack('/custom/fallback');

// Or in safe navigation
safeNavigate('/invalid/route', { replace: true });
// Automatically uses fallback on failure
```

## Performance Considerations

### Route Cache

The system builds a cache of valid routes on initialization for fast lookups:

```typescript
// Cache is built automatically on import
// No manual initialization needed
```

### Cache Contents

- Static routes from MENU_ITEMS
- Dynamic route patterns (as RegExp)
- Routes from routes constant
- System routes

## Debugging

### Enable Debug Logging

Debug logging is enabled by default in development mode (`__DEV__`).

```typescript
// View navigation statistics
import { debugNavigation } from '@/utils/navigation-guards';

debugNavigation();
// Prints:
// - Navigation statistics (total, successful, failed)
// - Recent navigation history
// - Cache information
```

### Common Issues

#### Issue: Route validation fails for valid route

**Solution**: Check if route is in MENU_ITEMS or routes constant. Ensure Portuguese paths are correctly mapped.

#### Issue: Back navigation doesn't work

**Solution**: Use `safeGoBack` or `useGuardedBack` with a fallback route.

#### Issue: Dynamic routes not working

**Solution**: Ensure IDs are valid UUIDs or the route pattern is registered.

## Best Practices

### 1. Always Use Safe Navigation

```typescript
// Good
const { navigate } = useNavigationGuard();
navigate('/producao/cronograma');

// Avoid
router.push('/producao/cronograma');  // No validation
```

### 2. Provide Fallbacks for Back Navigation

```typescript
// Good
const goBack = useGuardedBack('/(tabs)/home');

// Avoid
router.back();  // May fail if no history
```

### 3. Validate Before Navigation

```typescript
// Good
if (canNavigateTo(route)) {
  navigate(route);
}

// Avoid
navigate(unknownRoute);  // May fail
```

### 4. Use Dynamic Route Helpers

```typescript
// Good
const { toDetail } = useDynamicRoutes('/producao/cronograma');
navigate(toDetail(id));

// Avoid
navigate(`/producao/cronograma/details/${id}`);  // Manual construction
```

### 5. Check Route Existence in Conditional Rendering

```typescript
// Good
const exists = useRouteExists('/admin/users');
if (exists && hasPermission) {
  return <AdminLink />;
}

// Avoid
return <AdminLink />;  // May link to invalid route
```

## Integration with Existing Code

### Replacing Direct Router Calls

**Before:**
```typescript
import { router } from 'expo-router';

router.push('/producao/cronograma');
router.back();
```

**After:**
```typescript
import { useNavigationGuard } from '@/hooks';

const { navigate, goBack } = useNavigationGuard();

navigate('/producao/cronograma');
goBack('/(tabs)/home');
```

### Adding Validation to Navigation Buttons

**Before:**
```typescript
<Button onPress={() => router.push('/admin')}>
  Admin
</Button>
```

**After:**
```typescript
const { navigate, canNavigateTo } = useNavigationGuard();

<Button
  onPress={() => navigate('/admin')}
  disabled={!canNavigateTo('/admin')}
>
  Admin
</Button>
```

## Testing

### Manual Testing

1. Navigate to various routes in the app
2. Check console for navigation logs (dev mode)
3. Verify fallback routes work correctly
4. Test invalid navigation attempts

### Debug Console

```typescript
import { debugNavigation } from '@/utils/navigation-guards';

// In your component or screen
useEffect(() => {
  debugNavigation();
}, []);
```

## Configuration

Configure navigation guards in `utils/navigation-guards.ts`:

```typescript
const NAVIGATION_CONFIG = {
  enableLogging: __DEV__,  // Enable/disable logging
  maxHistorySize: 50,      // Max navigation history entries
  fallbackRoutes: {
    authenticated: "/(tabs)/home",
    unauthenticated: "/(auth)/login",
    error: "/(tabs)/home",
  },
  skipValidation: [        // Routes to skip validation
    "/",
    "/(tabs)",
    "/(auth)",
  ],
};
```

## API Reference

### Utilities (`utils/navigation-guards.ts`)

#### `safeNavigate(route: string, options?: { replace?: boolean }): boolean`
Safely navigate to a route with validation.

#### `safeGoBack(fallbackRoute?: string): void`
Safely navigate back with fallback.

#### `safeReplace(route: string): boolean`
Safely replace current route.

#### `routeExists(route: string): boolean`
Check if a route exists in the application.

#### `validateRoute(route: string): NavigationValidationResult`
Validate a route and get detailed result.

#### `getRouteInfo(route: string): RouteInfo`
Get detailed information about a route.

#### `getNavigationHistory(): NavigationAttempt[]`
Get navigation attempt history.

#### `getNavigationStats()`
Get navigation statistics.

#### `debugNavigation()`
Print comprehensive debug information.

### Hooks (`hooks/use-navigation-guard.ts`)

#### `useNavigationGuard()`
Main hook providing all navigation guard functionality.

#### `useGuardedBack(fallbackRoute?: string)`
Hook for safe back navigation with fallback.

#### `useDynamicRoutes(basePath: string)`
Hook for building dynamic routes.

#### `useRouteExists(route: string): boolean`
Hook to check if route exists.

#### `useConditionalNavigation(route: string, condition: boolean)`
Hook for conditional navigation.

## Troubleshooting

### Navigation Not Working

1. Check if route exists: `routeExists(route)`
2. Validate route: `validateRoute(route)`
3. Check console for errors
4. Verify route is in MENU_ITEMS or routes constant

### Route Validation Failing

1. Check route format (leading slash, correct structure)
2. Verify Portuguese to English mapping
3. Check if route is dynamic (requires ID parameter)
4. Ensure route is registered in MENU_ITEMS

### Back Navigation Issues

1. Use `safeGoBack` with fallback
2. Check navigation history: `getNavigationHistory()`
3. Verify router can go back: `router.canGoBack()`

## Future Enhancements

Potential improvements:

1. **Route Prefetching**: Preload routes before navigation
2. **Navigation Analytics**: Track navigation patterns
3. **Smart Fallbacks**: Context-aware fallback suggestions
4. **Route Suggestions**: Suggest similar routes when validation fails
5. **Navigation Middleware**: Custom validation logic per route
6. **Offline Navigation**: Handle offline navigation scenarios

## Support

For issues or questions:
1. Check console logs in development mode
2. Use `debugNavigation()` for detailed information
3. Review navigation history: `getNavigationHistory()`
4. Check route validation: `validateRoute(route)`

## Summary

The Navigation Guards System provides a robust, safe navigation layer for the mobile application:

- ✅ Validates routes before navigation
- ✅ Handles errors gracefully with fallbacks
- ✅ Logs navigation for debugging
- ✅ Provides safe navigation helpers
- ✅ Checks route permissions
- ✅ Prevents invalid navigation
- ✅ Supports dynamic routes
- ✅ Integrates with existing navigation

Use `useNavigationGuard()` in your components for safe, validated navigation throughout the application.
