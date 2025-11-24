import { memo, useMemo } from 'react'
import { View, StyleSheet } from 'react-native'
import { Combobox } from '@/components/ui/combobox'
import type { FilterField } from '../../types'

interface SelectFieldProps {
  field: FilterField
  value: any
  onChange: (value: any) => void
  options?: Array<{ label: string; value: any }>
}

export const SelectField = memo(function SelectField({
  field,
  value,
  onChange,
  options: providedOptions,
}: SelectFieldProps) {
  // Prepare options
  const options = useMemo(() => {
    if (providedOptions) return providedOptions
    if (field.options?.data) return field.options.data
    if (field.options) return field.options
    return []
  }, [providedOptions, field.options])

  const handleChange = (newValue: any) => {
    if (field.multiple) {
      onChange(newValue)
    } else {
      onChange(newValue?.[0] || null)
    }
  }

  const currentValue = useMemo(() => {
    if (field.multiple) {
      return Array.isArray(value) ? value : []
    }
    return value ? [value] : []
  }, [value, field.multiple])

  // Use placeholder as the main identifier (clean approach)
  const placeholder = typeof field.placeholder === 'string'
    ? field.placeholder
    : field.label || 'Selecione...'

  return (
    <View style={styles.container}>
      <Combobox
        options={options}
        selectedValues={currentValue}
        onValueChange={handleChange}
        placeholder={placeholder}
        searchPlaceholder={`Buscar ${field.label?.toLowerCase() || ''}...`.trim()}
        emptyText="Nenhuma opção encontrada"
        mode={field.multiple ? 'multiple' : 'single'}
      />
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
})
