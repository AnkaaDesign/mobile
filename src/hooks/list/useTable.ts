import { useState, useCallback, useEffect, useRef } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { TableColumn } from '@/components/list/types'

interface UseTableOptions<T> {
  columns: TableColumn<T>[]
  defaultVisible: string[]
  storageKey: string
}

const STORAGE_PREFIX = 'table-columns-'

export function useTable<T extends { id: string }>({
  columns,
  defaultVisible,
  storageKey,
}: UseTableOptions<T>) {
  const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultVisible)
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false)
  const isLoadedRef = useRef(false)
  const storageKeyRef = useRef(storageKey)
  storageKeyRef.current = storageKey

  // Load saved column visibility ONCE on mount (or when storageKey changes)
  useEffect(() => {
    let cancelled = false
    isLoadedRef.current = false

    AsyncStorage.getItem(`${STORAGE_PREFIX}${storageKey}`)
      .then((saved) => {
        if (cancelled) return

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
      .catch((error) => {
        if (!cancelled) {
          console.error('Failed to load saved columns:', error)
        }
      })
      .finally(() => {
        if (!cancelled) {
          isLoadedRef.current = true
        }
      })

    return () => {
      cancelled = true
    }
  }, [storageKey])

  // Validate visible columns when available columns change
  // This runs separately from loading — it only prunes columns that no longer exist
  useEffect(() => {
    if (!isLoadedRef.current) return
    if (columns.length === 0) return

    const validColumnKeys = new Set(columns.map((col) => col.key))

    setVisibleColumns((prev) => {
      const validColumns = prev.filter((key) => validColumnKeys.has(key))

      if (validColumns.length === 0) {
        // All saved columns are invalid (e.g., schema changed), use defaults
        const validDefaults = defaultVisible.filter((key) => validColumnKeys.has(key))
        const result = validDefaults.length > 0 ? validDefaults : defaultVisible
        AsyncStorage.setItem(`${STORAGE_PREFIX}${storageKeyRef.current}`, JSON.stringify(result))
        return result
      }

      if (validColumns.length !== prev.length) {
        // Some columns were removed, persist the cleaned list
        AsyncStorage.setItem(`${STORAGE_PREFIX}${storageKeyRef.current}`, JSON.stringify(validColumns))
        return validColumns
      }

      return prev
    })
  }, [columns, defaultVisible])

  // Save column visibility on toggle
  const handleColumnChange = useCallback(
    (columnKey: string) => {
      setVisibleColumns((prev) => {
        const next = prev.includes(columnKey)
          ? prev.filter((k) => k !== columnKey)
          : [...prev, columnKey]

        AsyncStorage.setItem(`${STORAGE_PREFIX}${storageKeyRef.current}`, JSON.stringify(next))

        return next
      })
    },
    []
  )

  const handleResetColumns = useCallback(() => {
    setVisibleColumns(defaultVisible)
    AsyncStorage.setItem(`${STORAGE_PREFIX}${storageKeyRef.current}`, JSON.stringify(defaultVisible))
  }, [defaultVisible])

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
