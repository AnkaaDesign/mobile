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

  // Load saved column visibility
  useEffect(() => {
    AsyncStorage.getItem(`table-columns-${storageKey}`).then((saved) => {
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setVisibleColumns(parsed)
          }
        } catch (error) {
          console.error('Failed to parse saved columns:', error)
        }
      }
    })
  }, [storageKey])

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

  return {
    columns,
    visibleColumns,
    onToggleColumn: handleColumnChange,
    onResetColumns: handleResetColumns,
  }
}
