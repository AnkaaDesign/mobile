import { memo } from 'react'
import { View, StyleSheet, Switch as RNSwitch } from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { useTheme } from '@/lib/theme'
import type { FilterField } from '../../types'

interface ToggleFieldProps {
  field: FilterField
  value: boolean | undefined
  onChange: (value: boolean | undefined) => void
}

export const ToggleField = memo(function ToggleField({
  field,
  value,
  onChange,
}: ToggleFieldProps) {
  const { colors } = useTheme()

  const handleChange = (newValue: boolean) => {
    onChange(newValue)
  }

  // Use placeholder as label if provided, otherwise use label
  const displayLabel = typeof field.placeholder === 'string'
    ? field.placeholder
    : field.label

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.labelContainer}>
          <ThemedText style={[styles.label, { color: colors.foreground }]}>
            {displayLabel}
          </ThemedText>
          {field.description && (
            <ThemedText style={[styles.description, { color: colors.mutedForeground }]}>
              {field.description}
            </ThemedText>
          )}
        </View>
        <RNSwitch
          value={value || false}
          onValueChange={handleChange}
          trackColor={{ false: colors.muted, true: colors.primary + '80' }}
          thumbColor={value ? colors.primary : colors.mutedForeground}
        />
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelContainer: {
    flex: 1,
    marginRight: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  description: {
    fontSize: 12,
    marginTop: 2,
  },
})
