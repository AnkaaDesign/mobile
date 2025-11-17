import React, { useState, useMemo, useCallback } from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { IconColumns } from '@tabler/icons-react-native'
import { useTheme } from '@/lib/theme'
import { ThemedText } from '@/components/ui/themed-text'
import { Drawer } from '@/components/ui/drawer'
import { GenericColumnDrawerContent } from '@/components/ui/generic-column-drawer-content'
import type { TableColumn } from '../types'

interface ColumnVisibilityProps {
  columns: TableColumn[]
  visibleColumns: string[]
  onToggleColumn: (key: string) => void
  onResetColumns: () => void
}

/**
 * Column Visibility Control for List Pages
 * Provides a button to open column visibility drawer
 */
export function ColumnVisibility({
  columns,
  visibleColumns,
  onToggleColumn,
  onResetColumns,
}: ColumnVisibilityProps) {
  const { colors } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

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

  const visibleCount = visibleColumns.length
  const totalCount = columns.length

  return (
    <>
      <TouchableOpacity
        onPress={() => setIsOpen(true)}
        style={[
          styles.button,
          {
            backgroundColor: colors.background,
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

      <Drawer
        open={isOpen}
        onOpenChange={setIsOpen}
        side="right"
        width="90%"
        closeOnBackdropPress
        closeOnSwipe={false}
      >
        <GenericColumnDrawerContent
          columns={drawerColumns}
          visibleColumns={visibleSet}
          onVisibilityChange={handleVisibilityChange}
          onClose={() => setIsOpen(false)}
          defaultColumns={visibleSet}
          title="Gerenciar Colunas"
        />
      </Drawer>
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
