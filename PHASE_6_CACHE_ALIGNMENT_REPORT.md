# PHASE 6: Query Cache Invalidation Strategy Alignment Report

## Executive Summary

This report documents the current cache invalidation strategies between web and mobile implementations, identifies inconsistencies, and provides recommendations for alignment to ensure consistent behavior across platforms.

## Current State Analysis

### Web Implementation

**Pattern: Selective Cache Invalidation**

Web uses a sophisticated, selective cache invalidation strategy that targets specific query keys:

```typescript
// Example from web/src/hooks/useCustomer.ts
export function useUpdateCustomer(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CustomerUpdateFormData) => updateCustomer(id, data),
    onSuccess: () => {
      // Selective invalidation of affected queries only
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
      queryClient.invalidateQueries({ queryKey: customerKeys.statistics() });
      queryClient.invalidateQueries({ queryKey: taskKeys.byCustomer(id) });
      queryClient.invalidateQueries({ queryKey: fileKeys.all });
      queryClient.invalidateQueries({ queryKey: changeLogKeys.all });
    },
  });
}
```

**Cache Clear Usage on Web:**
- Only used in `useAuth.ts` logout mutation
- File: `/home/kennedy/repositories/web/src/hooks/useAuth.ts:103`
- Context: Full cache clear ONLY on logout (appropriate)

### Mobile Implementation

**Pattern: Mixed - Primarily Selective, with Full Clears in Auth**

Mobile uses the same selective invalidation pattern in most hooks but has full cache clears in authentication contexts:

```typescript
// Example from mobile/src/hooks/useCustomer.ts - GOOD PATTERN
export function useUpdateCustomer(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CustomerUpdateFormData) => updateCustomer(id, data),
    onSuccess: () => {
      // Same selective invalidation as web
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
      queryClient.invalidateQueries({ queryKey: customerKeys.statistics() });
      queryClient.invalidateQueries({ queryKey: taskKeys.byCustomer(id) });
      queryClient.invalidateQueries({ queryKey: fileKeys.all });
      queryClient.invalidateQueries({ queryKey: changeLogKeys.all });
    },
  });
}
```

**Cache Clear Usage on Mobile:**
- Used in `useAuth.ts` logout mutation (line 103)
- Used in `auth-context.tsx` logout function (line 114, 583)
- Used in `auth-context.tsx` authentication error handler (line 114)
- Files:
  - `/home/kennedy/repositories/mobile/src/hooks/useAuth.ts:103`
  - `/home/kennedy/repositories/mobile/src/contexts/auth-context.tsx:114`
  - `/home/kennedy/repositories/mobile/src/contexts/auth-context.tsx:583`

## Shared Architecture (Already Aligned)

Both web and mobile use the **same** `createEntityHooks` factory pattern, which implements selective invalidation by default:

```typescript
// From both mobile and web createEntityHooks.ts (lines 244-256)
const invalidateQueries = () => {
  // Invalidate main entity queries
  queryClient.invalidateQueries({
    queryKey: queryKeys.all,
  });

  // Invalidate related queries
  relatedQueryKeys.forEach((keys) => {
    queryClient.invalidateQueries({
      queryKey: keys.all,
    });
  });
};
```

This factory is used by:
- Customer hooks
- Service Order hooks
- Order Item hooks
- File hooks
- Backup hooks
- And 31+ other entity hooks

## Key Findings

### 1. Alignment Status: MOSTLY ALIGNED

**Good News:**
- Mobile and web share identical `createEntityHooks` implementation
- Both use selective invalidation for all entity mutations
- Both use the same relatedQueryKeys pattern for cross-entity invalidation
- Cache structure and query keys are consistent

**Differences:**
- Mobile has additional full cache clears in auth-context.tsx
- Mobile's auth context is more complex due to AsyncStorage and React Native lifecycle

### 2. Mobile-Specific Cache Clear Locations

All `queryClient.clear()` calls in mobile are authentication-related:

#### Location 1: useAuth.ts (Hook-level)
```typescript
// File: mobile/src/hooks/useAuth.ts:100-105
const logout = useMutation({
  mutationFn: authService.logout,
  onSuccess: () => {
    queryClient.clear(); // Clear all cached data on logout
  },
});
```

#### Location 2: auth-context.tsx (Context-level logout)
```typescript
// File: mobile/src/contexts/auth-context.tsx:570-613
const logout = async (showAlert = false, alertMessage = "") => {
  setLoading(true);
  try {
    setUser(null);
    setAccessToken(null);
    setCachedToken(null);
    await removeStoredToken();
    await removeUserData();

    // Safely clear user from React Query cache
    if (queryClient) {
      queryClient.removeQueries({ queryKey: USER_QUERY_KEYS.all });
      queryClient.clear(); // Line 583
    }

    // Clear persisted React Query cache
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    await AsyncStorage.removeItem("react-query-cache");
  } catch (error) {
    console.error("Error during logout:", error);
  } finally {
    setLoading(false);
    router.replace(routeToMobilePath(routes.authentication.login));
  }
};
```

#### Location 3: auth-context.tsx (Auth error handler)
```typescript
// File: mobile/src/contexts/auth-context.tsx:95-137
const handleAuthError = async (error: { statusCode: number; message: string; category: any }) => {
  if (error.statusCode === 401 || error.statusCode === 403) {
    try {
      // Clear auth state immediately
      setUser(null);
      setAccessToken(null);
      setCachedToken(null);
      await removeStoredToken();
      await removeUserData();
      setAuthToken(null);

      // Clear React Query cache
      if (queryClient) {
        queryClient.removeQueries({ queryKey: USER_QUERY_KEYS.all });
        queryClient.clear(); // Line 114
      }

      // Clear persisted React Query cache
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      await AsyncStorage.removeItem("react-query-cache");

      // Navigate to login page
      router.replace(routeToMobilePath(routes.authentication.login));
    } catch (cleanupError) {
      console.error("Error during auth error cleanup:", cleanupError);
    }
  }
};
```

### 3. Why Mobile Has More Cache Clears

Mobile's additional cache clears are justified because:

1. **AsyncStorage Persistence**: Mobile persists cache to disk via AsyncStorage
2. **App Lifecycle**: Mobile apps can be backgrounded/foregrounded, requiring more aggressive cache management
3. **Security**: Mobile devices are more vulnerable to physical access, requiring thorough cleanup on logout
4. **Memory Constraints**: Mobile devices benefit from full cache clears to free memory

## Recommendations

### Recommendation 1: Keep Current Architecture (NO CHANGES NEEDED)

**Status: ALIGNED**

The current implementation is already well-aligned. Both platforms use:
- Selective invalidation via `createEntityHooks`
- Shared query key structure
- Related query invalidation pattern
- Full cache clear only on logout

**Rationale:**
- Mobile's additional cache clears in auth-context.tsx are appropriate for the platform
- The extra clears handle mobile-specific concerns (persistence, lifecycle)
- Entity mutations use identical selective invalidation on both platforms

### Recommendation 2: Document Platform Differences

Add documentation explaining when full cache clears are appropriate:

**Appropriate for `queryClient.clear()`:**
- User logout
- Authentication errors (401/403)
- User deletion/deactivation
- Critical security events

**NOT appropriate for `queryClient.clear()`:**
- Entity mutations (create/update/delete)
- Data refreshes
- Navigation changes
- Component unmount

### Recommendation 3: Enhance Mobile Cache Management (Optional)

Consider adding selective invalidation before full cache clear in logout:

```typescript
// Enhanced logout with pre-clear selective invalidation
const logout = async () => {
  try {
    // Step 1: Selectively invalidate sensitive queries first
    queryClient.removeQueries({ queryKey: USER_QUERY_KEYS.all });
    queryClient.invalidateQueries({ queryKey: ['auth'] });

    // Step 2: Full cache clear
    queryClient.clear();

    // Step 3: Clear persisted cache
    await AsyncStorage.removeItem("react-query-cache");
  } finally {
    router.replace(routes.authentication.login);
  }
};
```

This ensures a clean transition and prevents any potential race conditions.

## Benefits of Current Alignment

### 1. Performance
- Selective invalidation minimizes unnecessary refetches
- Only affected queries are invalidated after mutations
- Related entities are properly synchronized

### 2. Consistency
- Same behavior across web and mobile for entity operations
- Predictable cache behavior
- Reduced debugging complexity

### 3. Maintainability
- Shared `createEntityHooks` factory reduces code duplication
- Single source of truth for invalidation logic
- Easy to add new entities with consistent behavior

### 4. User Experience
- Faster UI updates (fewer unnecessary refetches)
- Consistent data across related views
- Proper cache synchronization

## Pattern Examples

### Pattern 1: Entity Mutation (Standard - Already Implemented)

**When to use:** All entity create/update/delete operations

```typescript
// ✅ CORRECT - Already implemented in mobile and web
export function useUpdateCustomer(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CustomerUpdateFormData) => updateCustomer(id, data),
    onSuccess: () => {
      // Selective invalidation
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
      queryClient.invalidateQueries({ queryKey: customerKeys.statistics() });

      // Related entities
      queryClient.invalidateQueries({ queryKey: taskKeys.byCustomer(id) });
      queryClient.invalidateQueries({ queryKey: fileKeys.all });
      queryClient.invalidateQueries({ queryKey: changeLogKeys.all });
    },
  });
}

// ❌ WRONG - Don't do this for entity mutations
export function useUpdateCustomer(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CustomerUpdateFormData) => updateCustomer(id, data),
    onSuccess: () => {
      queryClient.clear(); // Too aggressive! ❌
    },
  });
}
```

### Pattern 2: Authentication (Platform-Specific - Already Correct)

**When to use:** Logout, auth errors, session invalidation

```typescript
// ✅ CORRECT - Already implemented in mobile auth-context.tsx
const logout = async () => {
  try {
    // Clear auth state
    setUser(null);
    setAccessToken(null);
    await removeStoredToken();

    // Clear ALL cache on logout
    queryClient.clear(); // ✅ Appropriate here

    // Mobile-specific: Clear persisted cache
    await AsyncStorage.removeItem("react-query-cache");
  } finally {
    router.replace(routes.authentication.login);
  }
};
```

### Pattern 3: Using createEntityHooks (Standard - Already Implemented)

**When to use:** Creating new entity hooks

```typescript
// ✅ CORRECT - Already the standard pattern
const customerHooks = createEntityHooks({
  queryKeys: customerKeys,
  service: customerService,
  staleTime: 1000 * 60 * 5, // 5 minutes
  relatedQueryKeys: [taskKeys, fileKeys, changeLogKeys], // Related entities
});

// The factory automatically implements selective invalidation
export const useCustomerMutations = customerHooks.useMutations;
export const useCustomerBatchMutations = customerHooks.useBatchMutations;
```

## Implementation Status

### Already Implemented ✅

1. **Selective invalidation in entity hooks** - Both platforms use `createEntityHooks`
2. **Related query invalidation** - `relatedQueryKeys` pattern implemented
3. **Full cache clear on logout** - Implemented in both platforms
4. **Mobile-specific AsyncStorage clear** - Implemented in mobile auth-context

### No Changes Required ✅

The current implementation is already aligned and follows best practices. The differences between mobile and web are platform-specific and appropriate.

## Testing Recommendations

To verify cache alignment:

1. **Test entity mutations:**
   - Create/update/delete a customer
   - Verify only customer and related queries are refetched
   - Verify unrelated queries (e.g., items, orders) are NOT refetched

2. **Test logout:**
   - Perform logout
   - Verify ALL queries are cleared
   - Verify AsyncStorage is cleared (mobile)
   - Verify user is redirected to login

3. **Test auth errors:**
   - Trigger a 401 error
   - Verify cache is cleared
   - Verify user is logged out

4. **Test cross-entity updates:**
   - Update a customer
   - Verify tasks related to that customer are refetched
   - Verify files associated with customer are refetched

## Monitoring Recommendations

Add metrics to track:

1. **Cache invalidation frequency** - Monitor how often queries are invalidated
2. **Refetch counts** - Track unnecessary refetches (indicates over-invalidation)
3. **Cache hit rates** - Monitor cache effectiveness
4. **Logout performance** - Measure time to clear cache and redirect

## Conclusion

**The mobile and web implementations are already well-aligned.** Both use selective cache invalidation for entity operations via the shared `createEntityHooks` factory, and both use full cache clears only for authentication events (logout, auth errors).

Mobile's additional cache clears in `auth-context.tsx` are appropriate and necessary for handling:
- AsyncStorage persistence
- React Native app lifecycle
- Security requirements
- Memory management

**No changes are required.** The current implementation follows best practices and provides consistent behavior across platforms while accommodating platform-specific requirements.

## File References

### Mobile Files Analyzed
- `/home/kennedy/repositories/mobile/src/hooks/useCustomer.ts`
- `/home/kennedy/repositories/mobile/src/hooks/useBackup.ts`
- `/home/kennedy/repositories/mobile/src/hooks/useFile.ts`
- `/home/kennedy/repositories/mobile/src/hooks/useOrderItem.ts`
- `/home/kennedy/repositories/mobile/src/hooks/useServiceOrder.ts`
- `/home/kennedy/repositories/mobile/src/hooks/useAuth.ts`
- `/home/kennedy/repositories/mobile/src/hooks/createEntityHooks.ts`
- `/home/kennedy/repositories/mobile/src/contexts/auth-context.tsx`

### Web Files Analyzed
- `/home/kennedy/repositories/web/src/hooks/useCustomer.ts`
- `/home/kennedy/repositories/web/src/hooks/useAuth.ts`
- `/home/kennedy/repositories/web/src/hooks/createEntityHooks.ts`

### Statistics
- **Total hooks with cache operations (mobile):** 31 files
- **Full cache clears (mobile):** 3 locations (all auth-related)
- **Full cache clears (web):** 1 location (logout only)
- **Shared implementation:** `createEntityHooks` is identical on both platforms

---

**Report Date:** 2025-10-26
**Status:** ALIGNED - No Action Required
**Next Review:** After major refactoring or cache-related issues
