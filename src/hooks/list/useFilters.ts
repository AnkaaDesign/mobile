import { useState, useCallback, useMemo } from 'react'
import type { FilterSection, FilterValue } from '@/components/list/types'

interface UseFiltersOptions {
  sections: FilterSection[]
  defaultValues?: FilterValue
}

export function useFilters({ sections, defaultValues = {} }: UseFiltersOptions) {
  const [values, setValues] = useState<FilterValue>(defaultValues)
  const [isOpen, setIsOpen] = useState(false)

  const onChange = useCallback((newValues: FilterValue) => {
    setValues(newValues)
  }, [])

  const onClear = useCallback(() => {
    setValues({})
  }, [])

  const onOpen = useCallback(() => {
    setIsOpen(true)
  }, [])

  const onClose = useCallback(() => {
    setIsOpen(false)
  }, [])

  const onRemove = useCallback((key: string, value?: any) => {
    setValues((prev) => {
      const next = { ...prev }
      if (value !== undefined) {
        next[key] = value
      } else {
        delete next[key]
      }
      return next
    })
  }, [])

  // Count active filters
  const activeCount = useMemo(() => {
    let count = 0

    Object.entries(values).forEach(([key, value]) => {
      if (value === undefined || value === null) return

      if (Array.isArray(value)) {
        if (value.length > 0) count++
      } else if (typeof value === 'object') {
        // Date ranges, number ranges
        const hasValue = Object.values(value).some((v) => v !== undefined && v !== null)
        if (hasValue) count++
      } else {
        count++
      }
    })

    return count
  }, [values])

  // Convert filter values to API parameters
  const apiParams = useMemo(() => {
    const params: any = {}

    Object.entries(values).forEach(([key, value]) => {
      if (value === undefined || value === null) return

      if (Array.isArray(value) && value.length === 0) return

      if (typeof value === 'object' && !Array.isArray(value)) {
        // Handle date ranges and number ranges
        const hasValue = Object.values(value).some((v) => v !== undefined && v !== null)
        if (!hasValue) return
      }

      params[key] = value
    })

    return params
  }, [values])

  return {
    sections,
    values,
    onChange,
    onClear,
    onOpen,
    onClose,
    onRemove,
    activeCount,
    apiParams,
  }
}
