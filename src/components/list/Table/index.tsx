import { memo } from 'react'
import { View, FlatList, RefreshControl, StyleSheet, Dimensions } from 'react-native'
import { useTheme } from '@/lib/theme'
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
  rowHeight = 48,
  onRowPress,
  emptyState,
}: TableProps<T>) {
  const { colors } = useTheme()
  const { width: screenWidth } = Dimensions.get('window')

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
  const renderHeader = useCallback(
    () => (
      <Header
        columns={displayColumns}
        sort={sort}
        selection={selection}
        totalItems={data.length}
      />
    ),
    [displayColumns, sort, selection, data.length]
  )

  const renderItem = useCallback(
    ({ item, index }: { item: T; index: number }) => (
      <Row
        item={item}
        index={index}
        columns={displayColumns}
        selection={selection}
        actions={actions}
        onPress={onRowPress}
      />
    ),
    [displayColumns, selection, actions, onRowPress]
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.tableCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.2}
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
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
  },
  tableCard: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
})

// Export all sub-components
export { Header } from './Header'
export { Row } from './Row'
export { Cell } from './Cell'
export { Empty } from './Empty'
export { Loading } from './Loading'
export { RowActions } from './RowActions'
