# Nested Routes Implementation Examples

This document provides concrete examples of how to implement nested list pages using the List System migration pattern.

## Table of Contents

1. [Example 1: Order Items (Simple One-to-Many)](#example-1-order-items)
2. [Example 2: Paint Formula Components (Complex with Related Data)](#example-2-paint-formula-components)
3. [Example 3: Maintenance Schedules (Filtered View)](#example-3-maintenance-schedules)
4. [Example 4: Employee PPE (Date Range with Filters)](#example-4-employee-ppe)

---

## Example 1: Order Items

### Scenario

List all items within a specific purchase order. The page is accessed via:
- Route: `/estoque/pedidos/[orderId]/items/listar`
- Parent data: Order details with supplier info
- Filtering: By item status, price range, quantity

### File Structure

```
src/
  config/list/
    inventory/
      order-items.ts         # Config file
  app/(tabs)/
    estoque/pedidos/
      [orderId]/
        items/
          listar.tsx         # Page component
```

### Config File (`src/config/list/inventory/order-items.ts`)

```typescript
import type { ListConfig } from '@/components/list/types'
import type { OrderItem } from '@/types'

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
          brand: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
        },
      },
    },
  },

  table: {
    columns: [
      {
        key: 'item.uniCode',
        label: 'CÓDIGO',
        sortable: true,
        width: 1.0,
        render: (item: any) => item.item?.uniCode || '-',
      },
      {
        key: 'item.name',
        label: 'ITEM',
        sortable: true,
        width: 2.0,
        render: (item: any) => item.item?.name || '-',
      },
      {
        key: 'orderedQuantity',
        label: 'QUANTIDADE',
        sortable: true,
        width: 1.0,
        render: (item: any) => item.orderedQuantity || 0,
      },
      {
        key: 'price',
        label: 'PREÇO',
        sortable: true,
        width: 1.2,
        render: (item: any) => `R$ ${(item.price || 0).toFixed(2)}`,
      },
    ],
    defaultVisible: ['item.uniCode', 'item.name', 'orderedQuantity'],
    rowHeight: 56,
  },

  search: {
    placeholder: 'Buscar itens...',
    debounce: 300,
  },

  emptyState: {
    icon: 'package',
    title: 'Nenhum item',
    description: 'Adicione itens ao pedido',
  },
}
```

### Page Component (`src/app/(tabs)/estoque/pedidos/[orderId]/items/listar.tsx`)

```typescript
import { NestedLayout } from '@/components/list/NestedLayout'
import { orderItemsListConfig } from '@/config/list/inventory/order-items'

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

The `useOrderItemsInfiniteMobile` hook must:

```typescript
// src/hooks/use-order-items-infinite-mobile.ts
export function useOrderItemsInfiniteMobile(
  params?: Partial<OrderItemGetManyFormData> & { enabled?: boolean }
) {
  // Must support:
  // params.where.orderId - Filter by order
  // params.orderBy - Sorting
  // params.include - Related data
  // params.limit - Page size

  const infiniteQuery = useOrderItemsInfinite(params)
  return useInfiniteMobile(infiniteQuery)
}
```

---

## Example 2: Paint Formula Components

### Scenario

List all components (paint ingredients) within a paint formula. Components have:
- Percentage ratio in the formula
- Related item details (brand, category)
- Sorting by ratio
- Filter by brand and category

### File Structure

```
src/
  config/list/
    painting/
      formula-components.ts  # Config file
  app/(tabs)/
    pintura/formulas/
      [formulaId]/
        componentes/
          listar.tsx         # Page component
```

### Config File (`src/config/list/painting/formula-components.ts`)

```typescript
import type { ListConfig } from '@/components/list/types'
import type { PaintFormulaComponent } from '@/types'

export const formulaComponentsListConfig: ListConfig<PaintFormulaComponent> = {
  key: 'painting-formula-components',
  title: 'Componentes da Fórmula',

  query: {
    hook: 'usePaintFormulaComponentsInfiniteMobile',
    defaultSort: { field: 'ratio', direction: 'desc' },
    pageSize: 30,
    include: {
      item: {
        select: {
          id: true,
          name: true,
          uniCode: true,
          brand: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
        },
      },
    },
  },

  table: {
    columns: [
      {
        key: 'item.name',
        label: 'COMPONENTE',
        sortable: true,
        width: 2.0,
        render: (component: any) => component.item?.name || '-',
      },
      {
        key: 'ratio',
        label: 'PROPORÇÃO',
        sortable: true,
        width: 1.2,
        align: 'right',
        render: (component: any) => `${(component.ratio || 0).toFixed(2)}%`,
      },
      {
        key: 'item.brand.name',
        label: 'MARCA',
        sortable: true,
        width: 1.5,
        render: (component: any) => component.item?.brand?.name || '-',
      },
    ],
    defaultVisible: ['item.name', 'ratio', 'item.brand.name'],
    rowHeight: 56,
  },

  filters: {
    sections: [
      {
        key: 'brand',
        label: 'Marca',
        fields: [
          {
            key: 'brandId',
            type: 'select',
            multiple: true,
            async: true,
            loadOptions: async () => {
              // Fetch available brands
              return []
            },
          },
        ],
      },
      {
        key: 'ratio',
        label: 'Proporção',
        fields: [
          {
            key: 'ratioRange',
            type: 'number-range',
            min: 0,
            max: 100,
            step: 0.1,
          },
        ],
      },
    ],
  },

  search: {
    placeholder: 'Buscar componentes...',
    debounce: 300,
  },

  export: {
    title: 'Exportar Componentes',
    filename: 'componentes-formula',
    formats: ['csv', 'json'],
    columns: [
      { key: 'item.name', label: 'Componente' },
      { key: 'item.uniCode', label: 'Código' },
      { key: 'ratio', label: 'Proporção (%)' },
      { key: 'item.brand.name', label: 'Marca' },
      { key: 'item.category.name', label: 'Categoria' },
    ],
  },

  actions: {
    create: {
      label: 'Adicionar Componente',
      route: '/pintura/formulas/[formulaId]/componentes/cadastrar',
    },
  },

  emptyState: {
    icon: 'flask',
    title: 'Nenhum componente',
    description: 'Adicione componentes para criar a fórmula',
  },
}
```

### Page Component

```typescript
import { NestedLayout } from '@/components/list/NestedLayout'
import { formulaComponentsListConfig } from '@/config/list/painting/formula-components'

export default function FormulaComponentsScreen() {
  return (
    <NestedLayout
      config={formulaComponentsListConfig}
      paramKey="formulaId"
      buildWhere={(formulaId) => ({
        formulaPaintId: formulaId,
      })}
    />
  )
}
```

---

## Example 3: Maintenance Schedules

### Scenario

List maintenance schedules (might be filtered by item or department). Could be:
1. A true nested route: `/estoque/items/[itemId]/manutencao/agendamentos`
2. A filtered list on department: All schedules for current user's department

### Decision Tree

```
Is this a true parent-child relationship?
├─ YES (e.g., item has many maintenance schedules)
│  └─ Use NestedLayout with itemId
│
└─ NO (e.g., show all schedules, maybe filtered by department)
   └─ Use regular Layout with currentUser dept in where clause
```

### If True Nested Route - Config Example

```typescript
import type { ListConfig } from '@/components/list/types'
import type { MaintenanceSchedule } from '@/types'

export const maintenanceSchedulesListConfig: ListConfig<MaintenanceSchedule> = {
  key: 'inventory-maintenance-schedules',
  title: 'Agendamentos de Manutenção',

  query: {
    hook: 'useMaintenanceSchedulesInfiniteMobile',
    defaultSort: { field: 'scheduledDate', direction: 'asc' },
    pageSize: 25,
    include: {
      item: { select: { id: true, name: true, uniCode: true } },
      technician: { select: { id: true, name: true } },
    },
  },

  table: {
    columns: [
      {
        key: 'item.name',
        label: 'ITEM',
        sortable: true,
        width: 1.8,
        render: (schedule: any) => schedule.item?.name || '-',
      },
      {
        key: 'scheduledDate',
        label: 'AGENDAMENTO',
        sortable: true,
        width: 1.2,
        render: (schedule: any) => new Date(schedule.scheduledDate).toLocaleDateString('pt-BR'),
      },
      {
        key: 'status',
        label: 'STATUS',
        sortable: true,
        width: 1.0,
        render: (schedule: any) => {
          const statusMap: Record<string, string> = {
            PENDING: 'Pendente',
            IN_PROGRESS: 'Em Andamento',
            COMPLETED: 'Concluído',
          }
          return statusMap[schedule.status] || schedule.status
        },
      },
    ],
    defaultVisible: ['item.name', 'scheduledDate', 'status'],
    rowHeight: 56,
  },

  search: {
    placeholder: 'Buscar agendamentos...',
  },
}
```

### Page Component

```typescript
import { NestedLayout } from '@/components/list/NestedLayout'
import { maintenanceSchedulesListConfig } from '@/config/list/inventory/maintenance-schedules'

export default function MaintenanceSchedulesScreen() {
  return (
    <NestedLayout
      config={maintenanceSchedulesListConfig}
      paramKey="itemId"
      buildWhere={(itemId) => ({
        itemId: itemId,
      })}
    />
  )
}
```

---

## Example 4: Employee PPE (Date Range with Filters)

### Scenario

List PPE (Personal Protective Equipment) deliveries for a specific employee with:
- Date range filtering (delivery date)
- Status filtering (delivered, expired, pending)
- Equipment type filtering
- Search by equipment name

### File Structure

```
src/
  config/list/
    hr/
      employee-ppe.ts        # Config file
  app/(tabs)/
    recursos-humanos/
      funcionarios/
        [employeeId]/
          epi/
            listar.tsx       # Page component
```

### Config File

```typescript
import type { ListConfig } from '@/components/list/types'
import type { PPEDelivery } from '@/types'

export const employeePPEListConfig: ListConfig<PPEDelivery> = {
  key: 'hr-employee-ppe',
  title: 'EPI do Colaborador',

  query: {
    hook: 'useEmployeePPEInfiniteMobile',
    defaultSort: { field: 'deliveryDate', direction: 'desc' },
    pageSize: 20,
    include: {
      ppe: {
        select: {
          id: true,
          name: true,
          type: true,
          expirationDays: true,
        },
      },
      deliveredBy: {
        select: { id: true, name: true },
      },
    },
  },

  table: {
    columns: [
      {
        key: 'ppe.name',
        label: 'EPI',
        sortable: true,
        width: 2.0,
        render: (delivery: any) => delivery.ppe?.name || '-',
      },
      {
        key: 'deliveryDate',
        label: 'ENTREGA',
        sortable: true,
        width: 1.2,
        render: (delivery: any) => new Date(delivery.deliveryDate).toLocaleDateString('pt-BR'),
      },
      {
        key: 'expirationDate',
        label: 'VENCIMENTO',
        sortable: true,
        width: 1.2,
        render: (delivery: any) => {
          if (!delivery.expirationDate) return '-'
          return new Date(delivery.expirationDate).toLocaleDateString('pt-BR')
        },
      },
      {
        key: 'status',
        label: 'STATUS',
        sortable: true,
        width: 1.0,
        render: (delivery: any) => {
          const now = new Date()
          const expDate = new Date(delivery.expirationDate)
          if (expDate < now) return 'Vencido'
          if ((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24) < 30) return 'Próximo'
          return 'Válido'
        },
      },
    ],
    defaultVisible: ['ppe.name', 'deliveryDate', 'status'],
    rowHeight: 56,
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
            options: [
              { label: 'Válido', value: 'VALID' },
              { label: 'Próximo ao Vencimento', value: 'EXPIRING' },
              { label: 'Vencido', value: 'EXPIRED' },
            ],
          },
        ],
      },
      {
        key: 'date',
        label: 'Data de Entrega',
        fields: [
          {
            key: 'deliveryDateRange',
            type: 'date-range',
            placeholder: { min: 'De', max: 'Até' },
          },
        ],
      },
    ],
  },

  search: {
    placeholder: 'Buscar por nome do EPI...',
  },

  export: {
    title: 'Exportar EPI',
    filename: 'epi-colaborador',
    formats: ['csv', 'pdf'],
    columns: [
      { key: 'ppe.name', label: 'EPI' },
      { key: 'ppe.type', label: 'Tipo' },
      { key: 'deliveryDate', label: 'Data de Entrega', format: 'date' },
      { key: 'expirationDate', label: 'Data de Vencimento', format: 'date' },
      { key: 'deliveredBy.name', label: 'Entregue Por' },
    ],
  },

  emptyState: {
    icon: 'shield',
    title: 'Nenhum EPI registrado',
    description: 'Nenhuma entrega de EPI registrada para este colaborador',
  },
}
```

### Page Component

```typescript
import { NestedLayout } from '@/components/list/NestedLayout'
import { employeePPEListConfig } from '@/config/list/hr/employee-ppe'

export default function EmployeePPEScreen() {
  return (
    <NestedLayout
      config={employeePPEListConfig}
      paramKey="employeeId"
      buildWhere={(employeeId) => ({
        AND: [
          { employeeId: employeeId },
          { deletedAt: null }, // Only non-deleted
        ],
      })}
    />
  )
}
```

---

## Common Patterns

### Pattern 1: Simple Parent ID Filter

**When**: Parent ID maps directly to a field

```typescript
<NestedLayout
  config={config}
  paramKey="orderId"
  buildWhere={(orderId) => ({ orderId })}
/>
```

### Pattern 2: Field Name Mapping

**When**: Param name doesn't match field name exactly

```typescript
<NestedLayout
  config={config}
  paramKey="formulaId"
  buildWhere={(formulaId) => ({ formulaPaintId: formulaId })}
/>
```

### Pattern 3: Complex AND Conditions

**When**: Need multiple conditions

```typescript
<NestedLayout
  config={config}
  paramKey="employeeId"
  buildWhere={(employeeId) => ({
    AND: [
      { employeeId },
      { deletedAt: null },
      { status: 'ACTIVE' },
    ],
  })}
/>
```

### Pattern 4: OR Conditions

**When**: Multiple possible fields for the parent

```typescript
<NestedLayout
  config={config}
  paramKey="userId"
  buildWhere={(userId) => ({
    OR: [
      { createdBy: userId },
      { assignedTo: userId },
    ],
  })}
/>
```

---

## Testing Nested Routes

### Unit Test Example

```typescript
import { render } from '@testing-library/react-native'
import { NestedLayout } from '@/components/list/NestedLayout'

// Mock useLocalSearchParams
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(() => ({ orderId: 'order-123' })),
}))

describe('NestedLayout', () => {
  it('should extract orderId param and build where clause', () => {
    const { getByText } = render(
      <NestedLayout
        config={orderItemsListConfig}
        paramKey="orderId"
        buildWhere={(orderId) => ({ orderId })}
      />
    )

    // Component should render without errors
    expect(getByText(/itens/i)).toBeDefined()
  })

  it('should show error when param is missing', () => {
    jest.mock('expo-router', () => ({
      useLocalSearchParams: jest.fn(() => ({})),
    }))

    const { getByText } = render(
      <NestedLayout
        config={orderItemsListConfig}
        paramKey="orderId"
        buildWhere={(orderId) => ({ orderId })}
      />
    )

    expect(getByText(/parâmetro não encontrado/i)).toBeDefined()
  })
})
```

---

## Summary

Nested route implementation follows a consistent pattern:

1. **Create config** in `src/config/list/{module}/{entity}.ts`
2. **Implement page** using `NestedLayout` wrapper
3. **Extract param** with `useLocalSearchParams`
4. **Build where clause** in `buildWhere` function
5. **Test** with various parent IDs

All nested routes share the same architecture, just with different parent entities and field mappings.
