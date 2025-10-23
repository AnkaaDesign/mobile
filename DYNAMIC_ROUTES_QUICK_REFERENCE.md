# Dynamic Routes Quick Reference

## Import Statements

```typescript
// Hooks
import {
  useRequiredIdParam,
  useIdParam,
  useRequiredNestedIdParams,
  useNestedIdParams,
  useRequiredFormulaComponentParams,
  useUserIdParam,
  useQueryParams
} from '@/hooks';

// Types
import {
  IdParams,
  NestedIdParams,
  FormulaComponentParams
} from '@/types/route-params';

// Navigation
import { router } from 'expo-router';
import { routeToMobilePath } from '@/lib/route-mapper';
import { routes } from '@/constants';
```

---

## Common Patterns

### Single ID Parameter (e.g., /products/details/[id])

```typescript
// Detail Screen
const id = useRequiredIdParam();
const { data } = useProduct(id);
```

### Nested IDs (e.g., /orders/[orderId]/items/[id])

```typescript
// Detail Screen
const { orderId, id } = useRequiredNestedIdParams();
const { data } = useOrderItem(id);
```

### Formula Components (e.g., /formulas/[formulaId]/components/[id])

```typescript
// Detail Screen
const { formulaId, id } = useRequiredFormulaComponentParams();
const { data } = useFormulaComponent(id);
```

### User-Specific Routes (e.g., /payroll/[userId])

```typescript
// Detail Screen
const { userId, isValid, error } = useUserIdParam();
if (!isValid) return <ErrorScreen message={error} />;
```

---

## Navigation Patterns

### From List to Detail

```typescript
const handlePress = (id: string) => {
  router.push(routeToMobilePath(routes.products.details(id)));
};
```

### From Detail to Edit

```typescript
const id = useRequiredIdParam();
const handleEdit = () => {
  router.push(routeToMobilePath(routes.products.edit(id)));
};
```

### With Query Parameters

```typescript
router.push({
  pathname: routeToMobilePath(routes.payroll.details(userId)),
  params: { year: '2024', month: '1' }
});

// In detail screen
const { year, month } = useQueryParams<{ year: string; month: string }>();
```

---

## Decision Tree

```
Is this a detail/edit screen with [id]?
├─ YES: Is there only one [id] parameter?
│  ├─ YES: Use `useRequiredIdParam()`
│  └─ NO: Are there two IDs (parent/child)?
│     ├─ YES: Is it order/item pattern?
│     │  └─ Use `useRequiredNestedIdParams()`
│     └─ NO: Is it formula/component pattern?
│        └─ Use `useRequiredFormulaComponentParams()`
│
└─ NO: Is this a list screen?
   └─ Use navigation helpers only
```

---

## Error Handling

### Automatic (Throws on Error)

```typescript
const id = useRequiredIdParam();  // Throws if invalid
```

### Manual (Custom Error UI)

```typescript
const { id, isValid, error } = useIdParam();

if (!isValid) {
  return <ErrorScreen message={error} />;
}
```

---

## File Naming Conventions

- Single parameter: `details/[id].tsx`
- Nested parameters: `[orderId]/items/details/[id].tsx`
- Custom parameter: `[userId].tsx`, `[token].tsx`, etc.

---

## Common Mistakes to Avoid

❌ Don't cast with `as any`:
```typescript
router.push(path as any);
```

❌ Don't use raw `useLocalSearchParams` without types:
```typescript
const { id } = useLocalSearchParams();
```

❌ Don't manually handle arrays:
```typescript
const id = Array.isArray(params.id) ? params.id[0] : params.id;
```

❌ Don't skip validation:
```typescript
const id = params.id!;  // Unsafe
```

✅ Do use type-safe hooks:
```typescript
const id = useRequiredIdParam();
```

---

## TypeScript Types

### Route Parameters

```typescript
interface IdParams { id: string }
interface NestedIdParams { orderId: string; id: string }
interface FormulaComponentParams { formulaId: string; id: string }
interface UserIdParams { userId: string }
interface TokenParams { token: string }
interface EntityParams { entityType: string; entityId: string }
```

### Hook Return Types

```typescript
// useIdParam
{ id: string; isValid: boolean; error: string | null }

// useRequiredIdParam
string  // Throws on error

// useNestedIdParams
{ orderId: string; id: string; isValid: boolean; error: string | null }

// useRequiredNestedIdParams
{ orderId: string; id: string }  // Throws on error
```

---

## File Structure

```
src/
├── types/
│   └── route-params.ts          # Type definitions
├── hooks/
│   ├── use-route-params.ts      # Custom hooks
│   └── index.ts                 # Export hooks
├── lib/
│   └── route-mapper.ts          # Navigation utilities
└── app/(tabs)/
    ├── products/
    │   ├── list.tsx             # Navigation from here
    │   └── details/
    │       └── [id].tsx         # useRequiredIdParam()
    ├── orders/
    │   └── [orderId]/
    │       └── items/
    │           └── details/
    │               └── [id].tsx # useRequiredNestedIdParams()
    └── formulas/
        └── [formulaId]/
            └── components/
                └── details/
                    └── [id].tsx # useRequiredFormulaComponentParams()
```

---

## Quick Migration Steps

1. **Add import**: `import { useRequiredIdParam } from '@/hooks';`
2. **Replace extraction**: `const id = useRequiredIdParam();`
3. **Remove checks**: Delete `if (!id || id === "")` blocks
4. **Fix navigation**: Remove `as any` casts
5. **Test**: Navigate with valid and invalid IDs

---

## When to Use Each Hook

| Hook | Use Case | Example Route |
|------|----------|---------------|
| `useRequiredIdParam()` | Simple detail/edit screens | `/products/details/[id]` |
| `useIdParam()` | Need custom error handling | `/products/details/[id]` |
| `useRequiredNestedIdParams()` | Order items, nested resources | `/orders/[orderId]/items/[id]` |
| `useRequiredFormulaComponentParams()` | Formula components | `/formulas/[formulaId]/components/[id]` |
| `useUserIdParam()` | User-specific pages | `/payroll/[userId]` |
| `useTokenParam()` | Token-based routes | `/reset-password/[token]` |
| `useQueryParams<T>()` | Extract query strings | Any route with `?param=value` |

---

## Related Documentation

- [Complete Guide](./DYNAMIC_ROUTE_PARAMETERS_GUIDE.md)
- [Migration Examples](./ROUTE_PARAMETER_MIGRATION_EXAMPLES.md)
- [Expo Router Docs](https://docs.expo.dev/router/introduction/)
