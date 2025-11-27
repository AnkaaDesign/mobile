import React, { memo, useMemo, useCallback, useState } from 'react'
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
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ThemedView } from '@/components/ui/themed-view'
import { ThemedText } from '@/components/ui/themed-text'
import { FAB } from '@/components/ui/fab'
import { ErrorScreen } from '@/components/ui/error-screen'
import { useTheme } from '@/lib/theme'
import { useAuth } from '@/contexts/auth-context'
import { useTasksInfiniteMobile, useSectorsInfiniteMobile } from '@/hooks'
import { SECTOR_PRIVILEGES, TASK_STATUS } from '@/constants'
import { Search } from '@/components/list/Search'
import { Filters } from '@/components/list/Filters'
import { BulkActions } from '@/components/list/BulkActions'
import { ColumnVisibilityButton, ColumnVisibilityPanel } from '@/components/list/ColumnVisibility'
import { Header as TableHeader, Row as TableRow, Empty, Loading } from '@/components/list/Table'
import { SectorSelectModal, TaskDuplicateModal } from '@/components/production/task/modals'
import type { ListConfig, TableColumn, SortConfig, FilterValue, TableAction } from '@/components/list/types'
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
  const { user } = useAuth()
  const { width: screenWidth } = Dimensions.get('window')
  const insets = useSafeAreaInsets()

  // ============================================================================
  // State
  // ============================================================================

  // Search state
  const [searchText, setSearchText] = useState('')
  const [displaySearchText, setDisplaySearchText] = useState('')

  // Sort state
  const [sortConfig, setSortConfig] = useState<SortConfig>(config.query.defaultSort)

  // Filter state
  const [filterValues, setFilterValues] = useState<FilterValue>({
    status: [TASK_STATUS.PENDING, TASK_STATUS.IN_PRODUCTION],
  })
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectionEnabled, setSelectionEnabled] = useState(false)

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState<string[]>(config.table.defaultVisible)
  const [columnPanelOpen, setColumnPanelOpen] = useState(false)

  // Refreshing state
  const [refreshing, setRefreshing] = useState(false)

  // Other sectors visibility state (for LEADER and PRODUCTION users)
  const [showOtherSectors, setShowOtherSectors] = useState(false)

  // Modal state for admin actions
  const [sectorModalTask, setSectorModalTask] = useState<Task | null>(null)
  const [duplicateModalTask, setDuplicateModalTask] = useState<Task | null>(null)

  // Check if user is LEADER or PRODUCTION (should see filtered view by default)
  const isLeader = user?.sector?.privileges === SECTOR_PRIVILEGES.LEADER
  const isProduction = user?.sector?.privileges === SECTOR_PRIVILEGES.PRODUCTION
  const isLeaderOrProduction = isLeader || isProduction
  // For LEADER: show tasks from the sector they manage (managedSectorId)
  // For PRODUCTION: show tasks from their own sector (sector.id)
  const userSectorId = isLeader ? user?.managedSectorId : user?.sector?.id

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

  // Build query params for tasks
  const taskQueryParams = useMemo(() => ({
    orderBy: { [sortConfig.field]: sortConfig.direction },
    ...(searchText ? { searchingFor: searchText } : {}),
    ...filterValues,
    include: config.query.include,
    limit: 1000, // Get all tasks for grouping
  }), [sortConfig, searchText, filterValues, config.query.include])

  // Fetch tasks
  const {
    items: allTasks,
    isLoading: tasksLoading,
    error: tasksError,
    refresh: refreshTasks,
    totalCount,
  } = useTasksInfiniteMobile(taskQueryParams)

  // ============================================================================
  // Computed Values
  // ============================================================================

  // Filter tasks by search text (client-side for immediate feedback)
  const filteredTasks = useMemo(() => {
    if (!displaySearchText) return allTasks

    const searchLower = displaySearchText.toLowerCase()
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
  }, [allTasks, displaySearchText])

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
  // For LEADER/PRODUCTION: show own sector first, then undefined, then others (if enabled)
  const sections: SectionData[] = useMemo(() => {
    const result: SectionData[] = []
    const otherSections: SectionData[] = []

    // Find user's own sector
    const userSector = sectors.find((s: Sector) => s.id === userSectorId)

    // 1. User's own sector first (always shown for LEADER/PRODUCTION)
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

    // 2. Undefined sector (always shown for LEADER/PRODUCTION)
    const undefinedTasks = tasksBySector.get('undefined')
    if (undefinedTasks && undefinedTasks.length > 0) {
      result.push({
        title: 'Setor Indefinido',
        sectorId: 'undefined',
        data: undefinedTasks,
      })
    }

    // 3. Other production sectors
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

    // For LEADER/PRODUCTION: only add other sectors if showOtherSectors is true
    // For other roles (ADMIN, etc.): always show all sectors
    if (!isLeaderOrProduction || showOtherSectors) {
      result.push(...otherSections)
    }

    return result
  }, [tasksBySector, sectors, userSectorId, isLeaderOrProduction, showOtherSectors])

  // Calculate display columns
  const displayColumns = useMemo(() => {
    const visible = config.table.columns.filter((col) => visibleColumns.includes(col.key))
    const totalRatio = visible.reduce((sum, col) => sum + col.width, 0)
    const availableWidth = screenWidth - 32

    return visible.map((col) => ({
      ...col,
      width: Math.floor((availableWidth * col.width) / totalRatio),
    }))
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

  const handleSearch = useCallback((text: string) => {
    setSearchText(text)
  }, [])

  const handleSearchTextChange = useCallback((text: string) => {
    setDisplaySearchText(text)
  }, [])

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
    if (config.table.onRowPress) {
      config.table.onRowPress(item, router)
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

    if (action.onPress) {
      action.onPress(item, router, {})
    } else if (action.route) {
      const route = typeof action.route === 'function' ? action.route(item) : action.route
      router.push(route as any)
    }
  }, [config.table.actions, config.table.onRowPress, router])

  const handleCreate = useCallback(() => {
    if (config.actions?.create?.route) {
      router.push(config.actions.create.route as any)
    }
  }, [config.actions?.create?.route, router])

  const handleFilterChange = useCallback((values: FilterValue) => {
    setFilterValues(values)
  }, [])

  const handleFilterClear = useCallback(() => {
    setFilterValues({
      status: [TASK_STATUS.PENDING, TASK_STATUS.IN_PRODUCTION],
    })
  }, [])

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
      if (action.key === 'duplicate') {
        return {
          ...action,
          onPress: (task: Task) => {
            setDuplicateModalTask(task)
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
          detail={tasksError.message}
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
            onSearch={handleSearch}
            placeholder={config.search?.placeholder || 'Buscar...'}
            loading={tasksLoading}
          />
        </View>

        <View style={styles.actions}>
          {/* Toggle Other Sectors Button - only for LEADER and PRODUCTION users */}
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
            renderSectionHeader={({ section }) => (
              <View style={styles.sectionContainer}>
                {/* Section Header */}
                <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
                  <ThemedText style={[styles.sectionTitle, { color: section.sectorId === 'undefined' ? colors.mutedForeground : colors.foreground }]}>
                    {section.title}
                  </ThemedText>
                  <ThemedText style={[styles.sectionCount, { color: colors.mutedForeground }]}>
                    {section.data.length} {section.data.length === 1 ? 'tarefa' : 'tarefas'}
                  </ThemedText>
                </View>

                {/* Table Card with Header */}
                <View style={[styles.tableCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.tableHeader, { borderBottomColor: colors.border }]}>
                    <TableHeader
                      columns={displayColumns}
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
            )}
            renderItem={({ item, index, section }) => (
              <View style={[styles.rowContainer, { borderColor: colors.border }]}>
                <TableRow
                  item={item}
                  index={index}
                  columns={displayColumns}
                  selection={{
                    enabled: selectionEnabled,
                    selectedIds,
                    onToggle: handleToggleSelection,
                    onToggleAll: () => handleToggleAllInSection(section.data),
                  }}
                  actions={filteredTableActions}
                  onPress={handleRowPress}
                  getRowStyle={config.table.getRowStyle}
                />
              </View>
            )}
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
        onSuccess={() => {
          setSectorModalTask(null)
          handleRefresh()
        }}
      />

      {/* Task Duplicate Modal */}
      <TaskDuplicateModal
        visible={!!duplicateModalTask}
        onClose={() => setDuplicateModalTask(null)}
        task={duplicateModalTask}
        onSuccess={() => {
          setDuplicateModalTask(null)
          handleRefresh()
        }}
      />
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
