# Navigation Guards - Practical Examples

## Example 1: Updating Detail Header Component

### Before (Direct Router Usage)

```typescript
// components/ui/detail-header.tsx
import { router } from "expo-router";

export function DetailHeader({ title }: { title: string }) {
  return (
    <View>
      <TouchableOpacity onPress={() => router.back()}>
        <Icon name="arrow-left" />
      </TouchableOpacity>
      <Text>{title}</Text>
    </View>
  );
}
```

### After (With Navigation Guards)

```typescript
// components/ui/detail-header.tsx
import { useGuardedBack } from "@/hooks";

export function DetailHeader({
  title,
  fallbackRoute = "/(tabs)/home"
}: {
  title: string;
  fallbackRoute?: string;
}) {
  const goBack = useGuardedBack(fallbackRoute);

  return (
    <View>
      <TouchableOpacity onPress={goBack}>
        <Icon name="arrow-left" />
      </TouchableOpacity>
      <Text>{title}</Text>
    </View>
  );
}
```

## Example 2: Schedule List with Safe Navigation

### Before

```typescript
// app/(tabs)/production/schedule/list.tsx
import { router } from "expo-router";

export default function ScheduleListScreen() {
  const schedules = useSchedules();

  const navigateToDetail = (id: string) => {
    router.push(`/producao/cronograma/detalhes/${id}` as any);
  };

  return (
    <FlatList
      data={schedules}
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => navigateToDetail(item.id)}>
          <Text>{item.title}</Text>
        </TouchableOpacity>
      )}
    />
  );
}
```

### After (With Navigation Guards)

```typescript
// app/(tabs)/production/schedule/list.tsx
import { useNavigationGuard, useDynamicRoutes } from "@/hooks";

export default function ScheduleListScreen() {
  const schedules = useSchedules();
  const { navigate, canNavigateTo } = useNavigationGuard();
  const { toDetail } = useDynamicRoutes("/producao/cronograma");

  const navigateToDetail = (id: string) => {
    const detailRoute = toDetail(id);

    // Validate before navigation
    if (canNavigateTo(detailRoute)) {
      navigate(detailRoute);
    } else {
      console.warn("Cannot navigate to schedule detail");
    }
  };

  return (
    <FlatList
      data={schedules}
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => navigateToDetail(item.id)}>
          <Text>{item.title}</Text>
        </TouchableOpacity>
      )}
    />
  );
}
```

## Example 3: Schedule Detail with Context-Aware Back Navigation

### Implementation

```typescript
// app/(tabs)/production/schedule/details/[id].tsx
import { useNavigationGuard } from "@/hooks";

export default function ScheduleDetailScreen() {
  const { id } = useLocalSearchParams();
  const { goBack, getParentRoute, currentRoute } = useNavigationGuard();

  const schedule = useSchedule(id as string);

  const handleBack = () => {
    // Try to go to parent route, fallback to list
    const parentRoute = getParentRoute(currentRoute);
    goBack(parentRoute || "/producao/cronograma");
  };

  return (
    <View>
      <DetailHeader
        title={schedule?.title || "Schedule"}
        onBack={handleBack}
      />
      {/* Rest of component */}
    </View>
  );
}
```

## Example 4: Customer List with Conditional Navigation

### Implementation

```typescript
// app/(tabs)/administration/customers/list.tsx
import { useNavigationGuard } from "@/hooks";
import { usePrivileges } from "@/hooks";

export default function CustomerListScreen() {
  const customers = useCustomers();
  const { navigate } = useNavigationGuard();
  const { hasPrivilege } = usePrivileges();

  const canEdit = hasPrivilege(SECTOR_PRIVILEGES.ADMIN);
  const canCreate = hasPrivilege(SECTOR_PRIVILEGES.ADMIN);

  const handleCreateCustomer = () => {
    if (canCreate) {
      navigate("/administracao/clientes/cadastrar");
    }
  };

  const handleEditCustomer = (id: string) => {
    if (canEdit) {
      navigate(`/administracao/clientes/editar/${id}`);
    }
  };

  return (
    <View>
      <Button
        title="Create Customer"
        onPress={handleCreateCustomer}
        disabled={!canCreate}
      />
      <FlatList
        data={customers}
        renderItem={({ item }) => (
          <CustomerCard
            customer={item}
            onEdit={() => handleEditCustomer(item.id)}
            canEdit={canEdit}
          />
        )}
      />
    </View>
  );
}
```

## Example 5: Menu Item with Route Validation

### Implementation

```typescript
// components/navigation/menu-item.tsx
import { useNavigationGuard, useRouteExists } from "@/hooks";
import { memo } from "react";

interface MenuItemProps {
  title: string;
  icon: string;
  route: string;
  requiredPrivilege?: SECTOR_PRIVILEGES;
}

export const MenuItem = memo(function MenuItem({
  title,
  icon,
  route,
  requiredPrivilege,
}: MenuItemProps) {
  const { navigate, canNavigateTo } = useNavigationGuard();
  const { hasPrivilege } = usePrivileges();
  const routeExists = useRouteExists(route);

  // Check if user has permission and route exists
  const canAccess =
    routeExists &&
    (!requiredPrivilege || hasPrivilege(requiredPrivilege));

  const handlePress = () => {
    if (canAccess) {
      navigate(route);
    }
  };

  if (!routeExists) {
    // Don't render if route doesn't exist
    return null;
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={!canAccess}
      style={[styles.menuItem, !canAccess && styles.disabled]}
    >
      <Icon name={icon} />
      <Text>{title}</Text>
    </TouchableOpacity>
  );
});
```

## Example 6: Dynamic Navigation with Form

### Implementation

```typescript
// app/(tabs)/production/schedule/create.tsx
import { useNavigationGuard } from "@/hooks";
import { routes } from "@/constants/routes";

export default function ScheduleCreateScreen() {
  const { navigate, goBack } = useNavigationGuard();
  const createSchedule = useCreateSchedule();

  const handleSubmit = async (data: ScheduleFormData) => {
    try {
      const schedule = await createSchedule.mutateAsync(data);

      // Navigate to newly created schedule detail
      const detailRoute = routes.production.schedule.details(schedule.id);
      navigate(detailRoute);
    } catch (error) {
      console.error("Failed to create schedule:", error);
      // Stay on form on error
    }
  };

  const handleCancel = () => {
    // Go back to list
    goBack(routes.production.schedule.list);
  };

  return (
    <View>
      <ScheduleForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </View>
  );
}
```

## Example 7: Breadcrumb Navigation with Guards

### Implementation

```typescript
// components/ui/breadcrumb-nav.tsx
import { useNavigationGuard, useBreadcrumbs } from "@/hooks";

export function BreadcrumbNav() {
  const { navigate, currentRoute, getParentRoute } = useNavigationGuard();
  const breadcrumbs = useBreadcrumbs();

  const handleBreadcrumbClick = (route: string) => {
    // Safe navigation to breadcrumb item
    navigate(route);
  };

  const handleBackToParent = () => {
    const parentRoute = getParentRoute(currentRoute);
    if (parentRoute) {
      navigate(parentRoute);
    }
  };

  return (
    <View style={styles.breadcrumbContainer}>
      {breadcrumbs.map((crumb, index) => (
        <TouchableOpacity
          key={crumb.path}
          onPress={() => handleBreadcrumbClick(crumb.path)}
          disabled={index === breadcrumbs.length - 1}
        >
          <Text style={styles.breadcrumbText}>{crumb.title}</Text>
          {index < breadcrumbs.length - 1 && (
            <Text style={styles.separator}>/</Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}
```

## Example 8: Protected Route Component

### Implementation

```typescript
// components/navigation/protected-route.tsx
import { useNavigationGuard } from "@/hooks";
import { usePrivileges } from "@/hooks";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPrivilege?: SECTOR_PRIVILEGES;
  fallbackRoute?: string;
}

export function ProtectedRoute({
  children,
  requiredPrivilege,
  fallbackRoute = "/(tabs)/home",
}: ProtectedRouteProps) {
  const { replace, currentRouteInfo } = useNavigationGuard();
  const { hasPrivilege } = usePrivileges();

  useEffect(() => {
    // Check if user has required privilege
    if (requiredPrivilege && !hasPrivilege(requiredPrivilege)) {
      console.warn(
        `Access denied to route: ${currentRouteInfo.path}`,
        `Required privilege: ${requiredPrivilege}`
      );
      replace(fallbackRoute);
    }
  }, [requiredPrivilege, hasPrivilege, currentRouteInfo.path, replace, fallbackRoute]);

  // Show nothing while redirecting
  if (requiredPrivilege && !hasPrivilege(requiredPrivilege)) {
    return null;
  }

  return <>{children}</>;
}

// Usage in screen
export default function AdminScreen() {
  return (
    <ProtectedRoute requiredPrivilege={SECTOR_PRIVILEGES.ADMIN}>
      <View>
        <Text>Admin Content</Text>
      </View>
    </ProtectedRoute>
  );
}
```

## Example 9: Navigation Error Boundary

### Implementation

```typescript
// components/navigation/navigation-error-boundary.tsx
import { useEffect } from "react";
import { useNavigationGuard } from "@/hooks";
import { getNavigationStats, getFailedNavigations } from "@/utils/navigation-guards";

export function NavigationErrorBoundary({ children }: { children: React.ReactNode }) {
  const { currentRoute } = useNavigationGuard();

  useEffect(() => {
    // Monitor failed navigations
    const stats = getNavigationStats();

    if (stats.failed > 0) {
      const failures = getFailedNavigations();
      console.warn("Navigation failures detected:", {
        total: stats.failed,
        rate: stats.successRate,
        recent: failures.slice(-3),
      });
    }
  }, [currentRoute]);

  return <>{children}</>;
}

// Add to app layout
export default function RootLayout() {
  return (
    <NavigationErrorBoundary>
      {/* App content */}
    </NavigationErrorBoundary>
  );
}
```

## Example 10: Tab Navigation with Guards

### Implementation

```typescript
// app/(tabs)/_layout.tsx
import { useNavigationGuard } from "@/hooks";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  const { navigate, canNavigateTo } = useNavigationGuard();

  const tabs = [
    { name: "home", title: "Home", route: "/(tabs)/home" },
    { name: "production", title: "Production", route: "/(tabs)/production" },
    { name: "inventory", title: "Inventory", route: "/(tabs)/inventory" },
  ];

  return (
    <Tabs>
      {tabs.map(tab => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            // Disable tab if route doesn't exist
            href: canNavigateTo(tab.route) ? tab.route : null,
          }}
        />
      ))}
    </Tabs>
  );
}
```

## Example 11: Search Results with Navigation

### Implementation

```typescript
// components/search/search-results.tsx
import { useNavigationGuard } from "@/hooks";

interface SearchResult {
  id: string;
  type: "schedule" | "customer" | "item";
  title: string;
}

export function SearchResults({ results }: { results: SearchResult[] }) {
  const { navigate } = useNavigationGuard();

  const getRouteForResult = (result: SearchResult): string => {
    switch (result.type) {
      case "schedule":
        return `/producao/cronograma/detalhes/${result.id}`;
      case "customer":
        return `/administracao/clientes/detalhes/${result.id}`;
      case "item":
        return `/estoque/produtos/detalhes/${result.id}`;
      default:
        return "/(tabs)/home";
    }
  };

  const handleResultClick = (result: SearchResult) => {
    const route = getRouteForResult(result);
    navigate(route);
  };

  return (
    <FlatList
      data={results}
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => handleResultClick(item)}>
          <Text>{item.title}</Text>
          <Text>{item.type}</Text>
        </TouchableOpacity>
      )}
    />
  );
}
```

## Example 12: Deep Link Handler with Validation

### Implementation

```typescript
// lib/deep-link-handler.ts
import { safeNavigate, routeExists } from "@/utils/navigation-guards";

export function handleDeepLink(url: string) {
  try {
    // Parse URL to get route
    const route = parseDeepLink(url);

    // Validate route exists
    if (!routeExists(route)) {
      console.error("Deep link route does not exist:", route);
      // Navigate to home instead
      safeNavigate("/(tabs)/home");
      return;
    }

    // Safe navigation
    const success = safeNavigate(route);

    if (!success) {
      console.error("Failed to navigate from deep link:", route);
      // Fallback handled automatically by safeNavigate
    }
  } catch (error) {
    console.error("Error handling deep link:", error);
    safeNavigate("/(tabs)/home");
  }
}

function parseDeepLink(url: string): string {
  // Parse deep link URL to internal route
  // Example: ankaa://schedule/123 -> /producao/cronograma/detalhes/123
  const urlObj = new URL(url);
  const path = urlObj.pathname;

  // Map external paths to internal routes
  // Implementation depends on your deep linking structure
  return path;
}
```

## Best Practices Summary

1. **Always use navigation guards** instead of direct router calls
2. **Provide fallback routes** for back navigation
3. **Validate routes** before attempting navigation
4. **Use dynamic route helpers** for consistency
5. **Check route existence** in conditional rendering
6. **Handle navigation errors** gracefully
7. **Log navigation attempts** for debugging
8. **Use protected routes** for permission checking
9. **Monitor navigation stats** in development

## Migration Checklist

- [ ] Replace all `router.push()` with `navigate()`
- [ ] Replace all `router.back()` with `goBack(fallbackRoute)`
- [ ] Replace all `router.replace()` with `replace()`
- [ ] Add route validation before navigation
- [ ] Add fallback routes to back navigation
- [ ] Use dynamic route helpers for parameterized routes
- [ ] Add route existence checks for conditional rendering
- [ ] Implement protected routes for privileged screens
- [ ] Test navigation error handling
- [ ] Monitor navigation statistics

These examples demonstrate how to integrate the navigation guards system throughout your application for safer, more robust navigation.
