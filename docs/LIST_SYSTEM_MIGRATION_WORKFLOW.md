# 📋 List System Migration Workflow

## READ THIS EVERY TIME BEFORE MIGRATING A PAGE

This document contains the **exact workflow** to migrate any list page to the new system. Follow these steps **precisely** to ensure consistency across all migrations.

---

## 🎯 Overview

**Goal:** Convert a legacy list page (300-500 lines) into a clean, config-based implementation (6 lines).

**Time per page:** ~30 minutes

**Pattern:** Every list page follows the EXACT same structure.

---

## 📝 Step-by-Step Workflow

### Step 1: Identify the Page

**Location Pattern:**
```
src/app/(tabs)/{module}/{entity}/listar.tsx
```

**Examples:**
- `src/app/(tabs)/estoque/produtos/listar.tsx` → Items
- `src/app/(tabs)/estoque/pedidos/listar.tsx` → Orders
- `src/app/(tabs)/recursos-humanos/funcionarios/listar.tsx` → Employees

**What to check:**
1. ✅ Page exists and is a list page (has "listar" in path)
2. ✅ Page is currently using legacy components (Table, FilterDrawer, etc.)
3. ✅ Page has 200+ lines of code

---

### Step 2: Analyze the Existing Implementation

**Read the page and extract:**

#### A. Query Information
```typescript
// Find the hook being used:
const { items, isLoading, ... } = useXXXInfiniteMobile(params)

// Extract:
✓ Hook name: useXXXInfiniteMobile
✓ Default sort field
✓ Include relations
```

#### B. Column Information
```typescript
// Find column definitions (usually in a separate file):
import { createColumnDefinitions } from '@/components/.../list/xxx-table'

// Or inline column configuration
// Extract:
✓ Column keys
✓ Column labels
✓ Sortable columns
✓ Column renderers
✓ Default visible columns
```

#### C. Filter Information
```typescript
// Find filter drawer component:
import { XXXFilterDrawerContent } from '@/components/.../list/xxx-filter-drawer-content'

// Read the filter file and extract:
✓ Filter sections
✓ Filter field types
✓ Filter options (enums, async data)
✓ Date range filters
✓ Number range filters
```

#### D. Action Information
```typescript
// Find action handlers:
const handleEdit = (id) => router.push(...)
const handleDelete = (id) => deleteXXX(id)

// Extract:
✓ Routes for view/edit/details
✓ Delete mutation
✓ Bulk actions
✓ Create action route
```

---

### Step 3: Create the Config File

**Location Pattern:**
```
src/config/list/{module}/{entity}.ts
```

**Module Mapping:**
- `estoque/` → `inventory/`
- `recursos-humanos/` → `hr/`
- `producao/` → `production/`
- `administracao/` → `administration/`
- `pintura/` → `painting/`
- `minha-equipe/` → `my-team/`

**File Template:**
```typescript
import type { ListConfig } from '@/components/list/types'
import type { YourEntity } from '@/types'

export const yourEntitiesListConfig: ListConfig<YourEntity> = {
  // 1. Identity
  key: 'module-entity',
  title: 'Entity Name (Portuguese)',

  // 2. Query
  query: {
    hook: 'useYourEntitiesInfiniteMobile',
    defaultSort: { field: 'fieldName', direction: 'asc' },
    pageSize: 25,
    include: {
      // Relations to include
    },
  },

  // 3. Table
  table: {
    columns: [
      // See "Column Configuration Pattern" below
    ],
    defaultVisible: ['column1', 'column2', 'column3'],
    rowHeight: 60,
    actions: [
      // See "Action Configuration Pattern" below
    ],
  },

  // 4. Filters
  filters: {
    sections: [
      // See "Filter Configuration Pattern" below
    ],
  },

  // 5. Search
  search: {
    placeholder: 'Buscar...',
    debounce: 300,
  },

  // 6. Export
  export: {
    title: 'Entity Name',
    filename: 'entity-name',
    formats: ['csv', 'json', 'pdf'],
    columns: [
      // See "Export Configuration Pattern" below
    ],
  },

  // 7. Actions
  actions: {
    create: {
      label: 'Cadastrar Entity',
      route: '/module/entity/cadastrar',
    },
    bulk: [
      // See "Bulk Action Configuration Pattern" below
    ],
  },
}
```

---

### Step 4: Column Configuration Pattern

**Basic Column:**
```typescript
{
  key: 'name',                          // Unique identifier
  label: 'NOME',                        // Header label (uppercase)
  sortable: true,                       // Can be sorted?
  width: 2.0,                          // Responsive width ratio
  align: 'left',                        // left | center | right
  render: (item) => item.name,         // What to display
}
```

**Column with Formatting:**
```typescript
{
  key: 'price',
  label: 'PREÇO',
  sortable: true,
  width: 1.2,
  align: 'right',
  render: (item) => item.price,
  format: 'currency',                   // Auto-format as currency
}
```

**Column with Custom Component:**
```typescript
{
  key: 'status',
  label: 'STATUS',
  sortable: true,
  width: 1.2,
  align: 'center',
  render: (item) => item.status,
  format: 'badge',                      // Render as badge
}
```

**Nested Field Column:**
```typescript
{
  key: 'user.name',
  label: 'USUÁRIO',
  sortable: true,
  width: 1.5,
  align: 'left',
  render: (item) => item.user?.name || '-',
}
```

**Format Types Available:**
- `'date'` - Format as dd/MM/yyyy
- `'datetime'` - Format as dd/MM/yyyy HH:mm
- `'currency'` - Format as R$ X.XXX,XX
- `'number'` - Format with thousands separator
- `'percentage'` - Format as X%
- `'boolean'` - Display as Sim/Não
- `'status'` - Render as status badge
- `'badge'` - Render as simple badge

**Width Ratios (responsive):**
- `0.8` - Very narrow (icons, counts)
- `1.0` - Narrow (codes, short text)
- `1.2` - Normal (dates, status)
- `1.5` - Medium (names, categories)
- `2.0` - Wide (descriptions)
- `2.5` - Very wide (long text with images)

---

### Step 5: Filter Configuration Pattern

**Filter Section:**
```typescript
{
  key: 'section-name',
  label: 'Section Label',
  icon: 'icon-name',                    // Tabler icon name
  collapsible: true,
  defaultOpen: true,                    // Start expanded?
  fields: [
    // Filter fields here
  ],
}
```

**Toggle Filter (Boolean):**
```typescript
{
  key: 'isActive',
  label: 'Produtos Ativos',
  description: 'Incluir apenas produtos ativos',
  type: 'toggle',
  defaultValue: true,
}
```

**Select Filter (Single/Multi):**
```typescript
{
  key: 'status',
  label: 'Status',
  type: 'select',
  multiple: true,                       // Allow multiple?
  options: [
    { label: 'Ativo', value: 'ACTIVE' },
    { label: 'Inativo', value: 'INACTIVE' },
  ],
  placeholder: 'Selecione o status',
}
```

**Async Select (Load from API):**
```typescript
{
  key: 'brandIds',
  label: 'Marcas',
  type: 'select',
  multiple: true,
  async: true,
  loadOptions: async () => {
    // Load from API
    return []
  },
  placeholder: 'Selecione as marcas',
}
```

**Date Range Filter:**
```typescript
{
  key: 'createdAt',
  label: 'Data de Criação',
  type: 'date-range',
}
```

**Number Range Filter:**
```typescript
{
  key: 'priceRange',
  label: 'Preço',
  type: 'number-range',
  placeholder: { min: 'Mín', max: 'Máx' },
}
```

**Text Filter:**
```typescript
{
  key: 'searchText',
  label: 'Busca Livre',
  type: 'text',
  placeholder: 'Digite para buscar...',
}
```

---

### Step 6: Action Configuration Pattern

**View Action:**
```typescript
{
  key: 'view',
  label: 'Ver',
  icon: 'eye',
  variant: 'default',
  onPress: (item, router) => {
    router.push(`/module/entity/detalhes/${item.id}`)
  },
}
```

**Edit Action:**
```typescript
{
  key: 'edit',
  label: 'Editar',
  icon: 'pencil',
  variant: 'default',
  onPress: (item, router) => {
    router.push(`/module/entity/editar/${item.id}`)
  },
}
```

**Delete Action with Confirmation:**
```typescript
{
  key: 'delete',
  label: 'Excluir',
  icon: 'trash',
  variant: 'destructive',
  confirm: {
    title: 'Confirmar Exclusão',
    message: (item) => `Deseja excluir "${item.name}"?`,
  },
  onPress: async (item, _, { delete: deleteItem }) => {
    await deleteItem(item.id)
  },
}
```

**Conditional Action:**
```typescript
{
  key: 'approve',
  label: 'Aprovar',
  icon: 'check',
  variant: 'default',
  visible: (item) => item.status === 'PENDING',  // Only show if pending
  onPress: async (item, _, { approve }) => {
    await approve(item.id)
  },
}
```

---

### Step 7: Bulk Action Configuration Pattern

**Simple Bulk Delete:**
```typescript
{
  key: 'delete',
  label: 'Excluir',
  icon: 'trash',
  variant: 'destructive',
  confirm: {
    title: 'Confirmar Exclusão',
    message: (count) => `Deseja excluir ${count} ${count === 1 ? 'item' : 'itens'}?`,
  },
  onPress: async (ids, { batchDeleteAsync }) => {
    await batchDeleteAsync({ ids: Array.from(ids) })
  },
}
```

**Bulk Status Update:**
```typescript
{
  key: 'activate',
  label: 'Ativar',
  icon: 'check',
  variant: 'default',
  confirm: {
    title: 'Confirmar Ativação',
    message: (count) => `Ativar ${count} ${count === 1 ? 'item' : 'itens'}?`,
  },
  onPress: async (ids, { batchUpdate }) => {
    await batchUpdate({ ids: Array.from(ids), isActive: true })
  },
}
```

---

### Step 8: Export Configuration Pattern

**Basic Export Column:**
```typescript
{
  key: 'name',
  label: 'Nome',
  path: 'name',
}
```

**Nested Field Export:**
```typescript
{
  key: 'user',
  label: 'Usuário',
  path: 'user.name',
}
```

**Formatted Export:**
```typescript
{
  key: 'price',
  label: 'Preço',
  path: 'price',
  format: 'currency',
}

{
  key: 'createdAt',
  label: 'Data',
  path: 'createdAt',
  format: 'date',
}

{
  key: 'isActive',
  label: 'Ativo',
  path: 'isActive',
  format: 'boolean',
}
```

---

### Step 9: Create Index Export (if first in module)

**File:** `src/config/list/{module}/index.ts`

```typescript
export { itemsListConfig } from './items'
export { ordersListConfig } from './orders'
// ... more exports
```

---

### Step 10: Migrate the Page File

**Before (300-500 lines):**
```typescript
import { useState, useCallback, useMemo } from "react";
import { View, StyleSheet, Alert } from "react-native";
// ... 20+ imports
// ... 50+ lines of state
// ... 100+ lines of handlers
// ... 150+ lines of render logic
// ... 50+ lines of styles
```

**After (6 lines):**
```typescript
import { Layout } from '@/components/list/Layout'
import { yourEntitiesListConfig } from '@/config/list/module/your-entities'

export default function YourEntityListScreen() {
  return <Layout config={yourEntitiesListConfig} />
}
```

**Steps:**
1. Read the entire file to back it up mentally
2. Use Write tool to completely replace the file
3. Use the 6-line template
4. Verify imports are correct

---

### Step 11: Verification Checklist

After migration, verify:

**✅ File Structure:**
- [ ] Config file created in correct location
- [ ] Config file exported from module index
- [ ] Page file reduced to 6 lines
- [ ] Imports use correct paths

**✅ Config Completeness:**
- [ ] All columns from original table are configured
- [ ] All filters from original drawer are configured
- [ ] All actions (view/edit/delete) are configured
- [ ] Routes match the original routes
- [ ] Default sort matches original
- [ ] Default visible columns match original

**✅ TypeScript:**
- [ ] No type errors in config file
- [ ] No type errors in page file
- [ ] Entity type is correct
- [ ] Hook name is correct

**✅ Functionality:**
- [ ] Create button route is correct
- [ ] Row action routes are correct
- [ ] Bulk actions use correct mutations
- [ ] Export columns cover important fields

---

## 🎯 Common Patterns by Module

### Inventory Module

**Typical Structure:**
- Hook: `useXXXsInfiniteMobile`
- Routes: `/estoque/xxx/[cadastrar|editar/[id]|detalhes/[id]]`
- Common filters: status, category, brand, supplier, date ranges
- Common columns: uniCode, name, quantity, price, status
- Common actions: view, edit, delete, duplicate

### HR Module

**Typical Structure:**
- Hook: `useUsersInfiniteMobile` or `useXXXsInfiniteMobile`
- Routes: `/recursos-humanos/xxx/[cadastrar|editar/[id]|detalhes/[id]]`
- Common filters: status, position, sector, date ranges
- Common columns: name, cpf, position, status, dates
- Common actions: view, edit, delete

### Production Module

**Typical Structure:**
- Hook: `useTasksInfiniteMobile` or `useXXXsInfiniteMobile`
- Routes: `/producao/xxx/[cadastrar|editar/[id]|detalhes/[id]]`
- Common filters: status, priority, assignee, customer, date ranges
- Common columns: name, status, priority, customer, dates
- Common actions: view, edit, delete, change status

### Administration Module

**Typical Structure:**
- Hook: `useCustomersInfiniteMobile` or `useXXXsInfiniteMobile`
- Routes: `/administracao/xxx/[cadastrar|editar/[id]|detalhes/[id]]`
- Common filters: status, location, type
- Common columns: name, document, status, location
- Common actions: view, edit, delete

---

## 🚫 Common Mistakes to Avoid

### ❌ Don't Copy Legacy Code
```typescript
// WRONG - Don't bring over legacy patterns
const buildOrderBy = () => { ... 100 lines ... }
const [filters, setFilters] = useState({})
```

### ❌ Don't Mix Old and New
```typescript
// WRONG - Don't mix Layout with legacy components
<Layout config={config}>
  <LegacyTable ... />  // Remove all legacy components
</Layout>
```

### ❌ Don't Skip Config Fields
```typescript
// WRONG - Incomplete config
export const config = {
  key: 'items',
  title: 'Items',
  // Missing: query, table, filters, etc.
}
```

### ❌ Don't Hardcode Routes
```typescript
// WRONG
route: '/estoque/produtos/detalhes/123'

// CORRECT
onPress: (item, router) => router.push(`/estoque/produtos/detalhes/${item.id}`)
```

### ❌ Don't Forget Null Safety
```typescript
// WRONG
render: (item) => item.user.name

// CORRECT
render: (item) => item.user?.name || '-'
```

---

## 📚 Reference Files

**Always reference these files when creating configs:**

1. **Primary Reference:**
   - `src/config/list/inventory/items.ts` - Complete example with all features

2. **Other Examples:**
   - `src/config/list/inventory/orders.ts` - Complex filters
   - `src/config/list/inventory/borrows.ts` - Conditional actions
   - `src/config/list/hr/employees.ts` - Many columns
   - `src/config/list/production/tasks.ts` - Priority/status
   - `src/config/list/administration/customers.ts` - Location filters

3. **Type Definitions:**
   - `src/components/list/types.ts` - All available types

---

## 🔄 Batch Migration Strategy

**When migrating multiple pages:**

1. **Group by module** (all inventory, then all HR, etc.)
2. **Start with simplest** in each module
3. **Create configs first** for all pages in module
4. **Then migrate page files** in batch
5. **Verify each batch** before moving to next module

**Order of complexity:**
1. Simple lists (no relations, few columns)
2. Medium lists (some relations, standard filters)
3. Complex lists (many relations, custom actions)

---

## ✅ Success Criteria

**For each migrated page:**
- ✅ Original page had 200+ lines
- ✅ New page has exactly 6 lines
- ✅ Config file is complete and documented
- ✅ All features from original are preserved
- ✅ No TypeScript errors
- ✅ Routes work correctly
- ✅ Filters work correctly
- ✅ Actions work correctly

---

## 📊 Progress Tracking

**Keep track in this format:**

```markdown
## Migration Progress

### Inventory Module (6/12)
- [x] Items (429→6 lines) ✅
- [x] Orders (400→6 lines) ✅
- [x] Borrows (350→6 lines) ✅
- [ ] Activities
- [ ] External Withdrawals
- [ ] Suppliers
- [ ] Categories
- [ ] Brands
- [ ] Item Brands
- [ ] Item Categories
- [ ] Maintenance
- [ ] PPE Items

### HR Module (1/8)
- [x] Employees (380→6 lines) ✅
- [ ] Warnings
- [ ] Vacations
- [ ] Positions
- [ ] PPE Deliveries
- [ ] PPE Schedules
- [ ] PPE Sizes
- [ ] Holidays

### Production Module (1/12)
- [x] Tasks (420→6 lines) ✅
- [ ] Airbrushing
- [ ] Paints
- [ ] Services
- [ ] Service Orders
- [ ] Observations
- [ ] Cuts
- [ ] Cutting Plans
- [ ] Cutting Requests
- [ ] General Paintings
- [ ] Paint Applications
- [ ] Paint Mixing

### Administration Module (1/7)
- [x] Customers (350→6 lines) ✅
- [ ] Sectors
- [ ] Notifications
- [ ] Users
- [ ] Change Logs
- [ ] Files
- [ ] Backups

### Painting Module (0/2)
- [ ] Paint Catalog
- [ ] Paint Types

### My Team Module (0/2)
- [ ] Team Members
- [ ] Team Users

**Total: 6/49 pages (12% complete)**
```

---

## 🎯 REMEMBER

**Every time you migrate a page:**
1. ✅ Read this document first
2. ✅ Follow the exact patterns
3. ✅ Use items.ts as reference
4. ✅ Verify completeness
5. ✅ Update progress tracker

**Consistency is KEY!** Every page should follow the EXACT same pattern.

---

*Last Updated: 2025-11-13*
*Version: 1.0*
