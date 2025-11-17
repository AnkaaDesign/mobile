import { memo, useState, useEffect, useCallback } from 'react'
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ThemedText } from '@/components/ui/themed-text'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SlideInPanel } from '@/components/ui/slide-in-panel'
import { useTheme } from '@/lib/theme'
import { IconFilter, IconX } from '@tabler/icons-react-native'
import { Section } from './Section'
import type { FiltersProps } from '../types'

export const Filters = memo(function Filters({
  sections,
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

  return (
    <SlideInPanel isOpen={isOpen} onClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 16, borderBottomColor: colors.border }]}>
          <View style={styles.headerContent}>
            <IconFilter size={24} color={colors.foreground} />
            <ThemedText style={[styles.title, { color: colors.foreground }]}>
              Filtros
            </ThemedText>
            {activeCount > 0 && (
              <Badge variant="destructive" style={styles.badge}>
                {activeCount}
              </Badge>
            )}
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <IconX size={24} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Sections */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        >
          {sections.map((section) => (
            <Section
              key={section.key}
              section={section}
              values={localValues}
              onChange={setLocalValues}
            />
          ))}
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16, borderTopColor: colors.border, backgroundColor: colors.background }]}>
          <Button
            variant="outline"
            onPress={handleClear}
            style={styles.button}
          >
            Limpar {activeCount > 0 && `(${activeCount})`}
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
    paddingBottom: 16,
    borderBottomWidth: 1,
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
export { Section } from './Section'
export { Tags } from './Tags'
export * from './Fields'
