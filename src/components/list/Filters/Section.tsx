import { memo, useCallback } from 'react'
import { View, StyleSheet } from 'react-native'
import { SelectField, DateRangeField, NumberRangeField, ToggleField, TextField } from './Fields'
import type { FilterSection, FilterValue, FilterField } from '../types'

interface SectionProps {
  section: FilterSection
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
    <View style={styles.container}>
      <View style={styles.content}>
        {section.fields.map(renderField)}
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
})
