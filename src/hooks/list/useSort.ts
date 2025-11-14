import { useState, useCallback, useMemo } from 'react'
import type { SortConfig } from '@/components/list/types'

interface UseSortOptions {
  defaultSort: SortConfig
  mapping: Record<string, string | ((direction: 'asc' | 'desc') => any)>
}

export function useSort({ defaultSort, mapping }: UseSortOptions) {
  const [config, setConfig] = useState<SortConfig | null>(defaultSort)

  // Toggle sort for a field
  const onSort = useCallback(
    (field: string) => {
      if (!config || config.field !== field) {
        // New sort
        setConfig({ field, direction: 'asc' })
      } else if (config.direction === 'asc') {
        // Toggle to desc
        setConfig({ field, direction: 'desc' })
      } else {
        // Clear sort
        setConfig(null)
      }
    },
    [config]
  )

  // Reset to default
  const reset = useCallback(() => {
    setConfig(defaultSort)
  }, [defaultSort])

  // Build orderBy object for API
  const orderBy = useMemo(() => {
    if (!config) return buildOrderByFromMapping(defaultSort, mapping)
    return buildOrderByFromMapping(config, mapping)
  }, [config, defaultSort, mapping])

  return {
    config,
    onSort,
    reset,
    orderBy,
  }
}

// Helper to build orderBy from mapping
function buildOrderByFromMapping(
  config: SortConfig,
  mapping: Record<string, string | ((direction: 'asc' | 'desc') => any)>
): any {
  const mapped = mapping[config.field]

  if (!mapped) {
    // Fallback: use field as-is
    return { [config.field]: config.direction }
  }

  if (typeof mapped === 'function') {
    // Custom mapping function
    return mapped(config.direction)
  }

  if (mapped.includes('.')) {
    // Nested field: "brand.name" -> { brand: { name: direction } }
    const parts = mapped.split('.')
    let result: any = { [parts[parts.length - 1]]: config.direction }
    for (let i = parts.length - 2; i >= 0; i--) {
      result = { [parts[i]]: result }
    }
    return result
  }

  // Simple field
  return { [mapped]: config.direction }
}
