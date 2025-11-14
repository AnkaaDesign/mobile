# Enum Usage Pattern Analysis - List Config Migrations

## Overview
This document analyzes how enums are used across completed list config migrations to establish consistent patterns for remaining migrations.

## Files Analyzed
1. **src/config/list/hr/ppe-deliveries.ts** - PPE deliveries list config
2. **src/config/list/inventory/maintenance.ts** - Maintenance items list config
3. **src/config/list/hr/holidays.ts** - Holidays list config
4. **src/config/list/hr/vacations.ts** - Vacations list config (multiple enums)
5. **src/constants/enums.ts** - Main enum definitions
6. **src/constants/enum-labels.ts** - Enum label mappings

---

## Standard Pattern 1: Import Enums

### Pattern
```typescript
import { ENUM_NAME } from '@/constants/enums'
```

### Examples Found
- `ppe-deliveries.ts`: `import { PPE_DELIVERY_STATUS } from '@/constants/enums'`
- `maintenance.ts`: `import { MAINTENANCE_STATUS } from '@/constants/enums'`
- `holidays.ts`: `import { HOLIDAY_TYPE } from '@/constants/enums'`
- `vacations.ts`: `import { VACATION_STATUS, VACATION_TYPE } from '@/constants/enums'`

### Key Points
- Import only the enums you actually use in the config
- Import from `@/constants/enums` (using alias path)
- Multiple enums can be imported in a single statement when needed
- Use full enum names with UPPERCASE_SNAKE_CASE convention

---

## Standard Pattern 2: Local Label Mappings

### Pattern
```typescript
const STATUS_LABELS: Record<string, string> = {
  ENUM_VALUE: 'Portuguese Label',
  ANOTHER_VALUE: 'Another Label',
}
```

### Examples Found

#### Single Status Type
```typescript
// maintenance.ts
const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  IN_PROGRESS: 'Em Andamento',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
  OVERDUE: 'Atrasado',
}
```

#### Multiple Enum Types
```typescript
// vacations.ts
const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  APPROVED: 'Aprovado',
  REJECTED: 'Rejeitado',
  CANCELLED: 'Cancelado',
  IN_PROGRESS: 'Em Andamento',
  COMPLETED: 'Concluído',
}

const TYPE_LABELS: Record<string, string> = {
  ANNUAL: 'Anual',
  COLLECTIVE: 'Coletivo',
  MEDICAL: 'Médico',
  MATERNITY: 'Maternidade',
  PATERNITY: 'Paternidade',
  EMERGENCY: 'Emergência',
  STUDY: 'Estudo',
  UNPAID: 'Não Remunerado',
  OTHER: 'Outro',
}
```

### Key Points
- Define mapping locally in the config file, not globally
- Use `Record<string, string>` type for type safety
- Name variables by the enum type: `STATUS_LABELS`, `TYPE_LABELS`, etc.
- All labels should be in Portuguese (pt-BR)
- Place at the top of the file after imports

---

## Standard Pattern 3: Using Enums in Filters

### Pattern
```typescript
filters: {
  sections: [
    {
      key: 'status',
      label: 'Status',
      fields: [
        {
          key: 'status',
          label: 'Status',
          type: 'select',
          multiple: true,
          options: Object.values(ENUM_NAME).map((value) => ({
            label: LABEL_MAP[value],
            value: value,
          })),
          placeholder: 'Selecione...',
        },
      ],
    },
  ],
}
```

### Examples Found
```typescript
// ppe-deliveries.ts
options: Object.values(PPE_DELIVERY_STATUS).map((status) => ({
  label: STATUS_LABELS[status],
  value: status,
})),

// holidays.ts
options: Object.values(HOLIDAY_TYPE).map((type) => ({
  label: TYPE_LABELS[type],
  value: type,
})),
```

### Key Points
- Always use `Object.values(ENUM_NAME)` to get all enum values
- Map each value to an object with `label` and `value` properties
- Use the local label mapping constant
- Supports `multiple: true` for multi-select filters

---

## Standard Pattern 4: Using Enums in Table Columns

### Pattern
```typescript
table: {
  columns: [
    {
      key: 'status',
      label: 'STATUS',
      sortable: true,
      width: 1.2,
      align: 'center',
      render: (item) => item.status,
      format: 'badge',
    },
  ],
}
```

### Examples Found
```typescript
// ppe-deliveries.ts
{
  key: 'status',
  label: 'STATUS',
  sortable: true,
  width: 1.2,
  align: 'center',
  render: (delivery) => delivery.status,
  format: 'badge',
},

// vacations.ts (with TYPE_LABELS)
{
  key: 'type',
  label: 'TIPO',
  sortable: true,
  width: 1.2,
  align: 'center',
  render: (vacation) => vacation.type ? TYPE_LABELS[vacation.type] : '-',
  format: 'badge',
},
```

### Key Points
- Set `format: 'badge'` for enum values to render as badges
- For direct enum rendering: `render: (item) => item.status`
- For label rendering: `render: (item) => item.type ? LABEL_MAP[item.type] : '-'`
- Always handle null/undefined with fallback: `item.field || '-'`
- Use `sortable: true` to make enum columns sortable

---

## Standard Pattern 5: Using Enums in Export Configuration

### Pattern
```typescript
export: {
  title: 'Export Title',
  filename: 'export-filename',
  formats: ['csv', 'json', 'pdf'],
  columns: [
    {
      key: 'status',
      label: 'Status',
      path: 'status',
      format: (value) => LABEL_MAP[value] || value,
    },
  ],
}
```

### Examples Found
```typescript
// ppe-deliveries.ts
export: {
  columns: [
    {
      key: 'status',
      label: 'Status',
      path: 'status',
      format: (value) => STATUS_LABELS[value] || value,
    },
  ],
}

// vacations.ts
export: {
  columns: [
    {
      key: 'status',
      label: 'Status',
      path: 'status',
      format: (value) => STATUS_LABELS[value] || value,
    },
    {
      key: 'type',
      label: 'Tipo',
      path: 'type',
      format: (value) => value ? TYPE_LABELS[value] : '-',
    },
  ],
}
```

### Key Points
- Use format function to transform enum values to labels
- Always use fallback pattern: `LABEL_MAP[value] || value`
- For nullable enums: `value ? LABEL_MAP[value] : '-'`
- Export titles should be in Portuguese
- Common formats: `['csv', 'json', 'pdf']`

---

## Standard Pattern 6: Using Enums in Bulk Actions

### Pattern
```typescript
actions: {
  bulk: [
    {
      key: 'actionKey',
      label: 'Action Label',
      onPress: async (ids, { batchUpdate }) => {
        await batchUpdate({
          ids: Array.from(ids),
          fieldName: 'ENUM_VALUE',
        })
      },
    },
  ],
}
```

### Examples Found
```typescript
// ppe-deliveries.ts - Multiple status transitions
{
  key: 'approve',
  label: 'Aprovar',
  onPress: async (ids, { batchUpdate }) => {
    await batchUpdate({ ids: Array.from(ids), status: 'APPROVED' })
  },
},
{
  key: 'deliver',
  label: 'Marcar como Entregue',
  onPress: async (ids, { batchUpdate }) => {
    await batchUpdate({
      ids: Array.from(ids),
      status: 'DELIVERED',
      actualDeliveryDate: new Date()
    })
  },
},

// maintenance.ts
{
  key: 'start',
  label: 'Iniciar',
  onPress: async (ids, { batchUpdate }) => {
    await batchUpdate({
      ids: Array.from(ids),
      status: 'IN_PROGRESS',
      startedAt: new Date()
    })
  },
},
```

### Key Points
- Use enum string values directly (no need to reference the enum)
- Status transitions should be logically grouped
- Can combine status changes with date updates
- Always convert ids to array: `Array.from(ids)`

---

## Common Enum Types by Module

### HR Module
- **Status Enums**: `PPE_DELIVERY_STATUS`, `VACATION_STATUS`, `HOLIDAY_TYPE`
- **Additional Types**: `VACATION_TYPE` (for sub-categorization)

### Inventory Module
- **Status Enums**: `MAINTENANCE_STATUS`, `ORDER_STATUS`, `BORROW_STATUS`
- **Classification**: `EXTERNAL_WITHDRAWAL_STATUS`

### Production Module
- **Status Enums**: `TASK_STATUS`, `SERVICE_ORDER_STATUS`, `AIRBRUSHING_STATUS`, `CUT_STATUS`
- **Classification**: `CUT_TYPE`, `CUT_ORIGIN`, `CUT_REQUEST_REASON`

---

## Available Enum Status Values

### Common Status Patterns

#### Basic Status (3-5 values)
```typescript
PENDING, IN_PROGRESS, COMPLETED, CANCELLED
PENDING, OVERDUE, COMPLETED, CANCELLED
PENDING, APPROVED, REJECTED, CANCELLED
```

#### Full Lifecycle Status (6+ values)
```typescript
PENDING, APPROVED, REJECTED, CANCELLED, IN_PROGRESS, COMPLETED
ACTIVE, RETURNED, LOST
PENDING, PARTIALLY_RETURNED, FULLY_RETURNED, CHARGED, CANCELLED
```

### Relationship Between Enums
- Some enums have similar value patterns across modules
- Maintenance/PPE share similar status transitions
- Always check existing enums before creating new ones

---

## Best Practices

### 1. Naming Conventions
- Enum names: `UPPERCASE_SNAKE_CASE` (e.g., `PPE_DELIVERY_STATUS`)
- Label maps: `NOUN_LABELS` (e.g., `STATUS_LABELS`, `TYPE_LABELS`)
- Field keys in config: `camelCase` (e.g., `status`, `type`)

### 2. Label Consistency
- All labels should be in Portuguese (pt-BR)
- Use consistent terminology across configs
- Reference global `enum-labels.ts` for consistency when available

### 3. Type Safety
- Use `Record<string, string>` for label maps
- Don't use `any` types
- Import specific enums needed

### 4. Filter Organization
- Group filters by type (Status, Relationships, Dates)
- Use collapsible sections for better UX
- Status filters typically have `defaultOpen: true`
- Other filters typically have `defaultOpen: false`

### 5. Table Rendering
- Use `format: 'badge'` for status/enum display
- Handle null values with fallback: `item.field || '-'`
- For nullable enums: `item.field ? LABELS[item.field] : '-'`
- Keep column width appropriate for content

### 6. Export Configuration
- Always include enum fields in export
- Use format functions to export readable labels
- Include both date fields and status in exports

---

## Migration Checklist

When migrating a list config:

- [ ] Import only used enums from `@/constants/enums`
- [ ] Create local `*_LABELS` mappings for all enum fields
- [ ] Add enum field to table columns with proper format
- [ ] Add enum field to filters section with options mapping
- [ ] Add enum field to export configuration with label formatting
- [ ] Update bulk actions to use correct enum values for status transitions
- [ ] Test all status transitions in bulk actions
- [ ] Verify labels display correctly in badges
- [ ] Test filter options populate correctly
- [ ] Verify export includes readable labels

---

## Global Labels Reference

When available, global labels exist in `src/constants/enum-labels.ts`:

### Exported Constants (Examples)
- `ORDER_STATUS_LABELS: Record<ORDER_STATUS, string>`
- `USER_STATUS_LABELS: Record<USER_STATUS, string>`
- `TASK_STATUS_LABELS: Record<TASK_STATUS, string>`
- `VACATION_STATUS_LABELS: Record<VACATION_STATUS, string>`
- `MAINTENANCE_STATUS_LABELS: Record<MAINTENANCE_STATUS, string>`
- `BORROW_STATUS_LABELS: Record<BORROW_STATUS, string>`
- `PPE_DELIVERY_STATUS_LABELS: Record<PPE_DELIVERY_STATUS, string>`

### When to Use Global vs Local
- **Local Labels**: When labels are specific to the config context or different from global
- **Global Labels**: When labels are standard and used across multiple configs
- Current implementation: All configs use local labels (safe approach)

---

## Code Examples Summary

### Complete Example: Minimal Config
```typescript
import type { ListConfig } from '@/components/list/types'
import type { Holiday } from '@/types'
import { HOLIDAY_TYPE } from '@/constants/enums'

const TYPE_LABELS: Record<string, string> = {
  NATIONAL: 'Nacional',
  STATE: 'Estadual',
  MUNICIPAL: 'Municipal',
  OPTIONAL: 'Facultativo',
}

export const holidaysListConfig: ListConfig<Holiday> = {
  filters: {
    sections: [
      {
        key: 'type',
        label: 'Tipo',
        fields: [
          {
            key: 'type',
            type: 'select',
            multiple: true,
            options: Object.values(HOLIDAY_TYPE).map((type) => ({
              label: TYPE_LABELS[type],
              value: type,
            })),
          },
        ],
      },
    ],
  },
  // ... rest of config
}
```

### Complete Example: Full Config
```typescript
import type { ListConfig } from '@/components/list/types'
import type { PpeDelivery } from '@/types'
import { PPE_DELIVERY_STATUS } from '@/constants/enums'

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  APPROVED: 'Aprovado',
  DELIVERED: 'Entregue',
  REPROVED: 'Reprovado',
  CANCELLED: 'Cancelado',
}

export const ppeDeliveriesListConfig: ListConfig<PpeDelivery> = {
  // Filters with enum options
  filters: {
    sections: [
      {
        key: 'status',
        fields: [
          {
            key: 'status',
            type: 'select',
            multiple: true,
            options: Object.values(PPE_DELIVERY_STATUS).map((status) => ({
              label: STATUS_LABELS[status],
              value: status,
            })),
          },
        ],
      },
    ],
  },

  // Table column with enum rendering
  table: {
    columns: [
      {
        key: 'status',
        label: 'STATUS',
        render: (delivery) => delivery.status,
        format: 'badge',
      },
    ],
  },

  // Export with label formatting
  export: {
    columns: [
      {
        key: 'status',
        label: 'Status',
        path: 'status',
        format: (value) => STATUS_LABELS[value] || value,
      },
    ],
  },

  // Bulk actions with status transitions
  actions: {
    bulk: [
      {
        key: 'approve',
        label: 'Aprovar',
        onPress: async (ids, { batchUpdate }) => {
          await batchUpdate({ ids: Array.from(ids), status: 'APPROVED' })
        },
      },
      {
        key: 'deliver',
        label: 'Entregue',
        onPress: async (ids, { batchUpdate }) => {
          await batchUpdate({
            ids: Array.from(ids),
            status: 'DELIVERED',
            actualDeliveryDate: new Date(),
          })
        },
      },
    ],
  },
}
```

