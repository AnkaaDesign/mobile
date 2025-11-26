import { memo } from 'react'
import { DateRangeFilter } from '@/components/common/filters'
import { getFilterIcon } from '@/lib/filter-icon-mapping'
import type { FilterField } from '../../types'

interface DateRangeFieldProps {
  field: FilterField
  value: { gte?: Date; lte?: Date } | undefined
  onChange: (value: { gte?: Date; lte?: Date } | undefined) => void
}

export const DateRangeField = memo(function DateRangeField({
  field,
  value,
  onChange,
}: DateRangeFieldProps) {
  // Convert gte/lte to from/to for the DateRangeFilter component
  const handleChange = (range: { from?: Date; to?: Date } | undefined) => {
    if (!range) {
      onChange(undefined)
      return
    }
    onChange({
      gte: range.from,
      lte: range.to,
    })
  }

  // Use field label or placeholder string as label
  const label = field.label || (typeof field.placeholder === 'string' ? field.placeholder : field.key)

  // Get icon for this filter
  const icon = getFilterIcon(field.key)

  return (
    <DateRangeFilter
      label={label}
      icon={icon}
      value={{
        from: value?.gte,
        to: value?.lte,
      }}
      onChange={handleChange}
    />
  )
})
