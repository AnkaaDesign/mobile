# Navigation Guards - Quick Reference Card

## Quick Start

```typescript
import { useNavigationGuard } from '@/hooks';

function MyComponent() {
  const { navigate, goBack, canNavigateTo } = useNavigationGuard();

  return (
    <View>
      <Button onPress={() => navigate('/producao/cronograma')}>
        Go to Schedule
      </Button>
      <Button onPress={() => goBack('/(tabs)/home')}>
        Back
      </Button>
    </View>
  );
}
```

## Common Patterns

### Safe Navigation

```typescript
// Basic navigation
const { navigate } = useNavigationGuard();
navigate('/producao/cronograma');

// With validation
if (canNavigateTo(route)) {
  navigate(route);
}

// Replace current route
const { replace } = useNavigationGuard();
replace('/producao/cronograma');
```

### Back Navigation

```typescript
// With fallback
const { goBack } = useNavigationGuard();
goBack('/(tabs)/home');

// Simpler hook
const goBack = useGuardedBack('/(tabs)/home');
goBack();
```

### Dynamic Routes

```typescript
const { toDetail, toEdit, toCreate } = useDynamicRoutes('/producao/cronograma');

navigate(toDetail('123'));  // /producao/cronograma/details/123
navigate(toEdit('123'));    // /producao/cronograma/edit/123
navigate(toCreate());       // /producao/cronograma/create
```

### Route Validation

```typescript
const { validateRoute, getRouteInfo } = useNavigationGuard();

// Check if valid
const validation = validateRoute('/producao/cronograma');
if (!validation.isValid) {
  console.error(validation.reason);
}

// Get route details
const info = getRouteInfo('/producao/cronograma');
console.log(info.exists, info.isDynamic, info.requiresAuth);
```

### Route Type Checking

```typescript
const { isDetailRoute, isListRoute, getParentRoute } = useNavigationGuard();

if (isDetailRoute()) {
  const parent = getParentRoute();
  console.log('Parent route:', parent);
}
```

### Conditional Navigation

```typescript
const { navigate, canNavigate } = useConditionalNavigation(
  '/admin',
  hasAdminAccess
);

<Button onPress={navigate} disabled={!canNavigate}>
  Admin
</Button>
```

## API Cheat Sheet

### Hook: `useNavigationGuard()`

```typescript
const {
  // Navigation
  navigate,               // (route: string) => boolean
  goBack,                // (fallback?: string) => void
  replace,               // (route: string) => boolean

  // Validation
  canNavigateTo,         // (route: string) => boolean
  validateRoute,         // (route: string) => ValidationResult
  getRouteInfo,          // (route: string) => RouteInfo

  // Helpers
  isDetailRoute,         // (route?: string) => boolean
  isListRoute,           // (route?: string) => boolean
  getParentRoute,        // (route?: string) => string | null
  buildRoute,            // (template, params) => string

  // Current route
  currentRoute,          // string
  currentRouteInfo,      // RouteInfo

  // Debug
  getStats,              // () => NavigationStats
} = useNavigationGuard();
```

### Hook: `useGuardedBack(fallbackRoute?: string)`

```typescript
const goBack = useGuardedBack('/(tabs)/home');
goBack(); // Safe back navigation with fallback
```

### Hook: `useDynamicRoutes(basePath: string)`

```typescript
const {
  toDetail,    // (id: string) => string
  toEdit,      // (id: string) => string
  toCreate,    // () => string
  toList,      // () => string
  withParams,  // (template, params) => string
} = useDynamicRoutes('/producao/cronograma');
```

### Hook: `useRouteExists(route: string)`

```typescript
const exists = useRouteExists('/producao/cronograma');
if (!exists) {
  console.warn('Route does not exist');
}
```

### Hook: `useConditionalNavigation(route, condition)`

```typescript
const { navigate, canNavigate } = useConditionalNavigation(
  '/admin',
  hasPermission
);
```

## Utility Functions (Direct Import)

```typescript
import {
  safeNavigate,
  safeGoBack,
  safeReplace,
  routeExists,
  validateRoute,
  getRouteInfo,
  getNavigationHistory,
  getNavigationStats,
  debugNavigation,
} from '@/utils/navigation-guards';
```

## Common Routes

```typescript
import { routes } from '@/constants/routes';

// Production
routes.production.schedule.list
routes.production.schedule.details(id)
routes.production.schedule.edit(id)
routes.production.schedule.create

// Administration
routes.administration.customers.list
routes.administration.customers.details(id)
routes.administration.users.list

// Inventory
routes.inventory.products.list
routes.inventory.products.details(id)

// Personal
routes.personal.myVacations.root
routes.personal.myPpes.root
```

## Debug Commands

```typescript
// Get navigation stats
import { getNavigationStats } from '@/utils/navigation-guards';
console.log(getNavigationStats());

// Get navigation history
import { getNavigationHistory } from '@/utils/navigation-guards';
console.log(getNavigationHistory());

// Get failed navigations
import { getFailedNavigations } from '@/utils/navigation-guards';
console.log(getFailedNavigations());

// Full debug info
import { debugNavigation } from '@/utils/navigation-guards';
debugNavigation();
```

## Error Handling

### Navigation Failures

```typescript
const success = navigate('/some/route');
if (!success) {
  // Navigation failed, fallback was used
  console.error('Navigation failed');
}
```

### Route Validation Errors

```typescript
const validation = validateRoute('/some/route');
if (!validation.isValid) {
  console.error('Invalid route:', validation.reason);
  console.log('Suggested:', validation.suggestedRoute);
}
```

## Best Practices

### ✅ DO

```typescript
// Use navigation guards
const { navigate } = useNavigationGuard();
navigate('/route');

// Provide fallbacks
goBack('/(tabs)/home');

// Validate before navigation
if (canNavigateTo(route)) navigate(route);

// Use dynamic route helpers
const { toDetail } = useDynamicRoutes(basePath);
navigate(toDetail(id));
```

### ❌ DON'T

```typescript
// Direct router calls
router.push('/route');  // No validation

// Back without fallback
router.back();  // May fail

// Manual route construction
navigate(`/route/details/${id}`);  // Use helpers

// Ignore validation
navigate(unknownRoute);  // Check first
```

## Migration Guide

### Replace This

```typescript
import { router } from 'expo-router';

router.push('/route');
router.back();
router.replace('/route');
```

### With This

```typescript
import { useNavigationGuard } from '@/hooks';

const { navigate, goBack, replace } = useNavigationGuard();

navigate('/route');
goBack('/(tabs)/home');
replace('/route');
```

## Configuration

Default fallback routes (in `utils/navigation-guards.ts`):

```typescript
const NAVIGATION_CONFIG = {
  fallbackRoutes: {
    authenticated: "/(tabs)/home",
    unauthenticated: "/(auth)/login",
    error: "/(tabs)/home",
  },
};
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Route validation fails | Check if route exists in MENU_ITEMS or routes constant |
| Back navigation not working | Use `goBack()` with fallback route |
| Dynamic routes failing | Ensure ID is valid UUID format |
| Navigation not logging | Check `__DEV__` is true |

## TypeScript Types

```typescript
interface NavigationValidationResult {
  isValid: boolean;
  reason?: string;
  suggestedRoute?: string;
}

interface RouteInfo {
  path: string;
  exists: boolean;
  isDynamic: boolean;
  requiresAuth: boolean;
  requiredPrivilege?: string | string[];
}

interface NavigationAttempt {
  route: string;
  timestamp: Date;
  success: boolean;
  error?: string;
}
```

## Performance Tips

1. Route cache is built automatically on first use
2. Validation is fast (uses cache and regex)
3. History limited to 50 entries (configurable)
4. Debug logging only in development mode

## Support

- Check console logs in development
- Use `debugNavigation()` for full info
- Review navigation history
- Check route validation results

---

**Remember**: Always use navigation guards instead of direct router calls for safer, more robust navigation!
