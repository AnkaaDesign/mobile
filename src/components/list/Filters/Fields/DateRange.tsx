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

  return (
    <View style={styles.container}>
      <ThemedText style={[styles.label, { color: colors.foreground }]}>
        {field.label}
      </ThemedText>

      <View style={styles.row}>
        <View style={styles.dateField}>
          <ThemedText style={[styles.subLabel, { color: colors.mutedForeground }]}>
            De
          </ThemedText>
          <DatePicker
            value={value?.gte || null}
            onChange={handleFromChange}
            placeholder="Selecionar data"
          />
        </View>

        <View style={styles.dateField}>
          <ThemedText style={[styles.subLabel, { color: colors.mutedForeground }]}>
            Até
          </ThemedText>
          <DatePicker
            value={value?.lte || null}
            onChange={handleToChange}
            placeholder="Selecionar data"
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
  dateField: {
    flex: 1,
  },
  subLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
})
