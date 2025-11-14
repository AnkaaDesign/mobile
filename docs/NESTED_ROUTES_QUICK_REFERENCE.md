# Nested Routes - Quick Reference

## The Pattern in 30 Seconds

```typescript
// 1. Create config (no where clause needed)
export const itemsListConfig: ListConfig<Item> = { ... }

// 2. Use NestedLayout in your page
<NestedLayout
  config={itemsListConfig}
  paramKey="parentId"
  buildWhere={(parentId) => ({ parentId })}
/>
```

## File Checklist

For each nested route, create these files:

```
src/
  config/list/{module}/{entity}.ts    ← Config (220 lines)
  app/(tabs)/.../[parentId]/{entity}/
    listar.tsx                         ← Page (6 lines)
```

## Common buildWhere Patterns

### Simple Parent ID
```typescript
buildWhere={(orderId) => ({ orderId })}
```

### Renamed Field
```typescript
buildWhere={(formulaId) => ({ formulaPaintId: formulaId })}
```

### Multiple Conditions
```typescript
buildWhere={(employeeId) => ({
  AND: [
    { employeeId },
    { deletedAt: null },
  ],
})}
```

## Hook Requirements

Your InfiniteMobile hook must accept:
- `where` - Prisma where conditions
- `orderBy` - Sorting
- `include` - Related data
- `limit` - Page size

Example:
```typescript
usePaintComponentsInfiniteMobile({
  where: { formulaId: '123' },
  orderBy: { name: 'asc' },
  include: { item: true },
  limit: 25,
})
```

## Page Component Template

```typescript
import { NestedLayout } from '@/components/list/NestedLayout'
import { entityListConfig } from '@/config/list/{module}/{entity}'

export default function EntityListScreen() {
  return (
    <NestedLayout
      config={entityListConfig}
      paramKey="parentId"
      buildWhere={(parentId) => ({ parentId })}
    />
  )
}
```

## Query Params Flow

```
Route Params
    ↓ useLocalSearchParams
    ↓ NestedLayout
    ↓ buildWhere
    ↓ Modified Config
    ↓ Layout → useList → Hook → API
```

## Config Structure

Essential sections:
```typescript
{
  key: 'module-entity',           // Unique identifier
  title: 'Entity Name',           // Display title

  query: {
    hook: 'useEntityInfiniteMobile',
    defaultSort: { field: 'createdAt', direction: 'desc' },
    pageSize: 25,
  },

  table: {
    columns: [...],               // 3-8 columns typical
    defaultVisible: [...],        // 3-4 columns shown
    rowHeight: 56,
  },

  search: { placeholder: '...' },
  filters: { sections: [...] },   // Optional
  export: { ... },                // Optional

  emptyState: { ... },            // Optional
}
```

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Parâmetro não encontrado" | Check `paramKey` matches route param name |
| Data not filtering | Verify `buildWhere` returns correct field name |
| Hook returns no data | Ensure hook supports `where` clause |
| Infinite refetch loop | Check `buildWhere` isn't creating new objects |
| Routes broken in actions | Include `orderId` in dynamic routes: ``/parent/${item.parentId}/child`` |

## Validation Checklist

- [ ] Hook exists and supports `where` param
- [ ] `paramKey` matches route param (e.g., `orderId` in `[orderId]`)
- [ ] `buildWhere` returns correct Prisma where object
- [ ] Config file created in `src/config/list/{module}/`
- [ ] Page uses `<NestedLayout>` (6 lines max)
- [ ] Empty state handling configured
- [ ] Actions include parent ID in routes
- [ ] Module index exports the config

## Existing Nested Route Examples

### Order Items
```
Config: src/config/list/inventory/order-items.ts
Page: src/app/(tabs)/estoque/pedidos/[orderId]/items/listar.tsx
Hook: useOrderItemsInfiniteMobile
Param: orderId
```

### Paint Formula Components
```
Config: src/config/list/painting/formula-components.ts
Page: src/app/(tabs)/pintura/formulas/[formulaId]/componentes/listar.tsx
Hook: usePaintFormulaComponentsInfiniteMobile
Param: formulaId
Map: formulaId → formulaPaintId
```

## Type-Safe Route Params

Create an interface for each nested route:

```typescript
// src/types/routes.ts
export interface OrderItemsParams {
  orderId: string
}

// In page component
const { orderId } = useLocalSearchParams<OrderItemsParams>()
```

## Navigation to Nested Routes

From parent page:
```typescript
router.push(`/estoque/pedidos/${order.id}/items/listar`)
```

From within nested page:
```typescript
// Access current parent ID
const { orderId } = useLocalSearchParams()

// Navigate to related route
router.push(`/estoque/pedidos/${orderId}/items/detalhes/${itemId}`)
```

## Performance Tips

1. **Pagination**: Keep `pageSize` small (20-30 items)
2. **Includes**: Only include necessary related fields
3. **Debounce**: Search debounce 300ms minimum
4. **Memoization**: Wrap complex buildWhere in useMemo if needed

## Advanced: Conditional Where Clause

```typescript
const buildWhere = (parentId: string) => {
  const baseWhere = {
    parentId,
  }

  // Add additional conditions based on user role
  if (userRole === 'ADMIN') {
    return baseWhere
  }

  return {
    AND: [
      baseWhere,
      { status: 'ACTIVE' }, // Non-admin see only active
    ],
  }
}
```

## Related Files

- `src/components/list/NestedLayout.tsx` - The wrapper component
- `src/hooks/list/useList.ts` - Core list hook
- `src/components/list/types.ts` - Type definitions

## Documentation

- Full guide: `/docs/NESTED_ROUTES_PATTERN_GUIDE.md`
- Examples: `/docs/NESTED_ROUTES_EXAMPLES.md`
- This file: `/docs/NESTED_ROUTES_QUICK_REFERENCE.md`

## Minimal Example

**Config** (order-items.ts):
```typescript
export const orderItemsListConfig: ListConfig<OrderItem> = {
  key: 'order-items',
  title: 'Itens',
  query: {
    hook: 'useOrderItemsInfiniteMobile',
    defaultSort: { field: 'name', direction: 'asc' },
  },
  table: {
    columns: [
      { key: 'name', label: 'Nome', width: 2, render: (item) => item.name },
    ],
    defaultVisible: ['name'],
  },
  search: { placeholder: 'Buscar...' },
}
```

**Page** (listar.tsx):
```typescript
import { NestedLayout } from '@/components/list/NestedLayout'
import { orderItemsListConfig } from '@/config/list/inventory/order-items'

export default function OrderItemsScreen() {
  return (
    <NestedLayout
      config={orderItemsListConfig}
      paramKey="orderId"
      buildWhere={(orderId) => ({ orderId })}
    />
  )
}
```

That's it! The rest is automatic.
