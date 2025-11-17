import { memo, useMemo } from 'react'
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/lib/theme'
import { IconX } from '@tabler/icons-react-native'
import { format } from 'date-fns'
import type { FilterTagsProps } from '../types'

interface FilterTag {
  key: string
  label: string
  onRemove: () => void
}

export const Tags = memo(function Tags({
  values,
  searchText,
  sections,
  onRemove,
  onClearSearch,
  onClearAll,
}: FilterTagsProps) {
  const { colors } = useTheme()

  const tags = useMemo<FilterTag[]>(() => {
    const result: FilterTag[] = []

    // Add search tag
    if (searchText) {
      result.push({
        key: 'search',
        label: `Busca: "${searchText}"`,
        onRemove: onClearSearch || (() => {}),
      })
    }

    // Build tags from filter values
    sections.forEach((section) => {
      section.fields.forEach((field) => {
        const value = values[field.key]
        if (!value) return

        switch (field.type) {
          case 'select':
            if (field.multiple && Array.isArray(value) && value.length > 0) {
              // Get labels for selected values
              const options = field.options || []
              value.forEach((val) => {
                const option = options.find((opt) => opt.value === val)
                if (option) {
                  result.push({
                    key: `${field.key}-${val}`,
                    label: `${field.label}: ${option.label}`,
                    onRemove: () => {
                      const newValue = value.filter((v) => v !== val)
                      onRemove(field.key, newValue.length > 0 ? newValue : undefined)
                    },
                  })
                }
              })
            } else if (!field.multiple && value) {
              const options = field.options || []
              const option = options.find((opt) => opt.value === value)
              if (option) {
                result.push({
                  key: field.key,
                  label: `${field.label}: ${option.label}`,
                  onRemove: () => onRemove(field.key),
                })
              }
            }
            break

          case 'date-range':
            if (value.gte || value.lte) {
              const parts: string[] = []
              if (value.gte) parts.push(`de ${format(value.gte, 'dd/MM/yyyy')}`)
              if (value.lte) parts.push(`até ${format(value.lte, 'dd/MM/yyyy')}`)
              result.push({
                key: field.key,
                label: `${field.label}: ${parts.join(' ')}`,
                onRemove: () => onRemove(field.key),
              })
            }
            break

          case 'number-range':
            if (value.min !== undefined || value.max !== undefined) {
              const parts: string[] = []
              if (value.min !== undefined) parts.push(`≥ ${value.min}`)
              if (value.max !== undefined) parts.push(`≤ ${value.max}`)
              result.push({
                key: field.key,
                label: `${field.label}: ${parts.join(' e ')}`,
                onRemove: () => onRemove(field.key),
              })
            }
            break

          case 'toggle':
            if (value === true) {
              result.push({
                key: field.key,
                label: field.label,
                onRemove: () => onRemove(field.key),
              })
            }
            break

          case 'text':
            if (value) {
              result.push({
                key: field.key,
                label: `${field.label}: ${value}`,
                onRemove: () => onRemove(field.key),
              })
            }
            break
        }
      })
    })

    return result
  }, [values, searchText, sections, onRemove, onClearSearch])

  if (tags.length === 0) {
    return null
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tags.map((tag) => (
          <Badge
            key={tag.key}
            variant="secondary"
            style={styles.tag}
          >
            <ThemedText style={styles.tagText}>{tag.label}</ThemedText>
            <TouchableOpacity onPress={tag.onRemove} style={styles.removeButton}>
              <IconX size={14} color={colors.foreground} />
            </TouchableOpacity>
          </Badge>
        ))}

        {tags.length > 1 && (
          <Button
            variant="outline"
            size="sm"
            onPress={onClearAll}
            style={styles.clearButton}
          >
            Limpar tudo
          </Button>
        )}
      </ScrollView>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  scrollContent: {
    gap: 8,
    paddingRight: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 6,
  },
  tagText: {
    fontSize: 13,
  },
  removeButton: {
    padding: 2,
  },
  clearButton: {
    marginLeft: 4,
  },
})
