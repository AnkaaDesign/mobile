# Filter System Documentation

Complete guide for implementing filters in table list pages with async combobox loading, keyboard handling, and smooth scroll management.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Component Hierarchy](#component-hierarchy)
3. [Filter Configuration Pattern](#filter-configuration-pattern)
4. [Async Combobox with Pagination](#async-combobox-with-pagination)
5. [Keyboard Handling & Scroll Management](#keyboard-handling--scroll-management)
6. [Implementation Guide for New Tables](#implementation-guide-for-new-tables)
7. [API Integration Pattern](#api-integration-pattern)
8. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

The filter system follows a configuration-driven approach where each table defines its filters declaratively in a `ListConfig` object. The system consists of:

```
┌─────────────────────────────────────────────────────────────┐
│                      ListConfig                              │
│  (src/config/list/{module}/{entity}.ts)                     │
│  - Defines filter fields, async queryFn, options            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Filters Panel                             │
│  (src/components/list/Filters/index.tsx)                    │
│  - SlideInPanel container                                    │
│  - Manages scroll, keyboard, and combobox positioning       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Filter Fields                             │
│  (src/components/list/Filters/Fields/*.tsx)                 │
│  - SelectField, NumberRangeField, DateRangeField, etc.      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│               SelectFilter / MultiSelectFilter               │
│  (src/components/common/filters/SelectFilter.tsx)           │
│  - Wrapper that connects to Combobox                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Combobox                                │
│  (src/components/ui/combobox.tsx)                           │
│  - Handles async loading, pagination, load more             │
│  - Dropdown positioning                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy

### 1. ListConfig (Configuration)
**Location**: `src/config/list/{module}/{entity}.ts`

Defines the filter fields for a specific table:

```typescript
export const itemsListConfig: ListConfig<Item> = {
  key: 'inventory-items',
  title: 'Produtos',

  filters: {
    fields: [
      // Static select filter
      {
        key: 'isActive',
        label: 'Status',
        type: 'select',
        multiple: false,
        options: [
          { label: 'Ambos', value: 'ambos' },
          { label: 'Ativo', value: 'ativo' },
          { label: 'Inativo', value: 'inativo' },
        ],
        placeholder: 'Selecione...',
      },

      // Async multi-select filter with pagination
      {
        key: 'categoryIds',
        label: 'Categoria',
        type: 'select',
        multiple: true,
        async: true,
        queryKey: ['item-categories', 'filter'],
        queryFn: async (searchTerm: string, page: number = 1) => {
          // Implementation details in API Integration section
        },
        placeholder: 'Selecione categorias...',
      },

      // Number range filter
      {
        key: 'quantityRange',
        label: 'Faixa de Quantidade',
        type: 'number-range',
        placeholder: { min: 'Mínimo', max: 'Máximo' },
      },
    ],
  },
}
```

### 2. Filters Panel
**Location**: `src/components/list/Filters/index.tsx`

Main container that:
- Wraps all filter fields in a `SlideInPanel`
- Manages scroll position for combobox visibility
- Handles keyboard-aware scrolling for input fields
- Maintains local state until user applies filters

Key features:
- **Parent-controlled scrolling**: When a combobox opens, the panel scrolls to position the input at the top of the screen
- **Dynamic padding**: Adds extra padding to allow scroll room when combobox needs to be repositioned
- **Keyboard awareness**: Automatically scrolls focused input fields into view when keyboard appears

### 3. Filter Fields
**Location**: `src/components/list/Filters/Fields/*.tsx`

Individual field components:
- `SelectField` - Single/multi select with static or async options
- `NumberRangeField` - Min/max number inputs
- `DateRangeField` - Date range picker
- `TextField` - Text input
- `ToggleField` - Boolean toggle

### 4. SelectFilter / MultiSelectFilter
**Location**: `src/components/common/filters/SelectFilter.tsx`

Wrapper components that:
- Add label and icon display
- Connect to the Combobox component
- Pass through async configuration

### 5. Combobox
**Location**: `src/components/ui/combobox.tsx`

Core component that handles:
- Async data loading with React Query
- Pagination (load more on scroll)
- Options accumulation and deduplication
- Dropdown positioning
- Search functionality

---

## Filter Configuration Pattern

### FilterField Interface

```typescript
interface FilterField {
  key: string                    // Unique identifier, maps to filter value key
  label?: string                 // Display label
  type: FilterFieldType          // 'select' | 'date-range' | 'number-range' | 'text' | 'toggle'
  placeholder?: string | { min?: string; max?: string }

  // For select fields:
  multiple?: boolean             // Enable multi-select
  options?: Array<{              // Static options
    label: string
    value: any
    [key: string]: any          // Additional properties (e.g., stockLevel for custom rendering)
  }>

  // For async select fields:
  async?: boolean                // Enable async loading
  queryKey?: unknown[]           // React Query cache key
  queryFn?: (searchTerm: string, page?: number) => Promise<{
    data: Array<{ label: string; value: any }>
    hasMore?: boolean            // Whether more pages exist
    total?: number               // Optional total count
  }>
}
```

### Filter Field Types

| Type | Description | Props |
|------|-------------|-------|
| `select` | Single or multi-select dropdown | `multiple`, `options`, `async`, `queryKey`, `queryFn` |
| `number-range` | Min/max number inputs | `placeholder: { min, max }` |
| `date-range` | Date range picker | `placeholder: { from, to }` |
| `text` | Text input | `placeholder` |
| `toggle` | Boolean toggle | - |

---

## Async Combobox with Pagination

### How Load More Works

The combobox implements infinite scroll pagination:

1. **Initial Load**: When dropdown opens, first page is loaded via React Query
2. **Load More Trigger**: When user scrolls to 80% of list (`onEndReachedThreshold={0.2}`)
3. **Options Accumulation**: New options are appended to existing ones with deduplication
4. **State Management**: `hasMore` controls whether more requests should be made

### Key Implementation Details

```typescript
// In combobox.tsx

// State for pagination
const [currentPage, setCurrentPage] = useState(1);
const [allAsyncOptions, setAllAsyncOptions] = useState<TData[]>([]);
const [hasMore, setHasMore] = useState(false);
const [isLoadingMore, setIsLoadingMore] = useState(false);

// Load more function
const loadMore = useCallback(async () => {
  if (!queryFn || isLoadingMore || !hasMore) return;

  setIsLoadingMore(true);
  try {
    const nextPage = currentPage + 1;
    const result = await queryFn(debouncedSearch, nextPage);

    // Accumulate options with deduplication
    setAllAsyncOptions((prev) => {
      const combined = [...prev, ...(result.data || [])];
      const seen = new Set();
      return combined.filter((item) => {
        const value = getOptionValue(item);
        if (seen.has(value)) return false;
        seen.add(value);
        return true;
      });
    });

    setHasMore(result.hasMore || false);
    setCurrentPage(nextPage);
  } finally {
    setIsLoadingMore(false);
  }
}, [queryFn, isLoadingMore, hasMore, currentPage, debouncedSearch]);

// FlatList configuration
<FlatList
  data={filteredOptions}
  onEndReached={handleEndReached}
  onEndReachedThreshold={0.2}  // Trigger at 80% scroll
  ListFooterComponent={renderFooter}
/>
```

### queryFn Pattern

**CRITICAL**: The API expects `page` and `limit` parameters, NOT `skip` and `take`.

```typescript
queryFn: async (searchTerm: string, page: number = 1) => {
  const { getCategories } = await import('@/api-client')
  const pageSize = 20

  const response = await getCategories({
    where: searchTerm
      ? { name: { contains: searchTerm, mode: 'insensitive' } }
      : undefined,
    orderBy: { name: 'asc' },
    limit: pageSize,    // NOT 'take'
    page: page,         // NOT 'skip'
  })

  return {
    data: (response.data || []).map((item: any) => ({
      label: item.name,
      value: item.id,
    })),
    hasMore: response.meta?.hasNextPage ?? false,
    total: response.meta?.totalRecords,
  }
}
```

---

## Keyboard Handling & Scroll Management

### Combobox Scroll to Top

When a combobox opens, the filter panel scrolls to position the input near the top of the screen, ensuring the dropdown has maximum visibility.

**In Filters/index.tsx:**

```typescript
// State for scroll management
const scrollViewRef = useRef<ScrollView>(null)
const currentScrollY = useRef(0)
const scrollViewYRef = useRef(0)
const [comboboxExtraPadding, setComboboxExtraPadding] = useState(0)

// Handle combobox opening
const handleComboboxOpen = useCallback((measurements: {
  inputY: number
  inputHeight: number
  requiredHeight: number
}): boolean => {
  if (!scrollViewRef.current) return false

  const { inputY } = measurements

  // Position input near top with space for label
  const topPadding = 30
  const targetInputY = scrollViewYRef.current + topPadding
  const scrollAmount = inputY - targetInputY

  if (scrollAmount > 0) {
    // Add extra padding to allow scroll room
    setComboboxExtraPadding(scrollAmount + 300)

    // Scroll after padding applies
    setTimeout(() => {
      const targetScrollY = currentScrollY.current + scrollAmount
      scrollViewRef.current?.scrollTo({
        y: Math.max(0, targetScrollY),
        animated: true,
      })
    }, 50)
    return true
  }
  return false
}, [])

// Reset padding when combobox closes
const handleComboboxClose = useCallback(() => {
  setComboboxExtraPadding(0)
}, [])
```

### Keyboard-Aware Input Scrolling

For number-range and text inputs, the panel automatically scrolls focused fields into view when the keyboard appears.

```typescript
// Track keyboard visibility
useEffect(() => {
  const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
  const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'

  const showListener = Keyboard.addListener(showEvent, (e) => {
    setKeyboardHeight(e.endCoordinates.height)
  })

  const hideListener = Keyboard.addListener(hideEvent, () => {
    setKeyboardHeight(0)
    setFocusedFieldKey(null)
  })

  return () => {
    showListener.remove()
    hideListener.remove()
  }
}, [])

// Scroll focused field into view
useEffect(() => {
  if (!focusedFieldKey || keyboardHeight === 0) return

  const fieldLayout = fieldLayoutsRef.current.get(focusedFieldKey)
  if (!fieldLayout || !scrollViewRef.current) return

  const fieldBottomOnScreen = fieldLayout.y - currentScrollY.current + scrollViewYRef.current + fieldLayout.height
  const visibleAreaBottom = SCREEN_HEIGHT - keyboardHeight - 16

  if (fieldBottomOnScreen > visibleAreaBottom) {
    const hiddenAmount = fieldBottomOnScreen - visibleAreaBottom
    const targetScrollY = currentScrollY.current + hiddenAmount + 8

    scrollViewRef.current.scrollTo({
      y: targetScrollY,
      animated: true,
    })
  }
}, [focusedFieldKey, keyboardHeight])
```

---

## Implementation Guide for New Tables

### Step 1: Create Filter Configuration

Create or update the list config file in `src/config/list/{module}/{entity}.ts`:

```typescript
import type { ListConfig } from '@/components/list/types'
import type { YourEntity } from '@/types'

export const yourEntityListConfig: ListConfig<YourEntity> = {
  key: 'your-module-entity',
  title: 'Your Entity Title',

  // ... other config (query, table, etc.)

  filters: {
    fields: [
      // Add your filter fields here
    ],
  },
}
```

### Step 2: Add Static Select Filters

For filters with predefined options:

```typescript
{
  key: 'status',          // Key for filter values object
  label: 'Status',        // Label shown in filter panel
  type: 'select',
  multiple: false,        // Single select
  options: [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ],
  placeholder: 'Select status...',
},
```

### Step 3: Add Async Multi-Select Filters

For filters that load options from the API:

```typescript
{
  key: 'categoryIds',
  label: 'Category',
  type: 'select',
  multiple: true,           // Multi-select enabled
  async: true,              // Enable async loading
  queryKey: ['categories', 'filter'],  // React Query cache key
  queryFn: async (searchTerm: string, page: number = 1) => {
    try {
      const { getCategories } = await import('@/api-client')
      const pageSize = 20

      const response = await getCategories({
        where: searchTerm
          ? { name: { contains: searchTerm, mode: 'insensitive' } }
          : undefined,
        orderBy: { name: 'asc' },
        limit: pageSize,
        page: page,
      })

      return {
        data: (response.data || []).map((item: any) => ({
          label: item.name,
          value: item.id,
        })),
        hasMore: response.meta?.hasNextPage ?? false,
        total: response.meta?.totalRecords,
      }
    } catch (error) {
      console.error('[Category Filter] Error:', error)
      return { data: [], hasMore: false }
    }
  },
  placeholder: 'Select categories...',
},
```

### Step 4: Add Number Range Filters

```typescript
{
  key: 'priceRange',
  label: 'Price Range',
  type: 'number-range',
  placeholder: { min: 'Min', max: 'Max' },
},
```

### Step 5: Add Date Range Filters

```typescript
{
  key: 'dateRange',
  label: 'Date Range',
  type: 'date-range',
  placeholder: { from: 'From', to: 'To' },
},
```

### Step 6: Verify Filter Processing in useList Hook

Ensure your `useList` hook (or similar) processes the filter values correctly when building the API query:

```typescript
// Example filter value processing
const buildWhereClause = (filters: FilterValue) => {
  const where: any = {}

  // Handle status filter
  if (filters.status && filters.status !== 'all') {
    where.isActive = filters.status === 'active'
  }

  // Handle category IDs (array)
  if (filters.categoryIds?.length > 0) {
    where.categoryId = { in: filters.categoryIds }
  }

  // Handle price range
  if (filters.priceRange) {
    if (filters.priceRange.min !== undefined) {
      where.price = { ...where.price, gte: filters.priceRange.min }
    }
    if (filters.priceRange.max !== undefined) {
      where.price = { ...where.price, lte: filters.priceRange.max }
    }
  }

  return where
}
```

---

## API Integration Pattern

### Expected API Response Format

The API should return responses in this format for pagination to work:

```typescript
interface ApiResponse<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    totalRecords: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}
```

### API Call Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Current page number (1-indexed) |
| `limit` | number | Items per page |
| `where` | object | Prisma-style filter conditions |
| `orderBy` | object | Sort configuration |

### Example API Call

```typescript
const response = await getSuppliers({
  where: {
    OR: [
      { fantasyName: { contains: searchTerm, mode: 'insensitive' } },
      { corporateName: { contains: searchTerm, mode: 'insensitive' } },
    ],
  },
  orderBy: { fantasyName: 'asc' },
  limit: 20,
  page: 1,
})
```

---

## Troubleshooting

### Load More Not Working

1. **Check API response**: Ensure `meta.hasNextPage` is correctly set
2. **Verify parameters**: API expects `page` and `limit`, NOT `skip` and `take`
3. **Check queryFn return**: Must include `{ data, hasMore }` structure
4. **Console logs**: Check `[Combobox]` logs for pagination state

### Infinite Loop on Load More

**Cause**: API ignoring pagination parameters
**Fix**: Ensure API actually paginates using `page`/`limit` parameters

### Combobox Not Scrolling to Top

1. **Check onOpen callback**: Ensure `SelectField` passes `onOpen` to `Combobox`
2. **Verify measurements**: Check console for `[Filters] Combobox scroll to top:` logs
3. **Check extra padding**: Ensure `comboboxExtraPadding` is being set

### Keyboard Not Scrolling Input into View

1. **Check onFocus callback**: Ensure field passes `onFocus` to parent
2. **Verify layout measurement**: Check `fieldLayoutsRef` is being populated
3. **Check keyboard events**: Verify keyboard height is being captured

### Options Not Accumulating

1. **Check initial fetch**: Verify data loads on first open
2. **Check accumulation logic**: Options should be appended, not replaced
3. **Verify deduplication**: Check for duplicate values in options

---

## File Reference

| File | Purpose |
|------|---------|
| `src/components/list/types.ts` | Type definitions for FilterField, ListConfig |
| `src/components/list/Filters/index.tsx` | Main filter panel with scroll management |
| `src/components/list/Filters/Fields/Select.tsx` | SelectField wrapper component |
| `src/components/common/filters/SelectFilter.tsx` | SelectFilter/MultiSelectFilter components |
| `src/components/ui/combobox.tsx` | Core Combobox with async loading |
| `src/config/list/inventory/items.ts` | Reference implementation for items table |

---

## Summary Checklist for New Filter Implementation

- [ ] Create/update ListConfig with `filters.fields` array
- [ ] For static selects: Define `options` array
- [ ] For async selects: Set `async: true`, `queryKey`, and `queryFn`
- [ ] In queryFn: Use `page` and `limit` parameters (NOT `skip`/`take`)
- [ ] In queryFn: Return `{ data, hasMore }` structure
- [ ] In queryFn: Map API response to `{ label, value }` format
- [ ] Verify filter values are processed correctly in useList/query hook
- [ ] Test load more scrolling functionality
- [ ] Test keyboard handling for number/text inputs
