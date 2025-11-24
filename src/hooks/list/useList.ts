import { useMemo, useCallback, useState } from 'react'
import { useSearch } from './useSearch'
import { useSort } from './useSort'
import { useSelection } from './useSelection'
import { useFilters } from './useFilters'
import { useTable } from './useTable'
import type { ListConfig, UseListReturn } from '@/components/list/types'
import { useAuth } from '@/contexts/auth-context'
import * as hooks from '@/hooks'

/**
 * Main hook that orchestrates the entire list system
 * Combines search, filters, sort, selection, table, and export
 */
export function useList<T extends { id: string }>(
  config: ListConfig<T>
): UseListReturn<T> {
  // Get the infinite query hook dynamically
  const useInfiniteQuery = getInfiniteQueryHook(config.query.hook)

  // Get current user for permission checks
  const { user } = useAuth()

  // Core state hooks
  const search = useSearch({
    debounce: config.search?.debounce,
  })

  const sort = useSort({
    defaultSort: config.query.defaultSort,
    mapping: buildSortMapping(config.table.columns),
  })

  const filters = useFilters({
    fields: config.filters?.fields || [],
  })

  const selection = useSelection()

  // Build query params for API
  const queryParams = useMemo(
    () => ({
      orderBy: sort.orderBy,
      ...(search.text ? { searchingFor: search.text } : {}),
      ...filters.apiParams,
      include: config.query.include,
      where: config.query.where, // Base where clause
      limit: config.query.pageSize || 25,
    }),
    [sort.orderBy, search.text, filters.apiParams, config.query.include, config.query.where, config.query.pageSize]
  )

  // Data fetching
  const query = useInfiniteQuery(queryParams)

  // Table management
  const table = useTable({
    columns: config.table.columns,
    defaultVisible: config.table.defaultVisible,
    storageKey: config.key,
  })


  // Refresh handler
  const [refreshing, setRefreshing] = useState(false)
  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await query.refresh()
    } finally {
      setRefreshing(false)
    }
  }, [query])

  // Reset all filters/search/sort
  const reset = useCallback(() => {
    search.onClear()
    filters.onClear()
    sort.reset()
    selection.onClear()
  }, [search, filters, sort, selection])

  // Build filter tags props
  const filterTags = useMemo(
    () => ({
      values: filters.values,
      searchText: search.text,
      fields: filters.fields,
      onRemove: filters.onRemove,
      onClearSearch: search.onClear,
      onClearAll: reset,
    }),
    [filters.values, filters.fields, filters.onRemove, search.text, search.onClear, reset]
  )

  // Return organized API
  return {
    // Data
    items: query.items || [],
    totalCount: query.totalCount || 0,

    // Loading states
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    isFetchingNextPage: query.isFetchingNextPage,
    error: query.error,

    // Table
    table: {
      data: query.items || [],
      columns: config.table.columns,
      visibleColumns: table.visibleColumns,
      onToggleColumn: table.onToggleColumn,
      onResetColumns: table.onResetColumns,
      isColumnPanelOpen: table.isColumnPanelOpen,
      onOpenColumnPanel: table.onOpenColumnPanel,
      onCloseColumnPanel: table.onCloseColumnPanel,
      sort: sort.config,
      onSort: sort.onSort,
      rowHeight: config.table.rowHeight || 72,
      // Filter actions based on user permissions (canPerform check)
      actions: (config.table.actions || []).filter(
        (action) => !action.canPerform || action.canPerform(user)
      ),
      getRowStyle: config.table.getRowStyle,
    },

    // Search
    search: {
      text: search.text,
      displayText: search.displayText,
      onChangeText: search.onChangeText,
      onSearch: search.onSearch,
      onClear: search.onClear,
      placeholder: config.search?.placeholder || 'Buscar...',
      loading: query.isRefetching && !query.isFetchingNextPage,
    },

    // Filters
    filters: {
      fields: filters.fields,
      values: filters.values,
      onChange: filters.onChange,
      onClear: filters.onClear,
      activeCount: filters.activeCount,
      isOpen: filters.isOpen,
      onOpen: filters.onOpen,
      onClose: filters.onClose,
      tags: filterTags,
    },

    // Selection
    selection: {
      enabled: selection.enabled,
      selectedIds: selection.selectedIds,
      onToggle: selection.onToggle,
      onToggleAll: () => {
        const allIds = (query.items || []).map((item) => item.id)
        selection.onToggleAll(allIds)
      },
      onClear: selection.onClear,
      onEnable: selection.onEnable,
      onDisable: selection.onDisable,
    },


    // Pagination
    pagination: {
      loadMore: query.loadMore,
      canLoadMore: query.canLoadMore,
      refresh: handleRefresh,
      refreshing: refreshing || query.isRefetching,
    },

    // Actions
    actions: {
      create: config.actions?.create ? () => {} : undefined,
      bulk: config.actions?.bulk || [],
    },

    // Utilities
    reset,
  }
}

// Helper: Get infinite query hook by name
function getInfiniteQueryHook(hookName: string): any {
  // Get the hook from the hooks module
  const hook = (hooks as any)[hookName]

  if (!hook) {
    console.warn(`Hook "${hookName}" not found in hooks module. Using placeholder.`)
    // Return a placeholder that matches the expected API
    return (params: any) => ({
      items: [],
      isLoading: false,
      error: null,
      isRefetching: false,
      loadMore: () => {},
      canLoadMore: false,
      isFetchingNextPage: false,
      totalCount: 0,
      refresh: async () => {},
    })
  }

  return hook
}

// Helper: Build sort mapping from columns
function buildSortMapping(columns: any[]): Record<string, string> {
  const mapping: Record<string, string> = {}

  columns.forEach((col) => {
    if (col.sortable) {
      mapping[col.key] = col.key
    }
  })

  return mapping
}
