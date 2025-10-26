# Cache Invalidation Pattern Examples

This document provides practical examples of cache invalidation patterns used in the mobile application, demonstrating the selective invalidation strategy that's already implemented.

## Table of Contents

1. [Overview](#overview)
2. [Pattern 1: Basic Entity Mutation](#pattern-1-basic-entity-mutation)
3. [Pattern 2: Entity with Related Queries](#pattern-2-entity-with-related-queries)
4. [Pattern 3: Batch Operations](#pattern-3-batch-operations)
5. [Pattern 4: Complex Relationships](#pattern-4-complex-relationships)
6. [Pattern 5: Authentication Operations](#pattern-5-authentication-operations)
7. [Anti-Patterns](#anti-patterns)

---

## Overview

The application uses **selective cache invalidation** for all entity operations, implemented through the `createEntityHooks` factory. This ensures:

- Only affected queries are refetched
- Related entities are properly synchronized
- Performance is optimized
- Behavior is consistent across web and mobile

---

## Pattern 1: Basic Entity Mutation

### Use Case
Simple entity updates without complex relationships.

### Example: Backup Operations

**File:** `/home/kennedy/repositories/mobile/src/hooks/useBackup.ts`

```typescript
export function useBackupMutations() {
  const queryClient = useQueryClient();

  // ✅ Create backup - invalidate all backup queries
  const createBackup = useMutation({
    mutationFn: (data: CreateBackupRequest) => backupApi.createBackup(data),
    onSuccess: (result) => {
      // Only invalidate backup-related queries
      queryClient.invalidateQueries({ queryKey: backupQueryKeys.all });
    },
  });

  // ✅ Schedule backup - invalidate only scheduled backup queries
  const scheduleBackup = useMutation({
    mutationFn: (data: ScheduleBackupRequest) => backupApi.scheduleBackup(data),
    onSuccess: (result) => {
      // More specific invalidation - only scheduled backups
      queryClient.invalidateQueries({ queryKey: backupQueryKeys.scheduled() });
    },
  });

  // ✅ Verify backup - invalidate specific verification query
  const verifyBackup = useMutation({
    mutationFn: (id: string) => backupApi.verifyBackup(id),
    onSuccess: (result, id) => {
      // Most specific invalidation - single verification query
      queryClient.invalidateQueries({ queryKey: backupQueryKeys.verification(id) });
    },
  });

  return {
    create: createBackup,
    schedule: scheduleBackup,
    verify: verifyBackup,
  };
}
```

**Key Points:**
- Each mutation invalidates only the queries it affects
- More specific queries (like verification) use targeted invalidation
- No full cache clears

---

## Pattern 2: Entity with Related Queries

### Use Case
Entities that affect multiple related query types.

### Example: Customer Operations

**File:** `/home/kennedy/repositories/mobile/src/hooks/useCustomer.ts`

```typescript
export function useUpdateCustomer(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CustomerUpdateFormData) => updateCustomer(id, data),
    onSuccess: () => {
      // Step 1: Invalidate the specific customer detail
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(id) });

      // Step 2: Invalidate all customer lists (to reflect changes in list views)
      queryClient.invalidateQueries({ queryKey: customerKeys.all });

      // Step 3: Invalidate customer statistics
      queryClient.invalidateQueries({ queryKey: customerKeys.statistics() });

      // Step 4: Invalidate related entities
      queryClient.invalidateQueries({ queryKey: taskKeys.byCustomer(id) });
      queryClient.invalidateQueries({ queryKey: fileKeys.all }); // Customer logos
      queryClient.invalidateQueries({ queryKey: changeLogKeys.all }); // Audit trail
    },
  });
}
```

**Why This Pattern:**
- Customer changes affect tasks assigned to that customer
- Customer logos are stored as files
- Change logs track customer modifications
- List views need to reflect updated data

---

## Pattern 3: Batch Operations

### Use Case
Bulk operations that affect multiple records.

### Example: Batch Customer Updates

**File:** `/home/kennedy/repositories/mobile/src/hooks/useCustomer.ts`

```typescript
export function useBatchUpdateCustomers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CustomerBatchUpdateFormData) => batchUpdateCustomers(data),
    onSuccess: () => {
      // Batch operations require broader invalidation

      // Invalidate all customer queries (we don't know which specific ones changed)
      queryClient.invalidateQueries({ queryKey: customerKeys.all });

      // Invalidate statistics (aggregate data likely changed)
      queryClient.invalidateQueries({ queryKey: customerKeys.statistics() });

      // Invalidate all related entities (can't target specific ones)
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: fileKeys.all });
      queryClient.invalidateQueries({ queryKey: changeLogKeys.all });
    },
  });
}
```

**Key Difference from Single Updates:**
- Batch operations can't target specific IDs
- Must invalidate entire collections
- Still selective (not clearing unrelated entities like orders, items, etc.)

---

## Pattern 4: Complex Relationships

### Use Case
Entities with complex cross-entity relationships.

### Example: File Operations

**File:** `/home/kennedy/repositories/mobile/src/hooks/useFile.ts`

```typescript
export const useFileDelete = (options = {}) => {
  const queryClient = useQueryClient();
  const { optimisticUpdate = true } = options;

  return useMutation({
    mutationFn: async ({ _id, deleteFromStorage = true }) => {
      const response = await deleteFile(_id, deleteFromStorage);
      return { _id, deleted: true, response };
    },

    onMutate: async ({ _id }) => {
      if (!optimisticUpdate) return;

      // ✅ ADVANCED: Optimistic updates with selective cache manipulation

      // Step 1: Cancel in-flight queries
      await queryClient.cancelQueries({ queryKey: fileKeys.all });

      // Step 2: Get previous state for rollback
      const previousFiles = queryClient.getQueriesData({ queryKey: fileKeys.all });

      // Step 3: Optimistically update cache
      queryClient.setQueriesData<FileGetManyResponse>(
        { queryKey: fileKeys.lists() },
        (old) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: old.data.filter((file) => file.id !== _id),
          };
        }
      );

      // Step 4: Remove from individual queries
      queryClient.removeQueries({ queryKey: fileKeys.detail(_id) });

      return { previousFiles };
    },

    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousFiles && optimisticUpdate) {
        context.previousFiles.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      options.onError?.(error);
    },

    onSuccess: (data) => {
      // ✅ Ensure cache is updated after successful deletion
      queryClient.invalidateQueries({ queryKey: fileKeys.all });

      // ✅ Invalidate related entity queries that might reference this file
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
      queryClient.invalidateQueries({ queryKey: supplierKeys.all });

      options.onSuccess?.(data);
    },
  });
};
```

**Advanced Features:**
- **Optimistic updates** for instant UI feedback
- **Rollback mechanism** on error
- **Cross-entity invalidation** (files can belong to tasks, customers, suppliers)
- **Selective invalidation** even with complex relationships

---

## Pattern 5: Authentication Operations

### Use Case
User logout, session invalidation, authentication errors.

### Example: Logout (Full Cache Clear)

**File:** `/home/kennedy/repositories/mobile/src/contexts/auth-context.tsx`

```typescript
const logout = async (showAlert = false, alertMessage = "") => {
  setLoading(true);
  try {
    // Step 1: Clear auth state
    setUser(null);
    setAccessToken(null);
    setCachedToken(null);
    await removeStoredToken();
    await removeUserData();

    // Step 2: Clear React Query cache
    if (queryClient) {
      // First, selectively remove sensitive queries
      queryClient.removeQueries({ queryKey: USER_QUERY_KEYS.all });

      // Then, full cache clear (appropriate for logout)
      queryClient.clear(); // ✅ ONLY acceptable for auth operations
    }

    // Step 3: Clear persisted cache (mobile-specific)
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    await AsyncStorage.removeItem("react-query-cache");

    // Step 4: Show alert if needed
    if (showAlert && alertMessage) {
      Alert.alert("Access Blocked", alertMessage);
    }
  } catch (error) {
    console.error("Error during logout:", error);
  } finally {
    setLoading(false);
    setTimeout(() => {
      router.replace(routeToMobilePath(routes.authentication.login));
    }, 100);
  }
};
```

**Why Full Cache Clear Here:**
- User is logging out - all cached data should be cleared
- Security: prevent next user from seeing previous user's data
- Memory management: free up memory on mobile device
- Persistence: clear disk-cached data from AsyncStorage

### Example: Authentication Error Handler

```typescript
const handleAuthError = async (error: { statusCode: number; message: string }) => {
  if (error.statusCode === 401 || error.statusCode === 403) {
    try {
      // Clear auth state
      setUser(null);
      setAccessToken(null);
      setCachedToken(null);
      await removeStoredToken();
      await removeUserData();
      setAuthToken(null);

      // Clear React Query cache
      if (queryClient) {
        queryClient.removeQueries({ queryKey: USER_QUERY_KEYS.all });
        queryClient.clear(); // ✅ Appropriate for auth errors
      }

      // Clear persisted cache
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      await AsyncStorage.removeItem("react-query-cache");

      // Navigate to login
      router.replace(routeToMobilePath(routes.authentication.login));
    } catch (cleanupError) {
      console.error("Error during auth error cleanup:", cleanupError);
    }
  }
};
```

---

## Anti-Patterns

### ❌ Anti-Pattern 1: Full Cache Clear on Entity Mutation

**DON'T DO THIS:**

```typescript
export function useUpdateCustomer(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CustomerUpdateFormData) => updateCustomer(id, data),
    onSuccess: () => {
      // ❌ WRONG: Clears ALL queries, including unrelated ones
      queryClient.clear();
    },
  });
}
```

**Why It's Wrong:**
- Clears unrelated data (orders, items, products, etc.)
- Forces unnecessary refetches
- Poor performance
- Bad user experience (loading states everywhere)

**Correct Version:**

```typescript
export function useUpdateCustomer(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CustomerUpdateFormData) => updateCustomer(id, data),
    onSuccess: () => {
      // ✅ CORRECT: Only invalidate affected queries
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.byCustomer(id) });
    },
  });
}
```

---

### ❌ Anti-Pattern 2: No Invalidation

**DON'T DO THIS:**

```typescript
export function useUpdateCustomer(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CustomerUpdateFormData) => updateCustomer(id, data),
    onSuccess: () => {
      // ❌ WRONG: No invalidation - stale data remains
      // Nothing here!
    },
  });
}
```

**Why It's Wrong:**
- UI shows stale data
- List views don't update
- User has to manually refresh
- Inconsistent state across the app

---

### ❌ Anti-Pattern 3: Over-Invalidation

**DON'T DO THIS:**

```typescript
export function useUpdateCustomer(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CustomerUpdateFormData) => updateCustomer(id, data),
    onSuccess: () => {
      // ❌ WRONG: Invalidating unrelated queries
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
      queryClient.invalidateQueries({ queryKey: orderKeys.all }); // Not related!
      queryClient.invalidateQueries({ queryKey: itemKeys.all }); // Not related!
      queryClient.invalidateQueries({ queryKey: productKeys.all }); // Not related!
      queryClient.invalidateQueries({ queryKey: supplierKeys.all }); // Not related!
    },
  });
}
```

**Why It's Wrong:**
- Refetches unrelated data
- Poor performance
- Network waste
- Battery drain on mobile

**Correct Version:**

```typescript
export function useUpdateCustomer(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CustomerUpdateFormData) => updateCustomer(id, data),
    onSuccess: () => {
      // ✅ CORRECT: Only related queries
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.byCustomer(id) }); // Related!
      queryClient.invalidateQueries({ queryKey: fileKeys.all }); // Customer logos
    },
  });
}
```

---

### ❌ Anti-Pattern 4: Invalidating Inside Loops

**DON'T DO THIS:**

```typescript
const handleBatchUpdate = async (customers: Customer[]) => {
  for (const customer of customers) {
    await updateCustomer(customer.id, customer);

    // ❌ WRONG: Invalidating inside loop causes multiple refetches
    queryClient.invalidateQueries({ queryKey: customerKeys.all });
  }
};
```

**Why It's Wrong:**
- Triggers refetch after every single update
- Network spam
- Poor performance
- Race conditions

**Correct Version:**

```typescript
const handleBatchUpdate = async (customers: Customer[]) => {
  // Use batch API
  await batchUpdateCustomers({
    data: customers.map(c => ({ id: c.id, data: c }))
  });

  // ✅ CORRECT: Single invalidation after all updates
  queryClient.invalidateQueries({ queryKey: customerKeys.all });
};

// Or even better, use the hook that handles this:
const { batchUpdate } = useCustomerBatchMutations();
```

---

## Using createEntityHooks Factory

The `createEntityHooks` factory automatically implements the correct invalidation pattern. Always prefer using it over manual mutations.

### Example: Creating New Entity Hooks

```typescript
import { createEntityHooks } from "./createEntityHooks";
import { productKeys, categoryKeys, supplierKeys, changeLogKeys } from "./queryKeys";
import { productService } from '@/api-client';

// ✅ RECOMMENDED: Use factory for consistent behavior
const productHooks = createEntityHooks({
  queryKeys: productKeys,
  service: productService,
  staleTime: 1000 * 60 * 5, // 5 minutes

  // Define related entities that should be invalidated
  relatedQueryKeys: [categoryKeys, supplierKeys, changeLogKeys],
});

// Export standard hooks
export const useProductsInfinite = productHooks.useInfiniteList;
export const useProducts = productHooks.useList;
export const useProduct = productHooks.useDetail;
export const useProductMutations = productHooks.useMutations;
export const useProductBatchMutations = productHooks.useBatchMutations;

// The factory automatically handles:
// - Selective invalidation
// - Related query invalidation
// - Optimistic updates (if configured)
// - Error handling
// - Loading states
```

---

## Query Key Structure

Proper query key structure is essential for selective invalidation.

### Example: Customer Query Keys

```typescript
export const customerKeys = {
  all: ["customers"] as const,
  lists: () => [...customerKeys.all, "list"] as const,
  list: (filters?: any) => [...customerKeys.lists(), filters] as const,
  details: () => [...customerKeys.all, "detail"] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
  statistics: () => [...customerKeys.all, "statistics"] as const,
  byIds: (ids: string[]) => [...customerKeys.all, "byIds", ids] as const,
};
```

**How Invalidation Works:**

```typescript
// Invalidate specific customer
queryClient.invalidateQueries({ queryKey: customerKeys.detail("123") });
// Invalidates: ["customers", "detail", "123"]

// Invalidate all customer lists
queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
// Invalidates: ["customers", "list", ...], ["customers", "list", {...}], etc.

// Invalidate ALL customer queries
queryClient.invalidateQueries({ queryKey: customerKeys.all });
// Invalidates: ALL queries starting with ["customers", ...]
```

---

## Testing Cache Invalidation

### Test 1: Verify Selective Invalidation

```typescript
it("should only invalidate customer queries on update", async () => {
  const { result } = renderHook(() => useUpdateCustomer("123"), {
    wrapper: createWrapper(),
  });

  // Spy on invalidateQueries
  const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");

  // Perform mutation
  await act(async () => {
    await result.current.mutateAsync({ name: "Updated Name" });
  });

  // Assert only customer queries were invalidated
  expect(invalidateQueriesSpy).toHaveBeenCalledWith({
    queryKey: customerKeys.detail("123"),
  });
  expect(invalidateQueriesSpy).toHaveBeenCalledWith({
    queryKey: customerKeys.all,
  });

  // Assert unrelated queries were NOT invalidated
  expect(invalidateQueriesSpy).not.toHaveBeenCalledWith({
    queryKey: orderKeys.all,
  });
  expect(invalidateQueriesSpy).not.toHaveBeenCalledWith({
    queryKey: itemKeys.all,
  });
});
```

### Test 2: Verify Full Cache Clear Only on Logout

```typescript
it("should clear all cache on logout", async () => {
  const { result } = renderHook(() => useAuth(), {
    wrapper: createWrapper(),
  });

  // Spy on clear
  const clearSpy = jest.spyOn(queryClient, "clear");

  // Perform logout
  await act(async () => {
    await result.current.logout.mutateAsync();
  });

  // Assert cache was cleared
  expect(clearSpy).toHaveBeenCalled();
});

it("should NOT clear cache on customer update", async () => {
  const { result } = renderHook(() => useUpdateCustomer("123"), {
    wrapper: createWrapper(),
  });

  // Spy on clear
  const clearSpy = jest.spyOn(queryClient, "clear");

  // Perform update
  await act(async () => {
    await result.current.mutateAsync({ name: "Updated Name" });
  });

  // Assert cache was NOT cleared
  expect(clearSpy).not.toHaveBeenCalled();
});
```

---

## Summary

### ✅ DO

1. Use selective invalidation for entity mutations
2. Use `createEntityHooks` factory for consistency
3. Invalidate related queries when entities have relationships
4. Use full cache clear ONLY for authentication operations
5. Clear persisted cache on logout (mobile)
6. Use optimistic updates for better UX
7. Define proper query key hierarchies

### ❌ DON'T

1. Use `queryClient.clear()` for entity mutations
2. Invalidate unrelated queries
3. Skip invalidation entirely
4. Invalidate inside loops
5. Over-invalidate "just to be safe"
6. Mix authentication patterns with entity patterns

---

**Document Version:** 1.0
**Last Updated:** 2025-10-26
**Maintained By:** Development Team
