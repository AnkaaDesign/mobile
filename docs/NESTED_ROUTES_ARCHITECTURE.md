# Nested Routes Architecture Decision

## Executive Summary

The List System supports nested routes (routes with dynamic parameters like `[orderId]`) through a **component wrapper pattern** called `NestedLayout`. This approach:

- **Non-breaking**: Doesn't modify core `ListConfig` or `Layout` components
- **Reusable**: Single pattern works for all nested routes
- **Simple**: Minimal boilerplate per page (6-8 lines)
- **Flexible**: Supports simple and complex filtering scenarios

---

## Problem Statement

### Original Challenge

Nested routes need to:
1. Extract route parameters (e.g., `orderId` from `[orderId]`)
2. Apply parent ID as a filter in the query
3. Use the existing `Layout` component
4. Maintain type safety

### Why Not Modify ListConfig?

Initially considered adding route parameter support directly to `ListConfig`:

```typescript
// REJECTED APPROACH
interface ListConfig {
  query: {
    ...
    routeParams?: { key: string; mapTo: string }[] // Would require changes everywhere
  }
}
```

**Issues**:
- Breaking change to all existing configs
- Complicates `ListConfig` type definition
- Layout component needs to know about `useLocalSearchParams`
- Makes Layout less reusable (coupling to routing)

---

## Chosen Solution: Component Wrapper Pattern

### Architecture Diagram

```
NestedLayout (extracted params)
    ↓
    ├─ Extract param via useLocalSearchParams
    ├─ Build where clause via buildWhere callback
    ├─ Modify config with where clause
    └─ Render Layout with modified config
        ↓
        Layout (unchanged)
            ↓
            useList (unchanged)
                ↓
                Hook (receives where in params)
                    ↓
                    API
```

### Why This Approach?

1. **Separation of Concerns**
   - `NestedLayout` handles routing concerns
   - `Layout` handles UI concerns
   - `useList` handles data concerns

2. **Non-Breaking**
   - Existing layouts, hooks, configs unchanged
   - Can migrate incrementally
   - Old pages can coexist with new

3. **Composable**
   - Can nest NestedLayout components if needed
   - Can wrap with additional providers
   - Can customize error handling

4. **Testable**
   - Each layer testable independently
   - Mock useLocalSearchParams in tests
   - No coupling between test and routing

---

## Implementation Details

### NestedLayout Component

**Location**: `src/components/list/NestedLayout.tsx`

**Responsibilities**:
1. Extract route parameter using `useLocalSearchParams`
2. Validate parameter exists and is valid
3. Build where clause via callback
4. Merge with existing config where clause
5. Render Layout with modified config
6. Handle error states (missing params)

**Key Features**:
- Parameter validation
- Configurable error handling
- Graceful degradation
- Minimal overhead

```typescript
interface NestedLayoutProps {
  config: ListConfig<T>
  paramKey: string
  buildWhere?: (paramValue: string) => any
  validateParam?: boolean
  onParamError?: (key: string, value: any) => ReactNode
}
```

### Config Files

**Location**: `src/config/list/{module}/{entity}.ts`

**Key Point**: Configs do NOT include the parent filter

```typescript
// Config does NOT have:
where: { orderId: 'xxx' }

// Instead, NestedLayout adds it at runtime:
<NestedLayout
  config={config}
  buildWhere={(orderId) => ({ orderId })}
/>
```

### Page Components

**Location**: `src/app/(tabs)/.../[parentId]/{entity}/listar.tsx`

**Pattern**: Simple wrapper around NestedLayout

```typescript
export default function ListScreen() {
  return (
    <NestedLayout
      config={entityConfig}
      paramKey="parentId"
      buildWhere={(parentId) => ({ parentId })}
    />
  )
}
```

---

## Data Flow

### Request Path

```
1. User navigates to: /estoque/pedidos/order-123/items/listar
2. Page component renders: OrderItemsListScreen()
3. NestedLayout extracts: { orderId: 'order-123' }
4. buildWhere creates: { where: { orderId: 'order-123' } }
5. Modified config passed to: Layout component
6. Layout uses: useList hook
7. useList calls: useOrderItemsInfiniteMobile({
     where: { orderId: 'order-123' },
     orderBy: { createdAt: 'desc' },
     include: { item: true },
     limit: 25
   })
8. Hook calls: API with merged params
9. API returns: Filtered data
10. Layout renders: Table with filtered items
```

### Response Path

```
API ← Hook ← useList ← Layout ← NestedLayout ← Page → Browser
```

---

## Comparison with Alternatives

### Alternative 1: Direct ListConfig Modification

**Approach**: Add route param support to ListConfig

```typescript
// REJECTED
config.query.routeParams = { key: 'orderId', mapTo: 'orderId' }
```

**Pros**:
- Explicit in config
- No wrapper component

**Cons**:
- Breaking change to ListConfig type
- Layout must import useLocalSearchParams (routing concern)
- Complicates type definitions
- Harder to extend for complex cases

### Alternative 2: Context-Based Params

**Approach**: Use React Context to pass parent ID

```typescript
// REJECTED
<ParentIDProvider parentId={orderId}>
  <Layout config={config} />
</ParentIDProvider>
```

**Pros**:
- Can pass additional parent data
- Works across component tree

**Cons**:
- Requires additional provider setup
- More boilerplate per page
- Context overhead
- Harder to test

### Alternative 3: HoC Pattern

**Approach**: Higher-order component wrapping

```typescript
// POSSIBLE BUT OVERKILL
const withNestedRoute = (Component, paramKey) => (props) => {
  const params = useLocalSearchParams()
  // ...
}
```

**Pros**:
- Reusable wrapper

**Cons**:
- More complex
- HoC patterns less idiomatic in modern React
- Props drilling issues
- Less readable

### Chosen: NestedLayout Component

**Why**: Simple, explicit, testable, non-breaking

---

## Integration with List System

### How Configs Are Used

1. **Regular Routes** (No nesting)
   ```typescript
   // src/app/(tabs)/estoque/produtos/listar.tsx
   export default function ProductsListScreen() {
     return <Layout config={itemsListConfig} />
   }
   ```

2. **Nested Routes** (With parent ID)
   ```typescript
   // src/app/(tabs)/estoque/pedidos/[orderId]/items/listar.tsx
   export default function OrderItemsListScreen() {
     return (
       <NestedLayout
         config={orderItemsListConfig}
         paramKey="orderId"
         buildWhere={(orderId) => ({ orderId })}
       />
     )
   }
   ```

### Hook Requirements

All hooks used in nested routes must support the `where` parameter:

**Good Hook**:
```typescript
function useOrderItemsInfiniteMobile(params?: {
  where?: any           // Prisma where clause
  orderBy?: any         // Sorting
  include?: any         // Related data
  limit?: number        // Page size
  enabled?: boolean
})
```

**Bad Hook** (won't work):
```typescript
function useOrderItems(orderId: string) {
  // Can't pass where clause
}
```

---

## Type Safety

### Route Params Interface

Define interfaces for each nested route:

```typescript
// src/types/routes.ts
export interface OrderItemsRouteParams {
  orderId: string
}

export interface FormulaComponentsRouteParams {
  formulaId: string
}
```

### Usage in Page

```typescript
import { useLocalSearchParams } from 'expo-router'
import type { OrderItemsRouteParams } from '@/types/routes'

export default function OrderItemsListScreen() {
  const { orderId } = useLocalSearchParams<OrderItemsRouteParams>()

  // orderId is now typed as string
  return (
    <NestedLayout
      config={orderItemsListConfig}
      paramKey="orderId"
      buildWhere={(orderId) => ({ orderId })} // Type-safe
    />
  )
}
```

---

## Error Handling Strategy

### Level 1: Parameter Validation

NestedLayout validates params before rendering:

```typescript
const { orderId } = useLocalSearchParams()

if (!orderId || orderId === '') {
  return <ErrorScreen message="Order not found" />
}
```

### Level 2: Hook Error States

useList hook provides error state:

```typescript
if (list.error && list.items.length === 0) {
  return <ErrorScreen message="Failed to load items" />
}
```

### Level 3: Custom Error Handler

Per-page error handling:

```typescript
<NestedLayout
  config={orderItemsListConfig}
  paramKey="orderId"
  onParamError={(key) => (
    <CustomOrderNotFoundScreen />
  )}
/>
```

---

## Performance Considerations

### Query Merging

When NestedLayout adds where clause:

```typescript
// Config existing where
config.query.where = { status: 'ACTIVE' }

// NestedLayout adds parent filter
buildWhere = (orderId) => ({ orderId })

// Result: AND both conditions
const finalWhere = {
  AND: [
    { status: 'ACTIVE' },
    { orderId: 'order-123' }
  ]
}
```

**Performance**: Minimal - just object composition

### Memoization

Prevent unnecessary re-renders:

```typescript
// NestedLayout uses useMemo for:
- whereClause calculation
- modifiedConfig creation

// Page should use useMemo for:
- buildWhere function if complex
- config if modified dynamically
```

---

## Extensibility

### Future Enhancement: Automatic Route Generation

Could extend to auto-generate routes:

```typescript
config.table.actions = [
  {
    key: 'view',
    // Currently manual:
    route: (item) => `/estoque/pedidos/${item.orderId}/items/detalhes/${item.id}`

    // Could be automated:
    route: autoRoute('/items/detalhes/{id}', { parentParam: 'orderId' })
  }
]
```

### Future Enhancement: Shared Parent State

Could pass parent data via context:

```typescript
<NestedRouteProvider parent={{ id: orderId, data: order }}>
  <NestedLayout config={config} />
</NestedRouteProvider>
```

---

## Migration Path

### Current State

1. **Manual nested routes**: Order items, Paint formula components
   - Manual implementation, no config-driven system

2. **Unimplemented nested routes**: Maintenance schedules, others
   - Using UnderConstruction placeholder

### Migration Strategy

**Phase 1** (Now): Establish pattern
- Create NestedLayout component
- Document pattern
- Create example configs

**Phase 2**: Migrate existing nested routes
- Convert Order Items to config-driven
- Convert Paint Formula Components to config-driven
- Verify all works

**Phase 3**: Implement remaining nested routes
- Maintenance schedules
- Employee PPE deliveries
- Other pending pages

---

## Related Architecture Decisions

### Why not use Expo Router slots?

Slots could be used but:
- Would require parallel routes
- More complexity
- Harder to share state between parent/child
- Wrapper pattern simpler for this use case

### Why not use TanStack Router?

Expo Router chosen because:
- Better React Native integration
- File-based routing matches mobile conventions
- Works with Expo
- Sufficient for current needs

---

## Summary

| Aspect | Decision |
|--------|----------|
| **Pattern** | Component wrapper (NestedLayout) |
| **Non-breaking** | Yes - existing code unchanged |
| **Type safety** | Via route param interfaces |
| **Error handling** | Validation + error states + custom handlers |
| **Performance** | Minimal overhead, memoized |
| **Complexity** | Low - 6 line page components |
| **Reusability** | Single pattern for all nested routes |
| **Testability** | Each layer independently testable |
| **Extensibility** | Easy to enhance with features |

---

## References

- **Implementation**: `src/components/list/NestedLayout.tsx`
- **Guide**: `docs/NESTED_ROUTES_PATTERN_GUIDE.md`
- **Examples**: `docs/NESTED_ROUTES_EXAMPLES.md`
- **Quick Reference**: `docs/NESTED_ROUTES_QUICK_REFERENCE.md`

---

## Questions & Answers

### Q: Can I use NestedLayout for routes with multiple parameters?

A: Not directly, but could extend it:
```typescript
<NestedLayout
  config={config}
  paramKeys={['tenantId', 'departmentId']}
  buildWhere={(params) => ({
    AND: [
      { tenantId: params.tenantId },
      { departmentId: params.departmentId }
    ]
  })}
/>
```

### Q: What if my hook doesn't support where clauses?

A: That hook needs to be updated first. All InfiniteMobile hooks should support Prisma query params.

### Q: Can I use NestedLayout with non-nested routes?

A: Yes, but unnecessary - just use `<Layout>` directly.

### Q: How do I handle dynamic routes in actions?

A: Extract param in page and pass to config, or use route functions:
```typescript
route: (item) => `/pedidos/${orderId}/items/detalhes/${item.id}`
```

### Q: Does NestedLayout add runtime cost?

A: Negligible - just one useMemo hook and condition check.

### Q: Can I nest NestedLayout components?

A: Theoretically yes, but would be unusual. Better to flatten route structure.

---

## Conclusion

The **NestedLayout component wrapper pattern** provides a clean, non-breaking solution for handling nested routes in the List System. It maintains architectural consistency while enabling flexible, type-safe access to parent route parameters.
