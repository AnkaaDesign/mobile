# Nested Routes Pattern Guide for List System

## Overview

This guide documents how to handle nested routes (routes with dynamic parameters) in the List System migration. Nested routes are pages that depend on a parent entity ID, such as:

- `/estoque/pedidos/[orderId]/items/listar` - List items in a specific order
- `/pintura/formulas/[formulaId]/componentes/listar` - List components in a specific formula
- `/estoque/manutencao/agendamentos/listar` - List maintenance schedules for an item

## Current State Analysis

### Existing Nested List Pages

The codebase has **2 main nested list patterns**:

1. **Order Items** (`/estoque/pedidos/[orderId]/items/listar.tsx`)
   - Uses `useLocalSearchParams` to extract `orderId`
   - Uses custom hook `useOrderItemsByOrder(orderId)`
   - Manual implementation with custom list handling

2. **Paint Formula Components** (`/pintura/formulas/[formulaId]/componentes/listar.tsx`)
   - Uses `useLocalSearchParams` to extract `formulaId`
   - Uses `usePaintFormulaComponentsInfinite(queryParams)`
   - Manual implementation with infinite scroll

3. **Maintenance Schedules** (`/estoque/manutencao/agendamentos/listar.tsx`)
   - Currently unimplemented (UnderConstruction)
   - Needs pattern definition

### Key Discovery: No Native Route Params Support in Current ListConfig

**Important Finding**: The current `ListConfig` type does NOT natively support route parameters. This means we need to implement a **wrapper component** that:

1. Extracts route params using `useLocalSearchParams()`
2. Dynamically constructs the config with route-aware filters
3. Passes the modified config to the `Layout` component

## Architecture Decision

### Recommended Pattern: Component Wrapper + Dynamic Config

Instead of modifying the core `ListConfig` type, we use a **component-based wrapper** that:

1. Extracts route params at the page level
2. Builds a modified config with the parent ID as a filter
3. Passes the config to `Layout`

### Why This Approach?

- **Non-breaking**: Doesn't change existing configs or the Layout component
- **Flexible**: Each nested route can customize its own behavior
- **Testable**: Wrapper and config can be tested independently
- **Reusable**: Same pattern works for all nested routes
- **Simple**: Minimal boilerplate per page

## Pattern Implementation

### Step 1: Create the Wrapper Component

Location: `src/components/list/NestedLayout.tsx`

```tsx
import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import type { ListConfig } from './types'
import { Layout } from './Layout'

interface NestedLayoutProps<T extends { id: string }> {
  config: ListConfig<T>
  paramKey: string // The route param name (e.g., 'orderId', 'formulaId')
  buildWhere?: (paramValue: string) => any // Build where clause from param
}

/**
 * Wrapper for nested list pages
 * Extracts route params and applies them as filters/conditions to the config
 */
export function NestedLayout<T extends { id: string }>({
  config,
  paramKey,
  buildWhere,
}: NestedLayoutProps<T>) {
  const params = useLocalSearchParams()
  const paramValue = params[paramKey] as string

  if (!paramValue) {
    return (
      <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ThemedText>Parâmetro não encontrado</ThemedText>
      </ThemedView>
    )
  }

  // Build modified config with parent ID filter
  const modifiedConfig: ListConfig<T> = {
    ...config,
    query: {
      ...config.query,
      where: buildWhere
        ? buildWhere(paramValue)
        : {
            ...config.query.where,
            // Default: add parentId to where clause
            [`${paramKey.replace('Id', '')}`]: paramValue,
          },
    },
  }

  return <Layout config={modifiedConfig} />
}
```

### Step 2: Create Parent-Specific Config

For order items (`src/config/list/inventory/order-items.ts`):

```typescript
import type { ListConfig } from '@/components/list/types'
import type { OrderItem } from '@/types'
import { ORDER_ITEM_STATUS, ORDER_ITEM_STATUS_LABELS } from '@/constants/enums'

// Base configuration - without parent filter
// The filter is applied dynamically by NestedLayout
export const orderItemsListConfig: ListConfig<OrderItem> = {
  key: 'inventory-order-items',
  title: 'Itens do Pedido',

  query: {
    hook: 'useOrderItemsInfiniteMobile',
    defaultSort: { field: 'createdAt', direction: 'desc' },
    pageSize: 25,
    include: {
      item: {
        select: {
          id: true,
          name: true,
          uniCode: true,
          brand: { select: { name: true } },
          category: { select: { name: true } },
        },
      },
    },
    // Note: where clause will be added by NestedLayout
  },

  table: {
    columns: [
      {
        key: 'item.uniCode',
        label: 'CÓDIGO',
        sortable: true,
        width: 1.0,
        align: 'left',
        render: (item) => item.item?.uniCode || '-',
      },
      {
        key: 'item.name',
        label: 'ITEM',
        sortable: true,
        width: 2.0,
        align: 'left',
        render: (item) => item.item?.name || '-',
      },
      {
        key: 'orderedQuantity',
        label: 'QUANTIDADE',
        sortable: true,
        width: 1.0,
        align: 'center',
        render: (item) => item.orderedQuantity || 0,
      },
      {
        key: 'price',
        label: 'PREÇO UNIT',
        sortable: true,
        width: 1.2,
        align: 'right',
        render: (item) => item.price ? `R$ ${item.price.toFixed(2)}` : '-',
      },
      {
        key: 'status',
        label: 'STATUS',
        sortable: true,
        width: 1.2,
        align: 'center',
        render: (item) => ORDER_ITEM_STATUS_LABELS[item.status] || item.status,
      },
    ],
    defaultVisible: ['item.uniCode', 'item.name', 'orderedQuantity', 'status'],
    rowHeight: 56,
    actions: [
      {
        key: 'view',
        label: 'Ver',
        icon: 'eye',
        variant: 'default',
        route: (item) => `/estoque/pedidos/${item.orderId}/items/detalhes/${item.id}`,
      },
      {
        key: 'edit',
        label: 'Editar',
        icon: 'pencil',
        variant: 'default',
        route: (item) => `/estoque/pedidos/${item.orderId}/items/editar/${item.id}`,
      },
      {
        key: 'delete',
        label: 'Excluir',
        icon: 'trash',
        variant: 'destructive',
        confirm: {
          title: 'Confirmar Exclusão',
          message: (item) => `Remover "${item.item?.name || 'Item'}" do pedido?`,
        },
        onPress: async (item, router, mutations) => {
          // Handle deletion
        },
      },
    ],
  },

  filters: {
    sections: [
      {
        key: 'status',
        label: 'Status',
        fields: [
          {
            key: 'status',
            type: 'select',
            multiple: true,
            options: Object.entries(ORDER_ITEM_STATUS_LABELS).map(([value, label]) => ({
              value,
              label,
            })),
          },
        ],
      },
    ],
  },

  search: {
    placeholder: 'Buscar por código, nome, marca...',
    debounce: 300,
  },

  actions: {
    create: {
      label: 'Adicionar Item',
      route: '/estoque/pedidos/[orderId]/items/adicionar',
    },
  },

  export: {
    title: 'Exportar Itens',
    filename: 'itens-pedido',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      { key: 'item.uniCode', label: 'Código' },
      { key: 'item.name', label: 'Nome' },
      { key: 'orderedQuantity', label: 'Quantidade' },
      { key: 'receivedQuantity', label: 'Recebido' },
      { key: 'price', label: 'Preço Unit.' },
      { key: 'status', label: 'Status' },
    ],
  },
}
```

### Step 3: Implement the Nested List Page

For order items (`src/app/(tabs)/estoque/pedidos/[orderId]/items/listar.tsx`):

```tsx
import { NestedLayout } from '@/components/list/NestedLayout'
import { orderItemsListConfig } from '@/config/list/inventory/order-items'

export default function OrderItemsListScreen() {
  return (
    <NestedLayout
      config={orderItemsListConfig}
      paramKey="orderId"
      buildWhere={(orderId) => ({
        orderId: orderId,
      })}
    />
  )
}
```

## Detailed Implementation Examples

### Example 1: Order Items (One-to-Many Relationship)

**File Structure**:
```
src/
  config/list/
    inventory/
      order-items.ts       # Config
  app/(tabs)/
    estoque/pedidos/
      [orderId]/
        items/
          listar.tsx       # Page using NestedLayout
```

**Key Points**:
- Parent ID goes into `where` clause
- Supports filtering, sorting, searching within the order
- Actions include `orderId` in routes

### Example 2: Paint Formula Components (One-to-Many)

**File Structure**:
```
src/
  config/list/
    painting/
      formula-components.ts  # Config
  app/(tabs)/
    pintura/formulas/
      [formulaId]/
        componentes/
          listar.tsx         # Page using NestedLayout
```

**Key Points**:
- Parent ID: `formulaId`
- Uses `usePaintFormulaComponentsInfinite` hook
- Filters components by formula

### Example 3: Maintenance Schedules (Filtered List)

**File Structure**:
```
src/
  config/list/
    inventory/
      maintenance-schedules.ts  # Config
  app/(tabs)/
    estoque/manutencao/
      agendamentos/
        listar.tsx              # Page using NestedLayout
```

**Note**: This might not be a true nested route. Check if it needs parent filtering or is a filtered view of all schedules.

## Hook Requirements for Nested Routes

### Required Capabilities

Each hook used in a nested route config must:

1. **Accept `where` clause**: The hook must support Prisma where conditions
2. **Support `limit` param**: For pagination
3. **Support `orderBy` param**: For sorting
4. **Support `include` param**: For related data

### Example Hook Signature

```typescript
export function useOrderItemsInfiniteMobile(
  params?: Partial<OrderItemGetManyFormData> & { enabled?: boolean }
) {
  // params should include:
  // - where: Prisma where conditions
  // - orderBy: Sorting config
  // - include: Related data to fetch
  // - limit: Page size

  const infiniteQuery = useOrderItemsInfinite(params)
  return useInfiniteMobile(infiniteQuery)
}
```

## Dynamic Filter Application Methods

### Method 1: Simple Parent ID Filter (Recommended)

**When**: Parent ID needs to be included in the where clause

```typescript
<NestedLayout
  config={orderItemsListConfig}
  paramKey="orderId"
  buildWhere={(orderId) => ({
    orderId: orderId,
  })}
/>
```

### Method 2: Complex Nested Where Condition

**When**: Need AND/OR logic or multiple conditions

```typescript
<NestedLayout
  config={formulaComponentsListConfig}
  paramKey="formulaId"
  buildWhere={(formulaId) => ({
    AND: [
      { formulaPaintId: formulaId },
      { isActive: true }, // Additional filter
    ],
  })}
/>
```

### Method 3: Merging with Existing Where Clause

**When**: Config already has a base where clause

```typescript
const buildWhere = (parentId: string) => {
  const baseWhere = orderItemsListConfig.query.where || {}
  return {
    ...baseWhere,
    orderId: parentId,
  }
}

<NestedLayout
  config={orderItemsListConfig}
  paramKey="orderId"
  buildWhere={buildWhere}
/>
```

## Query Params Flow

### Current Flow (Non-Nested)

```
Config → Layout → useList → Hook → API
```

### Nested Route Flow

```
Route Params (useLocalSearchParams)
    ↓
NestedLayout (buildWhere)
    ↓
Modified Config (with where clause)
    ↓
Layout → useList → Hook → API
```

### Example: Order Items Query

```typescript
// Route params extracted by NestedLayout
const { orderId } = useLocalSearchParams()

// Where clause built and added to config
const buildWhere = (orderId: string) => ({ orderId })

// Hook receives query params including the where clause
const queryParams = {
  where: { orderId: '123' },      // From buildWhere
  orderBy: { createdAt: 'desc' }, // From config
  searchingFor: 'item name',      // From search
  include: { ... },               // From config
  limit: 25,                      // From config
}

// Hook executes API call with combined params
const items = useOrderItemsInfiniteMobile(queryParams)
```

## Type Safety Pattern

### Define Route Params Interface

```typescript
// src/types/routes.ts
export interface OrderItemsRouteParams {
  orderId: string
}

export interface FormulaComponentsRouteParams {
  formulaId: string
}
```

### Use in Page Component

```typescript
import { useLocalSearchParams } from 'expo-router'
import type { OrderItemsRouteParams } from '@/types/routes'

export default function OrderItemsListScreen() {
  const { orderId } = useLocalSearchParams<OrderItemsRouteParams>()

  if (!orderId) {
    // Handle missing param
    return <ErrorScreen />
  }

  return (
    <NestedLayout
      config={orderItemsListConfig}
      paramKey="orderId"
      buildWhere={() => ({ orderId })}
    />
  )
}
```

## Testing Nested Routes

### Unit Test Example

```typescript
import { renderHook } from '@testing-library/react-native'
import { useLocalSearchParams } from 'expo-router'

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
}))

describe('NestedLayout with Order Items', () => {
  it('should apply orderId filter to config', () => {
    ;(useLocalSearchParams as jest.Mock).mockReturnValue({
      orderId: 'order-123',
    })

    // Test that buildWhere produces correct where clause
    const where = buildWhere('order-123')
    expect(where).toEqual({ orderId: 'order-123' })
  })
})
```

## Best Practices

### 1. Parameter Validation

```typescript
const { orderId } = useLocalSearchParams()

if (!orderId) {
  return <ErrorScreen message="Pedido não encontrado" />
}

if (typeof orderId !== 'string') {
  return <ErrorScreen message="Parâmetro inválido" />
}
```

### 2. Empty State Handling

```typescript
<NestedLayout
  config={{
    ...orderItemsListConfig,
    emptyState: {
      icon: 'package',
      title: 'Nenhum item no pedido',
      description: 'Adicione itens para começar',
    },
  }}
  paramKey="orderId"
  buildWhere={(orderId) => ({ orderId })}
/>
```

### 3. Breadcrumb Integration

```typescript
<Stack.Screen
  options={{
    title: `Itens do Pedido #${orderId}`,
    headerBackTitle: 'Voltar',
  }}
/>

<NestedLayout
  config={orderItemsListConfig}
  paramKey="orderId"
  buildWhere={(orderId) => ({ orderId })}
/>
```

### 4. Dynamic Create Routes

When the create route is nested, update the config:

```typescript
const createRoute = (orderId: string) => `/estoque/pedidos/${orderId}/items/adicionar`

const config = {
  ...orderItemsListConfig,
  actions: {
    create: {
      label: 'Adicionar Item',
      route: createRoute(orderId), // Pass orderId
    },
  },
}
```

## Migration Checklist

For each nested route page:

- [ ] Create config file in `src/config/list/{module}/{entity}.ts`
- [ ] Verify hook exists and supports `where` clause
- [ ] Define route params interface in `src/types/routes.ts`
- [ ] Implement page using `NestedLayout` wrapper
- [ ] Add proper error handling for missing params
- [ ] Update actions to include parent ID in routes
- [ ] Add empty state messaging
- [ ] Export config from module index
- [ ] Test with various parent IDs
- [ ] Verify breadcrumbs and navigation

## Troubleshooting

### Issue: Hook receives undefined where clause

**Solution**: Ensure `NestedLayout` is building the where clause correctly:

```typescript
buildWhere={(orderId) => {
  console.log('Building where with orderId:', orderId)
  return { orderId }
}}
```

### Issue: Infinite loop or refetch on every render

**Solution**: Ensure params don't change on every render:

```typescript
// Bad - creates new object every time
buildWhere={(orderId) => ({ orderId })}

// Good - if orderId is stable
const config = useMemo(
  () => ({
    ...orderItemsListConfig,
    query: {
      ...orderItemsListConfig.query,
      where: { orderId },
    },
  }),
  [orderId]
)
```

### Issue: Filters not working in nested route

**Solution**: Ensure filter field keys match the data structure:

```typescript
// If nested data structure:
// { item: { name: 'Product' } }

// Filter key must be:
{ key: 'item.name', type: 'text' }

// In hook params, dot notation should work with Prisma
```

## Future Enhancements

### 1. NestedLayout Type Safety

Enhance NestedLayout to accept typed route params:

```typescript
interface NestedLayoutProps<
  T extends { id: string },
  P extends Record<string, string>
> {
  config: ListConfig<T>
  routeParams: P
  buildWhere: (params: P) => any
}
```

### 2. Auto-Route Generation

Generate routes automatically from config:

```typescript
route: (item) => autoRoute(
  `/estoque/pedidos/[orderId]/items`,
  { orderId },
  { action: 'view', id: item.id }
)
```

### 3. Shared Parent State

Pass parent data through context:

```typescript
<NestedRouteProvider parentId={orderId} parentData={order}>
  <NestedLayout config={orderItemsListConfig} ... />
</NestedRouteProvider>
```

## Related Documentation

- [ListConfig Type Definition](/Users/kennedycampos/Documents/repositories/mobile/src/components/list/types.ts)
- [Layout Component Implementation](/Users/kennedycampos/Documents/repositories/mobile/src/components/list/Layout/index.tsx)
- [useList Hook](/Users/kennedycampos/Documents/repositories/mobile/src/hooks/list/useList.ts)
- [Infinite Mobile Hook Pattern](/Users/kennedycampos/Documents/repositories/mobile/src/hooks/use-infinite-mobile.ts)

## Summary

**Key Takeaways**:

1. Use `NestedLayout` wrapper component to handle route params
2. Create config files just like non-nested routes
3. Use `buildWhere` function to inject parent ID filter
4. Ensure hooks support the where/orderBy/include/limit params
5. Handle missing params gracefully
6. Update action routes to include parent ID
7. Test thoroughly with different parent IDs
