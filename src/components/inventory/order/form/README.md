# Order Item Selectors

Advanced item selector components for Order forms with multi-column filtering, async pagination, and mobile-optimized UI.

## Components

### 1. OrderItemSelector

A single-selection item picker with advanced filtering capabilities.

**Features:**
- Async pagination with infinite scroll
- Search by name, code, brand, and category
- Multi-select filters (categories, brands, suppliers)
- Show/hide inactive items toggle
- Stock information display
- Price and supplier information
- Touch-optimized UI
- React Query integration for caching

**Usage:**

```tsx
import { OrderItemSelector } from '@/components/inventory/order/form';

function OrderForm() {
  const [itemId, setItemId] = useState<string>();
  const [filters, setFilters] = useState({
    categoryIds: [],
    brandIds: [],
    supplierIds: [],
    showInactive: false,
  });

  return (
    <OrderItemSelector
      value={itemId}
      onValueChange={setItemId}
      label="Item do Pedido"
      required
      categoryIds={filters.categoryIds}
      brandIds={filters.brandIds}
      supplierIds={filters.supplierIds}
      showInactive={filters.showInactive}
    />
  );
}
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string \| undefined` | - | Selected item ID |
| `onValueChange` | `(value: string \| undefined) => void` | - | Callback when selection changes |
| `disabled` | `boolean` | `false` | Disable the selector |
| `initialItem` | `Item` | - | Initial item to display |
| `error` | `string` | - | Error message to display |
| `label` | `string` | `"Item"` | Label for the selector |
| `required` | `boolean` | `true` | Show required indicator |
| `categoryIds` | `string[]` | `[]` | Filter by category IDs |
| `brandIds` | `string[]` | `[]` | Filter by brand IDs |
| `supplierIds` | `string[]` | `[]` | Filter by supplier IDs |
| `showInactive` | `boolean` | `false` | Show inactive items |

---

### 2. OrderMultiItemSelector

A multi-selection item picker for batch operations.

**Features:**
- All features from OrderItemSelector
- Multiple item selection
- Selection count badge
- Optimized for batch operations

**Usage:**

```tsx
import { OrderMultiItemSelector } from '@/components/inventory/order/form';

function OrderBatchForm() {
  const [itemIds, setItemIds] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    categoryIds: [],
    brandIds: [],
    supplierIds: [],
    showInactive: false,
  });

  return (
    <OrderMultiItemSelector
      value={itemIds}
      onValueChange={setItemIds}
      label="Itens do Pedido"
      categoryIds={filters.categoryIds}
      brandIds={filters.brandIds}
      supplierIds={filters.supplierIds}
      showInactive={filters.showInactive}
    />
  );
}
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string[]` | `[]` | Selected item IDs |
| `onValueChange` | `(value: string[] \| undefined) => void` | - | Callback when selection changes |
| `disabled` | `boolean` | `false` | Disable the selector |
| `error` | `string` | - | Error message to display |
| `label` | `string` | `"Itens"` | Label for the selector |
| `description` | `string` | - | Description text |
| `placeholder` | `string` | `"Selecione os itens"` | Placeholder text |
| `emptyText` | `string` | `"Nenhum item disponível"` | Empty state text |
| `searchPlaceholder` | `string` | `"Pesquisar por nome..."` | Search input placeholder |
| `categoryIds` | `string[]` | `[]` | Filter by category IDs |
| `brandIds` | `string[]` | `[]` | Filter by brand IDs |
| `supplierIds` | `string[]` | `[]` | Filter by supplier IDs |
| `showInactive` | `boolean` | `false` | Show inactive items |

---

### 3. ItemFilterModal

A modal dialog for advanced item filtering.

**Features:**
- Category multi-select filter
- Brand multi-select filter
- Supplier multi-select filter
- Show inactive toggle
- Active filter count badge
- Clear all filters button
- Apply filters with confirmation

**Usage:**

```tsx
import { ItemFilterModal, ItemFilters } from '@/components/inventory/order/form';

function OrderForm() {
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState<ItemFilters>({
    categoryIds: [],
    brandIds: [],
    supplierIds: [],
    showInactive: false,
  });

  const handleApplyFilters = (newFilters: ItemFilters) => {
    setFilters(newFilters);
  };

  return (
    <>
      <Button onPress={() => setFilterModalVisible(true)}>
        Filtros
      </Button>

      <ItemFilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={handleApplyFilters}
        initialFilters={filters}
      />
    </>
  );
}
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `visible` | `boolean` | - | Control modal visibility |
| `onClose` | `() => void` | - | Callback when modal closes |
| `onApply` | `(filters: ItemFilters) => void` | - | Callback when filters applied |
| `initialFilters` | `Partial<ItemFilters>` | `{}` | Initial filter values |

**ItemFilters Type:**

```typescript
interface ItemFilters {
  categoryIds: string[];
  brandIds: string[];
  supplierIds: string[];
  showInactive: boolean;
}
```

---

## Complete Example

See `item-selector-example.tsx` for a complete working example that demonstrates:

- Single item selection
- Multi item selection
- Filter modal integration
- Active filter display
- Filter clearing
- Result display

---

## Implementation Details

### Web vs Mobile Comparison

**Web (order-item-selector.tsx):**
- Table-based layout with fixed headers
- Multi-column sorting
- Inline quantity/price editing
- URL state management
- Pagination with page size control

**Mobile (item-selector.tsx):**
- Combobox-based selection (mobile-optimized)
- Single tap selection
- Modal filter interface
- Async infinite scroll pagination
- Touch-friendly UI elements

### Key Differences

1. **UI Pattern**: Web uses a table, mobile uses a combobox dropdown
2. **Selection**: Web allows inline editing, mobile focuses on item selection first
3. **Filters**: Web has inline filters, mobile uses a modal
4. **Pagination**: Web uses traditional pagination, mobile uses infinite scroll
5. **State**: Web uses URL state, mobile uses local component state

### Data Flow

```
User Input (Search/Filter)
    ↓
Debounced (300ms)
    ↓
React Query
    ↓
API Request (with pagination)
    ↓
Cache & Display
    ↓
Infinite Scroll (Load More)
```

### Performance Optimizations

1. **Debounced Search**: 300ms delay to reduce API calls
2. **Query Caching**: React Query caches results
3. **Pagination**: Load 50 items per page
4. **Memoization**: Callbacks and options are memoized
5. **Lazy Loading**: Items loaded on-demand

---

## Features Implemented

### From Web Version

- ✅ Search by name, code, brand, category
- ✅ Category filter (multi-select)
- ✅ Brand filter (multi-select)
- ✅ Supplier filter (multi-select)
- ✅ Show inactive toggle
- ✅ Stock information display
- ✅ Price display
- ✅ Pagination with async loading
- ✅ React Query integration

### Mobile-Specific Enhancements

- ✅ Touch-optimized UI
- ✅ Modal filter interface
- ✅ Infinite scroll pagination
- ✅ Visual stock indicators (color-coded)
- ✅ Compact badge displays
- ✅ Combobox pattern for native feel
- ✅ Multi-item selection mode

### Not Implemented (Web-Only)

- ❌ Inline quantity/price editing (handled in parent form)
- ❌ Multi-column sorting (single sort in combobox)
- ❌ URL state management (uses local state)
- ❌ Show selected toggle (not needed in combobox)
- ❌ Select all checkbox (combobox handles this)

---

## API Integration

The components use the following API endpoints:

### Items
- `getItems(params)` - Fetch items with filters and pagination

### Filters
- `getItemCategories(params)` - Fetch active categories
- `getItemBrands(params)` - Fetch active brands
- `getSuppliers(params)` - Fetch active suppliers

### Query Parameters

```typescript
{
  take: number;           // Page size
  skip: number;           // Offset
  where: {
    OR: [...],            // Search conditions
    categoryId?: {...},   // Category filter
    brandId?: {...},      // Brand filter
    supplierId?: {...},   // Supplier filter
    isActive?: boolean;   // Active filter
  };
  orderBy: {...};         // Sorting
  include: {              // Related data
    itemCategory: true,
    itemBrand: true,
    supplier: true,
    prices: {...},
  };
}
```

---

## Testing

To test the components:

1. **Single Selection**:
   - Select an item
   - Search for items
   - Apply filters
   - Clear filters
   - Verify selection state

2. **Multi Selection**:
   - Select multiple items
   - Verify count badge
   - Deselect items
   - Clear all selections

3. **Filters**:
   - Open filter modal
   - Select categories
   - Select brands
   - Select suppliers
   - Toggle inactive
   - Apply filters
   - Clear filters
   - Verify filter count

4. **Pagination**:
   - Scroll to load more
   - Verify continuous loading
   - Test with filters applied

---

## Troubleshooting

### Items not loading
- Check API connectivity
- Verify authentication
- Check console for errors

### Filters not working
- Ensure filter IDs are valid
- Check API response format
- Verify where clause construction

### Performance issues
- Reduce page size if needed
- Check debounce timing
- Verify query cache settings

---

## Future Enhancements

- [ ] Advanced search operators (AND/OR)
- [ ] Saved filter presets
- [ ] Recent selections history
- [ ] Barcode scanning integration
- [ ] Offline mode support
- [ ] Export selection to CSV
- [ ] Custom sorting options

---

## Related Components

- `Combobox` - Base selection component
- `Badge` - Visual indicators
- `Label` - Form labels
- `Switch` - Toggle controls
- `Modal` - Filter interface

---

## Credits

Based on the web `order-item-selector.tsx` component, adapted for mobile with React Native optimizations and touch-friendly UI patterns.
