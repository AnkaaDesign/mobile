import { memo, useMemo, useCallback } from 'react'
import { View, FlatList, RefreshControl, StyleSheet, Dimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '@/lib/theme'
import { ThemedText } from '@/components/ui/themed-text'
import { Header } from './Header'
import { Row } from './Row'
import { Empty } from './Empty'
import { Loading } from './Loading'
import type { TableProps } from '../types'

export const Table = memo(function Table<T extends { id: string }>({
  data,
  columns,
  visibleColumns,
  sort,
  selection,
  loading = false,
  loadingMore = false,
  onLoadMore,
  canLoadMore = false,
  onRefresh,
  refreshing = false,
  actions,
  rowHeight = 72,
  onRowPress,
  emptyState,
  totalCount = 0,
  getRowStyle,
}: TableProps<T>) {
  const { colors } = useTheme()
  const { width: screenWidth } = Dimensions.get('window')
  const insets = useSafeAreaInsets()

  // Filter visible columns and calculate widths
  const displayColumns = useMemo(() => {
    const visible = columns.filter((col) => visibleColumns.includes(col.key))

    // Calculate total width ratio
    const totalRatio = visible.reduce((sum, col) => sum + col.width, 0)
    const availableWidth = screenWidth - 32 // Account for padding

    // Assign calculated widths
    return visible.map((col) => ({
      ...col,
      width: Math.floor((availableWidth * col.width) / totalRatio),
    }))
  }, [columns, visibleColumns, screenWidth])

  // Render functions
  const renderItem = useCallback(
    ({ item, index }: { item: T; index: number }) => (
      <Row
        item={item}
        index={index}
        columns={displayColumns}
        selection={selection}
        actions={actions}
        onPress={onRowPress}
        getRowStyle={getRowStyle}
      />
    ),
    [displayColumns, selection, actions, onRowPress, getRowStyle]
  )

  const renderFooter = useCallback(
    () => (loadingMore ? <Loading type="footer" /> : null),
    [loadingMore]
  )

  const renderEmpty = useCallback(
    () => (
      <Empty
        icon={emptyState?.icon}
        title={emptyState?.title}
        description={emptyState?.description}
      />
    ),
    [emptyState]
  )

  const handleEndReached = useCallback(() => {
    if (canLoadMore && !loadingMore && onLoadMore) {
      onLoadMore()
    }
  }, [canLoadMore, loadingMore, onLoadMore])

  const handleRefresh = useCallback(async () => {
    if (onRefresh) {
      await onRefresh()
    }
  }, [onRefresh])

  // Show skeleton on initial load
  if (loading && data.length === 0) {
    return <Loading type="skeleton" />
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom + 8 }]}>
      <View style={[styles.tableCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {/* Fixed Header */}
        <View style={[styles.headerContainer, { borderBottomColor: colors.border }]}>
          <Header
            columns={displayColumns}
            sort={sort}
            selection={selection}
            totalItems={data.length}
          />
        </View>

        {/* Scrollable Body */}
        <View style={styles.bodyContainer}>
          <FlatList
            data={data}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmpty}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.2}
            contentContainerStyle={{ paddingBottom: 8 }}
            refreshControl={
              onRefresh ? (
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  colors={[colors.primary]}
                  tintColor={colors.primary}
                />
              ) : undefined
            }
            // Performance optimizations
            removeClippedSubviews
            maxToRenderPerBatch={12}
            windowSize={7}
            initialNumToRender={15}
            updateCellsBatchingPeriod={50}
            getItemLayout={(_, index) => ({
              length: rowHeight,
              offset: rowHeight * index,
              index,
            })}
          />
        </View>

        {/* Fixed Footer with Pagination Info */}
        <View style={[styles.footerContainer, { borderTopColor: colors.border, backgroundColor: colors.card }]}>
          <ThemedText style={[styles.paginationText, { color: colors.foreground }]}>
            Mostrando {data.length} de {totalCount || data.length}
          </ThemedText>
        </View>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 0,
    paddingBottom: 0,
  },
  tableCard: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  headerContainer: {
    borderBottomWidth: 1,
    backgroundColor: 'transparent',
  },
  bodyContainer: {
    flex: 1,
  },
  footerContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  paginationText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
})

// Export all sub-components
export { Header } from './Header'
export { Row } from './Row'
export { Cell } from './Cell'
export { Empty } from './Empty'
export { Loading } from './Loading'
export { RowActions } from './RowActions'
