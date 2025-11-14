import { memo } from 'react'
import { View, StyleSheet } from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { Input } from '@/components/ui/input'
import { useTheme } from '@/lib/theme'
import type { FilterField } from '../../types'

interface TextFieldProps {
  field: FilterField
  value: string | undefined
  onChange: (value: string | undefined) => void
}

export const TextField = memo(function TextField({
  field,
  value,
  onChange,
}: TextFieldProps) {
  const { colors } = useTheme()

  const handleChange = (text: string) => {
    onChange(text || undefined)
  }

  return (
    <View style={styles.container}>
      <ThemedText style={[styles.label, { color: colors.foreground }]}>
        {field.label}
      </ThemedText>
      <Input
        value={value || ''}
        onChangeText={handleChange}
        placeholder={field.placeholder || field.label}
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
