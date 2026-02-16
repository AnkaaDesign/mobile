import { memo, useMemo, useCallback, useState } from 'react'
import { View, ScrollView, Pressable, StyleSheet, Dimensions, Platform } from 'react-native'
import { useTheme } from '@/lib/theme'
import { Checkbox } from '@/components/ui/checkbox'
import { Cell } from './Cell'
import { CellContent } from './CellContent'
import { RowActions } from './RowActions'
import { lightImpactHaptic } from '@/utils/haptics'
import type { TableColumn, TableAction, RenderContext, ActionMutationsContext } from '../types'

interface RowProps<T extends { id: string }> {
  item: T
  index: number
  columns: Array<TableColumn<T> & { width: number }>
  selection?: {
    enabled: boolean
    selectedIds: Set<string>
    onToggle: (id: string) => void
  }
  actions?: Array<TableAction<T>>
  /** Mutations for row actions (update, delete, etc.) */
  mutations?: ActionMutationsContext
  onPress?: (item: T) => void
  getRowStyle?: (item: T, isDark?: boolean) => { backgroundColor?: string; borderLeftColor?: string; borderLeftWidth?: number } | undefined
  /** Context passed to render functions for navigation route and other info */
  renderContext?: RenderContext
}

export const Row = memo(function Row<T extends { id: string }>({
  item,
  index,
  columns,
  selection,
  actions,
  mutations,
  onPress,
  getRowStyle,
  renderContext,
}: RowProps<T>) {
  const { colors, isDark } = useTheme()
  const { width: screenWidth } = Dimensions.get('window')

  // Local pressed state for immediate visual feedback
  const [isPressed, setIsPressed] = useState(false)

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

  const normalBackgroundColor = useMemo(() => {
    if (customRowStyle?.backgroundColor) {
      return customRowStyle.backgroundColor
    }
    if (isSelected) {
      return isDark ? colors.primary + '20' : colors.primary + '10'
    }
    return index % 2 === 0 ? colors.background : colors.card
  }, [isSelected, index, colors, isDark, customRowStyle])

  // Calculate actual background based on press state - use subtle gray instead of green
  const backgroundColor = isPressed
    ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)')
    : normalBackgroundColor

  const borderStyle = useMemo(() => {
    if (customRowStyle?.borderLeftColor) {
      return {
        borderLeftColor: customRowStyle.borderLeftColor,
        borderLeftWidth: customRowStyle.borderLeftWidth || 4,
      }
    }
    return {}
  }, [customRowStyle])

  // Immediate visual feedback on press start
  const handlePressIn = useCallback(() => {
    if (onPress && !selection?.enabled) {
      setIsPressed(true)
    }
  }, [onPress, selection?.enabled])

  const handlePressOut = useCallback(() => {
    setIsPressed(false)
  }, [])

  // Handle press — let the parent handler (Layout.handleRowPress) manage
  // the loading overlay via pushWithLoading/startNavigation
  const handlePress = useCallback(() => {
    if (selection?.enabled) {
      lightImpactHaptic()
      selection.onToggle(item.id)
    } else if (onPress) {
      // Haptic feedback (don't await - fire and forget)
      lightImpactHaptic()
      // Delegate to parent handler which controls the overlay
      onPress(item)
    }
  }, [selection, onPress, item])

  const hasActions = actions && actions.length > 0 && !selection?.enabled

  // Row style - simple object, not array
  const rowStyle = useMemo(() => ({
    ...styles.row,
    width: Math.max(tableWidth, screenWidth - 32),
    backgroundColor,
    opacity: isPressed ? (Platform.OS === 'ios' ? 0.7 : 1) : 1,
  }), [tableWidth, screenWidth, backgroundColor, isPressed])

  // Ripple config for Android
  const androidRipple = useMemo(() => ({
    color: colors.primary + '40',
    borderless: false,
  }), [colors.primary])

  const rowContent = (
    <>
      {selection?.enabled && (
        <View style={styles.checkboxCell}>
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => selection.onToggle(item.id)}
          />
        </View>
      )}

      {columns.map((column, colIndex) => {
        // Extract raw value from item using column key for badge lookup
        const rawValue = column.badgeEntity ? (item as any)[column.key.split('.')[0]] : undefined
        return (
          <Cell
            key={column.key}
            width={column.width}
            align={column.align}
            style={colIndex === columns.length - 1 ? { paddingLeft: 4 } : undefined}
          >
            <CellContent
              value={column.render(item, renderContext)}
              format={column.format}
              style={column.style}
              badgeEntity={column.badgeEntity}
              rawValue={rawValue}
              component={column.component}
              onCellPress={column.onCellPress ? () => column.onCellPress!(item) : undefined}
            />
          </Cell>
        )
      })}
    </>
  )

  return (
    <View style={[styles.rowWrapper, { backgroundColor: normalBackgroundColor }, borderStyle]}>
      {hasActions ? (
        <RowActions item={item} actions={actions as any} mutations={mutations} renderContext={renderContext}>
          {(closeActions) => (
            <View style={{ backgroundColor: normalBackgroundColor }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                scrollEnabled={tableWidth > screenWidth - 32}
              >
                <Pressable
                  style={rowStyle}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  onPress={handlePress}
                  android_ripple={androidRipple}
                >
                  {rowContent}
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
            style={rowStyle}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handlePress}
            android_ripple={androidRipple}
          >
            {rowContent}
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
    alignItems: 'center',
  },
  checkboxCell: {
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
})
