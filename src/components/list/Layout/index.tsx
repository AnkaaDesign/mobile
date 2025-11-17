import React, { memo } from 'react'
import { View, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native'
import { IconPlus, IconFilter } from '@tabler/icons-react-native'
import { useRouter } from 'expo-router'
import { ThemedView } from '@/components/ui/themed-view'
import { ThemedText } from '@/components/ui/themed-text'
import { FAB } from '@/components/ui/fab'
import { ErrorScreen } from '@/components/ui/error-screen'
import { useTheme } from '@/lib/theme'
import { useList } from '@/hooks/list/useList'
import { Table } from '../Table'
import { Search } from '../Search'
import { Filters } from '../Filters'
import { Export } from '../Export'
import { BulkActions } from '../BulkActions'
import { ColumnVisibility } from '../ColumnVisibility'
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
  const list = useList(config)

  // Handle create action
  const handleCreate = () => {
    if (config.actions?.create?.route) {
      router.push(config.actions.create.route as any)
    }
  }

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
          {/* Column Visibility */}
          <ColumnVisibility
            columns={list.table.columns}
            visibleColumns={list.table.visibleColumns}
            onToggleColumn={list.table.onToggleColumn}
            onResetColumns={list.table.onResetColumns}
          />

          {config.export && (
            <Export
              onExport={list.export.onExport}
              isExporting={list.export.isExporting}
              disabled={list.export.disabled}
              formats={list.export.formats}
              hasSelection={list.export.hasSelection}
              selectedCount={list.export.selectedCount}
              totalCount={list.export.totalCount}
            />
          )}

          {config.filters && (
            <TouchableOpacity
              onPress={list.filters.onOpen}
              style={[
                styles.actionButton,
                {
                  backgroundColor: colors.background,
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
        <Filters.Tags {...list.filters.tags} />
      )}

      {/* Bulk Actions Bar */}
      {list.selection.enabled && list.selection.selectedIds.size > 0 && config.actions?.bulk && (
        <BulkActions
          selectedIds={list.selection.selectedIds}
          actions={config.actions.bulk}
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
        rowHeight={list.table.rowHeight}
        emptyState={config.emptyState}
      />

      {/* FAB for Create */}
      {config.actions?.create && (
        <FAB
          icon={<IconPlus size={24} color="#fff" />}
          label={config.actions.create.label}
          onPress={handleCreate}
        />
      )}

      {/* Filter Drawer */}
      {config.filters && (
        <Filters
          sections={list.filters.sections}
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
})

// Export sub-components for custom layouts
export { Container } from './Container'
export { Header } from './Header'
