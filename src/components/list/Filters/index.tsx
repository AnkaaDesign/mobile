import { memo, useState, useEffect, useCallback, useRef } from 'react'
import { View, ScrollView, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Keyboard, Dimensions, LayoutChangeEvent } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ThemedText } from '@/components/ui/themed-text'
import { Button } from '@/components/ui/button'
import { SlideInPanel } from '@/components/ui/slide-in-panel'
import { useTheme } from '@/lib/theme'
import { IconFilter, IconX } from '@tabler/icons-react-native'
import { SelectField, DateRangeField, NumberRangeField, ToggleField, TextField } from './Fields'
import type { FiltersProps, FilterField, FilterValue } from '../types'

const SCREEN_HEIGHT = Dimensions.get('window').height

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
  const scrollViewRef = useRef<ScrollView>(null)
  const fieldLayoutsRef = useRef<Map<string, { y: number; height: number }>>(new Map())
  const scrollViewYRef = useRef(0)
  const currentScrollY = useRef(0)

  // Local state for uncommitted changes
  const [localValues, setLocalValues] = useState(values)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [focusedFieldKey, setFocusedFieldKey] = useState<string | null>(null)
  const [comboboxExtraPadding, setComboboxExtraPadding] = useState(0)

  // Intelligent keyboard-aware scrolling when a field is focused
  useEffect(() => {
    if (!focusedFieldKey || keyboardHeight === 0) return

    const fieldLayout = fieldLayoutsRef.current.get(focusedFieldKey)
    if (!fieldLayout || !scrollViewRef.current) return

    // Calculate where the field's bottom is on screen (accounting for current scroll)
    const fieldBottomOnScreen = fieldLayout.y - currentScrollY.current + scrollViewYRef.current + fieldLayout.height

    // Calculate the visible area bottom (above keyboard with small padding)
    const visibleAreaBottom = SCREEN_HEIGHT - keyboardHeight - 16

    // Only scroll if the field's bottom is hidden by keyboard
    if (fieldBottomOnScreen > visibleAreaBottom) {
      // Calculate exactly how much the field is hidden
      const hiddenAmount = fieldBottomOnScreen - visibleAreaBottom

      // Scroll just enough to show the field (minimal padding)
      const targetScrollY = currentScrollY.current + hiddenAmount + 8

      scrollViewRef.current.scrollTo({
        y: targetScrollY,
        animated: true,
      })
    }
  }, [focusedFieldKey, keyboardHeight])

  // Track keyboard visibility
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'

    const showListener = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height)
    })

    const hideListener = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0)
      setFocusedFieldKey(null)
    })

    return () => {
      showListener.remove()
      hideListener.remove()
    }
  }, [])

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

  // Handle field layout measurement
  const handleFieldLayout = useCallback((fieldKey: string, event: LayoutChangeEvent) => {
    const { y, height } = event.nativeEvent.layout
    fieldLayoutsRef.current.set(fieldKey, { y, height })
  }, [])

  // Handle field focus
  const handleFieldFocus = useCallback((fieldKey: string) => {
    setFocusedFieldKey(fieldKey)
  }, [])

  // Handle combobox opening - scroll to position input at top of screen
  // Returns true if scrolling was needed
  const handleComboboxOpen = useCallback((measurements: { inputY: number; inputHeight: number; requiredHeight: number }): boolean => {
    if (!scrollViewRef.current) return false

    const { inputY } = measurements

    // Target: position input near the top of the screen (with space for label)
    // scrollViewYRef.current contains the Y position of the ScrollView on screen
    const topPadding = 30 // Space for label above the input
    const targetInputY = scrollViewYRef.current + topPadding

    // Calculate scroll amount needed to move input to top
    const scrollAmount = inputY - targetInputY

    console.log('[Filters] Combobox scroll to top:', {
      inputY,
      targetInputY,
      scrollAmount,
      currentScrollY: currentScrollY.current,
      scrollViewY: scrollViewYRef.current,
      SCREEN_HEIGHT,
    })

    // Scroll if input is below target position
    if (scrollAmount > 0) {
      // Add extra padding to allow scroll room
      setComboboxExtraPadding(scrollAmount + 300)

      // Then scroll after a brief delay to let padding apply
      setTimeout(() => {
        const targetScrollY = currentScrollY.current + scrollAmount
        console.log('[Filters] Executing scroll to:', targetScrollY)
        scrollViewRef.current?.scrollTo({
          y: Math.max(0, targetScrollY),
          animated: true,
        })
      }, 50)
      return true
    }
    return false
  }, [])

  // Function to reset padding when combobox closes
  const handleComboboxClose = useCallback(() => {
    setComboboxExtraPadding(0)
  }, [])

  const renderField = useCallback(
    (field: FilterField) => {
      const fieldValue = localValues[field.key]

      const wrapWithLayout = (component: React.ReactNode) => (
        <View
          key={field.key}
          onLayout={(e) => handleFieldLayout(field.key, e)}
        >
          {component}
        </View>
      )

      switch (field.type) {
        case 'select':
          return wrapWithLayout(
            <SelectField
              field={field}
              value={fieldValue}
              onChange={(value) => handleFieldChange(field.key, value)}
              onOpen={handleComboboxOpen}
              onClose={handleComboboxClose}
            />
          )

        case 'date-range':
          return wrapWithLayout(
            <DateRangeField
              field={field}
              value={fieldValue}
              onChange={(value) => handleFieldChange(field.key, value)}
            />
          )

        case 'number-range':
          return wrapWithLayout(
            <NumberRangeField
              field={field}
              value={fieldValue}
              onChange={(value) => handleFieldChange(field.key, value)}
              onFocus={() => handleFieldFocus(field.key)}
            />
          )

        case 'toggle':
          return wrapWithLayout(
            <ToggleField
              field={field}
              value={fieldValue}
              onChange={(value) => handleFieldChange(field.key, value)}
            />
          )

        case 'text':
          return wrapWithLayout(
            <TextField
              field={field}
              value={fieldValue}
              onChange={(value) => handleFieldChange(field.key, value)}
              onFocus={() => handleFieldFocus(field.key)}
            />
          )

        default:
          return null
      }
    },
    [localValues, handleFieldChange, handleFieldLayout, handleFieldFocus, handleComboboxOpen, handleComboboxClose]
  )

  return (
    <SlideInPanel isOpen={isOpen} onClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.container, { backgroundColor: colors.background }]}
        keyboardVerticalOffset={0}
      >
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
          ref={scrollViewRef}
          style={styles.content}
          contentContainerStyle={[
            styles.scrollContent,
            {
              // Dynamic padding: extra when combobox needs scroll room
              paddingBottom: keyboardHeight > 0
                ? keyboardHeight + 120
                : insets.bottom + 100 + comboboxExtraPadding
            }
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onLayout={(e) => {
            // Measure scroll view position relative to screen
            e.target.measureInWindow?.((_x, y) => {
              scrollViewYRef.current = y
            })
          }}
          onScroll={(e) => {
            currentScrollY.current = e.nativeEvent.contentOffset.y
          }}
          scrollEventThrottle={16}
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
      </KeyboardAvoidingView>
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
    gap: 16,
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
