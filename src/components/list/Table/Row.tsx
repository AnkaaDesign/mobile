import { memo, useMemo, useCallback } from 'react'
import { View, ScrollView, Pressable, StyleSheet, Dimensions } from 'react-native'
import { useTheme } from '@/lib/theme'
import { Checkbox } from '@/components/ui/checkbox'
import { Cell } from './Cell'
import { RowActions } from './RowActions'
import type { TableColumn, TableAction } from '../types'

interface RowProps<T extends { id: string }> {
  item: T
  index: number
  columns: Array<TableColumn<T> & { width: number }>
  selection?: {
    enabled: boolean
    selectedIds: Set<string>
    onToggle: (id: string) => void
  }
  actions?: TableAction<T>[]
  onPress?: (item: T) => void
}

export const Row = memo(function Row<T extends { id: string }>({
  item,
  index,
  columns,
  selection,
  actions,
  onPress,
}: RowProps<T>) {
  const { colors, isDark } = useTheme()
  const { width: screenWidth } = Dimensions.get('window')

  const tableWidth = useMemo(
    () => columns.reduce((sum, col) => sum + col.width, 0) + (selection?.enabled ? 50 : 0),
    [columns, selection?.enabled]
  )

  const isSelected = useMemo(
    () => selection?.enabled && selection.selectedIds.has(item.id),
    [selection, item.id]
  )

  const backgroundColor = useMemo(() => {
    if (isSelected) {
      return isDark ? colors.primary + '20' : colors.primary + '10'
    }
    return index % 2 === 0 ? colors.card : colors.background
  }, [isSelected, index, colors, isDark])

  const handlePress = useCallback(() => {
    if (selection?.enabled) {
      selection.onToggle(item.id)
    } else if (onPress) {
      onPress(item)
    }
  }, [selection, onPress, item])

  const hasActions = actions && actions.length > 0 && !selection?.enabled

  return (
    <View style={[styles.rowWrapper, { backgroundColor }]}>
      {hasActions ? (
        <RowActions item={item} actions={actions}>
          {(closeActions) => (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              scrollEnabled={tableWidth > screenWidth - 32}
            >
              <Pressable
                style={[styles.row, { width: Math.max(tableWidth, screenWidth - 32) }]}
                onPress={handlePress}
                android_ripple={{ color: colors.primary + '20' }}
              >
                {selection?.enabled && (
                  <View style={styles.checkboxCell}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => selection.onToggle(item.id)}
                    />
                  </View>
                )}

                {columns.map((column) => (
                  <Cell
                    key={column.key}
                    width={column.width}
                    align={column.align}
                  >
                    {column.render(item)}
                  </Cell>
                ))}
              </Pressable>
            </ScrollView>
          )}
        </RowActions>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEnabled={tableWidth > screenWidth - 32}
        >
          <Pressable
            style={[styles.row, { width: Math.max(tableWidth, screenWidth - 32) }]}
            onPress={handlePress}
            android_ripple={{ color: colors.primary + '20' }}
          >
            {selection?.enabled && (
              <View style={styles.checkboxCell}>
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => selection.onToggle(item.id)}
                />
              </View>
            )}

            {columns.map((column) => (
              <Cell
                key={column.key}
                width={column.width}
                align={column.align}
              >
                {column.render(item)}
              </Cell>
            ))}
          </Pressable>
        </ScrollView>
      )}
    </View>
  )
})

const styles = StyleSheet.create({
  rowWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  row: {
    flexDirection: 'row',
    minHeight: 48,
  },
  checkboxCell: {
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
})
