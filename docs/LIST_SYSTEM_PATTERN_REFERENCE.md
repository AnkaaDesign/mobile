# 🎨 List System Pattern Reference

## Quick Reference Guide for Config Creation

This is a **condensed reference** for common patterns. Keep this open while creating configs.

---

## 📐 Standard Column Widths

```typescript
// Width ratios (responsive):
0.8  // Tiny: icons, small badges, counts
1.0  // Narrow: codes (uniCode, SKU), short IDs
1.2  // Normal: dates, status badges, small numbers
1.5  // Medium: names, categories, brands, users
2.0  // Wide: descriptions, long names, addresses
2.5  // Very wide: complex data with images/avatars
```

---

## 🎯 Standard Column Templates

### Text Column
```typescript
{
  key: 'name',
  label: 'NOME',
  sortable: true,
  width: 1.5,
  align: 'left',
  render: (item) => item.name,
}
```

### Code Column
```typescript
{
  key: 'uniCode',
  label: 'CÓDIGO',
  sortable: true,
  width: 1.0,
  align: 'left',
  render: (item) => item.uniCode || '-',
}
```

### Status Badge
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

### Currency
```typescript
{
  key: 'price',
  label: 'PREÇO',
  sortable: true,
  width: 1.2,
  align: 'right',
  render: (item) => item.price,
  format: 'currency',
}
```

### Date
```typescript
{
  key: 'createdAt',
  label: 'CRIADO EM',
  sortable: true,
  width: 1.2,
  align: 'left',
  render: (item) => item.createdAt,
  format: 'date',
}
```

### DateTime
```typescript
{
  key: 'updatedAt',
  label: 'ATUALIZADO EM',
  sortable: true,
  width: 1.5,
  align: 'left',
  render: (item) => item.updatedAt,
  format: 'datetime',
}
```

### Number
```typescript
{
  key: 'quantity',
  label: 'QUANTIDADE',
  sortable: true,
  width: 1.0,
  align: 'center',
  render: (item) => item.quantity,
  format: 'number',
}
```

### Boolean
```typescript
{
  key: 'isActive',
  label: 'ATIVO',
  sortable: true,
  width: 0.8,
  align: 'center',
  render: (item) => item.isActive,
  format: 'boolean',
}
```

### Nested Field
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

### Count with Badge
```typescript
{
  key: 'itemsCount',
  label: 'ITENS',
  sortable: false,
  width: 0.8,
  align: 'center',
  render: (item) => (item as any)._count?.items || 0,
  format: 'badge',
}
```

---

## 🔍 Standard Filter Templates

### Status Select (Enum)
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
      type: 'select',
      multiple: true,
      options: Object.values(STATUS_ENUM).map((status) => ({
        label: STATUS_LABELS[status],
        value: status,
      })),
      placeholder: 'Selecione o status',
    },
  ],
}
```

### Entity Filters (Async)
```typescript
{
  key: 'entities',
  label: 'Relacionamentos',
  icon: 'tags',
  collapsible: true,
  defaultOpen: false,
  fields: [
    {
      key: 'categoryIds',
      label: 'Categorias',
      type: 'select',
      multiple: true,
      async: true,
      loadOptions: async () => [],
      placeholder: 'Selecione as categorias',
    },
    {
      key: 'brandIds',
      label: 'Marcas',
      type: 'select',
      multiple: true,
      async: true,
      loadOptions: async () => [],
      placeholder: 'Selecione as marcas',
    },
  ],
}
```

### Date Ranges
```typescript
{
  key: 'dates',
  label: 'Datas',
  icon: 'calendar',
  collapsible: true,
  defaultOpen: false,
  fields: [
    {
      key: 'createdAt',
      label: 'Data de Criação',
      type: 'date-range',
    },
    {
      key: 'updatedAt',
      label: 'Data de Atualização',
      type: 'date-range',
    },
  ],
}
```

### Number Ranges
```typescript
{
  key: 'ranges',
  label: 'Faixas de Valores',
  icon: 'coins',
  collapsible: true,
  defaultOpen: false,
  fields: [
    {
      key: 'priceRange',
      label: 'Preço (R$)',
      type: 'number-range',
      placeholder: { min: 'Mín', max: 'Máx' },
    },
    {
      key: 'quantityRange',
      label: 'Quantidade',
      type: 'number-range',
      placeholder: { min: 'Mín', max: 'Máx' },
    },
  ],
}
```

### Boolean Toggles
```typescript
{
  key: 'options',
  label: 'Opções',
  icon: 'settings',
  collapsible: true,
  defaultOpen: false,
  fields: [
    {
      key: 'isActive',
      label: 'Apenas Ativos',
      description: 'Mostrar apenas itens ativos',
      type: 'toggle',
      defaultValue: true,
    },
    {
      key: 'hasStock',
      label: 'Com Estoque',
      description: 'Apenas itens com estoque disponível',
      type: 'toggle',
    },
  ],
}
```

---

## ⚡ Standard Action Templates

### View Action
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

### Edit Action
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

### Delete Action
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

### Duplicate Action
```typescript
{
  key: 'duplicate',
  label: 'Duplicar',
  icon: 'copy',
  variant: 'default',
  onPress: (item, router) => {
    router.push({
      pathname: `/module/entity/cadastrar`,
      params: { duplicateFrom: item.id },
    })
  },
}
```

### Conditional Action
```typescript
{
  key: 'approve',
  label: 'Aprovar',
  icon: 'check',
  variant: 'default',
  visible: (item) => item.status === 'PENDING',
  confirm: {
    title: 'Confirmar Aprovação',
    message: (item) => `Aprovar "${item.name}"?`,
  },
  onPress: async (item, _, { approve }) => {
    await approve(item.id)
  },
}
```

---

## 🔄 Standard Bulk Actions

### Bulk Delete
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

### Bulk Status Change
```typescript
{
  key: 'activate',
  label: 'Ativar',
  icon: 'check',
  variant: 'default',
  confirm: {
    title: 'Confirmar Ativação',
    message: (count) => `Ativar ${count} itens?`,
  },
  onPress: async (ids, { batchUpdate }) => {
    await batchUpdate({ ids: Array.from(ids), isActive: true })
  },
},
{
  key: 'deactivate',
  label: 'Desativar',
  icon: 'x',
  variant: 'secondary',
  confirm: {
    title: 'Confirmar Desativação',
    message: (count) => `Desativar ${count} itens?`,
  },
  onPress: async (ids, { batchUpdate }) => {
    await batchUpdate({ ids: Array.from(ids), isActive: false })
  },
}
```

### Bulk Assign
```typescript
{
  key: 'assign',
  label: 'Atribuir',
  icon: 'user',
  variant: 'default',
  confirm: {
    title: 'Atribuir Itens',
    message: (count) => `Atribuir ${count} itens?`,
  },
  onPress: async (ids, { batchAssign }) => {
    // Could show modal to select user
    await batchAssign({ ids: Array.from(ids), userId: 'xxx' })
  },
}
```

---

## 📤 Standard Export Columns

### Basic Fields
```typescript
{ key: 'id', label: 'ID', path: 'id' },
{ key: 'name', label: 'Nome', path: 'name' },
{ key: 'description', label: 'Descrição', path: 'description' },
```

### Formatted Fields
```typescript
{ key: 'price', label: 'Preço', path: 'price', format: 'currency' },
{ key: 'quantity', label: 'Quantidade', path: 'quantity', format: 'number' },
{ key: 'isActive', label: 'Ativo', path: 'isActive', format: 'boolean' },
{ key: 'createdAt', label: 'Criado', path: 'createdAt', format: 'date' },
{ key: 'updatedAt', label: 'Atualizado', path: 'updatedAt', format: 'datetime' },
```

### Nested Fields
```typescript
{ key: 'user', label: 'Usuário', path: 'user.name' },
{ key: 'category', label: 'Categoria', path: 'category.name' },
{ key: 'brand', label: 'Marca', path: 'brand.name' },
```

### Enum Fields
```typescript
{
  key: 'status',
  label: 'Status',
  path: 'status',
  format: (value) => STATUS_LABELS[value] || value,
}
```

---

## 🗂️ Module-Specific Patterns

### Inventory Module

**Common Include:**
```typescript
include: {
  brand: true,
  category: true,
  supplier: true,
  _count: {
    select: {
      activities: true,
    },
  },
}
```

**Common Columns:**
- uniCode, name, quantity, price, totalPrice
- brand.name, category.name, supplier.fantasyName
- status, isActive, createdAt

**Common Filters:**
- Status, isActive
- Brand, Category, Supplier
- Price range, Quantity range
- Created date range

### HR Module

**Common Include:**
```typescript
include: {
  position: true,
  sector: true,
  managedSector: true,
  _count: {
    select: {
      tasks: true,
    },
  },
}
```

**Common Columns:**
- name, cpf, email, phone
- position.name, sector.name
- status, isActive, admissionalDate

**Common Filters:**
- Status, isActive
- Position, Sector
- Hire date range

### Production Module

**Common Include:**
```typescript
include: {
  customer: true,
  sector: true,
  createdBy: true,
  _count: {
    select: {
      services: true,
    },
  },
}
```

**Common Columns:**
- name, serialNumber, status, priority
- customer.fantasyName, sector.name
- term, startedAt, finishedAt

**Common Filters:**
- Status, Priority
- Customer, Sector, Created By
- Date ranges (term, startedAt, finishedAt)

### Administration Module

**Common Include:**
```typescript
include: {
  economicActivity: true,
  _count: {
    select: {
      tasks: true,
    },
  },
}
```

**Common Columns:**
- fantasyName, legalName, cnpj, email
- city, state, status
- economicActivity.name

**Common Filters:**
- Status, State
- Economic Activity
- Has tasks toggle

---

## 🎨 Icon Reference

**Common Icons (Tabler):**
- `package` - Inventory/Items
- `shopping-cart` - Orders
- `user` - Users/Employees
- `users` - Team/Groups
- `calendar` - Dates/Schedule
- `clipboard` - Tasks
- `building` - Company/Organization
- `tag` - Categories/Tags
- `coins` - Prices/Money
- `settings` - Config/Options
- `filter` - Filters
- `search` - Search
- `eye` - View
- `pencil` - Edit
- `trash` - Delete
- `copy` - Duplicate
- `check` - Approve/Confirm
- `x` - Cancel/Reject
- `download` - Download/Export

---

## 🔢 Standard Sort Configs

### Alphabetical (Default)
```typescript
defaultSort: { field: 'name', direction: 'asc' }
```

### Chronological (Newest First)
```typescript
defaultSort: { field: 'createdAt', direction: 'desc' }
```

### By Status
```typescript
defaultSort: { field: 'status', direction: 'asc' }
```

### By Priority
```typescript
defaultSort: { field: 'priority', direction: 'desc' }
```

---

## 📊 Standard Default Visible Columns

**Inventory:**
```typescript
defaultVisible: ['uniCode', 'name', 'quantity']
```

**Orders:**
```typescript
defaultVisible: ['description', 'status', 'totalPrice']
```

**Users/Employees:**
```typescript
defaultVisible: ['name', 'email', 'status']
```

**Tasks:**
```typescript
defaultVisible: ['name', 'status', 'priority', 'term']
```

**Customers:**
```typescript
defaultVisible: ['fantasyName', 'cnpj', 'status']
```

---

## 🚀 Speed Reference

**Copy-paste ready snippets:**

### Complete Config Skeleton
```typescript
import type { ListConfig } from '@/components/list/types'
import type { Entity } from '@/types'

export const entitiesListConfig: ListConfig<Entity> = {
  key: 'module-entity',
  title: 'Entities',
  query: {
    hook: 'useEntitiesInfiniteMobile',
    defaultSort: { field: 'name', direction: 'asc' },
    pageSize: 25,
    include: {},
  },
  table: {
    columns: [],
    defaultVisible: [],
    rowHeight: 60,
    actions: [],
  },
  filters: {
    sections: [],
  },
  search: {
    placeholder: 'Buscar...',
    debounce: 300,
  },
  export: {
    title: 'Entities',
    filename: 'entities',
    formats: ['csv', 'json', 'pdf'],
    columns: [],
  },
  actions: {
    create: {
      label: 'Cadastrar',
      route: '/module/entity/cadastrar',
    },
    bulk: [],
  },
}
```

### Standard 3-Action Set
```typescript
actions: [
  {
    key: 'view',
    label: 'Ver',
    icon: 'eye',
    variant: 'default',
    onPress: (item, router) => router.push(`/module/entity/detalhes/${item.id}`),
  },
  {
    key: 'edit',
    label: 'Editar',
    icon: 'pencil',
    variant: 'default',
    onPress: (item, router) => router.push(`/module/entity/editar/${item.id}`),
  },
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
  },
]
```

---

*Last Updated: 2025-11-13*
*Version: 1.0*
