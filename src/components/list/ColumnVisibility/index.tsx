import { memo, useState, useMemo, useCallback } from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { IconColumns } from '@tabler/icons-react-native'
import { useTheme } from '@/lib/theme'
import { ThemedText } from '@/components/ui/themed-text'
import { SlideInPanel } from '@/components/ui/slide-in-panel'
import { GenericColumnDrawerContent } from '@/components/ui/generic-column-drawer-content'
import type { TableColumn } from '../types'

interface ColumnVisibilityButtonProps {
  columns: TableColumn[]
  visibleColumns: string[]
  onOpen: () => void
}

/**
 * Column Visibility Button - Just the button that opens the panel
 */
export function ColumnVisibilityButton({
  columns,
  visibleColumns,
  onOpen,
}: ColumnVisibilityButtonProps) {
  const { colors } = useTheme()
  const visibleCount = visibleColumns.length
  const totalCount = columns.length

  return (
    <TouchableOpacity
      onPress={onOpen}
      style={[
        styles.button,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
      activeOpacity={0.7}
    >
      <IconColumns size={20} color={colors.foreground} />
      {visibleCount < totalCount && (
        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          <ThemedText style={[styles.badgeText, { color: colors.primaryForeground }]}>
            {visibleCount}
          </ThemedText>
        </View>
      )}
    </TouchableOpacity>
  )
}

interface ColumnVisibilityPanelProps {
  columns: TableColumn[]
  visibleColumns: string[]
  onToggleColumn: (key: string) => void
  onResetColumns: () => void
  isOpen: boolean
  onClose: () => void
  defaultVisible?: string[]
}

/**
 * Column Visibility Panel - The slide-in panel with column controls
 */
export const ColumnVisibilityPanel = memo(function ColumnVisibilityPanel({
  columns,
  visibleColumns,
  onToggleColumn,
  isOpen,
  onClose,
  defaultVisible,
}: ColumnVisibilityPanelProps) {
  // Transform table columns to drawer format
  const drawerColumns = useMemo(
    () =>
      columns.map((col) => ({
        key: col.key,
        header: col.label,
      })),
    [columns]
  )

  // Convert array to Set for drawer
  const visibleSet = useMemo(
    () => new Set(visibleColumns),
    [visibleColumns]
  )

  // Use the actual default visible columns from config
  const defaultColumns = useMemo(
    () => new Set(defaultVisible || columns.map(col => col.key)),
    [defaultVisible, columns]
  )

  // Handle visibility change
  const handleVisibilityChange = useCallback(
    (newVisible: Set<string>) => {
      // Find what changed
      const added = Array.from(newVisible).find(
        (key) => !visibleSet.has(key)
      )
      const removed = Array.from(visibleSet).find(
        (key) => !newVisible.has(key)
      )

      if (added) {
        onToggleColumn(added)
      } else if (removed) {
        onToggleColumn(removed)
      } else {
        // Bulk change - toggle all differences
        const allKeys = new Set([
          ...Array.from(visibleSet),
          ...Array.from(newVisible),
        ])
        allKeys.forEach((key) => {
          if (visibleSet.has(key) !== newVisible.has(key)) {
            onToggleColumn(key)
          }
        })
      }
    },
    [visibleSet, onToggleColumn]
  )

  return (
    <SlideInPanel isOpen={isOpen} onClose={onClose}>
      <GenericColumnDrawerContent
        columns={drawerColumns}
        visibleColumns={visibleSet}
        onVisibilityChange={handleVisibilityChange}
        onClose={onClose}
        defaultColumns={defaultColumns}
        title="Colunas"
      />
    </SlideInPanel>
  )
})

// Backward compatibility export
export function ColumnVisibility({
  columns,
  visibleColumns,
  onToggleColumn,
  onResetColumns,
  defaultVisible,
}: {
  columns: TableColumn[]
  visibleColumns: string[]
  onToggleColumn: (key: string) => void
  onResetColumns: () => void
  defaultVisible?: string[]
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <ColumnVisibilityButton
        columns={columns}
        visibleColumns={visibleColumns}
        onOpen={() => setIsOpen(true)}
      />
      <ColumnVisibilityPanel
        columns={columns}
        visibleColumns={visibleColumns}
        onToggleColumn={onToggleColumn}
        onResetColumns={onResetColumns}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        defaultVisible={defaultVisible}
      />
    </>
  )
}

const styles = StyleSheet.create({
  button: {
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
    fontSize: 10,
    fontWeight: '700',
  },
})