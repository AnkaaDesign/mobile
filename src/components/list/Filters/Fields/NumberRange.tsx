import { memo } from 'react'
import { View, StyleSheet } from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { Input } from '@/components/ui/input'
import { useTheme } from '@/lib/theme'
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
  const { colors } = useTheme()

  const handleMinChange = (text: string) => {
    const num = text ? parseFloat(text) : undefined
    onChange({
      ...value,
      min: num,
    })
  }

  const handleMaxChange = (text: string) => {
    const num = text ? parseFloat(text) : undefined
    onChange({
      ...value,
      max: num,
    })
  }

  return (
    <View style={styles.container}>
      <ThemedText style={[styles.label, { color: colors.foreground }]}>
        {field.label}
      </ThemedText>

      <View style={styles.row}>
        <View style={styles.inputField}>
          <ThemedText style={[styles.subLabel, { color: colors.mutedForeground }]}>
            Mínimo
          </ThemedText>
          <Input
            value={value?.min?.toString() || ''}
            onChangeText={handleMinChange}
            placeholder={field.min?.toString() || '0'}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputField}>
          <ThemedText style={[styles.subLabel, { color: colors.mutedForeground }]}>
            Máximo
          </ThemedText>
          <Input
            value={value?.max?.toString() || ''}
            onChangeText={handleMaxChange}
            placeholder={field.max?.toString() || '∞'}
            keyboardType="numeric"
          />
        </View>
      </View>
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  inputField: {
    flex: 1,
  },
  subLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
})
