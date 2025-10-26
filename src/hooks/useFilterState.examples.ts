/**
 * Usage Examples for useFilterState Hook
 *
 * This file demonstrates various usage patterns for the useFilterState hook.
 * It shows how to manage filter state with persistence in mobile applications.
 */

import { useFilterState, useFilterStateDebounced, createFilterConfig } from './useFilterState';

// =====================================================
// Example 1: Basic Filter State
// =====================================================

interface BasicFilters {
  search: string;
  status: 'all' | 'active' | 'inactive';
}

export function useBasicFilters() {
  const {
    filters,
    updateFilters,
    resetFilters,
    hasActiveFilters,
    isLoading,
  } = useFilterState<BasicFilters>({
    key: 'basic-filters',
    defaultFilters: {
      search: '',
      status: 'all',
    },
  });

  return {
    filters,
    updateFilters,
    resetFilters,
    hasActiveFilters,
    isLoading,
  };
}

// Usage in component:
// const { filters, updateFilters } = useBasicFilters();
// <TextInput value={filters.search} onChangeText={(text) => updateFilters({ search: text })} />

// =====================================================
// Example 2: Complex Filter State with Callback
// =====================================================

interface CustomerFilters {
  search: string;
  status: 'active' | 'inactive' | 'all';
  category: string | null;
  tags: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
}

export function useCustomerFilters(onFiltersChange?: (filters: CustomerFilters) => void) {
  const {
    filters,
    setFilters,
    updateFilters,
    resetFilters,
    clearFilter,
    hasActiveFilters,
    isLoading,
  } = useFilterState<CustomerFilters>({
    key: 'customers',
    defaultFilters: {
      search: '',
      status: 'all',
      category: null,
      tags: [],
      dateRange: {
        start: null,
        end: null,
      },
    },
    onChange: onFiltersChange,
  });

  // Helper function to add a tag
  const addTag = (tag: string) => {
    if (!filters.tags.includes(tag)) {
      updateFilters({ tags: [...filters.tags, tag] });
    }
  };

  // Helper function to remove a tag
  const removeTag = (tag: string) => {
    updateFilters({ tags: filters.tags.filter((t) => t !== tag) });
  };

  // Helper function to set date range
  const setDateRange = (start: Date | null, end: Date | null) => {
    updateFilters({ dateRange: { start, end } });
  };

  return {
    filters,
    setFilters,
    updateFilters,
    resetFilters,
    clearFilter,
    hasActiveFilters,
    isLoading,
    // Custom helpers
    addTag,
    removeTag,
    setDateRange,
  };
}

// =====================================================
// Example 3: Debounced Filter State (for Search)
// =====================================================

interface SearchFilters {
  query: string;
  category: string | null;
  sortBy: 'name' | 'date' | 'relevance';
}

export function useSearchFilters() {
  const {
    filters,
    updateFilters,
    resetFilters,
    hasActiveFilters,
    isLoading,
  } = useFilterStateDebounced<SearchFilters>({
    key: 'search',
    defaultFilters: {
      query: '',
      category: null,
      sortBy: 'relevance',
    },
  }, 300); // 300ms debounce

  return {
    filters,
    updateFilters,
    resetFilters,
    hasActiveFilters,
    isLoading,
  };
}

// Usage: Rapid typing won't spam AsyncStorage
// const { filters, updateFilters } = useSearchFilters();
// <TextInput value={filters.query} onChangeText={(text) => updateFilters({ query: text })} />

// =====================================================
// Example 4: Filter State with Config Factory
// =====================================================

const itemFiltersConfig = createFilterConfig({
  key: 'items',
  defaultFilters: {
    search: '',
    category: null,
    inStock: true,
    minPrice: 0,
    maxPrice: 1000,
  },
});

export function useItemFilters() {
  return useFilterState(itemFiltersConfig);
}

// =====================================================
// Example 5: Type-Safe Enum Filters
// =====================================================

enum OrderStatus {
  All = 'all',
  Pending = 'pending',
  InProgress = 'in_progress',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

enum OrderPriority {
  All = 'all',
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Urgent = 'urgent',
}

interface OrderFilters {
  search: string;
  status: OrderStatus;
  priority: OrderPriority;
  assignedToMe: boolean;
}

export function useOrderFilters() {
  const {
    filters,
    updateFilters,
    resetFilters,
    clearFilter,
    hasActiveFilters,
    isLoading,
  } = useFilterState<OrderFilters>({
    key: 'orders',
    defaultFilters: {
      search: '',
      status: OrderStatus.All,
      priority: OrderPriority.All,
      assignedToMe: false,
    },
  });

  return {
    filters,
    updateFilters,
    resetFilters,
    clearFilter,
    hasActiveFilters,
    isLoading,
  };
}

// =====================================================
// Example 6: Advanced Filter State with Validation
// =====================================================

interface AdvancedFilters {
  search: string;
  minValue: number;
  maxValue: number;
  selectedIds: string[];
}

export function useAdvancedFilters() {
  const {
    filters,
    updateFilters: baseUpdateFilters,
    resetFilters,
    hasActiveFilters,
    isLoading,
  } = useFilterState<AdvancedFilters>({
    key: 'advanced',
    defaultFilters: {
      search: '',
      minValue: 0,
      maxValue: 100,
      selectedIds: [],
    },
  });

  // Validated update function
  const updateFilters = (updates: Partial<AdvancedFilters>) => {
    // Ensure min/max relationship is maintained
    if ('minValue' in updates && updates.minValue !== undefined) {
      if (updates.minValue > filters.maxValue) {
        baseUpdateFilters({ ...updates, maxValue: updates.minValue });
        return;
      }
    }
    if ('maxValue' in updates && updates.maxValue !== undefined) {
      if (updates.maxValue < filters.minValue) {
        baseUpdateFilters({ ...updates, minValue: updates.maxValue });
        return;
      }
    }
    baseUpdateFilters(updates);
  };

  return {
    filters,
    updateFilters,
    resetFilters,
    hasActiveFilters,
    isLoading,
  };
}

// =====================================================
// Example 7: Multi-Step Filter State
// =====================================================

interface WizardFilters {
  step1: {
    category: string;
    subcategory: string;
  };
  step2: {
    features: string[];
    priceRange: [number, number];
  };
  step3: {
    delivery: 'pickup' | 'shipping';
    location: string;
  };
}

export function useWizardFilters() {
  const {
    filters,
    updateFilters,
    resetFilters,
    hasActiveFilters,
    isLoading,
  } = useFilterState<WizardFilters>({
    key: 'wizard',
    defaultFilters: {
      step1: {
        category: '',
        subcategory: '',
      },
      step2: {
        features: [],
        priceRange: [0, 1000],
      },
      step3: {
        delivery: 'pickup',
        location: '',
      },
    },
  });

  // Helper to update a specific step
  const updateStep = <K extends keyof WizardFilters>(
    step: K,
    data: Partial<WizardFilters[K]>
  ) => {
    updateFilters({
      [step]: { ...filters[step], ...data },
    } as Partial<WizardFilters>);
  };

  return {
    filters,
    updateFilters,
    updateStep,
    resetFilters,
    hasActiveFilters,
    isLoading,
  };
}

// =====================================================
// Example 8: Filter State with Derived Values
// =====================================================

interface ProductFilters {
  search: string;
  categoryIds: string[];
  priceMin: number;
  priceMax: number;
  onSale: boolean;
  inStock: boolean;
}

export function useProductFilters() {
  const {
    filters,
    updateFilters,
    resetFilters,
    clearFilter,
    hasActiveFilters,
    isLoading,
  } = useFilterState<ProductFilters>({
    key: 'products',
    defaultFilters: {
      search: '',
      categoryIds: [],
      priceMin: 0,
      priceMax: 10000,
      onSale: false,
      inStock: true,
    },
  });

  // Derived values
  const hasSearchQuery = filters.search.length > 0;
  const hasCategoryFilter = filters.categoryIds.length > 0;
  const hasPriceFilter = filters.priceMin > 0 || filters.priceMax < 10000;
  const activeFilterCount = [
    hasSearchQuery,
    hasCategoryFilter,
    hasPriceFilter,
    filters.onSale,
    filters.inStock,
  ].filter(Boolean).length;

  return {
    filters,
    updateFilters,
    resetFilters,
    clearFilter,
    hasActiveFilters,
    isLoading,
    // Derived values
    hasSearchQuery,
    hasCategoryFilter,
    hasPriceFilter,
    activeFilterCount,
  };
}
