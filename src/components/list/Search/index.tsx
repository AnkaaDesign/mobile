import { memo, useRef, useEffect } from 'react'
import { View, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useTheme } from '@/lib/theme'
import { IconSearch, IconX } from '@tabler/icons-react-native'
import type { SearchProps } from '../types'

export const Search = memo(function Search({
  value,
  onChangeText,
  onSearch,
  placeholder = 'Buscar...',
  loading = false,
  debounce = 300,
}: SearchProps) {
  const { colors } = useTheme()
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  const handleChange = (text: string) => {
    onChangeText(text)

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Set new debounced search
    debounceTimerRef.current = setTimeout(() => {
      onSearch(text)
    }, debounce)
  }

  const handleClear = () => {
    onChangeText('')
    onSearch('')
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.muted,
          borderColor: colors.border,
        },
      ]}
    >
      <IconSearch size={20} color={colors.mutedForeground} />

      <TextInput
        value={value}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        style={[
          styles.input,
          {
            color: colors.foreground,
          },
        ]}
        returnKeyType="search"
        onSubmitEditing={() => onSearch(value)}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {loading && <ActivityIndicator size="small" color={colors.primary} />}

      {value.length > 0 && !loading && (
        <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
          <IconX size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
      )}
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 0,
    margin: 0,
  },
  clearButton: {
    padding: 2,
  },
})
