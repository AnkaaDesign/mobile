import { memo, useMemo } from 'react'
import { View, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { Checkbox } from '@/components/ui/checkbox'
import { useTheme } from '@/lib/theme'
import { IconChevronUp, IconChevronDown, IconArrowsSort } from '@tabler/icons-react-native'
import type { TableColumn, SortConfig } from '../types'

interface HeaderProps<T> {
  columns: Array<TableColumn<T> & { width: number }>
  sort?: {
    config: SortConfig | null
    onSort: (field: string) => void
  }
  selection?: {
    enabled: boolean
    selectedIds: Set<string>
    onToggle?: (id: string) => void
    onToggleAll: () => void
  }
  totalItems: number
}

export const Header = memo(function Header<T>({
  columns,
  sort,
  selection,
  totalItems,
}: HeaderProps<T>) {
  const { colors } = useTheme()
  const { width: screenWidth } = Dimensions.get('window')

  const tableWidth = useMemo(
    () => columns.reduce((sum, col) => sum + col.width, 0) + (selection?.enabled ? 50 : 0),
    [columns, selection?.enabled]
  )

  const allSelected = useMemo(
    () => selection?.enabled && selection.selectedIds.size === totalItems && totalItems > 0,
    [selection, totalItems]
  )

  const someSelected = useMemo(
    () => selection?.enabled && selection.selectedIds.size > 0 && selection.selectedIds.size < totalItems,
    [selection, totalItems]
  )

  return (
    <View style={styles.headerWrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={tableWidth > screenWidth - 32}
      >
        <View style={[styles.headerRow, { width: Math.max(tableWidth, screenWidth - 32) }]}>
          {/* Selection Checkbox */}
          {selection?.enabled && (
            <View style={styles.checkboxCell}>
              <Checkbox
                checked={allSelected || false}
                indeterminate={someSelected || false}
                onCheckedChange={selection.onToggleAll}
              />
            </View>
          )}

          {/* Column Headers */}
          {columns.map((column, colIndex) => {
            const isSorted = sort?.config?.field === column.key
            const sortDirection = isSorted ? sort?.config?.direction : null
            const isLastColumn = colIndex === columns.length - 1

            return (
              <TouchableOpacity
                key={column.key}
                style={[
                  styles.headerCell,
                  { width: column.width },
                  isLastColumn && { paddingLeft: 4 },
                ]}
                onPress={() => column.sortable && sort?.onSort(column.key)}
                disabled={!column.sortable}
                activeOpacity={column.sortable ? 0.7 : 1}
              >
                <View
                  style={[
                    styles.headerContent,
                    column.align === 'center' && styles.centerAlign,
                    column.align === 'right' && styles.rightAlign,
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.headerText,
                      { color: colors.foreground },
                    ]}
                    numberOfLines={1}
                  >
                    {column.label}
                  </ThemedText>

                  {/* Sort Indicator */}
                  {column.sortable && (
                    <View style={styles.sortIcon}>
                      {sortDirection === 'asc' && (
                        <IconChevronUp size={14} color={colors.primary} />
                      )}
                      {sortDirection === 'desc' && (
                        <IconChevronDown size={14} color={colors.primary} />
                      )}
                      {!sortDirection && (
                        <IconArrowsSort size={14} color={colors.mutedForeground} />
                      )}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            )
          })}
        </View>
      </ScrollView>
    </View>
  )
})

const styles = StyleSheet.create({
  headerWrapper: {
    // Border is handled by parent container
  },
  headerRow: {
    flexDirection: 'row',
    minHeight: 40,
  },
  checkboxCell: {
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  headerCell: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 4,
  },
  centerAlign: {
    justifyContent: 'center',
  },
  rightAlign: {
    justifyContent: 'flex-end',
  },
  headerText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sortIcon: {
    marginLeft: 4,
  },
})
