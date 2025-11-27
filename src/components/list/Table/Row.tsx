import { memo, useMemo, useCallback } from 'react'
import { View, ScrollView, Pressable, StyleSheet, Dimensions } from 'react-native'
import { useTheme } from '@/lib/theme'
import { Checkbox } from '@/components/ui/checkbox'
import { Cell } from './Cell'
import { CellContent } from './CellContent'
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
  getRowStyle?: (item: T, isDark?: boolean) => { backgroundColor?: string; borderLeftColor?: string; borderLeftWidth?: number } | undefined
}

export const Row = memo(function Row<T extends { id: string }>({
  item,
  index,
  columns,
  selection,
  actions,
  onPress,
  getRowStyle,
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

  const customRowStyle = useMemo(() => {
    return getRowStyle?.(item, isDark)
  }, [getRowStyle, item, isDark])

  const backgroundColor = useMemo(() => {
    if (customRowStyle?.backgroundColor) {
      return customRowStyle.backgroundColor
    }
    if (isSelected) {
      return isDark ? colors.primary + '20' : colors.primary + '10'
    }
    return index % 2 === 0 ? colors.background : colors.card
  }, [isSelected, index, colors, isDark, customRowStyle])

  const borderStyle = useMemo(() => {
    if (customRowStyle?.borderLeftColor) {
      return {
        borderLeftColor: customRowStyle.borderLeftColor,
        borderLeftWidth: customRowStyle.borderLeftWidth || 4,
      }
    }
    return {}
  }, [customRowStyle])

  const handlePress = useCallback(() => {
    if (selection?.enabled) {
      selection.onToggle(item.id)
    } else if (onPress) {
      onPress(item)
    }
  }, [selection, onPress, item])

  const hasActions = actions && actions.length > 0 && !selection?.enabled

  return (
    <View style={[styles.rowWrapper, { backgroundColor }, borderStyle]}>
      {hasActions ? (
        <RowActions item={item} actions={actions}>
          {(closeActions) => (
            <View style={{ backgroundColor }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                scrollEnabled={tableWidth > screenWidth - 32}
              >
                <Pressable
                  style={[styles.row, { width: Math.max(tableWidth, screenWidth - 32), backgroundColor }]}
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

                {columns.map((column, colIndex) => (
                  <Cell
                    key={column.key}
                    width={column.width}
                    align={column.align}
                    style={colIndex === columns.length - 1 ? { paddingLeft: 4 } : undefined}
                  >
                    <CellContent
                      value={column.render(item)}
                      format={column.format}
                      style={column.style}
                      badgeEntity={column.badgeEntity}
                      component={column.component}
                      onCellPress={column.onCellPress ? () => column.onCellPress!(item) : undefined}
                    />
                  </Cell>
                ))}
              </Pressable>
            </ScrollView>
            </View>
          )}
        </RowActions>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEnabled={tableWidth > screenWidth - 32}
        >
          <Pressable
            style={[styles.row, { width: Math.max(tableWidth, screenWidth - 32), backgroundColor }]}
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

            {columns.map((column, colIndex) => (
              <Cell
                key={column.key}
                width={column.width}
                align={column.align}
                style={colIndex === columns.length - 1 ? { paddingLeft: 4 } : undefined}
              >
                <CellContent
                  value={column.render(item)}
                  format={column.format}
                  style={column.style}
                  badgeEntity={column.badgeEntity}
                  component={column.component}
                  onCellPress={column.onCellPress ? () => column.onCellPress!(item) : undefined}
                />
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
