# useFilterState Hook

Type-safe filter state management with AsyncStorage persistence for React Native mobile apps.

## Quick Start

```typescript
import { useFilterState } from '@/hooks';

interface MyFilters {
  search: string;
  status: 'all' | 'active' | 'inactive';
}

const { filters, updateFilters, resetFilters } = useFilterState<MyFilters>({
  key: 'my-screen',
  defaultFilters: {
    search: '',
    status: 'all',
  },
});
```

## API Reference

### `useFilterState<T>(options)`

Main hook for filter state management.

**Parameters:**
- `key: string` - Unique storage key (stored as `@filters_{key}`)
- `defaultFilters: T` - Default filter values
- `onChange?: (filters: T) => void` - Optional callback when filters change

**Returns:**
- `filters: T` - Current filter values
- `setFilters: (filters: T | ((prev: T) => T)) => void` - Replace all filters
- `updateFilters: (updates: Partial<T>) => void` - Merge updates
- `resetFilters: () => void` - Reset to defaults
- `clearFilter: (filterKey: keyof T) => void` - Clear single filter
- `hasActiveFilters: boolean` - True if any filter differs from default
- `isLoading: boolean` - True while loading from storage

### `useFilterStateDebounced<T>(options, debounceMs?)`

Debounced variant for rapid updates (e.g., search input).

**Parameters:**
- Same as `useFilterState`
- `debounceMs?: number` - Debounce delay in milliseconds (default: 500)

**Returns:** Same as `useFilterState`

### `createFilterConfig<T>(options)`

Utility to create filter configuration objects.

**Parameters:**
- `key: string`
- `defaultFilters: T`

**Returns:** `UseFilterStateOptions<T>`

## Usage Examples

### Basic Filters

```typescript
const { filters, updateFilters } = useFilterState({
  key: 'customers',
  defaultFilters: {
    search: '',
    status: 'all' as const,
  },
});

<TextInput
  value={filters.search}
  onChangeText={(text) => updateFilters({ search: text })}
/>
```

### With Refetch Callback

```typescript
const { data, refetch } = useQuery({ ... });

const { filters, updateFilters } = useFilterState({
  key: 'items',
  defaultFilters: { category: null, inStock: true },
  onChange: () => {
    refetch();
  },
});
```

### Debounced Search

```typescript
const { filters, updateFilters } = useFilterStateDebounced({
  key: 'search',
  defaultFilters: { query: '' },
}, 300);

// Typing "hello" = 1 storage write after 300ms
<TextInput
  value={filters.query}
  onChangeText={(text) => updateFilters({ query: text })}
/>
```

### Clear Filters Button

```typescript
const { resetFilters, hasActiveFilters } = useFilterState({
  key: 'orders',
  defaultFilters: { status: 'all', assignedToMe: false },
});

<Button
  onPress={resetFilters}
  disabled={!hasActiveFilters}
>
  Clear Filters
</Button>
```

### Complex Filters

```typescript
interface ComplexFilters {
  search: string;
  tags: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
}

const { filters, updateFilters, clearFilter } = useFilterState<ComplexFilters>({
  key: 'advanced',
  defaultFilters: {
    search: '',
    tags: [],
    dateRange: { start: null, end: null },
  },
});

// Add tag
const addTag = (tag: string) => {
  updateFilters({ tags: [...filters.tags, tag] });
};

// Clear date range
const clearDates = () => {
  clearFilter('dateRange');
};
```

### With Config Factory

```typescript
const itemFiltersConfig = createFilterConfig({
  key: 'items',
  defaultFilters: {
    search: '',
    category: null,
    minPrice: 0,
    maxPrice: 1000,
  },
});

const filters = useFilterState(itemFiltersConfig);
```

## Best Practices

### 1. Choose the Right Variant

**Standard** - Use for infrequent updates:
- Dropdowns
- Checkboxes
- Toggle switches
- Date pickers

**Debounced** - Use for rapid updates:
- Search inputs
- Range sliders
- Numeric inputs
- Text fields

### 2. Unique Storage Keys

Use descriptive, unique keys per screen/feature:

```typescript
// Good
key: 'customer-list'
key: 'order-search'
key: 'inventory-filters'

// Bad
key: 'filters'  // Too generic
key: 'list'     // Not descriptive
```

### 3. Type Safety

Always define filter types:

```typescript
interface OrderFilters {
  search: string;
  status: 'all' | 'pending' | 'completed';  // Use literal types
  priority: number;
}

const filters = useFilterState<OrderFilters>({ ... });
// TypeScript will enforce types
```

### 4. Default Values

Provide sensible defaults:

```typescript
defaultFilters: {
  search: '',           // Empty string, not null
  status: 'all',        // Explicit default
  tags: [],             // Empty array, not null
  dateRange: {
    start: null,        // Null OK for optional dates
    end: null,
  },
}
```

### 5. Active Filter Detection

Use `hasActiveFilters` for UI feedback:

```typescript
const { hasActiveFilters, resetFilters } = useFilterState({ ... });

// Show clear button only when filters are active
{hasActiveFilters && (
  <Button onPress={resetFilters}>Clear</Button>
)}

// Show filter count badge
<Badge count={hasActiveFilters ? 1 : 0} />
```

## Storage Format

Filters are stored in AsyncStorage as JSON:

**Key:** `@filters_{key}`

**Value:**
```json
{
  "search": "acme",
  "status": "active",
  "tags": ["priority", "new"],
  "dateRange": {
    "start": "2025-01-01T00:00:00.000Z",
    "end": "2025-12-31T23:59:59.999Z"
  }
}
```

## Performance

### Standard Variant
- **Writes:** Immediate on every filter change
- **Overhead:** ~1-2ms per write
- **Use case:** Infrequent updates

### Debounced Variant
- **Writes:** After debounce delay
- **Overhead:** Minimal (batched)
- **Use case:** Frequent updates

**Example:**
```typescript
// Standard: Type "hello" = 5 writes
const standard = useFilterState({ ... });

// Debounced: Type "hello" = 1 write after 300ms
const debounced = useFilterStateDebounced({ ... }, 300);
```

## Migration from useState

**Before:**
```typescript
const [search, setSearch] = useState('');
const [status, setStatus] = useState('all');

useEffect(() => {
  AsyncStorage.setItem('search', search);
}, [search]);

const resetFilters = () => {
  setSearch('');
  setStatus('all');
};
```

**After:**
```typescript
const { filters, updateFilters, resetFilters } = useFilterState({
  key: 'my-screen',
  defaultFilters: { search: '', status: 'all' },
});
```

## Common Patterns

### Filter Bar Component

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
      <Picker
        selectedValue={filters.status}
        onValueChange={(status) => updateFilters({ status })}
      >
        <Picker.Item label="All" value="all" />
        <Picker.Item label="Active" value="active" />
        <Picker.Item label="Inactive" value="inactive" />
      </Picker>
      {hasActiveFilters && (
        <TouchableOpacity onPress={resetFilters}>
          <Text>Clear Filters</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
```

### Integration with Infinite Scroll

```typescript
const CustomersScreen = () => {
  const { filters, updateFilters } = useFilterState({
    key: 'customers',
    defaultFilters: { search: '', status: 'all' },
  });

  const { data, fetchNextPage } = useCustomersInfiniteMobile({
    search: filters.search,
    status: filters.status !== 'all' ? filters.status : undefined,
  });

  return (
    <View>
      <FilterBar filters={filters} updateFilters={updateFilters} />
      <FlatList data={data.pages} ... />
    </View>
  );
};
```

### Multi-Step Filters

```typescript
const [step, setStep] = useState(1);

const { filters, updateFilters } = useFilterState<WizardFilters>({
  key: 'wizard',
  defaultFilters: {
    step1: { category: '' },
    step2: { features: [] },
    step3: { delivery: 'pickup' },
  },
});

const nextStep = () => {
  setStep((s) => s + 1);
};
```

## Troubleshooting

### Filters Not Persisting

Check AsyncStorage permissions and storage quota:
```typescript
const checkStorage = async () => {
  const keys = await AsyncStorage.getAllKeys();
  console.log('Storage keys:', keys);
};
```

### Filters Not Loading

Ensure you wait for `isLoading` to be false:
```typescript
const { filters, isLoading } = useFilterState({ ... });

if (isLoading) {
  return <LoadingSpinner />;
}

return <FilteredList filters={filters} />;
```

### Type Errors

Ensure filter types match:
```typescript
// ❌ Type mismatch
updateFilters({ status: 'pending' });  // Error if not in type

// ✅ Correct type
interface Filters {
  status: 'all' | 'pending' | 'completed';
}
updateFilters({ status: 'pending' });  // OK
```

## Related Hooks

- `useColumnVisibility` - Manage table column visibility
- `useTableSort` - Manage table sorting state
- `useDebouncedSearch` - Debounced search input
- `useInfiniteMobile` - Infinite scroll with filters

## See Also

- [Examples](/home/kennedy/repositories/mobile/src/hooks/useFilterState.examples.ts)
- [Tests](/home/kennedy/repositories/mobile/src/hooks/__tests__/useFilterState.test.ts)
- [Implementation Guide](/home/kennedy/repositories/mobile/PHASE_6_FIX_FILTER_STATE.md)
