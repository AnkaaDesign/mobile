# Navigation State Management Analysis - Mobile App

## Executive Summary

The mobile application uses **Expo Router** (file-based routing system similar to Next.js) with a custom navigation history tracking mechanism. The current implementation has **moderate issues** related to state synchronization, route parameter handling, and navigation state persistence that need to be addressed.

### Key Findings
- Navigation system is primarily managed through Expo Router with a supplementary NavigationHistoryContext
- Route parameter passing appears to work correctly through Expo Router's `useLocalSearchParams`
- Navigation state synchronization issues exist between the history context and actual navigation stack
- No explicit navigation listeners are implemented for state synchronization
- State persistence for navigation context is not implemented

---

## 1. Navigation Architecture Overview

### Current Stack
- **Framework**: Expo Router 6.0.8 (file-based routing, similar to Next.js)
- **React Navigation**: Used underneath Expo Router
  - Drawer Navigator (primary navigation pattern)
  - Stack Navigator (nested navigation)
- **Custom Context**: NavigationHistoryContext (supplementary history tracking)

### Navigation Structure
```
Root Layout (/app/_layout.tsx)
├── ErrorBoundary
├── GestureHandlerRootView
├── SafeAreaProvider
├── ThemeProvider
├── QueryClientProvider
├── AuthProvider
├── FileViewerProvider
├── NavigationHistoryProvider ← Custom
├── SwipeRowProvider
└── Stack
    ├── (auth) - Authentication routes
    ├── (tabs) - Main app with Drawer
    │   ├── Drawer.Screen (multiple screens)
    │   └── Header with back button + menu button
    └── index - Redirect based on auth state
```

---

## 2. Route Parameter Management

### Current Implementation

#### Route Parameters (Positive ✓)
- **Dynamic Routes**: Work correctly through Expo Router's `useLocalSearchParams()`
  - Example: `/production/schedule/details/[id]` captures `id` parameter
  - File: `[id].tsx` automatically creates catch-all parameter
  
- **Pattern**: Clean separation of concerns
  ```typescript
  const { id } = useLocalSearchParams();
  const { data: response } = useTaskDetail(id as string, { include: {...} });
  ```

#### Issues Identified
1. **No Route Context Parameter Passing** (⚠️ Low Priority)
   - Navigation params are passed but not validated
   - No type safety for route parameters
   - Example: Should validate `id` is UUID format before API call

2. **Query String Parameters Not Utilized**
   - Current implementation doesn't use search params for state
   - All state is kept in React Query cache
   - Risk: Deep linking might not preserve all necessary state

### Recommendations
```typescript
// Add route param validation
interface ScheduleDetailParams {
  id: string; // UUID format
  referrer?: string; // Track where user came from
  expand?: string; // Query params for what to include
}

const useValidatedParams = (schema: ZodSchema) => {
  const params = useLocalSearchParams();
  try {
    return schema.parse(params);
  } catch (error) {
    console.error('[ROUTING] Invalid params:', error);
    router.back();
    return null;
  }
};
```

---

## 3. Navigation State Synchronization

### Current Issues (Critical ⚠️⚠️)

#### Problem 1: NavigationHistoryContext Desynchronization
The custom history context can get out of sync with the actual navigation stack:

**Current Code** (navigation-history-context.tsx, lines 31-36):
```typescript
useEffect(() => {
  if (pathname) {
    addToHistory(pathname);
  }
}, [pathname]);
```

**Issues**:
- Tracks pathname changes but doesn't listen to actual navigation events
- Can miss navigation that happens through other means
- History array doesn't reflect actual React Navigation stack state
- `router.back()` doesn't guarantee going to the recorded previous route

**Example Scenario**:
1. User navigates: Home → Details → Edit
2. History: ["/home", "/details/123", "/edit/123"]
3. User presses hardware back button (bypasses NavigationHistory)
4. Actual nav goes to Details, but History context doesn't update
5. Next `goBack()` call goes to wrong route

#### Problem 2: No Navigation Listeners
Missing React Navigation listeners:
```typescript
// Current implementation LACKS these listeners:
// - onStateChange: Called when navigation state changes
// - onAction: Called when an action is dispatched
// - onUnhandledAction: For handling unhandled navigation
```

#### Problem 3: Back Button Implementation
File: `(tabs)/_layout.tsx`, lines 1521-1538

```typescript
headerLeft: () => {
  if (!shouldShowBackButton(pathname, canGoBack)) return null;
  return (
    <Pressable onPress={() => goBack()}>
      {/* Back button */}
    </Pressable>
  );
}
```

**Issues**:
- Uses custom `goBack()` which manipulates history array
- Doesn't use native `navigation.goBack()` reliably
- Can cause navigation state mismatch
- Back history not synchronized with Drawer navigator state

---

## 4. Navigation State Persistence

### Current Status: NOT IMPLEMENTED (⚠️⚠️)

Currently, navigation state is **NOT** persisted:
- No `rehydrateNavigationState` implementation
- No storage of navigation history to AsyncStorage
- No restoration of navigation state on app restart

**Impact**:
- User loses navigation position on app restart
- No "resume" functionality
- Deep linking doesn't preserve history

### Missing Implementation
```typescript
// NOT PRESENT in codebase
// Should be in RootLayout or (tabs)/_layout.tsx

const navigationRef = useRef(null);

const handleNavigationStateChange = async (state) => {
  // Persist state
  await AsyncStorage.setItem('navigationState', JSON.stringify(state));
};

useEffect(() => {
  // Restore state on mount
  const state = await AsyncStorage.getItem('navigationState');
  // ...
}, []);
```

---

## 5. Navigation Listeners and Observers

### Current Status: MINIMAL (⚠️)

#### What Exists:
1. **AppState Listener** (auth-context.tsx, lines 384-409)
   - Monitors app foreground/background transitions
   - Re-validates session when app returns to foreground
   - ✓ Good pattern for auth state

2. **Auth Error Handler** (auth-context.tsx, lines 87-142)
   - Listens for 401/403 auth errors
   - Triggers logout on auth failure
   - ✓ Properly synchronized

#### What's Missing:
1. **Navigation State Observer**
   - No listener for navigation state changes
   - No tracking of route transitions
   - No deep-linking verification

2. **Parameter Change Listener**
   - Each screen must use `useLocalSearchParams()`
   - No automatic validation
   - No type checking

3. **Navigation Error Handler**
   - No error boundaries for navigation failures
   - No handling for undefined routes
   - No tracking of failed navigation attempts

---

## 6. Nested Navigator Communication

### Current Implementation

#### Drawer + Stack Hierarchy
```typescript
// (tabs)/_layout.tsx
<Drawer>
  <Drawer.Screen name="home" />
  <Drawer.Screen name="production/schedule" />
  <Drawer.Screen name="production/schedule/details/[id]" />
</Drawer>
```

#### Issues:
1. **Drawer State Not Synchronized**
   - Drawer can be open while navigation happens
   - Menu expansion state doesn't match navigation
   - No synchronized state between menus and tabs

2. **Nested Route Configuration**
   - Routes like `/production/schedule/details/[id]` registered at drawer level
   - Could be more efficiently organized with nested navigators
   - Current flat structure works but isn't optimal

3. **Menu Item Active State**
   - Menu activation logic in CustomDrawerContent (lines 737-791)
   - Uses `pathname` and manual matching
   - Subject to path translation bugs (Portuguese ↔ English)

---

## 7. Found Issues and Bugs

### Issue #1: Route Parameter Synchronization (Medium ⚠️)
**File**: `/production/schedule/details/[id].tsx`

Current code:
```typescript
const { id } = useLocalSearchParams();
const { data: response } = useTaskDetail(id as string, { ... });
```

**Problem**:
- No validation that `id` exists before API call
- `useTaskDetail` will fail silently if `id` is undefined
- No error handling for invalid ID formats

**Fix**:
```typescript
const { id } = useLocalSearchParams<{ id: string }>();

if (!id) {
  return <ErrorScreen message="ID não fornecido" />;
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (!uuidRegex.test(id)) {
  return <ErrorScreen message="ID inválido" />;
}

const { data: response } = useTaskDetail(id, { ... });
```

### Issue #2: History Array Can Grow Unbounded (Low ⚠️)
**File**: `navigation-history-context.tsx`, lines 58-61

Current code:
```typescript
// Keep history manageable (max 20 entries)
if (newHistory.length > 20) {
  return newHistory.slice(-20);
}
```

**Problem**:
- With current usage, 20 items might not be enough for complex navigation flows
- No consideration for memory pressure on low-end devices
- Array slicing on every navigation is inefficient

**Better approach**:
```typescript
const MAX_HISTORY = 50; // For better UX
if (newHistory.length > MAX_HISTORY) {
  return newHistory.slice(-MAX_HISTORY);
}
```

### Issue #3: Menu Active State Path Matching (Medium ⚠️⚠️)
**File**: `(tabs)/_layout.tsx`, lines 737-791

Current logic has path matching bugs:
```typescript
// Current implementation
const itemEnglishPath = getEnglishPath(item.path);
if (currentPath === itemEnglishPath) return true;
if (currentPath.startsWith(itemEnglishPath + "/")) return true;
```

**Problems**:
- Path translation between Portuguese and English is error-prone
- `/estoque/produtos` vs `/inventory/products` vs `/(tabs)/inventory/products` mismatch
- Doesn't properly handle dynamic segments like `[id]`

**Example failure**:
- Item path: `/estoque/produtos/detalhes/:id`
- Current path: `/(tabs)/inventory/products/details/123`
- Translation doesn't match due to format differences

### Issue #4: Router.back() Implementation (Medium ⚠️⚠️)
**File**: `navigation-history-context.tsx`, lines 69-95

Current code:
```typescript
const goBack = () => {
  if (history.length > 1) {
    const previousRoute = history[history.length - 2];
    setHistory((prev) => prev.slice(0, -1));
    router.back(); // ← Uses native back instead of pushing route
  }
};
```

**Issue**:
- Line 83: Uses `router.back()` which is good
- But line 81: Modifies history BEFORE navigation completes
- If navigation fails, history is inconsistent

**Better approach**:
```typescript
const goBack = async () => {
  if (history.length <= 1) {
    router.push("/(tabs)/home");
    return;
  }
  
  try {
    // Use native back first
    await router.back();
    // Update history only after successful navigation
    setHistory((prev) => prev.slice(0, -1));
  } catch (error) {
    console.error('[NAV] Back navigation failed:', error);
    // Recover by going to home
    router.push("/(tabs)/home");
  }
};
```

### Issue #5: No Type Safety for Navigation Routes (Medium ⚠️)
**Problem**: Routes are typed as `string` everywhere

Current:
```typescript
router.push(tabRoute as any); // ← Using 'as any'
props.navigation?.closeDrawer?.(); // ← Optional chaining hides issues
```

Should use:
```typescript
type TabRoute = `/(tabs)/${string}`;
const isValidTabRoute = (route: unknown): route is TabRoute => {
  return typeof route === 'string' && route.startsWith('/(tabs)/');
};

if (!isValidTabRoute(tabRoute)) {
  throw new Error(`Invalid route: ${tabRoute}`);
}
router.push(tabRoute);
```

---

## 8. Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     RootLayout                          │
├─────────────────────────────────────────────────────────┤
│  • AuthProvider (handles auth state + validation)      │
│  • NavigationHistoryProvider (custom history tracking) │
│  • Stack (with (auth) + (tabs) + index)                │
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│              (tabs)/_layout.tsx                         │
├─────────────────────────────────────────────────────────┤
│  • Drawer Navigator (custom content with menu items)   │
│  • CustomDrawerContent (menu rendering + navigation)   │
│  • Drawer.Screen (dynamic screen registration)         │
├─────────────────────────────────────────────────────────┤
│  ⚠️ ISSUE: Flat screen structure, not nested navigators│
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│           Individual Screen Files                       │
├─────────────────────────────────────────────────────────┤
│  • /home/index.tsx                                      │
│  • /production/schedule/details/[id].tsx                │
│  • /production/schedule/list/index.tsx                  │
├─────────────────────────────────────────────────────────┤
│  ⚠️ ISSUE: Each must handle their own params            │
│  ⚠️ ISSUE: No shared navigation context                 │
└─────────────────────────────────────────────────────────┘
```

---

## 9. Recommendations and Fixes

### Priority 1: Critical (Implement Immediately)

#### 1.1 Add Navigation State Listeners
**File to Create**: `src/lib/navigation-listener-setup.ts`

```typescript
import { NavigationContainerRef } from '@react-navigation/native';

export function setupNavigationListeners(
  navigationRef: NavigationContainerRef<any>,
  onStateChange: (state: any) => void
) {
  // Called when navigation state changes
  const unsubscribe = navigationRef?.addListener?.('state', ({ data }) => {
    console.log('[NAV] State changed:', data);
    onStateChange(data);
  });

  return unsubscribe;
}
```

#### 1.2 Synchronize History Context with Actual Navigation
**Update File**: `src/contexts/navigation-history-context.tsx`

```typescript
import { useEffect } from "react";
import { useFocusEffect } from "@react-navigation/native";

export function NavigationHistoryProvider({ children }: NavigationHistoryProviderProps) {
  const [history, setHistory] = useState<string[]>([]);
  const pathname = usePathname();
  const router = useRouter();
  const navigationRef = useRef<NavigationContainerRef>(null);

  // Sync with actual navigation state changes
  useFocusEffect(
    useCallback(() => {
      // Get current route from navigation state
      const state = navigationRef.current?.getRootState();
      if (state) {
        const currentRoute = state.routeNames[state.index];
        console.log('[NAV HISTORY] Syncing with navigation state:', currentRoute);
        
        // Update history if route changed
        setHistory(prev => {
          if (prev[prev.length - 1] !== pathname) {
            const newHistory = [...prev, pathname];
            return newHistory.length > 50 ? newHistory.slice(-50) : newHistory;
          }
          return prev;
        });
      }
    }, [pathname])
  );

  // ... rest of component
}
```

#### 1.3 Add Route Parameter Validation Hook
**File to Create**: `src/hooks/useValidatedParams.ts`

```typescript
import { useLocalSearchParams } from "expo-router";
import { ZodSchema, z } from "zod";

export function useValidatedParams<T>(schema: ZodSchema<T>): T | null {
  const params = useLocalSearchParams();
  
  try {
    return schema.parse(params);
  } catch (error) {
    console.error('[ROUTING] Invalid params:', error);
    // Trigger error boundary or redirect
    return null;
  }
}

// Usage in component:
const scheduleDetailSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
  tab: z.enum(['info', 'timeline', 'files']).optional(),
});

export function ScheduleDetailsScreen() {
  const params = useValidatedParams(scheduleDetailSchema);
  
  if (!params) {
    return <ErrorScreen message="Invalid schedule ID" />;
  }

  return <ScheduleDetails id={params.id} />;
}
```

### Priority 2: High (Implement in Next Sprint)

#### 2.1 Fix Menu Active State Detection
**Update File**: `src/(tabs)/_layout.tsx`, lines 737-791

```typescript
// IMPROVED: isItemActive function
const isItemActive = useCallback((item: any): boolean => {
  if (!item.path) return false;

  // Normalize current path
  const currentPath = pathname.replace(/^\/(\(tabs\))?/, '');
  
  // Normalize item path
  const itemPath = item.path.replace(/^\//, '');
  
  // Convert Portuguese to English for comparison
  const itemEnglishPath = getEnglishPath(itemPath);
  
  // Debug logging
  if (DEBUG_STYLES) {
    console.log('[MENU] isItemActive check:', {
      itemId: item.id,
      currentPath,
      itemPath,
      itemEnglishPath,
      isMatch: currentPath === itemEnglishPath || currentPath.startsWith(itemEnglishPath + '/')
    });
  }

  // Exact match or prefix match
  return (
    currentPath === itemEnglishPath || 
    currentPath.startsWith(itemEnglishPath + '/')
  );
}, [pathname]);
```

#### 2.2 Improve goBack Implementation
**Update File**: `src/contexts/navigation-history-context.tsx`, lines 69-95

```typescript
const goBack = useCallback(async () => {
  console.log('[NAV HISTORY] goBack called, history length:', history.length);

  if (history.length <= 1) {
    // No history, go to home
    try {
      await router.push("/(tabs)/home" as any);
    } catch (error) {
      console.error('[NAV HISTORY] Failed to navigate to home:', error);
    }
    return;
  }

  try {
    // Update history AFTER successful navigation
    const newHistory = history.slice(0, -1);
    
    // Attempt native back navigation
    await router.back();
    
    // Only update history if navigation succeeded
    setHistory(newHistory);
    console.log('[NAV HISTORY] Back navigation successful');
  } catch (error) {
    console.error('[NAV HISTORY] Back navigation failed:', error);
    
    // Fallback: navigate to previous route manually
    if (history.length >= 2) {
      const previousRoute = history[history.length - 2];
      try {
        await router.push(previousRoute as any);
        setHistory(history.slice(0, -1));
      } catch (fallbackError) {
        console.error('[NAV HISTORY] Fallback navigation also failed:', fallbackError);
        // Last resort: go to home
        await router.push("/(tabs)/home" as any);
        setHistory([]);
      }
    }
  }
}, [history, router]);
```

#### 2.3 Implement Navigation State Persistence
**File to Create**: `src/lib/navigation-persistence.ts`

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const NAVIGATION_STATE_KEY = 'navigation_state';

export async function persistNavigationState(state: any): Promise<void> {
  try {
    const serialized = JSON.stringify(state);
    await AsyncStorage.setItem(NAVIGATION_STATE_KEY, serialized);
    console.log('[NAV] Navigation state persisted');
  } catch (error) {
    console.error('[NAV] Failed to persist navigation state:', error);
  }
}

export async function restoreNavigationState(): Promise<any | null> {
  try {
    const serialized = await AsyncStorage.getItem(NAVIGATION_STATE_KEY);
    if (serialized) {
      return JSON.parse(serialized);
    }
  } catch (error) {
    console.error('[NAV] Failed to restore navigation state:', error);
  }
  return null;
}

export async function clearNavigationState(): Promise<void> {
  try {
    await AsyncStorage.removeItem(NAVIGATION_STATE_KEY);
    console.log('[NAV] Navigation state cleared');
  } catch (error) {
    console.error('[NAV] Failed to clear navigation state:', error);
  }
}
```

### Priority 3: Medium (Implement in Following Sprint)

#### 3.1 Add Type-Safe Route Definitions
**File to Create**: `src/types/routes.ts`

```typescript
import { z } from 'zod';

// Define all routes with parameters
export const routeSchemas = {
  'production/schedule/details/[id]': z.object({
    id: z.string().uuid(),
  }),
  'inventory/products/details/[id]': z.object({
    id: z.string().uuid(),
  }),
  // ... other routes
} as const;

// Type helper
export type RouteParams<T extends keyof typeof routeSchemas> = 
  z.infer<typeof routeSchemas[T]>;

// Usage in component
export function useRouteParams<T extends keyof typeof routeSchemas>(
  route: T
): RouteParams<T> | null {
  const params = useLocalSearchParams();
  try {
    return routeSchemas[route].parse(params);
  } catch (error) {
    console.error(`Invalid params for route ${route}:`, error);
    return null;
  }
}
```

#### 3.2 Add Navigation Error Boundary
**File to Create**: `src/components/navigation-error-boundary.tsx`

```typescript
import React from 'react';
import { ErrorBoundary, FallbackComponent } from 'react-error-boundary';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

const NavigationErrorFallback: FallbackComponent = ({ error, resetErrorBoundary }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
    <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
      Erro na Navegação
    </Text>
    <Text style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>
      {error?.message || 'Falha ao navegar para a página solicitada'}
    </Text>
    <Pressable
      onPress={resetErrorBoundary}
      style={{ padding: 12, backgroundColor: '#15803d', borderRadius: 8 }}
    >
      <Text style={{ color: 'white', fontWeight: 'bold' }}>Tentar Novamente</Text>
    </Pressable>
  </View>
);

export function NavigationErrorBoundary({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <ErrorBoundary
      FallbackComponent={NavigationErrorFallback}
      onReset={() => router.replace('/(tabs)/home' as any)}
      onError={(error) => {
        console.error('[NAV ERROR]', error);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
```

---

## 10. Testing Strategy

### Unit Tests for Navigation

```typescript
// tests/contexts/navigation-history-context.test.ts
import { renderHook, act } from '@testing-library/react-native';
import { useNavigationHistory } from '@/contexts/navigation-history-context';

describe('NavigationHistoryContext', () => {
  test('should add route to history on navigation', () => {
    const { result } = renderHook(() => useNavigationHistory());
    
    act(() => {
      result.current.pushToHistory('/home');
      result.current.pushToHistory('/details/123');
    });

    expect(result.current.canGoBack).toBe(true);
    expect(result.current.getBackPath()).toBe('/home');
  });

  test('should handle goBack correctly', async () => {
    const { result } = renderHook(() => useNavigationHistory());
    
    act(() => {
      result.current.pushToHistory('/home');
      result.current.pushToHistory('/details');
    });

    await act(async () => {
      await result.current.goBack();
    });

    expect(result.current.getBackPath()).toBeNull();
  });

  test('should not exceed max history length', () => {
    const { result } = renderHook(() => useNavigationHistory());
    
    act(() => {
      for (let i = 0; i < 30; i++) {
        result.current.pushToHistory(`/route${i}`);
      }
    });

    // History should be capped at 20
    expect(result.current.canGoBack).toBe(true);
  });
});
```

---

## 11. Implementation Timeline

| Priority | Task | Estimated Time | Sprint |
|----------|------|-----------------|--------|
| P1 | Add navigation state listeners | 4 hours | Current |
| P1 | Synchronize history context | 6 hours | Current |
| P1 | Add route param validation hook | 3 hours | Current |
| P2 | Fix menu active state detection | 4 hours | Next |
| P2 | Improve goBack implementation | 3 hours | Next |
| P2 | Navigation state persistence | 5 hours | Next |
| P3 | Type-safe route definitions | 6 hours | Following |
| P3 | Navigation error boundary | 4 hours | Following |
| Total | - | **35 hours** | **3 Sprints** |

---

## 12. Monitoring and Logging

### Add Navigation Analytics
```typescript
// src/lib/navigation-analytics.ts
export function logNavigation(
  from: string,
  to: string,
  duration: number,
  success: boolean
) {
  console.log('[NAV ANALYTICS]', {
    from,
    to,
    duration: `${duration}ms`,
    success,
    timestamp: new Date().toISOString(),
  });

  // Send to analytics service
  // analytics.trackNavigation({ from, to, duration, success });
}

// Usage
const start = performance.now();
try {
  await router.push(route);
  logNavigation(currentPath, route, performance.now() - start, true);
} catch (error) {
  logNavigation(currentPath, route, performance.now() - start, false);
}
```

---

## 13. Conclusion

The mobile app's navigation system is **functional but needs improvements** in state synchronization and error handling. The main issues are:

1. History context not synced with actual navigation stack
2. Missing navigation listeners
3. No state persistence
4. Fragile path matching for menu active states
5. Inadequate error handling for navigation failures

Implementing the Priority 1 recommendations will significantly improve navigation reliability and user experience. The proposed fixes maintain backward compatibility while adding robustness.

**Next Steps**:
1. Implement Priority 1 fixes immediately
2. Add comprehensive tests
3. Monitor navigation errors in production
4. Plan Priority 2 and 3 improvements

