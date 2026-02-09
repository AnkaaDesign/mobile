import React, { memo, useMemo, useCallback, useState, useEffect } from 'react'
import {
  View,
  SectionList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native'
import { IconFilter, IconBuildingFactory2, IconEye, IconEyeOff } from '@tabler/icons-react-native'
import { useRouter, usePathname } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ThemedView } from '@/components/ui/themed-view'
import { ThemedText } from '@/components/ui/themed-text'
import { FAB } from '@/components/ui/fab'
import { ErrorScreen } from '@/components/ui/error-screen'
import { useTheme } from '@/lib/theme'
import { useAuth } from '@/contexts/auth-context'
import { usePageTracker } from '@/hooks/use-page-tracker'
import { perfLog } from '@/utils/performance-logger'
import { useNavigationLoading } from '@/contexts/navigation-loading-context'
import { useTasksInfiniteMobile, useSectorsInfiniteMobile } from '@/hooks'
import { TASK_STATUS, SECTOR_PRIVILEGES } from '@/constants'
import { isTeamLeader, hasPrivilege } from '@/utils/user'
import { Search } from '@/components/list/Search'
import { useDebouncedSearch } from '@/hooks/useDebouncedSearch'
import { Filters } from '@/components/list/Filters'
import { BulkActions } from '@/components/list/BulkActions'
import { ColumnVisibilityButton, ColumnVisibilityPanel } from '@/components/list/ColumnVisibility'
import { Header as TableHeader, Row as TableRow, Empty, Loading } from '@/components/list/Table'
import { SectorSelectModal } from '@/components/production/task/modals'
import { CopyFromTaskModal } from './copy-from-task-modal'
import { AddArtworksModal } from './add-artworks-modal'
import type { ListConfig, TableColumn, SortConfig, FilterValue, TableAction, RenderContext } from '@/components/list/types'
import type { Task, Sector } from '@/types'

interface TaskScheduleLayoutProps {
  config: ListConfig<Task>
}

interface SectionData {
  title: string
  sectorId: string
  data: Task[]
}

/**
 * Task Schedule Layout - Groups tasks by production sectors
 * Displays one table per sector with production privileges
 */
export const TaskScheduleLayout = memo(function TaskScheduleLayout({
  config,
}: TaskScheduleLayoutProps) {
  const { colors } = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()
  const { pushWithLoading, startNavigation, isNavigating } = useNavigationLoading()
  const { width: screenWidth } = Dimensions.get('window')
  const insets = useSafeAreaInsets()

  // Track page access for recents/most accessed
  usePageTracker({ title: config.title })

  // ============================================================================
  // State
  // ============================================================================

  // Search state - useDebouncedSearch handles the separation of display vs debounced values
  // displayText updates instantly (for TextInput), searchText updates after 300ms debounce
  // This prevents heavy re-renders during typing which caused the input to clear
  const { displayText: displaySearchText, searchText, setDisplayText: setDisplaySearchText, reset: resetSearch } = useDebouncedSearch('', 300)

  // Sort state
  const [sortConfig, setSortConfig] = useState<SortConfig>(config.query.defaultSort)

  // Filter state - use config's default values if provided
  const [filterValues, setFilterValues] = useState<FilterValue>(
    config.filters?.defaultValues || {
      status: [TASK_STATUS.WAITING_PRODUCTION, TASK_STATUS.IN_PRODUCTION],
    }
  )
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectionEnabled, setSelectionEnabled] = useState(false)

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState<string[]>(config.table.defaultVisible)
  const [columnPanelOpen, setColumnPanelOpen] = useState(false)

  // Refreshing state
  const [refreshing, setRefreshing] = useState(false)

  // Other sectors visibility state (for team leaders only)
  const [showOtherSectors, setShowOtherSectors] = useState(false)

  // Modal state for admin actions
  const [sectorModalTask, setSectorModalTask] = useState<Task | null>(null)
  const [copyFromTaskModalTask, setCopyFromTaskModalTask] = useState<Task | null>(null)
  const [addArtworksModalTask, setAddArtworksModalTask] = useState<Task | null>(null)

  // Check if user is a team leader (should see filtered view by default)
  // Note: Team leadership is now determined by managedSector relationship (user.managedSector?.id)
  const userIsTeamLeader = user ? isTeamLeader(user) : false
  const isLeaderOrProduction = userIsTeamLeader
  // For team leaders: show tasks from the sector they manage (managedSector.id)
  const userSectorId = userIsTeamLeader ? user?.managedSector?.id : user?.sector?.id

  // ============================================================================
  // Data Fetching
  // ============================================================================

  // Fetch sectors with production privilege only
  const {
    items: sectors,
    isLoading: sectorsLoading,
  } = useSectorsInfiniteMobile({
    where: {
      privileges: SECTOR_PRIVILEGES.PRODUCTION,
    },
    orderBy: { name: 'asc' },
    limit: 100, // Get all production sectors
  })

  // Check if config has groupByStatus flag (for agenda 3-table workflow)
  // Defined early because query params depend on this
  const shouldGroupByStatus = config.table.groupByStatus === true

  // Build base query params (without status filter for agenda view)
  const baseQueryParams = useMemo(() => {
    // For agenda view (groupByStatus), we DON'T include status in base params
    // because we'll make separate calls for each status group like the web does
    const { status: _status, ...filterValuesWithoutStatus } = filterValues as any;

    // For agenda view, use multi-column sorting like the web: forecastDate ASC, then name ASC, then identificador ASC
    // Use Prisma's nulls: "last" format to match web behavior (null forecastDates at the end)
    // identificador is mapped to serialNumber (the primary identifier field)
    // For other views, use the single sortConfig
    const orderBy = shouldGroupByStatus
      ? [
          { forecastDate: { sort: 'asc' as const, nulls: 'last' as const } },
          { name: 'asc' as const },
          { serialNumber: { sort: 'asc' as const, nulls: 'last' as const } },
        ]
      : { [sortConfig.field]: sortConfig.direction };

    return {
      orderBy,
      ...(searchText ? { searchingFor: searchText } : {}),
      ...filterValuesWithoutStatus,
      include: config.query.include,
      limit: shouldGroupByStatus ? 300 : 100, // Optimized: Reduced initial load
    };
  }, [shouldGroupByStatus, sortConfig, searchText, filterValues, config.query.include])

  // Optimized: Single API call for both agenda and standard views
  const queryParams = useMemo(() => {
    // For agenda view, use multi-column sorting like the web: forecastDate ASC, then name ASC, then serialNumber ASC
    // For other views, use the single sortConfig
    const orderBy = shouldGroupByStatus
      ? [
          { forecastDate: { sort: 'asc' as const, nulls: 'last' as const } },
          { name: 'asc' as const },
          { serialNumber: { sort: 'asc' as const, nulls: 'last' as const } },
        ]
      : { [sortConfig.field]: sortConfig.direction };

    const params: any = {
      orderBy,
      ...(searchText ? { searchingFor: searchText } : {}),
      include: config.query.include,
      limit: shouldGroupByStatus ? 300 : 100, // Optimized: Reduced initial load
    };

    // For agenda view, use preparation filters but remove status filter (like web)
    if (shouldGroupByStatus) {
      // Copy all filters except status to match web behavior
      // The preparation logic in the API will handle status filtering
      const { status, ...filterValuesWithoutStatus } = filterValues as any;
      Object.assign(params, filterValuesWithoutStatus);
    } else {
      // For standard view, use filters as-is
      Object.assign(params, filterValues);
    }

    return params;
  }, [shouldGroupByStatus, sortConfig, searchText, filterValues, config.query.include]);

  // Single API call for all tasks
  const {
    items: allTasksFromAPI,
    isLoading: tasksLoading,
    error: tasksError,
    refresh: refreshTasks,
  } = useTasksInfiniteMobile(queryParams);

  // Group tasks by status for agenda view (client-side grouping is fast)
  const { preparationTasks, inProductionTasks, completedTasks } = useMemo(() => {
    if (!shouldGroupByStatus) {
      return { preparationTasks: [], inProductionTasks: [], completedTasks: [] };
    }

    const preparation: Task[] = [];
    const inProduction: Task[] = [];
    const completed: Task[] = [];

    allTasksFromAPI.forEach((task) => {
      // Group tasks based on their status
      // Note: When using shouldDisplayInPreparation filter, the API returns tasks that need preparation
      // regardless of their actual status (except CANCELLED which is never shown)
      if (task.status === TASK_STATUS.PREPARATION || task.status === TASK_STATUS.WAITING_PRODUCTION) {
        preparation.push(task);
      } else if (task.status === TASK_STATUS.IN_PRODUCTION) {
        inProduction.push(task);
      } else if (task.status === TASK_STATUS.COMPLETED) {
        // Completed tasks only appear in preparation when they're missing required service orders
        completed.push(task);
      }
      // Other statuses (DELAYED, WAITING_CUSTOMER, etc.) go to preparation if returned by API
      else if (task.status && task.status !== TASK_STATUS.CANCELLED) {
        preparation.push(task);
      }
    });

    return { preparationTasks: preparation, inProductionTasks: inProduction, completedTasks: completed };
  }, [shouldGroupByStatus, allTasksFromAPI]);

  // Use the appropriate tasks based on view type
  const allTasks = useMemo(() => {
    if (shouldGroupByStatus) {
      return [...preparationTasks, ...inProductionTasks, ...completedTasks];
    }
    return allTasksFromAPI;
  }, [shouldGroupByStatus, preparationTasks, inProductionTasks, completedTasks, allTasksFromAPI]);

  // DEBUG: Log task counts for performance tracking
  useEffect(() => {
    if (__DEV__ && shouldGroupByStatus) {
      console.log('[TaskScheduleLayout] Optimized agenda view - Single API call:');
      console.log('  Preparation tasks:', preparationTasks.length);
      console.log('  In Production tasks:', inProductionTasks.length);
      console.log('  Completed tasks:', completedTasks.length);
      console.log('  Total:', allTasks.length);
      console.log('  [PERFORMANCE] Single API call instead of 3 separate calls');
    }
  }, [shouldGroupByStatus, preparationTasks.length, inProductionTasks.length, completedTasks.length, allTasks.length]);

  // ============================================================================
  // Computed Values
  // ============================================================================

  // Filter tasks by search text (client-side, uses debounced searchText to avoid
  // heavy re-renders on every keystroke which caused TextInput to clear)
  const filteredTasks = useMemo(() => {
    if (!searchText) return allTasks

    const searchLower = searchText.toLowerCase()
    return allTasks.filter((task) => {
      return (
        task.name?.toLowerCase().includes(searchLower) ||
        task.customer?.fantasyName?.toLowerCase().includes(searchLower) ||
        task.customer?.corporateName?.toLowerCase().includes(searchLower) ||
        task.serialNumber?.toLowerCase().includes(searchLower) ||
        task.truck?.plate?.toLowerCase().includes(searchLower) ||
        task.sector?.name?.toLowerCase().includes(searchLower)
      )
    })
  }, [allTasks, searchText])

  // Group tasks by sector
  const tasksBySector = useMemo(() => {
    const grouped = new Map<string, Task[]>()

    // Initialize with empty arrays for each production sector
    sectors.forEach((sector: Sector) => {
      grouped.set(sector.id, [])
    })

    // Add undefined sector group
    grouped.set('undefined', [])

    // Group tasks
    filteredTasks.forEach((task) => {
      const sectorId = task.sectorId || 'undefined'
      const tasks = grouped.get(sectorId) || []
      tasks.push(task)
      grouped.set(sectorId, tasks)
    })

    return grouped
  }, [filteredTasks, sectors])

  // Convert to SectionList format
  // Check if config has groupBySector flag (default true for backward compatibility)
  const shouldGroupBySector = config.table.groupBySector !== false

  // Filter tasks from each status group by search text (for agenda view)
  // Uses debounced searchText to prevent input clearing during slow typing
  const filteredPreparationTasks = useMemo(() => {
    if (!shouldGroupByStatus || !searchText) return preparationTasks
    const searchLower = searchText.toLowerCase()
    return preparationTasks.filter((task) => {
      return (
        task.name?.toLowerCase().includes(searchLower) ||
        task.customer?.fantasyName?.toLowerCase().includes(searchLower) ||
        task.customer?.corporateName?.toLowerCase().includes(searchLower) ||
        task.serialNumber?.toLowerCase().includes(searchLower) ||
        task.truck?.plate?.toLowerCase().includes(searchLower) ||
        task.sector?.name?.toLowerCase().includes(searchLower)
      )
    })
  }, [shouldGroupByStatus, preparationTasks, searchText])

  const filteredInProductionTasks = useMemo(() => {
    if (!shouldGroupByStatus || !searchText) return inProductionTasks
    const searchLower = searchText.toLowerCase()
    return inProductionTasks.filter((task) => {
      return (
        task.name?.toLowerCase().includes(searchLower) ||
        task.customer?.fantasyName?.toLowerCase().includes(searchLower) ||
        task.customer?.corporateName?.toLowerCase().includes(searchLower) ||
        task.serialNumber?.toLowerCase().includes(searchLower) ||
        task.truck?.plate?.toLowerCase().includes(searchLower) ||
        task.sector?.name?.toLowerCase().includes(searchLower)
      )
    })
  }, [shouldGroupByStatus, inProductionTasks, searchText])

  const filteredCompletedTasks = useMemo(() => {
    if (!shouldGroupByStatus || !searchText) return completedTasks
    const searchLower = searchText.toLowerCase()
    return completedTasks.filter((task) => {
      return (
        task.name?.toLowerCase().includes(searchLower) ||
        task.customer?.fantasyName?.toLowerCase().includes(searchLower) ||
        task.customer?.corporateName?.toLowerCase().includes(searchLower) ||
        task.serialNumber?.toLowerCase().includes(searchLower) ||
        task.truck?.plate?.toLowerCase().includes(searchLower) ||
        task.sector?.name?.toLowerCase().includes(searchLower)
      )
    })
  }, [shouldGroupByStatus, completedTasks, searchText])

  // Group tasks by status for agenda view (3-table workflow like web)
  // Now uses pre-fetched data from separate API calls instead of grouping client-side
  const tasksByStatus = useMemo(() => {
    if (!shouldGroupByStatus) return null

    return {
      preparation: filteredPreparationTasks,
      inProduction: filteredInProductionTasks,
      completed: filteredCompletedTasks,
    }
  }, [shouldGroupByStatus, filteredPreparationTasks, filteredInProductionTasks, filteredCompletedTasks])

  // Check if user is financial for section ordering
  // Use exact match so admins get regular table order (not financial order)
  const isFinancialUser = user?.sector?.privileges === SECTOR_PRIVILEGES.FINANCIAL

  const sections: SectionData[] = useMemo(() => {
    // If grouping by status (agenda 3-table workflow), create 3 sections
    if (shouldGroupByStatus && tasksByStatus) {
      const result: SectionData[] = []

      // For FINANCIAL users: Show Completed first, then In Production, then Preparation
      if (isFinancialUser) {
        // Section 1: Concluído (COMPLETED) - First for financial
        if (tasksByStatus.completed.length > 0) {
          result.push({
            title: 'Concluído',
            sectorId: 'completed',
            data: tasksByStatus.completed,
          })
        }

        // Section 2: Em Produção (IN_PRODUCTION)
        if (tasksByStatus.inProduction.length > 0) {
          result.push({
            title: 'Em Produção',
            sectorId: 'in-production',
            data: tasksByStatus.inProduction,
          })
        }

        // Section 3: Em Preparação (PREPARATION + WAITING_PRODUCTION)
        if (tasksByStatus.preparation.length > 0) {
          result.push({
            title: 'Em Preparação',
            sectorId: 'preparation',
            data: tasksByStatus.preparation,
          })
        }
      } else {
        // Default order for other users: Preparation, In Production, Completed
        // Section 1: Em Preparação (PREPARATION + WAITING_PRODUCTION)
        if (tasksByStatus.preparation.length > 0) {
          result.push({
            title: 'Em Preparação',
            sectorId: 'preparation',
            data: tasksByStatus.preparation,
          })
        }

        // Section 2: Em Produção (IN_PRODUCTION)
        if (tasksByStatus.inProduction.length > 0) {
          result.push({
            title: 'Em Produção',
            sectorId: 'in-production',
            data: tasksByStatus.inProduction,
          })
        }

        // Section 3: Concluído (COMPLETED)
        if (tasksByStatus.completed.length > 0) {
          result.push({
            title: 'Concluído',
            sectorId: 'completed',
            data: tasksByStatus.completed,
          })
        }
      }

      return result
    }

    // If not grouping by sector, return all tasks in a single section
    if (!shouldGroupBySector) {
      return [{
        title: '',
        sectorId: 'all',
        data: filteredTasks,
      }]
    }

    // Original sector grouping logic
    const result: SectionData[] = []
    const otherSections: SectionData[] = []

    // Find user's own sector
    const userSector = sectors.find((s: Sector) => s.id === userSectorId)

    // 1. User's own sector first (always shown for team leaders)
    if (userSector) {
      const userSectorTasks = tasksBySector.get(userSector.id)
      if (userSectorTasks && userSectorTasks.length > 0) {
        result.push({
          title: userSector.name,
          sectorId: userSector.id,
          data: userSectorTasks,
        })
      }
    }

    // 2. Other production sectors
    sectors.forEach((sector: Sector) => {
      // Skip user's own sector (already added)
      if (sector.id === userSectorId) return

      const sectorTasks = tasksBySector.get(sector.id)
      if (sectorTasks && sectorTasks.length > 0) {
        otherSections.push({
          title: sector.name,
          sectorId: sector.id,
          data: sectorTasks,
        })
      }
    })

    // For team leaders: only add other sectors if showOtherSectors is true
    // For other roles (ADMIN, etc.): always show all sectors
    if (!isLeaderOrProduction || showOtherSectors) {
      result.push(...otherSections)
    }

    // 3. Undefined sector last (always shown for team leaders)
    const undefinedTasks = tasksBySector.get('undefined')
    if (undefinedTasks && undefinedTasks.length > 0) {
      result.push({
        title: 'Setor Indefinido',
        sectorId: 'undefined',
        data: undefinedTasks,
      })
    }

    return result
  }, [shouldGroupByStatus, tasksByStatus, shouldGroupBySector, filteredTasks, tasksBySector, sectors, userSectorId, isLeaderOrProduction, showOtherSectors, isFinancialUser])

  // Calculate display columns
  const displayColumns = useMemo(() => {
    const visible = config.table.columns.filter((col) => visibleColumns.includes(col.key))
    const totalRatio = visible.reduce((sum, col) => sum + col.width, 0)
    const availableWidth = screenWidth - 32

    return visible.map((col) => ({
      ...col,
      width: Math.floor((availableWidth * col.width) / totalRatio),
    })) as Array<TableColumn<Task> & { width: number }>
  }, [config.table.columns, visibleColumns, screenWidth])

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filterValues.sectorIds?.length > 0) count++
    if (filterValues.termRange?.from || filterValues.termRange?.to) count++
    if (filterValues.isOverdue) count++
    return count
  }, [filterValues])

  // Get selected tasks
  const selectedTasks = useMemo(() => {
    return filteredTasks.filter(task => selectedIds.has(task.id))
  }, [filteredTasks, selectedIds])

  // ============================================================================
  // Handlers
  // ============================================================================

  // Search text change handler - only updates displayText (instant)
  // The useDebouncedSearch hook automatically debounces searchText updates
  const handleSearchTextChange = useCallback((text: string) => {
    setDisplaySearchText(text)
  }, [setDisplaySearchText])

  const handleSort = useCallback((field: string) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }, [])

  const handleToggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      // Auto-enable selection when first item is selected
      if (next.size > 0 && !selectionEnabled) {
        setSelectionEnabled(true)
      }
      return next
    })
  }, [selectionEnabled])

  const handleToggleAllInSection = useCallback((sectionData: Task[]) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      const sectionIds = sectionData.map(task => task.id)
      const allSelected = sectionIds.every(id => next.has(id))

      if (allSelected) {
        sectionIds.forEach(id => next.delete(id))
      } else {
        sectionIds.forEach(id => next.add(id))
      }

      if (next.size > 0 && !selectionEnabled) {
        setSelectionEnabled(true)
      }

      return next
    })
  }, [selectionEnabled])

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set())
    setSelectionEnabled(false)
  }, [])

  const handleToggleColumn = useCallback((key: string) => {
    setVisibleColumns(prev => {
      if (prev.includes(key)) {
        return prev.filter(k => k !== key)
      }
      return [...prev, key]
    })
  }, [])

  const handleResetColumns = useCallback(() => {
    setVisibleColumns(config.table.defaultVisible)
  }, [config.table.defaultVisible])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await refreshTasks()
    } finally {
      setRefreshing(false)
    }
  }, [refreshTasks])

  const handleRowPress = useCallback((item: Task) => {
    // Prevent double-clicks while navigating
    if (isNavigating) return

    // Performance logging - track navigation start
    perfLog.navigationClick('TaskScheduleLayout', 'ScheduleDetailsScreen', item.id)
    perfLog.mark(`Row pressed: ${item.name || item.id}`)

    if (config.table.onRowPress) {
      startNavigation()
      config.table.onRowPress(item, router)
      // Navigation loading will auto-hide when pathname changes
      return
    }

    if (!config.table.actions || config.table.actions.length === 0) return

    let action = config.table.actions.find(a => a.key === 'view')
    if (!action) {
      action = config.table.actions.find(a => a.variant !== 'destructive')
    }
    if (!action) {
      action = config.table.actions[0]
    }

    if (action.visible && !action.visible(item)) return

    perfLog.mark(`Navigating via action: ${action.key}`)

    if (action.onPress) {
      startNavigation()
      action.onPress(item, router, {})
      // Navigation loading will auto-hide when pathname changes
    } else if (action.route) {
      const route = typeof action.route === 'function' ? action.route(item) : action.route
      pushWithLoading(route)
    }
  }, [config.table.actions, config.table.onRowPress, router, isNavigating, startNavigation, pushWithLoading])

  const handleCreate = useCallback(() => {
    if (config.actions?.create?.route) {
      pushWithLoading(config.actions.create.route)
    }
  }, [config.actions?.create?.route, pushWithLoading])

  const handleFilterChange = useCallback((values: FilterValue) => {
    setFilterValues(values)
  }, [])

  const handleFilterClear = useCallback(() => {
    // When using status-based grouping (preparation 3-table view), don't apply restrictive status filter
    // The shouldDisplayInPreparation filter handles the logic on the backend
    if (config.table.groupByStatus) {
      setFilterValues(config.filters?.defaultValues || {})
    } else {
      setFilterValues({
        status: [TASK_STATUS.WAITING_PRODUCTION, TASK_STATUS.IN_PRODUCTION],
      })
    }
  }, [config.table.groupByStatus, config.filters?.defaultValues])

  // ============================================================================
  // Permission Check
  // ============================================================================

  const canCreate = config.actions?.create?.canCreate
    ? config.actions.create.canCreate(user)
    : true

  // Filter table actions based on user permissions and add modal handlers
  const filteredTableActions = useMemo(() => {
    const actions = (config.table.actions || []).filter(
      (action) => !action.canPerform || action.canPerform(user)
    )

    // Wrap modal actions with custom handlers
    return actions.map((action): TableAction<Task> => {
      if (action.key === 'change-sector') {
        return {
          ...action,
          onPress: (task: Task) => {
            setSectorModalTask(task)
          },
        }
      }
      if (action.key === 'copyFromTask') {
        return {
          ...action,
          onPress: (task: Task) => {
            setCopyFromTaskModalTask(task)
          },
        }
      }
      if (action.key === 'addArtworks') {
        return {
          ...action,
          onPress: (task: Task) => {
            setAddArtworksModalTask(task)
          },
        }
      }
      return action
    })
  }, [config.table.actions, user])

  // ============================================================================
  // Loading State
  // ============================================================================

  if ((tasksLoading || sectorsLoading) && allTasks.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Carregando cronograma...
          </ThemedText>
        </View>
      </ThemedView>
    )
  }

  // ============================================================================
  // Error State
  // ============================================================================

  if (tasksError && allTasks.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen
          message="Erro ao carregar cronograma"
          detail={(tasksError as Error)?.message || 'Erro desconhecido'}
          onRetry={handleRefresh}
        />
      </ThemedView>
    )
  }

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <ThemedView style={styles.container}>
      {/* Header with Search and Actions */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Search
            value={displaySearchText}
            onChangeText={handleSearchTextChange}
            placeholder={config.search?.placeholder || 'Buscar...'}
            loading={tasksLoading}
          />
        </View>

        <View style={styles.actions}>
          {/* Toggle Other Sectors Button - only for team leaders */}
          {isLeaderOrProduction && (
            <TouchableOpacity
              onPress={() => setShowOtherSectors(!showOtherSectors)}
              style={[
                styles.actionButton,
                {
                  backgroundColor: showOtherSectors ? colors.primary : colors.card,
                  borderColor: showOtherSectors ? colors.primary : colors.border,
                },
              ]}
              activeOpacity={0.7}
            >
              {showOtherSectors ? (
                <IconEyeOff size={20} color={showOtherSectors ? '#fff' : colors.foreground} />
              ) : (
                <IconBuildingFactory2 size={20} color={colors.foreground} />
              )}
            </TouchableOpacity>
          )}

          <ColumnVisibilityButton
            columns={config.table.columns}
            visibleColumns={visibleColumns}
            onOpen={() => setColumnPanelOpen(true)}
          />

          {config.filters && (
            <TouchableOpacity
              onPress={() => setFiltersOpen(true)}
              style={[
                styles.actionButton,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
              activeOpacity={0.7}
            >
              <IconFilter size={20} color={colors.foreground} />
              {activeFiltersCount > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.destructive }]}>
                  <ThemedText style={styles.badgeText}>
                    {activeFiltersCount}
                  </ThemedText>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Bulk Actions Bar */}
      {selectionEnabled && selectedIds.size > 0 && config.actions?.bulk && (
        <BulkActions
          selectedIds={selectedIds}
          actions={config.actions.bulk}
          onClear={handleClearSelection}
        />
      )}

      {/* Sectioned Task List */}
      <View style={[styles.tableContainer, { paddingBottom: insets.bottom + 8 }]}>
        {sections.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Empty
              icon={config.emptyState?.icon}
              title={config.emptyState?.title || 'Nenhuma tarefa encontrada'}
              description={config.emptyState?.description}
            />
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            stickySectionHeadersEnabled={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            // Critical performance optimizations for large lists
            removeClippedSubviews={true} // Unmount offscreen rows
            maxToRenderPerBatch={10} // Render 10 items per batch
            windowSize={10} // Keep 10 screens of data in memory
            initialNumToRender={15} // Initial batch size
            updateCellsBatchingPeriod={50} // Batch updates every 50ms
            legacyImplementation={false} // Use modern implementation
            // Optimize scroll performance
            scrollEventThrottle={16} // 60fps scrolling
            directionalLockEnabled={true} // Prevent diagonal scrolling
            disableVirtualization={false} // Keep virtualization enabled
            // Memory optimization
            maintainVisibleContentPosition={{
              minIndexForVisible: 0,
              autoscrollToTopThreshold: 10
            }}
            renderSectionHeader={({ section }) => {
              // Determine section color based on status grouping
              const getSectionColor = () => {
                if (!shouldGroupByStatus) {
                  return section.sectorId === 'undefined' ? colors.mutedForeground : colors.foreground
                }
                // Status-based colors for agenda 3-table view
                switch (section.sectorId) {
                  case 'preparation':
                    return '#f59e0b' // Amber for preparation/waiting
                  case 'in-production':
                    return colors.primary // Primary color for active production
                  case 'completed':
                    return '#22c55e' // Green for completed
                  default:
                    return colors.foreground
                }
              }

              return (
              <View style={styles.sectionContainer}>
                {/* Section Header - only show if title exists */}
                {section.title && (
                  <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      {shouldGroupByStatus && (
                        <View style={{
                          width: 4,
                          height: 20,
                          borderRadius: 2,
                          backgroundColor: getSectionColor(),
                        }} />
                      )}
                      <ThemedText style={[styles.sectionTitle, { color: getSectionColor() }]}>
                        {section.title}
                      </ThemedText>
                    </View>
                    <ThemedText style={[styles.sectionCount, { color: colors.mutedForeground }]}>
                      {section.data.length} {section.data.length === 1 ? 'tarefa' : 'tarefas'}
                    </ThemedText>
                  </View>
                )}

                {/* Table Card with Header */}
                <View style={[styles.tableCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.tableHeader, { borderBottomColor: colors.border }]}>
                    <TableHeader
                      columns={displayColumns as any}
                      sort={{
                        config: sortConfig,
                        onSort: handleSort,
                      }}
                      selection={{
                        enabled: selectionEnabled,
                        selectedIds,
                        onToggle: handleToggleSelection,
                        onToggleAll: () => handleToggleAllInSection(section.data),
                      }}
                      totalItems={section.data.length}
                    />
                  </View>
                </View>
              </View>
              )
            }}
            renderItem={({ item, index, section }) => {
              // Create render context for cell rendering
              const renderContext: RenderContext = {
                navigationRoute: shouldGroupByStatus ? 'preparation' : 'schedule',
                route: pathname, // Pass the actual current route
                user: user ?? undefined,
                rowIndex: index,
              }
              return (
                <View style={[styles.rowContainer, { borderColor: colors.border }]}>
                  <TableRow
                    item={item as Task}
                    index={index}
                    columns={displayColumns as any}
                    selection={{
                      enabled: selectionEnabled,
                      selectedIds,
                      onToggle: handleToggleSelection,
                    }}
                    actions={filteredTableActions as any}
                    onPress={handleRowPress as any}
                    getRowStyle={config.table.getRowStyle as any}
                    renderContext={renderContext}
                  />
                </View>
              )
            }}
            renderSectionFooter={() => (
              <View style={[styles.sectionFooter, { backgroundColor: colors.card, borderColor: colors.border }]} />
            )}
            ItemSeparatorComponent={() => (
              <View style={[styles.separator, { backgroundColor: colors.border }]} />
            )}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

      {/* FAB for Create */}
      {config.actions?.create && canCreate && (
        <FAB
          icon="plus"
          onPress={handleCreate}
        />
      )}

      {/* Column Visibility Panel */}
      <ColumnVisibilityPanel
        columns={config.table.columns}
        visibleColumns={visibleColumns}
        onToggleColumn={handleToggleColumn}
        onResetColumns={handleResetColumns}
        isOpen={columnPanelOpen}
        onClose={() => setColumnPanelOpen(false)}
        defaultVisible={config.table.defaultVisible}
      />

      {/* Filter Drawer */}
      {config.filters && (
        <Filters
          fields={config.filters.fields}
          values={filterValues}
          onChange={handleFilterChange}
          onClear={handleFilterClear}
          activeCount={activeFiltersCount}
          isOpen={filtersOpen}
          onClose={() => setFiltersOpen(false)}
        />
      )}

      {/* Sector Select Modal */}
      <SectorSelectModal
        visible={!!sectorModalTask}
        onClose={() => setSectorModalTask(null)}
        task={sectorModalTask}
        onSuccess={(_task: Task) => {
          setSectorModalTask(null)
          handleRefresh()
        }}
      />

      {/* Copy From Task Modal */}
      {copyFromTaskModalTask && (
        <CopyFromTaskModal
          open={!!copyFromTaskModalTask}
          onOpenChange={(open) => !open && setCopyFromTaskModalTask(null)}
          targetTask={copyFromTaskModalTask}
          userPrivilege={user?.sector?.privileges}
          onSuccess={() => {
            setCopyFromTaskModalTask(null)
            handleRefresh()
          }}
        />
      )}

      {/* Add Artworks Modal */}
      {addArtworksModalTask && (
        <AddArtworksModal
          open={!!addArtworksModalTask}
          onOpenChange={(open) => !open && setAddArtworksModalTask(null)}
          targetTask={addArtworksModalTask}
          onSuccess={() => {
            setAddArtworksModalTask(null)
            handleRefresh()
          }}
        />
      )}
    </ThemedView>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 8,
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  tableContainer: {
    flex: 1,
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
  },
  listContent: {
    paddingBottom: 80,
  },
  sectionContainer: {
    marginBottom: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionCount: {
    fontSize: 12,
  },
  tableCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: 'hidden',
  },
  tableHeader: {
    borderBottomWidth: 1,
  },
  rowContainer: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  separator: {
    height: 1,
  },
  sectionFooter: {
    height: 1,
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    marginBottom: 16,
  },
})

export default TaskScheduleLayout
