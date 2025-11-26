# Filter Implementation Guide with Icons

This guide shows how to implement filters with labels and icons in a flat list structure (no sections).

## Overview

All filter components now support an `icon` prop that displays next to the label. The icon mapping system automatically resolves the appropriate icon for each filter type.

## Updated Filter Components

All common filter components now accept an `icon` prop:
- `StringFilter`
- `DateRangeFilter`
- `NumericRangeFilter`
- `SelectFilter` / `MultiSelectFilter`
- `BooleanFilter`

## Using Filter Icons

### 1. Import Required Components and Icons

```tsx
import { getFilterIcon } from '@/lib/filter-icon-mapping';
import { StringFilter, DateRangeFilter, SelectFilter, BooleanFilter, NumericRangeFilter } from '@/components/common/filters';
```

### 2. Example: Item Filter Drawer (Flat List)

```tsx
import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Drawer, DrawerHeader, DrawerContent, DrawerFooter } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { IconFilter, IconCheck, IconX } from '@tabler/icons-react-native';
import { getFilterIcon } from '@/lib/filter-icon-mapping';
import {
  StringFilter,
  DateRangeFilter,
  SelectFilter,
  MultiSelectFilter,
  BooleanFilter,
  NumericRangeFilter,
} from '@/components/common/filters';

interface ItemFilters {
  searchingFor?: string;
  isActive?: boolean;
  status?: string[];
  brandIds?: string[];
  categoryIds?: string[];
  supplierIds?: string[];
  quantityRange?: { min?: number; max?: number };
  priceRange?: { min?: number; max?: number };
  stockLevels?: string[];
  createdAt?: { from?: Date; to?: Date };
}

export function ItemFilterDrawer({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  onApply,
  onClear,
  activeFilterCount,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: ItemFilters;
  onFiltersChange: (filters: ItemFilters) => void;
  onApply: () => void;
  onClear: () => void;
  activeFilterCount: number;
}) {
  const [localFilters, setLocalFilters] = React.useState(filters);

  // Sync local state when drawer opens
  React.useEffect(() => {
    if (open) {
      setLocalFilters(filters);
    }
  }, [open, filters]);

  const handleApply = () => {
    onFiltersChange(localFilters);
    onApply();
    onOpenChange(false);
  };

  const handleClear = () => {
    const clearedFilters: ItemFilters = {};
    setLocalFilters(clearedFilters);
    onClear();
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} side="right" width="90%">
      <DrawerHeader>
        <View style={styles.header}>
          <IconFilter size={24} />
          <Text style={styles.title}>Filtros</Text>
          {activeFilterCount > 0 && (
            <Badge variant="secondary">{activeFilterCount}</Badge>
          )}
          <Button variant="ghost" onPress={() => onOpenChange(false)}>
            <IconX size={20} />
          </Button>
        </View>
      </DrawerHeader>

      <DrawerContent>
        <ScrollView contentContainerStyle={styles.filterList}>
          {/* Search Filter */}
          <StringFilter
            label="Buscar"
            icon={getFilterIcon('searchingFor')}
            value={localFilters.searchingFor}
            onChange={(v) => setLocalFilters({ ...localFilters, searchingFor: v })}
            placeholder="Digite o nome do item..."
          />

          {/* Active Status Filter */}
          <BooleanFilter
            label="Apenas itens ativos"
            icon={getFilterIcon('isActive')}
            value={localFilters.isActive ?? true}
            onChange={(v) => setLocalFilters({ ...localFilters, isActive: v })}
            description="Mostrar somente produtos ativos"
          />

          {/* Brand Filter */}
          <MultiSelectFilter
            label="Marcas"
            icon={getFilterIcon('brandIds')}
            value={localFilters.brandIds || []}
            onChange={(v) => setLocalFilters({ ...localFilters, brandIds: v })}
            options={brandOptions}
            placeholder="Selecione as marcas"
          />

          {/* Category Filter */}
          <MultiSelectFilter
            label="Categorias"
            icon={getFilterIcon('categoryIds')}
            value={localFilters.categoryIds || []}
            onChange={(v) => setLocalFilters({ ...localFilters, categoryIds: v })}
            options={categoryOptions}
            placeholder="Selecione as categorias"
          />

          {/* Supplier Filter */}
          <MultiSelectFilter
            label="Fornecedores"
            icon={getFilterIcon('supplierIds')}
            value={localFilters.supplierIds || []}
            onChange={(v) => setLocalFilters({ ...localFilters, supplierIds: v })}
            options={supplierOptions}
            placeholder="Selecione os fornecedores"
          />

          {/* Stock Level Filter */}
          <MultiSelectFilter
            label="Nível de Estoque"
            icon={getFilterIcon('stockLevels')}
            value={localFilters.stockLevels || []}
            onChange={(v) => setLocalFilters({ ...localFilters, stockLevels: v })}
            options={[
              { value: 'NEGATIVE', label: 'Estoque Negativo' },
              { value: 'OUT_OF_STOCK', label: 'Sem Estoque' },
              { value: 'CRITICAL', label: 'Crítico' },
              { value: 'LOW', label: 'Baixo' },
              { value: 'OPTIMAL', label: 'Ótimo' },
              { value: 'EXCESS', label: 'Excesso' },
            ]}
            placeholder="Selecione os níveis"
          />

          {/* Quantity Range Filter */}
          <NumericRangeFilter
            label="Quantidade"
            icon={getFilterIcon('quantityRange')}
            value={localFilters.quantityRange}
            onChange={(v) => setLocalFilters({ ...localFilters, quantityRange: v })}
            minPlaceholder="Mínimo"
            maxPlaceholder="Máximo"
            suffix=" unid."
          />

          {/* Price Range Filter */}
          <NumericRangeFilter
            label="Preço"
            icon={getFilterIcon('priceRange')}
            value={localFilters.priceRange}
            onChange={(v) => setLocalFilters({ ...localFilters, priceRange: v })}
            prefix="R$"
            minPlaceholder="Mínimo"
            maxPlaceholder="Máximo"
            decimalPlaces={2}
          />

          {/* Date Range Filter */}
          <DateRangeFilter
            label="Data de Criação"
            icon={getFilterIcon('createdAt')}
            value={localFilters.createdAt}
            onChange={(v) => setLocalFilters({ ...localFilters, createdAt: v })}
            showPresets={true}
          />
        </ScrollView>
      </DrawerContent>

      <DrawerFooter>
        <View style={styles.footer}>
          <Button variant="outline" onPress={handleClear} style={styles.button}>
            <IconX size={18} />
            <Text>Limpar</Text>
          </Button>
          <Button variant="default" onPress={handleApply} style={styles.button}>
            <IconCheck size={18} />
            <Text>Aplicar</Text>
          </Button>
        </View>
      </DrawerFooter>
    </Drawer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  filterList: {
    padding: 16,
    gap: 20, // Space between each filter
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
  },
});
```

## Icon Mapping Reference

The `getFilterIcon()` function automatically maps filter keys to appropriate icons:

### Common Filter Keys

| Filter Key | Icon | Description |
|------------|------|-------------|
| `searchingFor` / `search` | IconSearch | Search/text filters |
| `isActive` / `active` | IconToggleRight | Active status |
| `status` | IconAlertCircle | Status filters |
| `userId` / `userIds` | IconUser / IconUsers | User filters |
| `itemId` / `itemIds` | IconPackage | Item/product filters |
| `categoryId` / `categoryIds` | IconFolder | Category filters |
| `brandId` / `brandIds` | IconBrandAsana | Brand filters |
| `supplierId` / `supplierIds` | IconTruck | Supplier filters |
| `createdAt` / `updatedAt` | IconCalendar | Date filters |
| `quantityRange` / `quantity` | IconRuler | Quantity filters |
| `priceRange` / `price` | IconCurrencyDollar | Price filters |
| `stockLevel` / `stockLevels` | IconBuildingWarehouse | Stock filters |
| `sectorId` / `sectorIds` | IconBuilding | Sector filters |
| `operation` / `operations` | IconArrowsExchange | Operation filters |

### Using Custom Icons

You can override the automatic icon by passing a custom icon component:

```tsx
import { IconCustom } from '@tabler/icons-react-native';

<StringFilter
  label="Custom Filter"
  icon={IconCustom}  // Custom icon
  value={filters.custom}
  onChange={(v) => setFilters({ ...filters, custom: v })}
/>
```

### Registering New Icon Mappings

For domain-specific filters, register custom mappings:

```tsx
import { registerFilterIcon } from '@/lib/filter-icon-mapping';
import { IconCustom } from '@tabler/icons-react-native';

// Register single mapping
registerFilterIcon('myCustomFilter', IconCustom);

// Register multiple mappings
registerFilterIcons({
  customFilter1: IconCustom1,
  customFilter2: IconCustom2,
});
```

## Filter Layout Best Practices

### 1. Flat List Structure (Recommended)
- Display all filters in a single scrollable list
- Each filter has its own label and icon
- Consistent spacing between filters (16-20px recommended)
- No collapsible sections

### 2. Filter Ordering
- Place most frequently used filters at the top
- Group related filters together (e.g., all date filters, all selection filters)
- Keep search/text filters at the very top for quick access

### 3. Visual Hierarchy
- Icons: 18px size for consistency
- Label font: 14-16px
- Maintain consistent spacing: 8-12px gap between icon and label

## Migration from Section-Based Filters

### Before (with FilterSection):
```tsx
<FilterSection title="Informações Básicas">
  <StringFilter label="Nome" ... />
  <StringFilter label="Email" ... />
</FilterSection>
```

### After (flat list with icons):
```tsx
<StringFilter
  label="Nome"
  icon={getFilterIcon('name')}
  ...
/>
<StringFilter
  label="Email"
  icon={getFilterIcon('email')}
  ...
/>
```

## Complete Example with All Filter Types

```tsx
<ScrollView contentContainerStyle={{ padding: 16, gap: 20 }}>
  {/* Text Search */}
  <StringFilter
    label="Buscar"
    icon={getFilterIcon('searchingFor')}
    value={filters.search}
    onChange={(v) => updateFilter('search', v)}
  />

  {/* Boolean Toggle */}
  <BooleanFilter
    label="Apenas ativos"
    icon={getFilterIcon('isActive')}
    value={filters.isActive}
    onChange={(v) => updateFilter('isActive', v)}
  />

  {/* Single Select */}
  <SelectFilter
    label="Status"
    icon={getFilterIcon('status')}
    value={filters.status}
    onChange={(v) => updateFilter('status', v)}
    options={statusOptions}
  />

  {/* Multi Select */}
  <MultiSelectFilter
    label="Categorias"
    icon={getFilterIcon('categoryIds')}
    value={filters.categoryIds}
    onChange={(v) => updateFilter('categoryIds', v)}
    options={categoryOptions}
  />

  {/* Numeric Range */}
  <NumericRangeFilter
    label="Preço"
    icon={getFilterIcon('priceRange')}
    value={filters.priceRange}
    onChange={(v) => updateFilter('priceRange', v)}
    prefix="R$"
    decimalPlaces={2}
  />

  {/* Date Range */}
  <DateRangeFilter
    label="Data de Criação"
    icon={getFilterIcon('createdAt')}
    value={filters.createdAt}
    onChange={(v) => updateFilter('createdAt', v)}
    showPresets={true}
  />
</ScrollView>
```

## Summary

- ✅ All filter components now support icons
- ✅ Icons display next to labels (18px size)
- ✅ Automatic icon resolution via `getFilterIcon()`
- ✅ Flat list structure (no sections needed)
- ✅ Consistent spacing and visual hierarchy
- ✅ Custom icon support
- ✅ Extensible icon mapping system
