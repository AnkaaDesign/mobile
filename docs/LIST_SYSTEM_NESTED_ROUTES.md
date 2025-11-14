# List System - Nested Routes Pattern

## Overview

This document explains how to handle **nested routes** (routes with dynamic parameters) in the List System migration. These are routes like `/parent/[parentId]/children/listar.tsx` that need to filter data based on a parent entity ID.

## The Challenge

Traditional list configs are static - they can't accept parameters. But nested routes need to filter by a parent ID (e.g., show only components for a specific formula).

## The Solution: Factory Functions

Instead of exporting a static config object, export a **factory function** that accepts parameters and returns a config object.

## Complete Example: Paint Formula Components

### 1. Config File with Factory Function

**File:** `src/config/list/painting/formula-components.ts`

```typescript
import type { ListConfig } from '@/components/list/types'
import type { PaintFormulaComponent } from '@/types'

/**
 * Factory function for Paint Formula Components list config
 * Accepts formulaId as parameter for nested route support
 */
export function createFormulaComponentsListConfig(
  formulaId: string
): ListConfig<PaintFormulaComponent> {
  return {
    key: `painting-formula-components-${formulaId}`,
    title: 'Componentes da Fórmula',

    query: {
      hook: 'usePaintFormulaComponentsInfinite',
      defaultSort: { field: 'ratio', direction: 'desc' },
      pageSize: 25,
      include: {
        item: {
          include: {
            brand: true,
            category: true,
          },
        },
      },
      // KEY PART: Base where clause filters by parent ID
      where: {
        formulaPaintId: formulaId,
      },
    },

    table: {
      columns: [
        // ... columns definition
      ],
      actions: [
        {
          key: 'view',
          label: 'Ver',
          icon: 'eye',
          variant: 'default',
          // Use formulaId in routes (closure captures it)
          onPress: (component, router) => {
            router.push(`/pintura/formulas/${formulaId}/componentes/detalhes/${component.id}`)
          },
        },
        // ... more actions using formulaId
      ],
    },

    // ... rest of config

    actions: {
      create: {
        label: 'Adicionar Componente',
        // Use formulaId in create route
        route: `/pintura/formulas/${formulaId}/componentes/cadastrar`,
      },
    },
  }
}
```

### 2. Page Component

**File:** `src/app/(tabs)/pintura/formulas/[formulaId]/componentes/listar.tsx`

```typescript
import { useLocalSearchParams } from 'expo-router'
import { Layout } from '@/components/list/Layout'
import { createFormulaComponentsListConfig } from '@/config/list/painting/formula-components'

export default function ComponentListScreen() {
  const { formulaId } = useLocalSearchParams<{ formulaId: string }>()

  // Create config with the formulaId parameter
  const config = createFormulaComponentsListConfig(formulaId!)

  return <Layout config={config} />
}
```

**Result:** 12 lines instead of 490!

### 3. Module Index Export

**File:** `src/config/list/painting/index.ts`

```typescript
export { catalogListConfig } from './catalog'
export { formulasListConfig } from './formulas'
export { createFormulaComponentsListConfig } from './formula-components' // Factory function
export { paintBrandsListConfig } from './paint-brands'
```

## How It Works

### Key Mechanisms

1. **Factory Function**
   - Function name: `createXXXListConfig(parentId: string)`
   - Returns: `ListConfig<Entity>`
   - Captures `parentId` in closure for use in routes and filters

2. **Base Where Clause**
   - `config.query.where` defines the base filter
   - This is merged with search/filter conditions by `useList` hook
   - Example: `where: { formulaPaintId: formulaId }`

3. **Closure Capture**
   - The `parentId` parameter is captured in the config object
   - Used in:
     - Action routes (`onPress` callbacks)
     - Create button route
     - Unique config key

4. **useList Hook Processing**
   - Hook reads `config.query.where` as base condition
   - Merges it with dynamic filters/search
   - Final query: `{ AND: [baseWhere, dynamicFilters] }`

## When to Use This Pattern

### Use Factory Functions When:
- ✅ Route has dynamic parameters (e.g., `[parentId]`)
- ✅ Need to filter by parent entity
- ✅ Need parent ID in action routes
- ✅ Need parent ID in create route

### Use Static Config When:
- ✅ Top-level list route (no parent)
- ✅ No dynamic filtering needed
- ✅ Simple standalone entity list

## Other Use Cases

### Multiple Parameters

```typescript
export function createOrderItemsListConfig(
  orderId: string,
  supplierId?: string
): ListConfig<OrderItem> {
  return {
    query: {
      where: {
        orderId,
        ...(supplierId ? { item: { supplierId } } : {}),
      },
    },
    // ... rest of config
  }
}
```

### Conditional Config

```typescript
export function createTaskListConfig(
  filters: { customerId?: string; status?: string }
): ListConfig<Task> {
  return {
    query: {
      where: {
        ...(filters.customerId ? { customerId: filters.customerId } : {}),
        ...(filters.status ? { status: filters.status } : {}),
      },
    },
    // ... rest of config
  }
}
```

## Common Patterns

### 1. Parent Info in Title

```typescript
export function createComponentsListConfig(
  formulaId: string,
  formulaName?: string
): ListConfig<Component> {
  return {
    title: formulaName
      ? `Componentes - ${formulaName}`
      : 'Componentes da Fórmula',
    // ...
  }
}
```

### 2. Conditional Actions Based on Parent

```typescript
export function createItemsListConfig(
  orderId: string,
  orderStatus: string
): ListConfig<OrderItem> {
  return {
    table: {
      actions: [
        {
          key: 'edit',
          label: 'Editar',
          icon: 'pencil',
          // Only show edit if order is not completed
          visible: () => orderStatus !== 'COMPLETED',
          onPress: (item, router) => {
            router.push(`/orders/${orderId}/items/edit/${item.id}`)
          },
        },
      ],
    },
    // ...
  }
}
```

### 3. Parent Context in Empty State

```typescript
export function createComponentsListConfig(
  formulaId: string
): ListConfig<Component> {
  return {
    emptyState: {
      icon: 'flask',
      title: 'Nenhum componente',
      description: 'Adicione componentes para criar esta fórmula',
      // Could include parent context
    },
    // ...
  }
}
```

## Migration Workflow

### For Nested Routes:

1. **Identify Parameters**
   ```typescript
   const { parentId } = useLocalSearchParams<{ parentId: string }>()
   ```

2. **Create Factory Function**
   ```typescript
   export function createChildrenListConfig(parentId: string): ListConfig<Child>
   ```

3. **Add Base Where Clause**
   ```typescript
   query: {
     where: { parentId }
   }
   ```

4. **Use parentId in Routes**
   ```typescript
   actions: [
     {
       onPress: (item, router) => {
         router.push(`/parent/${parentId}/children/${item.id}`)
       }
     }
   ]
   ```

5. **Update Page Component**
   ```typescript
   const config = createChildrenListConfig(parentId!)
   return <Layout config={config} />
   ```

## Benefits

1. **Still Configuration-Driven**
   - All logic in one place
   - Type-safe
   - Easy to maintain

2. **Minimal Page Code**
   - 10-12 lines instead of 400+
   - No component logic
   - Just parameter extraction and config creation

3. **Reusable**
   - Factory can be called from multiple places
   - Can create different configs with same factory
   - Easy to test

4. **Flexible**
   - Can accept multiple parameters
   - Can have conditional logic
   - Can derive config from parent state

## Testing

```typescript
import { createComponentsListConfig } from '@/config/list/painting/formula-components'

describe('Formula Components Config', () => {
  it('creates config with correct where clause', () => {
    const config = createComponentsListConfig('formula-123')

    expect(config.query.where).toEqual({
      formulaPaintId: 'formula-123'
    })
  })

  it('includes formulaId in create route', () => {
    const config = createComponentsListConfig('formula-123')

    expect(config.actions?.create?.route).toBe(
      '/pintura/formulas/formula-123/componentes/cadastrar'
    )
  })
})
```

## Common Mistakes to Avoid

### ❌ Don't hardcode parent ID
```typescript
// BAD
where: { formulaPaintId: 'some-id' }
```

### ❌ Don't forget to use parent ID in routes
```typescript
// BAD
onPress: (item, router) => {
  router.push(`/components/view/${item.id}`) // Missing parent context!
}
```

### ❌ Don't make factory function async
```typescript
// BAD
export async function createConfig(id: string) {
  const data = await fetchData(id) // Config should be synchronous
  return { ... }
}
```

### ✅ Do validate parameters
```typescript
export function createConfig(id: string): ListConfig<Entity> {
  if (!id) {
    throw new Error('ID is required')
  }
  return { ... }
}
```

### ✅ Do include parent ID in config key
```typescript
key: `module-entity-${parentId}`, // Makes each parent's list independent
```

## Summary

The factory function pattern enables the List System to handle nested routes elegantly:

- **Static configs** for top-level lists
- **Factory functions** for nested/parameterized lists
- **Same `<Layout>` component** for both
- **Consistent 6-12 line page files**

This maintains the simplicity and power of the configuration-driven architecture while supporting complex routing scenarios.
