import { memo } from 'react'
import { View, TouchableOpacity, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { useTheme } from '@/lib/theme'
import { Icon } from '@/components/ui/icon'
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react-native'
import { SelectField, DateRangeField, NumberRangeField, ToggleField, TextField } from './Fields'
import type { FilterSection as FilterSectionType, FilterValue, FilterField } from '../types'

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

interface SectionProps {
  section: FilterSectionType
  values: FilterValue
  onChange: (values: FilterValue) => void
  optionsData?: Record<string, Array<{ label: string; value: any }>>
}

export const Section = memo(function Section({
  section,
  values,
  onChange,
  optionsData,
}: SectionProps) {
  const { colors } = useTheme()
  const [isExpanded, setIsExpanded] = useState(section.defaultOpen !== false)

  const toggleExpanded = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setIsExpanded((prev) => !prev)
  }, [])

  const handleFieldChange = useCallback(
    (fieldKey: string, value: any) => {
      onChange({
        ...values,
        [fieldKey]: value,
      })
    },
    [values, onChange]
  )

  const renderField = useCallback(
    (field: FilterField) => {
      const fieldValue = values[field.key]

      switch (field.type) {
        case 'select':
          return (
            <SelectField
              key={field.key}
              field={field}
              value={fieldValue}
              onChange={(value) => handleFieldChange(field.key, value)}
              options={optionsData?.[field.key]}
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
    [values, handleFieldChange, optionsData]
  )

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      <TouchableOpacity
        style={styles.header}
        onPress={toggleExpanded}
        activeOpacity={0.7}
      >
        <View style={styles.headerContent}>
          {section.icon && <Icon name={section.icon} size="sm" />}
          <ThemedText style={[styles.title, { color: colors.foreground }]}>
            {section.label}
          </ThemedText>
        </View>
        {isExpanded ? (
          <IconChevronUp size={20} color={colors.mutedForeground} />
        ) : (
          <IconChevronDown size={20} color={colors.mutedForeground} />
        )}
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.content}>
          {section.fields.map(renderField)}
        </View>
      )}
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
})
