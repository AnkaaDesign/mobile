import { memo, useState, useEffect, useCallback } from 'react'
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ThemedText } from '@/components/ui/themed-text'
import { Button } from '@/components/ui/button'
import { SlideInPanel } from '@/components/ui/slide-in-panel'
import { useTheme } from '@/lib/theme'
import { IconFilter, IconX } from '@tabler/icons-react-native'
import { SelectField, DateRangeField, NumberRangeField, ToggleField, TextField } from './Fields'
import type { FiltersProps, FilterField, FilterValue } from '../types'

export const Filters = memo(function Filters({
  fields,
  values,
  onChange,
  onClear,
  activeCount,
  isOpen,
  onClose,
}: FiltersProps) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()

  // Local state for uncommitted changes
  const [localValues, setLocalValues] = useState(values)

  // Sync local values when panel opens
  useEffect(() => {
    if (isOpen) {
      setLocalValues(values)
    }
  }, [isOpen, values])

  const handleApply = useCallback(() => {
    onChange(localValues)
    onClose()
  }, [localValues, onChange, onClose])

  const handleClear = useCallback(() => {
    setLocalValues({})
    onClear()
    onClose()
  }, [onClear, onClose])

  const handleFieldChange = useCallback(
    (fieldKey: string, value: any) => {
      setLocalValues((prev) => ({
        ...prev,
        [fieldKey]: value,
      }))
    },
    []
  )

  const renderField = useCallback(
    (field: FilterField) => {
      const fieldValue = localValues[field.key]

      switch (field.type) {
        case 'select':
          return (
            <SelectField
              key={field.key}
              field={field}
              value={fieldValue}
              onChange={(value) => handleFieldChange(field.key, value)}
            />
          )

        case 'date-range':
          return (
            <DateRangeField
              key={field.key}
              field={field}
              value={fieldValue}
              onChange={(value) => handleFieldChange(field.key, value)}
            />
          )

        case 'number-range':
          return (
            <NumberRangeField
              key={field.key}
              field={field}
              value={fieldValue}
              onChange={(value) => handleFieldChange(field.key, value)}
            />
          )

        case 'toggle':
          return (
            <ToggleField
              key={field.key}
              field={field}
              value={fieldValue}
              onChange={(value) => handleFieldChange(field.key, value)}
            />
          )

        case 'text':
          return (
            <TextField
              key={field.key}
              field={field}
              value={fieldValue}
              onChange={(value) => handleFieldChange(field.key, value)}
            />
          )

        default:
          return null
      }
    },
    [localValues, handleFieldChange]
  )

  return (
    <SlideInPanel isOpen={isOpen} onClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <IconFilter size={24} color={colors.foreground} />
            <ThemedText style={[styles.title, { color: colors.foreground }]}>
              Filtros
            </ThemedText>
            {activeCount > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.destructive }]}>
                <ThemedText style={[styles.badgeText, { color: '#fff' }]}>
                  {activeCount}
                </ThemedText>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <IconX size={24} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Fields */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        >
          <View style={styles.fieldsContainer}>
            {fields.map(renderField)}
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16, borderTopColor: colors.border, backgroundColor: colors.background }]}>
          <Button
            variant="outline"
            onPress={handleClear}
            style={styles.button}
          >
            {activeCount > 0 ? `Limpar (${activeCount})` : 'Limpar'}
          </Button>
          <Button
            variant="default"
            onPress={handleApply}
            style={styles.button}
          >
            Aplicar
          </Button>
        </View>
      </View>
    </SlideInPanel>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  badge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
  fieldsContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  button: {
    flex: 1,
  },
})

// Export all sub-components
export { Tags } from './Tags'
export * from './Fields'
