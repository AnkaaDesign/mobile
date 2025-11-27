/**
 * Core List System Types
 * Clean, simple, comprehensive type definitions for the entire list system
 */

import type { ReactNode } from 'react'
import type { TextStyle } from 'react-native'

// ============================================================================
// Base Types
// ============================================================================

export type SortDirection = 'asc' | 'desc'

export interface SortConfig {
  field: string
  direction: SortDirection
}

export interface FilterValue {
  [key: string]: any
}

// ============================================================================
// Table Types
// ============================================================================

export type CellFormat =
  | 'date'
  | 'datetime'
  | 'datetime-multiline'
  | 'currency'
  | 'number'
  | 'percentage'
  | 'boolean'
  | 'status'
  | 'badge'
  | 'count-badge'

export interface TableColumn<T = any> {
  key: string
  label: string
  width: number // Ratio for responsive widths
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
  render: (item: T) => any // Can return primitive or ReactNode
  format?: CellFormat // Auto-format the rendered value
  component?: string // Special component to use (e.g., 'file-thumbnail')
  style?: TextStyle // Additional text styles
  badgeEntity?: string // Entity type for badge color resolution (e.g., 'ORDER', 'TASK', 'USER')
  /** Custom press handler for cell - when provided, prevents default row press */
  onCellPress?: (item: T) => void
}

export interface TableAction<T = any> {
  key: string
  /** Label can be a string or a function that receives the item and returns a string */
  label: string | ((item: T) => string)
  icon?: string
  variant?: 'default' | 'destructive' | 'secondary'
  route?: string | ((item: T) => string)
  confirm?: {
    title: string
    message: string | ((item: T) => string)
  }
  onPress?: (item: T, router?: any, context?: { mutations?: any; user?: any }) => void | Promise<void>
  /** Item-level visibility check - receives item and optionally user */
  visible?: (item: T, user?: any) => boolean
  /** Permission check - if provided, action will only be shown if this returns true */
  canPerform?: (user: any) => boolean
}

export interface TableProps<T extends { id: string }> {
  data: T[]
  columns: TableColumn<T>[]
  visibleColumns: string[]
  sort?: {
    config: SortConfig | null
    onSort: (field: string) => void
  }
  selection?: {
    enabled: boolean
    selectedIds: Set<string>
    onToggle: (id: string) => void
    onToggleAll: () => void
  }
  loading?: boolean
  loadingMore?: boolean
  onLoadMore?: () => void
  canLoadMore?: boolean
  onRefresh?: () => Promise<void>
  refreshing?: boolean
  actions?: TableAction<T>[]
  rowHeight?: number
  onRowPress?: (item: T) => void
  emptyState?: {
    icon?: string
    title?: string
    description?: string
  }
  totalCount?: number
  getRowStyle?: (item: T, isDark?: boolean) => { backgroundColor?: string; borderLeftColor?: string; borderLeftWidth?: number } | undefined
}

// ============================================================================
// Filter Types
// ============================================================================

export type FilterFieldType =
  | 'toggle'
  | 'select'
  | 'date-range'
  | 'number-range'
  | 'text'

export interface FilterField {
  key: string
  label?: string
  description?: string
  type: FilterFieldType
  placeholder?: string | { min?: string; max?: string; from?: string; to?: string } // For range/date inputs
  multiple?: boolean
  defaultValue?: any
  options?: Array<{ label: string; value: any; [key: string]: any }> // Static options
  async?: boolean // Load options asynchronously
  queryKey?: unknown[] // Query key for async mode
  queryFn?: (searchTerm: string, page?: number) => Promise<{ data: Array<{ label: string; value: any }>; hasMore?: boolean }> // Query function for async
  loadOptions?: () => Promise<Array<{ label: string; value: any }>>
  min?: number
  max?: number
  step?: number
  /** Permission check - if provided, filter will only be shown if this returns true */
  canView?: (user: any) => boolean
}

export interface FiltersProps {
  fields: FilterField[]
  values: FilterValue
  onChange: (values: FilterValue) => void
  onClear: () => void
  activeCount: number
  isOpen: boolean
  onClose: () => void
}

export interface FilterTagsProps {
  values: FilterValue
  searchText?: string
  fields: FilterField[]
  onRemove: (key: string, value?: any) => void
  onClearSearch?: () => void
  onClearAll: () => void
}

// ============================================================================
// Search Types
// ============================================================================

export interface SearchProps {
  value: string
  onChangeText: (text: string) => void
  onSearch: (text: string) => void
  placeholder?: string
  loading?: boolean
  debounce?: number
}

// ============================================================================
// Export Types
// ============================================================================

export type ExportFormat = 'csv' | 'json' | 'pdf'

export interface ExportColumn {
  key: string
  label: string
  path?: string // Dot notation for nested values
  format?: 'date' | 'datetime' | 'currency' | 'number' | 'boolean' | ((value: any) => string)
}

export interface ExportConfig {
  formats: ExportFormat[]
  filename: string
  title?: string
  columns: ExportColumn[]
}

export interface ExportProps {
  onExport: (format: ExportFormat, mode: 'all' | 'selected') => Promise<void>
  isExporting: boolean
  disabled?: boolean
  formats: ExportFormat[]
  hasSelection: boolean
  selectedCount: number
  totalCount: number
}

// ============================================================================
// Selection Types
// ============================================================================

export interface SelectionProps {
  enabled: boolean
  selectedIds: Set<string>
  onToggle: (id: string) => void
  onToggleAll: () => void
  onClear: () => void
  totalCount: number
}

// ============================================================================
// Bulk Actions Types
// ============================================================================

export interface BulkAction {
  key: string
  label: string
  icon?: string
  variant?: 'default' | 'destructive' | 'secondary'
  confirm?: {
    title: string
    message: string | ((count: number) => string)
  }
  onPress: (ids: Set<string>, mutations?: any) => void | Promise<void>
}

export interface BulkActionsProps {
  selectedIds: Set<string>
  actions: BulkAction[]
  onClear: () => void
}

// ============================================================================
// Layout Types
// ============================================================================

export interface LayoutProps {
  children: ReactNode
  header?: ReactNode
  title?: string
  loading?: boolean
  error?: Error | null
  onRetry?: () => void
}

// ============================================================================
// List Config Types (Complete configuration for a list page)
// ============================================================================

export interface ListConfig<T extends { id: string }> {
  // Identity
  key: string
  title: string

  // Query
  query: {
    hook: string // Name of the infinite query hook
    defaultSort: SortConfig
    pageSize?: number
    sortOptions?: Array<{ field: string; label: string }> // Available sort options
    include?: any // Prisma include object
    where?: any // Base Prisma where clause (will be merged with filters)
    /** Forced API params that will be merged with user filters (e.g., sectorIds, statuses) */
    forcedParams?: Record<string, any>
  }

  // Table
  table: {
    columns: TableColumn<T>[]
    defaultVisible: string[]
    rowHeight?: number
    actions?: TableAction<T>[]
    onRowPress?: (item: T, router: any) => void
    getRowStyle?: (item: T, isDark?: boolean) => { backgroundColor?: string; borderLeftColor?: string; borderLeftWidth?: number } | undefined
  }

  // Filters
  filters?: {
    fields: FilterField[]
    /** Default filter values that will be applied on initial load */
    defaultValues?: FilterValue
  }

  // Search
  search?: {
    placeholder: string
    debounce?: number
  }

  // Export
  export?: ExportConfig

  // Actions
  actions?: {
    create?: {
      label: string
      route: string
      icon?: string
      canCreate?: (user: any) => boolean
    }
    bulk?: BulkAction[]
    toolbar?: Array<{
      key: string
      label: string
      icon?: string
      variant?: 'default' | 'primary' | 'secondary'
      onPress: (router: any) => void
    }>
  }

  // Permissions
  permissions?: {
    view?: string | string[]
    create?: string | string[]
    edit?: string | string[]
    delete?: string | string[]
  }

  // Empty state
  emptyState?: {
    icon?: string
    title?: string
    description?: string
  }
}

// ============================================================================
// Hook Return Types
// ============================================================================

export interface UseListReturn<T extends { id: string }> {
  // Data
  items: T[]
  totalCount: number

  // Loading states
  isLoading: boolean
  isRefetching: boolean
  isFetchingNextPage: boolean
  error: Error | null

  // Table
  table: {
    data: T[]
    columns: TableColumn<T>[]
    visibleColumns: string[]
    onToggleColumn: (key: string) => void
    onResetColumns: () => void
    isColumnPanelOpen: boolean
    onOpenColumnPanel: () => void
    onCloseColumnPanel: () => void
    sort: SortConfig | null
    onSort: (field: string) => void
    rowHeight: number
    actions: TableAction<T>[]
    getRowStyle?: (item: T, isDark?: boolean) => { backgroundColor?: string; borderLeftColor?: string; borderLeftWidth?: number } | undefined
  }

  // Search
  search: {
    text: string
    displayText: string
    onChangeText: (text: string) => void
    onSearch: (text: string) => void
    onClear: () => void
    placeholder: string
    loading: boolean
  }

  // Filters
  filters: {
    fields: FilterField[]
    values: FilterValue
    onChange: (values: FilterValue) => void
    onClear: () => void
    activeCount: number
    isOpen: boolean
    onOpen: () => void
    onClose: () => void
    tags: FilterTagsProps
  }

  // Selection
  selection: {
    enabled: boolean
    selectedIds: Set<string>
    onToggle: (id: string) => void
    onToggleAll: () => void
    onClear: () => void
    onEnable: () => void
    onDisable: () => void
  }


  // Pagination
  pagination: {
    loadMore: () => void
    canLoadMore: boolean
    refresh: () => Promise<void>
    refreshing: boolean
  }

  // Actions
  actions: {
    create?: () => void
    bulk: BulkAction[]
  }

  // Utilities
  reset: () => void
}
