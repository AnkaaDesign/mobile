import { memo, useCallback } from 'react'
import { View, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native'
import { IconFilter } from '@tabler/icons-react-native'
import { useRouter } from 'expo-router'
import { ThemedView } from '@/components/ui/themed-view'
import { ThemedText } from '@/components/ui/themed-text'
import { Icon } from '@/components/ui/icon'
import { FAB } from '@/components/ui/fab'
import { ErrorScreen } from '@/components/ui/error-screen'
import { useTheme } from '@/lib/theme'
import { useList } from '@/hooks/list/useList'
import { useAuth } from '@/contexts/auth-context'
import { usePageTracker } from '@/hooks/use-page-tracker'
import { Table } from '../Table'
import { Search } from '../Search'
import { Filters, Tags } from '../Filters'
import { BulkActions } from '../BulkActions'
import { ColumnVisibilityButton, ColumnVisibilityPanel } from '../ColumnVisibility'
import type { ListConfig } from '../types'

interface LayoutProps {
  config: ListConfig<any>
}

/**
 * Complete List Page Layout - Handles everything automatically
 * Just pass a config and it renders the entire page
 */
export const Layout = memo(function Layout({
  config,
}: LayoutProps) {
  const { colors } = useTheme()
  const router = useRouter()
  const { user } = useAuth()
  const list = useList(config)

  // Track page access for recents/most accessed
  usePageTracker({ title: config.title })

  // Handle create action
  const handleCreate = () => {
    if (config.actions?.create?.route) {
      router.push(config.actions.create.route as any)
    }
  }

  // Handle row click - use config's onRowPress if defined, otherwise use 'view' action or first non-destructive action
  const handleRowPress = useCallback((item: any) => {
    // If config has a custom onRowPress handler, use it
    if (config.table.onRowPress) {
      config.table.onRowPress(item, router)
      return
    }

    // Otherwise fall back to action-based navigation
    if (!config.table.actions || config.table.actions.length === 0) return

    // Try to find a 'view' action first
    let action = config.table.actions.find(action => action.key === 'view')

    // If no 'view' action, use the first non-destructive action (usually 'edit')
    if (!action) {
      action = config.table.actions.find(action => action.variant !== 'destructive')
    }

    // If still no action, use the first available action
    if (!action) {
      action = config.table.actions[0]
    }

    // Check if action is visible (if visibility function is defined)
    if (action.visible && !action.visible(item)) return

    // Execute the action
    if (action.onPress) {
      action.onPress(item, router, {})
    } else if (action.route) {
      const route = typeof action.route === 'function' ? action.route(item) : action.route
      router.push(route as any)
    }
  }, [config.table.actions, config.table.onRowPress, router])

  // Check if user can create (using permission function if provided)
  const canCreate = config.actions?.create?.canCreate
    ? config.actions.create.canCreate(user)
    : true // Default to true if no permission check is provided

  // Show loading on initial load
  if (list.isLoading && list.items.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Carregando {config.title.toLowerCase()}...
          </ThemedText>
        </View>
      </ThemedView>
    )
  }

  // Show error if initial load failed
  if (list.error && list.items.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ErrorScreen
          message={`Erro ao carregar ${config.title.toLowerCase()}`}
          detail={list.error.message}
          onRetry={list.pagination.refresh}
        />
      </ThemedView>
    )
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header with Search and Actions */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Search
            value={list.search.displayText}
            onChangeText={list.search.onChangeText}
            onSearch={list.search.onSearch}
            placeholder={list.search.placeholder}
            loading={list.search.loading}
          />
        </View>

        <View style={styles.actions}>
          {/* Custom Toolbar Actions */}
          {config.actions?.toolbar?.map((action) => (
            <TouchableOpacity
              key={action.key}
              onPress={() => action.onPress(router)}
              style={[
                styles.actionButton,
                {
                  backgroundColor: action.variant === 'primary' ? colors.primary : colors.card,
                  borderColor: action.variant === 'primary' ? colors.primary : colors.border,
                  paddingHorizontal: action.label ? 12 : 10,
                },
              ]}
              activeOpacity={0.7}
            >
              {action.icon && (
                <View style={{ marginRight: action.label ? 6 : 0 }}>
                  <Icon
                    name={action.icon}
                    size={18}
                    color={action.variant === 'primary' ? 'white' : colors.foreground}
                  />
                </View>
              )}
              {action.label && (
                <ThemedText style={[
                  styles.actionButtonText,
                  { color: action.variant === 'primary' ? 'white' : colors.foreground }
                ]}>
                  {action.label}
                </ThemedText>
              )}
            </TouchableOpacity>
          ))}

          {/* Column Visibility Button */}
          <ColumnVisibilityButton
            columns={list.table.columns}
            visibleColumns={list.table.visibleColumns}
            onOpen={list.table.onOpenColumnPanel}
          />

          {config.filters && (
            <TouchableOpacity
              onPress={list.filters.onOpen}
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
              {list.filters.activeCount > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.destructive }]}>
                  <ThemedText style={styles.badgeText}>
                    {list.filters.activeCount}
                  </ThemedText>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tags */}
      {config.filters && list.filters.activeCount > 0 && (
        <Tags {...list.filters.tags} />
      )}

      {/* Bulk Actions Bar */}
      {list.selection.enabled && list.selection.selectedIds.size > 0 && config.actions?.bulk && (
        <BulkActions
          selectedIds={list.selection.selectedIds}
          actions={config.actions.bulk}
          mutations={list.table.mutations}
          onClear={list.selection.onClear}
        />
      )}

      {/* Table */}
      <Table
        data={list.items}
        columns={list.table.columns}
        visibleColumns={list.table.visibleColumns}
        sort={{
          config: list.table.sort,
          onSort: list.table.onSort,
        }}
        selection={{
          enabled: list.selection.enabled,
          selectedIds: list.selection.selectedIds,
          onToggle: list.selection.onToggle,
          onToggleAll: list.selection.onToggleAll,
        }}
        loading={list.isLoading}
        loadingMore={list.isFetchingNextPage}
        onLoadMore={list.pagination.loadMore}
        canLoadMore={list.pagination.canLoadMore}
        onRefresh={list.pagination.refresh}
        refreshing={list.pagination.refreshing}
        actions={list.table.actions}
        mutations={list.table.mutations}
        rowHeight={list.table.rowHeight}
        onRowPress={handleRowPress}
        emptyState={config.emptyState}
        totalCount={list.totalCount}
        getRowStyle={list.table.getRowStyle}
      />

      {/* FAB for Create */}
      {config.actions?.create && canCreate && (
        <FAB
          icon="plus"
          onPress={handleCreate}
        />
      )}

      {/* Column Visibility Panel */}
      <ColumnVisibilityPanel
        columns={list.table.columns}
        visibleColumns={list.table.visibleColumns}
        onToggleColumn={list.table.onToggleColumn}
        onResetColumns={list.table.onResetColumns}
        isOpen={list.table.isColumnPanelOpen}
        onClose={list.table.onCloseColumnPanel}
        defaultVisible={config.table.defaultVisible}
      />

      {/* Filter Drawer */}
      {config.filters && (
        <Filters
          fields={list.filters.fields}
          values={list.filters.values}
          onChange={list.filters.onChange}
          onClear={list.filters.onClear}
          activeCount={list.filters.activeCount}
          isOpen={list.filters.isOpen}
          onClose={list.filters.onClose}
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
    paddingHorizontal: 12,
    paddingVertical: 12,
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
    minWidth: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    flexDirection: 'row',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
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
})

// Export sub-components for custom layouts
export { Container } from './Container'
export { Header } from './Header'
