# Route Validation Quick Start Guide

## For Developers: How to Use Route Validation

### 1. Safe Navigation in Components

Instead of directly using `router.push()`, use the safe navigation helper:

```typescript
import { safeNavigate } from '@/utils/route-validator';
import { useRouter } from 'expo-router';

function MyComponent() {
  const router = useRouter();

  const handleNavigate = () => {
    // This will validate the route before navigating
    safeNavigate(router, 'human-resources/performance-levels/list');
  };
}
```

### 2. Check if a Route Exists

Before building navigation UI or links:

```typescript
import { isRouteRegistered } from '@/utils/route-validator';

const routePath = 'human-resources/performance-levels/edit/123';

if (isRouteRegistered(routePath)) {
  // Show edit button
} else {
  // Hide edit button or show "Coming Soon"
}
```

### 3. Adding a New Route

**Step 1:** Create the screen file
```
src/app/(tabs)/your-module/your-feature/list.tsx
```

**Step 2:** Add to route registry (`src/utils/route-validator.ts`)
```typescript
export const REGISTERED_ROUTES = new Set([
  // ... existing routes
  "your-module/your-feature/list",
  "your-module/your-feature/details/[id]",
  "your-module/your-feature/edit/[id]",
]);
```

**Step 3:** Register in layout (`src/app/(tabs)/_layout.tsx`)
```typescript
const getScreensToRegister = () => {
  const existingScreens = [
    // ... existing screens
    { name: "your-module/your-feature/list", title: "Lista de Features" },
    { name: "your-module/your-feature/details/[id]", title: "Detalhes da Feature" },
    { name: "your-module/your-feature/edit/[id]", title: "Editar Feature" },
  ];
  return existingScreens;
};
```

### 4. Common Patterns

#### Dynamic Routes
```typescript
// These routes are automatically matched:
"human-resources/employees/details/123"
  → matches "human-resources/employees/details/[id]"

"human-resources/positions/abc-def-ghi/remunerations"
  → matches "human-resources/positions/[positionId]/remunerations"
```

#### Breadcrumb Navigation
```typescript
// Breadcrumbs automatically use route validation
import { Breadcrumb } from '@/components/ui/breadcrumb';

<Breadcrumb showHome maxSegments={5} />
// Clicking segments will validate routes before navigation
```

#### Menu Navigation
```typescript
// The drawer menu already uses route validation
// Just ensure your routes are registered
```

### 5. Troubleshooting

**Problem:** Getting "Route not registered" warnings

**Solution:**
1. Check if the route is in `REGISTERED_ROUTES` in `route-validator.ts`
2. Check if the screen file actually exists
3. Verify the route is in `getScreensToRegister()` in `_layout.tsx`
4. Ensure dynamic segments match the pattern (`[id]`, `[userId]`, etc.)

**Problem:** Navigation redirects to home unexpectedly

**Solution:**
- Check the console for validation warnings
- Verify the route string matches the registered pattern
- Ensure you're not including the `(tabs)` prefix in the route string

### 6. Testing Routes

```typescript
import { isRouteRegistered, validateRoute } from '@/utils/route-validator';

// Test if route exists
console.log(isRouteRegistered('human-resources/employees/list')); // true
console.log(isRouteRegistered('non-existent-route')); // false

// Get validated route or fallback
console.log(validateRoute('valid-route')); // 'valid-route'
console.log(validateRoute('invalid-route')); // '/(tabs)/home'
```

### 7. Best Practices

1. **Always use route validation** for programmatic navigation
2. **Check route existence** before showing navigation UI
3. **Register routes immediately** when creating new screens
4. **Use descriptive console warnings** for debugging
5. **Test navigation** after adding new routes

### 8. API Reference

```typescript
// Check if a route is registered
isRouteRegistered(route: string): boolean

// Get fallback route (home)
getFallbackRoute(): string

// Validate and return route or fallback
validateRoute(route: string): string

// Safe navigation helper
safeNavigate(
  router: { push: (route: string) => void },
  route: string,
  fallbackToHome?: boolean
): void
```

## Quick Checklist for New Features

- [ ] Create screen file in `src/app/(tabs)/...`
- [ ] Add route to `REGISTERED_ROUTES` in `route-validator.ts`
- [ ] Add screen to `getScreensToRegister()` in `_layout.tsx`
- [ ] Add labels to breadcrumb mapping if needed
- [ ] Test navigation to new route
- [ ] Verify breadcrumbs work correctly
- [ ] Check drawer menu shows the route
