import { memo } from 'react'
import { View, StyleSheet } from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { Combobox } from '@/components/ui/combobox'
import { useTheme } from '@/lib/theme'
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
  const { colors } = useTheme()

  // Prepare options
  const options = useMemo(() => {
    if (providedOptions) return providedOptions
    if (field.options?.data) return field.options.data
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

  return (
    <View style={styles.container}>
      <ThemedText style={[styles.label, { color: colors.foreground }]}>
        {field.label}
      </ThemedText>
      <Combobox
        options={options}
        selectedValues={currentValue}
        onValueChange={handleChange}
        placeholder={field.placeholder || `Selecione ${field.label.toLowerCase()}`}
        searchPlaceholder="Buscar..."
        emptyText="Nenhuma opção encontrada"
        mode={field.multiple ? 'multiple' : 'single'}
      />
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
})
