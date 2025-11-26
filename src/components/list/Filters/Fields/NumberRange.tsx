import { memo } from 'react'
import { NumericRangeFilter } from '@/components/common/filters'
import { getFilterIcon } from '@/lib/filter-icon-mapping'
import type { FilterField } from '../../types'

interface NumberRangeFieldProps {
  field: FilterField
  value: { min?: number; max?: number } | undefined
  onChange: (value: { min?: number; max?: number } | undefined) => void
}

export const NumberRangeField = memo(function NumberRangeField({
  field,
  value,
  onChange,
}: NumberRangeFieldProps) {
  // Get placeholder labels - use field.placeholder if object, otherwise defaults
  const placeholders = typeof field.placeholder === 'object' && field.placeholder
    ? { min: field.placeholder.min || 'Mínimo', max: field.placeholder.max || 'Máximo' }
    : { min: 'Mínimo', max: 'Máximo' }

  // Use field label or placeholder string as label
  const label = field.label || (typeof field.placeholder === 'string' ? field.placeholder : field.key)

  // Get icon for this filter
  const icon = getFilterIcon(field.key)

  // Detect if this is a currency field based on key name
  const isCurrency = field.key.toLowerCase().includes('price') || field.key.toLowerCase().includes('preço')

  return (
    <NumericRangeFilter
      label={label}
      icon={icon}
      value={value}
      onChange={onChange}
      minPlaceholder={placeholders.min}
      maxPlaceholder={placeholders.max}
      format={isCurrency ? 'currency' : undefined}
    />
  )
})
