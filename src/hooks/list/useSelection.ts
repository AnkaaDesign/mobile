import { useState, useCallback } from 'react'

export function useSelection(defaultEnabled: boolean = false) {
  const [enabled, setEnabled] = useState(defaultEnabled)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const onToggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const onToggleAll = useCallback(
    (allIds: string[]) => {
      setSelectedIds((prev) => {
        const allSelected = allIds.every((id) => prev.has(id))
        if (allSelected) {
          // Deselect all
          return new Set()
        } else {
          // Select all
          return new Set(allIds)
        }
      })
    },
    []
  )

  const onClear = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const onEnable = useCallback(() => {
    setEnabled(true)
  }, [])

  const onDisable = useCallback(() => {
    setEnabled(false)
    setSelectedIds(new Set())
  }, [])

  return {
    enabled,
    selectedIds,
    onToggle,
    onToggleAll,
    onClear,
    onEnable,
    onDisable,
  }
}
