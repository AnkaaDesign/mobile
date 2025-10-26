# PHASE 6 FIX - Filter State Management for Mobile

## Overview

Created `useFilterState` hook for mobile to provide centralized, persistent filter state management. This hook is adapted from the web implementation but optimized for mobile's AsyncStorage-based persistence model.

## Created Files

### 1. Core Hook
- **File:** `/home/kennedy/repositories/mobile/src/hooks/useFilterState.ts`
- **Purpose:** Main filter state management hook with AsyncStorage persistence

### 2. Examples
- **File:** `/home/kennedy/repositories/mobile/src/hooks/useFilterState.examples.ts`
- **Purpose:** Comprehensive usage examples and patterns

### 3. Exports
- **Updated:** `/home/kennedy/repositories/mobile/src/hooks/index.ts`
- **Added:** New "UI State Management Hooks" section with exports

## API Documentation

### `useFilterState<T>`

Main hook for managing filter state with persistent storage.

```typescript
function useFilterState<T extends Record<string, any>>(
  options: UseFilterStateOptions<T>
): UseFilterStateReturn<T>
```

#### Options

```typescript
interface UseFilterStateOptions<T> {
  key: string;              // Storage key for AsyncStorage
  defaultFilters: T;        // Default filter values
  onChange?: (filters: T) => void;  // Optional callback when filters change
}
```

#### Return Value

```typescript
interface UseFilterStateReturn<T> {
  filters: T;                                    // Current filter values
  setFilters: (filters: T | ((prev: T) => T)) => void;  // Replace all filters
  updateFilters: (updates: Partial<T>) => void;  // Merge updates
  resetFilters: () => void;                      // Reset to defaults
  clearFilter: (filterKey: keyof T) => void;     // Clear single filter
  hasActiveFilters: boolean;                     // Check if filters are active
  isLoading: boolean;                            // Loading state
}
```

### `useFilterStateDebounced<T>`

Debounced variant for rapid filter updates (e.g., search input).

```typescript
function useFilterStateDebounced<T extends Record<string, any>>(
  options: UseFilterStateOptions<T>,
  debounceMs?: number  // Default: 500ms
): UseFilterStateReturn<T>
```

### `createFilterConfig<T>`

Utility to create filter configuration objects.

```typescript
function createFilterConfig<T>(options: {
  key: string;
  defaultFilters: T;
}): UseFilterStateOptions<T>
```

## Usage Examples

### Basic Usage

```typescript
interface CustomerFilters {
  search: string;
  status: 'active' | 'inactive' | 'all';
  category: string | null;
}

const {
  filters,
  updateFilters,
  resetFilters,
  hasActiveFilters,
  isLoading
} = useFilterState<CustomerFilters>({
  key: 'customers',
  defaultFilters: {
    search: '',
    status: 'all',
    category: null,
  },
});

// Update filters
<TextInput
  value={filters.search}
  onChangeText={(text) => updateFilters({ search: text })}
/>

// Reset filters
<Button onPress={resetFilters} disabled={!hasActiveFilters}>
  Clear Filters
</Button>
```

### With Callback

```typescript
const { filters, updateFilters } = useFilterState({
  key: 'items',
  defaultFilters: { search: '', inStock: true },
  onChange: (filters) => {
    // Refetch data when filters change
    refetch();
  },
});
```

### Debounced (for Search)

```typescript
const { filters, updateFilters } = useFilterStateDebounced({
  key: 'search',
  defaultFilters: { query: '' },
}, 300); // 300ms debounce

// Rapid typing won't spam AsyncStorage
<TextInput
  value={filters.query}
  onChangeText={(text) => updateFilters({ query: text })}
/>
```

### With Config Factory

```typescript
const itemFiltersConfig = createFilterConfig({
  key: 'items',
  defaultFilters: {
    search: '',
    category: null,
    inStock: true,
  },
});

const filters = useFilterState(itemFiltersConfig);
```

## Differences from Web Version

### Architecture

| Aspect | Web (`useFilterState`) | Mobile (`useFilterState`) |
|--------|------------------------|---------------------------|
| **State Persistence** | URL query parameters | AsyncStorage |
| **Sync Mechanism** | `useSearchParams` from react-router | AsyncStorage read/write |
| **Filter Structure** | Complex `FilterDefinition` with groups | Simple generic `Record<string, any>` |
| **Serialization** | URL-encoded JSON | JSON in AsyncStorage |
| **Browser Integration** | URL sync for sharing/bookmarking | Local persistence only |

### API Differences

| Feature | Web | Mobile |
|---------|-----|--------|
| **syncWithUrl** | Yes (option) | N/A (no URLs) |
| **urlParamName** | Yes (option) | N/A (no URLs) |
| **FilterDefinition** | Required complex structure | Generic type parameter |
| **createFilterGroup** | Yes | N/A |
| **serializeFiltersToUrl** | Yes | N/A |
| **deserializeFiltersFromUrl** | Yes | N/A |
| **Debounced variant** | No | Yes (new feature) |

### Simplified Mobile API

The mobile version uses a simpler, more flexible API:

**Web:**
```typescript
// Complex filter definition structure
const definition: FilterDefinition = {
  id: "",
  name: "",
  groups: [createFilterGroup([], "AND")],
};

const { definition, setDefinition, clearFilters } = useFilterState({
  defaultDefinition: definition,
  syncWithUrl: true,
});
```

**Mobile:**
```typescript
// Simple, type-safe filter object
interface MyFilters {
  search: string;
  status: string;
}

const { filters, updateFilters, resetFilters } = useFilterState({
  key: 'my-filters',
  defaultFilters: {
    search: '',
    status: 'all',
  },
});
```

### Key Improvements for Mobile

1. **AsyncStorage Integration**
   - Automatic persistence to local storage
   - Loads filters on mount
   - Saves filters on change

2. **Loading State**
   - `isLoading` flag while reading from storage
   - Prevents premature saves during initialization

3. **Generic Type Support**
   - Works with any filter object shape
   - Full TypeScript type safety
   - No required structure

4. **Debounced Variant**
   - Reduces AsyncStorage writes for rapid updates
   - Perfect for search inputs
   - Configurable debounce delay

5. **Active Filter Detection**
   - `hasActiveFilters` compares against defaults
   - Handles arrays, objects, and primitives
   - Useful for UI indicators

## Integration Points

### With Infinite Scroll Hooks

```typescript
const { filters, updateFilters } = useFilterState({
  key: 'customers',
  defaultFilters: { search: '', status: 'all' },
});

const { data, fetchNextPage } = useCustomersInfiniteMobile({
  search: filters.search,
  status: filters.status,
});
```

### With List Components

```typescript
const FilterBar = () => {
  const { filters, updateFilters, resetFilters, hasActiveFilters } =
    useFilterState<CustomerFilters>({
      key: 'customers',
      defaultFilters: DEFAULT_FILTERS,
    });

  return (
    <View>
      <SearchBar
        value={filters.search}
        onChangeText={(text) => updateFilters({ search: text })}
      />
      <StatusPicker
        value={filters.status}
        onChange={(status) => updateFilters({ status })}
      />
      {hasActiveFilters && (
        <Button onPress={resetFilters}>Clear Filters</Button>
      )}
    </View>
  );
};
```

### With Form Components

```typescript
const AdvancedFilters = () => {
  const { filters, updateFilters, clearFilter } = useFilterState({
    key: 'advanced',
    defaultFilters: {
      category: null,
      tags: [],
      dateRange: { start: null, end: null },
    },
  });

  return (
    <View>
      <CategoryPicker
        value={filters.category}
        onChange={(cat) => updateFilters({ category: cat })}
        onClear={() => clearFilter('category')}
      />
      <TagSelector
        selectedTags={filters.tags}
        onTagsChange={(tags) => updateFilters({ tags })}
      />
      <DateRangePicker
        range={filters.dateRange}
        onChange={(range) => updateFilters({ dateRange: range })}
      />
    </View>
  );
};
```

## Storage Format

### Storage Key Pattern
```typescript
// Pattern: @filters_{key}
AsyncStorage.getItem('@filters_customers')
AsyncStorage.getItem('@filters_orders')
AsyncStorage.getItem('@filters_search')
```

### Storage Value Format
```json
{
  "search": "acme",
  "status": "active",
  "category": "electronics",
  "tags": ["priority", "new"],
  "dateRange": {
    "start": "2025-01-01T00:00:00.000Z",
    "end": "2025-12-31T23:59:59.999Z"
  }
}
```

## Performance Considerations

### Standard Variant
- **Use when:** Filters change infrequently
- **Writes:** On every filter change
- **Best for:** Dropdowns, checkboxes, toggles

### Debounced Variant
- **Use when:** Filters change rapidly
- **Writes:** After debounce delay (default 500ms)
- **Best for:** Search inputs, sliders, numeric inputs

### Example Comparison

```typescript
// Standard - writes immediately on each keystroke
const standard = useFilterState({
  key: 'standard',
  defaultFilters: { search: '' },
});
// Type "hello" = 5 AsyncStorage writes

// Debounced - waits 300ms after last keystroke
const debounced = useFilterStateDebounced({
  key: 'debounced',
  defaultFilters: { search: '' },
}, 300);
// Type "hello" = 1 AsyncStorage write (after 300ms)
```

## Type Safety

The hook provides full TypeScript type safety:

```typescript
interface Filters {
  search: string;
  status: 'active' | 'inactive';
  count: number;
}

const { filters, updateFilters } = useFilterState<Filters>({
  key: 'typed',
  defaultFilters: {
    search: '',
    status: 'active',
    count: 0,
  },
});

// ✅ Type-safe
updateFilters({ search: 'test' });
updateFilters({ status: 'inactive' });
updateFilters({ count: 10 });

// ❌ Type errors
updateFilters({ search: 123 });        // Error: Type 'number' is not assignable to type 'string'
updateFilters({ status: 'pending' });  // Error: Type '"pending"' is not assignable
updateFilters({ invalid: 'value' });   // Error: Object literal may only specify known properties
```

## Testing Strategy

### Unit Tests
```typescript
import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFilterState } from './useFilterState';

describe('useFilterState', () => {
  beforeEach(() => {
    AsyncStorage.clear();
  });

  it('loads filters from storage', async () => {
    await AsyncStorage.setItem('@filters_test', JSON.stringify({ search: 'loaded' }));

    const { result } = renderHook(() => useFilterState({
      key: 'test',
      defaultFilters: { search: '' },
    }));

    await waitFor(() => {
      expect(result.current.filters.search).toBe('loaded');
    });
  });

  it('saves filters to storage', async () => {
    const { result } = renderHook(() => useFilterState({
      key: 'test',
      defaultFilters: { search: '' },
    }));

    act(() => {
      result.current.updateFilters({ search: 'test' });
    });

    const stored = await AsyncStorage.getItem('@filters_test');
    expect(JSON.parse(stored)).toEqual({ search: 'test' });
  });

  it('detects active filters', () => {
    const { result } = renderHook(() => useFilterState({
      key: 'test',
      defaultFilters: { search: '', active: false },
    }));

    expect(result.current.hasActiveFilters).toBe(false);

    act(() => {
      result.current.updateFilters({ search: 'test' });
    });

    expect(result.current.hasActiveFilters).toBe(true);
  });
});
```

## Migration Guide

### From Custom Filter State

**Before:**
```typescript
const [search, setSearch] = useState('');
const [status, setStatus] = useState('all');
const [category, setCategory] = useState(null);

useEffect(() => {
  AsyncStorage.setItem('customer_search', search);
}, [search]);

useEffect(() => {
  AsyncStorage.setItem('customer_status', status);
}, [status]);

// Reset filters
const resetFilters = () => {
  setSearch('');
  setStatus('all');
  setCategory(null);
};
```

**After:**
```typescript
const { filters, updateFilters, resetFilters } = useFilterState({
  key: 'customers',
  defaultFilters: {
    search: '',
    status: 'all',
    category: null,
  },
});

// All persistence handled automatically!
```

### From useItemFilters Pattern

**Before:**
```typescript
// Multiple useState hooks, manual persistence
const [searchTerm, setSearchTerm] = useState('');
const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
const [onlyInStock, setOnlyInStock] = useState(true);
```

**After:**
```typescript
const { filters, updateFilters } = useFilterState({
  key: 'items',
  defaultFilters: {
    searchTerm: '',
    selectedCategories: [],
    onlyInStock: true,
  },
});
```

## Next Steps

1. **Integrate with existing filter components**
   - Update filter bars to use `useFilterState`
   - Replace custom state management with hook

2. **Migrate entity list screens**
   - Customers list
   - Orders list
   - Items list
   - etc.

3. **Add filter presets**
   - Save/load named filter presets
   - Quick filter buttons
   - Recent filters history

4. **Performance monitoring**
   - Track AsyncStorage read/write performance
   - Optimize debounce delays per use case
   - Monitor filter complexity impact

## Summary

The mobile `useFilterState` hook provides:

- ✅ AsyncStorage-based persistence
- ✅ Type-safe filter management
- ✅ Simple, flexible API
- ✅ Loading state handling
- ✅ Active filter detection
- ✅ Debounced variant for performance
- ✅ Full TypeScript support
- ✅ Comprehensive examples
- ✅ Easy migration path

This hook completes PHASE 6 FIX and provides mobile with the same filter state management capabilities as web, adapted for the mobile architecture and storage model.
