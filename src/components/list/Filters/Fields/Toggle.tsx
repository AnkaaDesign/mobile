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

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <ThemedText style={[styles.label, { color: colors.foreground }]}>
          {field.label}
        </ThemedText>
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
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
})
