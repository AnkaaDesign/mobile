# Enum Usage Quick Reference Guide

## Quick Checklist

```
When adding enums to a list config, follow this order:

1. IMPORT
   import { ENUM_NAME } from '@/constants/enums'

2. LABELS
   const STATUS_LABELS: Record<string, string> = { ... }

3. FILTERS
   options: Object.values(ENUM_NAME).map((value) => ({
     label: LABELS[value],
     value: value,
   }))

4. TABLE
   render: (item) => item.status
   format: 'badge'

5. EXPORT
   format: (value) => LABELS[value] || value

6. BULK ACTIONS
   status: 'ENUM_VALUE'
```

---

## Common Enums by Use Case

### Status Management
```typescript
// Simple 4-value status
PENDING, IN_PROGRESS, COMPLETED, CANCELLED

// With approval flow
PENDING, APPROVED, REJECTED, CANCELLED

// With lifecycle
PENDING, APPROVED, IN_PROGRESS, COMPLETED, CANCELLED

// Borrow/Return pattern
ACTIVE, RETURNED, LOST
```

### Type/Category Fields
```typescript
HOLIDAY_TYPE: NATIONAL | STATE | MUNICIPAL | OPTIONAL
VACATION_TYPE: ANNUAL | COLLECTIVE | MEDICAL | MATERNITY | PATERNITY | EMERGENCY | STUDY | UNPAID | OTHER
CUT_TYPE: VINYL | STENCIL
```

---

## Label Mapping Quick Template

### Single Enum Type
```typescript
const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  IN_PROGRESS: 'Em Andamento',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
}
```

### Multiple Enum Types
```typescript
const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  APPROVED: 'Aprovado',
  REJECTED: 'Rejeitado',
  CANCELLED: 'Cancelado',
}

const TYPE_LABELS: Record<string, string> = {
  ANNUAL: 'Anual',
  COLLECTIVE: 'Coletivo',
  MEDICAL: 'Médico',
}
```

---

## Filter Pattern Quick Copy

### Basic Status Filter
```typescript
{
  key: 'status',
  label: 'Status',
  icon: 'package',
  collapsible: true,
  defaultOpen: true,
  fields: [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      multiple: true,
      options: Object.values(STATUS_ENUM).map((status) => ({
        label: STATUS_LABELS[status],
        value: status,
      })),
      placeholder: 'Selecione os status',
    },
  ],
}
```

### Type/Category Filter
```typescript
{
  key: 'type',
  label: 'Tipo',
  icon: 'tag',
  collapsible: true,
  defaultOpen: false,
  fields: [
    {
      key: 'type',
      label: 'Tipo',
      type: 'select',
      multiple: true,
      options: Object.values(TYPE_ENUM).map((type) => ({
        label: TYPE_LABELS[type],
        value: type,
      })),
      placeholder: 'Selecione os tipos',
    },
  ],
}
```

---

## Table Column Quick Copy

### Enum Field (Rendered as Badge)
```typescript
{
  key: 'status',
  label: 'STATUS',
  sortable: true,
  width: 1.2,
  align: 'center',
  render: (item) => item.status,
  format: 'badge',
}
```

### Enum Field (With Label Lookup)
```typescript
{
  key: 'type',
  label: 'TIPO',
  sortable: true,
  width: 1.2,
  align: 'center',
  render: (item) => item.type ? TYPE_LABELS[item.type] : '-',
  format: 'badge',
}
```

---

## Export Column Quick Copy

### Direct Enum Export
```typescript
{
  key: 'status',
  label: 'Status',
  path: 'status',
  format: (value) => STATUS_LABELS[value] || value,
}
```

### Nullable Enum Export
```typescript
{
  key: 'type',
  label: 'Tipo',
  path: 'type',
  format: (value) => value ? TYPE_LABELS[value] : '-',
}
```

---

## Bulk Action Quick Copy

### Simple Status Update
```typescript
{
  key: 'actionKey',
  label: 'Action Label',
  icon: 'icon-name',
  variant: 'default',
  confirm: {
    title: 'Confirmar Ação',
    message: (count) => `Confirmar ação em ${count} item(s)?`,
  },
  onPress: async (ids, { batchUpdate }) => {
    await batchUpdate({
      ids: Array.from(ids),
      status: 'ENUM_VALUE'
    })
  },
}
```

### Status + Date Update
```typescript
{
  key: 'complete',
  label: 'Concluir',
  icon: 'check',
  variant: 'default',
  confirm: {
    title: 'Confirmar Conclusão',
    message: (count) => `Concluir ${count} item(s)?`,
  },
  onPress: async (ids, { batchUpdate }) => {
    await batchUpdate({
      ids: Array.from(ids),
      status: 'COMPLETED',
      finishedAt: new Date(),
    })
  },
}
```

---

## Common Translation Pairs

| Enum Value | Portuguese |
|-----------|-----------|
| PENDING | Pendente |
| APPROVED | Aprovado |
| REJECTED | Rejeitado |
| CANCELLED | Cancelado |
| IN_PROGRESS | Em Andamento |
| COMPLETED | Concluído |
| OVERDUE | Atrasado |
| ACTIVE | Ativo |
| RETURNED | Devolvido |
| LOST | Perdido |
| DELIVERED | Entregue |
| REPROVED | Reprovado |
| ANNUAL | Anual |
| COLLECTIVE | Coletivo |
| MEDICAL | Médico |
| MATERNITY | Maternidade |
| PATERNITY | Paternidade |
| EMERGENCY | Emergência |
| STUDY | Estudo |
| UNPAID | Não Remunerado |
| OTHER | Outro |
| NATIONAL | Nacional |
| STATE | Estadual |
| MUNICIPAL | Municipal |
| OPTIONAL | Facultativo |

---

## Enum Fields By Entity Type

### PPE Delivery
- Status: PENDING, APPROVED, DELIVERED, REPROVED, CANCELLED
- Import: `import { PPE_DELIVERY_STATUS } from '@/constants/enums'`

### Maintenance
- Status: PENDING, IN_PROGRESS, COMPLETED, CANCELLED, OVERDUE
- Import: `import { MAINTENANCE_STATUS } from '@/constants/enums'`

### Vacation
- Status: PENDING, APPROVED, REJECTED, CANCELLED, IN_PROGRESS, COMPLETED
- Type: ANNUAL, COLLECTIVE, MEDICAL, MATERNITY, PATERNITY, EMERGENCY, STUDY, UNPAID, OTHER
- Import: `import { VACATION_STATUS, VACATION_TYPE } from '@/constants/enums'`

### Holiday
- Type: NATIONAL, STATE, MUNICIPAL, OPTIONAL
- Import: `import { HOLIDAY_TYPE } from '@/constants/enums'`

### Borrow
- Status: ACTIVE, RETURNED, LOST
- Import: `import { BORROW_STATUS } from '@/constants/enums'`

### Order
- Status: CREATED, PARTIALLY_FULFILLED, FULFILLED, OVERDUE, PARTIALLY_RECEIVED, RECEIVED, CANCELLED
- Import: `import { ORDER_STATUS } from '@/constants/enums'`

### Task
- Status: PENDING, IN_PRODUCTION, COMPLETED, CANCELLED, ON_HOLD, INVOICED, SETTLED
- Import: `import { TASK_STATUS } from '@/constants/enums'`

### Cut
- Type: VINYL, STENCIL
- Status: PENDING, CUTTING, COMPLETED
- Origin: PLAN, REQUEST
- Import: `import { CUT_TYPE, CUT_STATUS, CUT_ORIGIN } from '@/constants/enums'`

---

## Common Mistakes to Avoid

| Mistake | Correct |
|---------|---------|
| `import { STATUS } from...` | `import { PPE_DELIVERY_STATUS } from...` |
| `const STATUS_LABELS = { ... }` | `const STATUS_LABELS: Record<string, string> = { ... }` |
| `Object.keys(ENUM)` | `Object.values(ENUM)` |
| `LABELS[value]` without fallback | `LABELS[value] \|\| value` |
| `render: delivery.status` | `render: (delivery) => delivery.status` |
| Status value: `Pendente` | Status value: `PENDING` (use enum) |
| No format for enum columns | `format: 'badge'` |
| Export without label mapping | Use `format: (v) => LABELS[v]` |

