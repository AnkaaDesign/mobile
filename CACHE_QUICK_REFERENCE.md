# Cache Invalidation Quick Reference

> **TL;DR:** Use selective invalidation for entity operations, full cache clear only for auth.

## Decision Tree

```
Is this an authentication operation (logout/auth error)?
│
├─ YES → Use queryClient.clear() ✅
│         + Clear AsyncStorage cache
│         + Clear auth tokens
│
└─ NO → Is this an entity mutation (create/update/delete)?
         │
         ├─ YES → Use selective invalidation ✅
         │         queryClient.invalidateQueries({ queryKey: entityKeys.all })
         │         queryClient.invalidateQueries({ queryKey: relatedKeys.all })
         │
         └─ NO → Need help? See full documentation
```

## Quick Commands

### Use Factory (Recommended)

```typescript
const hooks = createEntityHooks({
  queryKeys: entityKeys,
  service: entityService,
  relatedQueryKeys: [relatedKey1, relatedKey2],
});
```

### Manual Selective Invalidation

```typescript
// After entity mutation
queryClient.invalidateQueries({ queryKey: entityKeys.all });
queryClient.invalidateQueries({ queryKey: entityKeys.detail(id) });
queryClient.invalidateQueries({ queryKey: relatedKeys.all });
```

### Full Cache Clear (Auth Only)

```typescript
// On logout
queryClient.clear();
await AsyncStorage.removeItem("react-query-cache");
```

## Common Patterns

| Operation | Pattern | Example |
|-----------|---------|---------|
| Create entity | Invalidate entity.all + related | `invalidateQueries({ queryKey: customerKeys.all })` |
| Update entity | Invalidate entity.all + entity.detail + related | `invalidateQueries({ queryKey: customerKeys.detail(id) })` |
| Delete entity | Invalidate entity.all + related | `invalidateQueries({ queryKey: customerKeys.all })` |
| Batch operation | Invalidate entity.all + related.all | Same as above but broader scope |
| Logout | Full cache clear | `queryClient.clear()` |

## File References

| Need | File |
|------|------|
| Comprehensive analysis | `PHASE_6_CACHE_ALIGNMENT_REPORT.md` |
| Code examples | `CACHE_INVALIDATION_EXAMPLES.md` |
| Executive summary | `PHASE_6_SUMMARY.md` |
| Factory implementation | `src/hooks/createEntityHooks.ts` |
| Verification script | `verify-cache-alignment.sh` |

## Verification

Run the verification script:

```bash
cd /home/kennedy/repositories/mobile
./verify-cache-alignment.sh
```

Expected: All tests pass ✅

## Red Flags 🚨

**If you see this in entity mutations, it's WRONG:**

```typescript
// ❌ DON'T DO THIS in entity mutations
queryClient.clear();
```

**If you see this, it's RIGHT:**

```typescript
// ✅ DO THIS in entity mutations
queryClient.invalidateQueries({ queryKey: entityKeys.all });
```

## Getting Help

1. Check `CACHE_INVALIDATION_EXAMPLES.md` for your use case
2. Look at similar existing hooks (e.g., `useCustomer.ts`)
3. Use the `createEntityHooks` factory
4. When in doubt, follow the factory pattern

## Key Stats

- **Hooks using factory:** 93
- **Selective invalidation calls:** 196
- **Related key patterns:** 53
- **Inappropriate cache clears:** 0 ✅
- **Auth cache clears:** 3 ✅

**Status:** ✅ ALIGNED

---

**Version:** 1.0 | **Date:** 2025-10-26
