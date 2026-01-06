import { memo } from 'react'
import { View, StyleSheet } from 'react-native'
import { Input } from '@/components/ui/input'
import type { FilterField } from '../../types'

interface TextFieldProps {
  field: FilterField
  value: string | undefined
  onChange: (value: string | number | null) => void
  onFocus?: () => void
}

export const TextField = memo(function TextField({
  field,
  value,
  onChange,
  onFocus,
}: TextFieldProps) {
  const handleChange = (text: string) => {
    onChange(text || null)
  }

  // Use placeholder as the main identifier (clean approach)
  const placeholder = typeof field.placeholder === 'string'
    ? field.placeholder
    : field.label || 'Digite...'

  return (
    <View style={styles.container}>
      <Input
        value={value || ''}
        onChangeText={handleChange as any}
        placeholder={placeholder}
        onFocus={onFocus}
      />
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
})
