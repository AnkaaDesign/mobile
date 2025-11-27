import { useState, useCallback} from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useEffect } from 'react'
import type { TableColumn } from '@/components/list/types'

interface UseTableOptions<T> {
  columns: TableColumn<T>[]
  defaultVisible: string[]
  storageKey: string
}

export function useTable<T extends { id: string }>({
  columns,
  defaultVisible,
  storageKey,
}: UseTableOptions<T>) {
  const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultVisible)
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false)

  // Load saved column visibility
  useEffect(() => {
    AsyncStorage.getItem(`table-columns-${storageKey}`).then((saved) => {
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Filter out any column keys that no longer exist in the current columns
            const validColumnKeys = new Set(columns.map(col => col.key))
            const validSavedColumns = parsed.filter((key: string) => validColumnKeys.has(key))

            // Only use saved columns if at least one is still valid
            if (validSavedColumns.length > 0) {
              setVisibleColumns(validSavedColumns)
              // If some columns were invalid, update storage with valid ones
              if (validSavedColumns.length !== parsed.length) {
                AsyncStorage.setItem(`table-columns-${storageKey}`, JSON.stringify(validSavedColumns))
              }
            } else {
              // All saved columns are invalid, reset to defaults
              setVisibleColumns(defaultVisible)
              AsyncStorage.setItem(`table-columns-${storageKey}`, JSON.stringify(defaultVisible))
            }
          }
        } catch (error) {
          console.error('Failed to parse saved columns:', error)
        }
      }
    })
  }, [storageKey, columns, defaultVisible])

  // Save column visibility
  const handleColumnChange = useCallback(
    async (columnKey: string) => {
      setVisibleColumns((prev) => {
        const next = prev.includes(columnKey)
          ? prev.filter((k) => k !== columnKey)
          : [...prev, columnKey]

        // Persist
        AsyncStorage.setItem(`table-columns-${storageKey}`, JSON.stringify(next))

        return next
      })
    },
    [storageKey]
  )

  const handleResetColumns = useCallback(async () => {
    setVisibleColumns(defaultVisible)
    await AsyncStorage.setItem(`table-columns-${storageKey}`, JSON.stringify(defaultVisible))
  }, [defaultVisible, storageKey])

  const handleOpenColumnPanel = useCallback(() => {
    setIsColumnPanelOpen(true)
  }, [])

  const handleCloseColumnPanel = useCallback(() => {
    setIsColumnPanelOpen(false)
  }, [])

  return {
    columns,
    visibleColumns,
    onToggleColumn: handleColumnChange,
    onResetColumns: handleResetColumns,
    isColumnPanelOpen,
    onOpenColumnPanel: handleOpenColumnPanel,
    onCloseColumnPanel: handleCloseColumnPanel,
  }
}
