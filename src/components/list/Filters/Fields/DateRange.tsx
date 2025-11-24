import { memo } from 'react'
import { View, StyleSheet } from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { DatePicker } from '@/components/ui/date-picker'
import { useTheme } from '@/lib/theme'
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
  const { colors } = useTheme()

  const handleFromChange = (date: Date | null) => {
    onChange({
      ...value,
      gte: date || undefined,
    })
  }

  const handleToChange = (date: Date | null) => {
    onChange({
      ...value,
      lte: date || undefined,
    })
  }

  // Get placeholder labels - use field.placeholder if object, otherwise defaults
  const placeholders = typeof field.placeholder === 'object' && field.placeholder
    ? {
        from: field.placeholder.from || field.placeholder.min || 'Data inicial',
        to: field.placeholder.to || field.placeholder.max || 'Data final'
      }
    : { from: 'Data inicial', to: 'Data final' }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.dateField}>
          <ThemedText style={[styles.subLabel, { color: colors.mutedForeground }]}>
            {placeholders.from}
          </ThemedText>
          <DatePicker
            value={value?.gte || null}
            onChange={handleFromChange}
            placeholder="Selecionar..."
          />
        </View>

        <View style={styles.dateField}>
          <ThemedText style={[styles.subLabel, { color: colors.mutedForeground }]}>
            {placeholders.to}
          </ThemedText>
          <DatePicker
            value={value?.lte || null}
            onChange={handleToChange}
            placeholder="Selecionar..."
          />
        </View>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  dateField: {
    flex: 1,
  },
  subLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
})
