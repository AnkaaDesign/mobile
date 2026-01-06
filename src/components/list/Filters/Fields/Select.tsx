import { memo, useMemo } from 'react'
import { View } from 'react-native'
import { MultiSelectFilter, SelectFilter } from '@/components/common/filters'
import { getFilterIcon } from '@/lib/filter-icon-mapping'
import { Icon } from '@/components/ui/icon'
import { ThemedText } from '@/components/ui/themed-text'
import { useTheme } from '@/lib/theme'
import { getStockLevelTextColor } from '@/utils/stock-level'
import type { FilterField } from '../../types'

interface SelectFieldProps {
  field: FilterField
  value: any
  onChange: (value: any) => void
  options?: Array<{ label: string; value: any }>
  onOpen?: (measurements: { inputY: number; inputHeight: number; requiredHeight: number }) => boolean | void
  onClose?: () => void
}

const SelectFieldComponent = function SelectField({
  field,
  value,
  onChange,
  options: providedOptions,
  onOpen,
  onClose,
}: SelectFieldProps) {
  // Prepare options
  const options = useMemo(() => {
    if (providedOptions) return providedOptions
    if (field.options) return field.options
    return []
  }, [providedOptions, field.options])

  const handleChange = (newValue: any) => {
    onChange(newValue)
  }

  const currentValue = useMemo(() => {
    if (field.multiple) {
      return Array.isArray(value) ? value : []
    }
    return value || null
  }, [value, field.multiple])

  // Use placeholder as the label
  const label = field.label || (typeof field.placeholder === 'string' ? field.placeholder : 'Selecione...')
  const placeholder = typeof field.placeholder === 'string' ? field.placeholder : 'Selecione...'

  // Get icon for this filter
  const icon = getFilterIcon(field.key)
  const { colors } = useTheme()

  // Stock level custom renderer with icons and colors
  const renderStockLevelOption = useMemo(() => {
    if (field.key !== 'stockLevels') return undefined

    return (option: any) => {
      const stockLevel = option.stockLevel || option.value
      const colorClass = getStockLevelTextColor(stockLevel)
      const colorMap: Record<string, string> = {
        'text-neutral-500': '#6b7280',
        'text-red-600': '#dc2626',
        'text-orange-500': '#f97316',
        'text-yellow-500': '#eab308',
        'text-green-600': '#16a34a',
        'text-purple-600': '#9333ea',
      }
      const iconColor = colorMap[colorClass] || colors.foreground

      return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon
            name="alert-triangle"
            size={18}
            color={iconColor}
          />
          <ThemedText style={{ color: iconColor }}>{option.label}</ThemedText>
        </View>
      )
    }
  }, [field.key, colors])

  if (field.multiple) {
    return (
      <MultiSelectFilter
        label={label}
        icon={icon}
        value={currentValue}
        onChange={handleChange}
        options={field.async ? undefined : options}
        placeholder={placeholder}
        renderOption={renderStockLevelOption}
        async={field.async}
        queryKey={field.queryKey}
        queryFn={field.queryFn}
        onOpen={onOpen}
        onClose={onClose}
      />
    )
  }

  return (
    <SelectFilter
      label={label}
      icon={icon}
      value={currentValue}
      onChange={handleChange}
      options={field.async ? undefined : options}
      placeholder={placeholder}
      renderOption={renderStockLevelOption}
      async={field.async}
      queryKey={field.queryKey}
      queryFn={field.queryFn}
      onOpen={onOpen}
      onClose={onClose}
    />
  )
}

SelectFieldComponent.displayName = 'SelectField'
export const SelectField = memo(SelectFieldComponent)
