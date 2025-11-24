import React, { memo } from 'react'
import { View, Text } from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { formatDate, formatDateTime, formatCurrency } from '@/utils/formatters'
import type { CellFormat } from '../types'

interface CellContentProps {
  value: any
  format?: CellFormat
  style?: any
}

/**
 * Renders cell content with proper formatting
 * Ensures all text is wrapped in Text components
 */
export const CellContent = memo(function CellContent({
  value,
  format,
  style,
}: CellContentProps) {
  // Safety check - if no value and no format, return empty text
  if (value === undefined && !format) {
    return <ThemedText style={[{ fontSize: 12 }, style]} numberOfLines={2} ellipsizeMode="tail">-</ThemedText>
  }
  // If value is already a React element, return it as is
  if (React.isValidElement(value)) {
    return value
  }

  // Handle null/undefined for all formats
  if (value === null || value === undefined || value === '') {
    // For badge/status, return a simple inline badge
    if (format === 'badge' || format === 'status') {
      return (
        <View style={{
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 4,
          backgroundColor: '#6b7280', // gray for empty values
          alignSelf: 'flex-start',
        }}>
          <Text style={{
            fontSize: 12,
            fontWeight: '600',
            color: '#fff',
          }}>
            -
          </Text>
        </View>
      )
    }
    return <ThemedText style={[{ fontSize: 12 }, style]} variant="muted" numberOfLines={2} ellipsizeMode="tail">-</ThemedText>
  }

  // Format based on type
  switch (format) {
    case 'date':
      return (
        <ThemedText style={[{ fontSize: 12, flexShrink: 0 }, style]} numberOfLines={1} ellipsizeMode="tail">
          {value ? formatDate(value) : '-'}
        </ThemedText>
      )

    case 'datetime':
      return (
        <ThemedText style={[{ fontSize: 12 }, style]} numberOfLines={2} ellipsizeMode="tail">
          {value ? formatDateTime(value) : '-'}
        </ThemedText>
      )

    case 'datetime-multiline': {
      if (!value) {
        return <ThemedText style={[{ fontSize: 12 }, style]}>-</ThemedText>
      }
      const date = new Date(value)
      const day = date.getDate()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return (
        <View>
          <ThemedText style={[{ fontSize: 12 }, style]}>{`${day}/${month}/${year}`}</ThemedText>
          <ThemedText style={[{ fontSize: 12, opacity: 0.7 }, style]}>{`${hours}:${minutes}`}</ThemedText>
        </View>
      )
    }

    case 'currency':
      return (
        <ThemedText style={[{ fontSize: 12, fontWeight: '500' }, style]} numberOfLines={2} ellipsizeMode="tail">
          {value !== null && value !== undefined ? formatCurrency(value) : '-'}
        </ThemedText>
      )

    case 'number':
      return (
        <ThemedText style={[{ fontSize: 12 }, style]} numberOfLines={2} ellipsizeMode="tail">
          {typeof value === 'number' ? value.toLocaleString('pt-BR') : String(value)}
        </ThemedText>
      )

    case 'percentage':
      return (
        <ThemedText style={[{ fontSize: 12 }, style]} numberOfLines={2} ellipsizeMode="tail">
          {typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : String(value)}
        </ThemedText>
      )

    case 'boolean':
      return (
        <ThemedText style={[{ fontSize: 12 }, style]} numberOfLines={2} ellipsizeMode="tail">
          {value ? 'Sim' : 'Não'}
        </ThemedText>
      )

    case 'badge':
    case 'status':
      try {
        // Ensure value is safely converted to string
        const stringValue = value != null && value !== '' ? String(value) : '-'
        const variant = getStatusVariant(stringValue) || 'default'

        // Create a simple text badge without using the Badge component temporarily
        // to avoid the undefined props issue
        return (
          <View style={{
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 4,
            backgroundColor: getBadgeColor(variant),
            alignSelf: 'flex-start',
          }}>
            <Text style={{
              fontSize: 12,
              fontWeight: '600',
              color: '#fff',
            }}>
              {stringValue}
            </Text>
          </View>
        )
      } catch (error) {
        // Fallback if Badge fails
        console.warn('Badge rendering error:', error)
        return <ThemedText style={[{ fontSize: 12 }, style]} numberOfLines={2} ellipsizeMode="tail">
          {value != null ? String(value) : '-'}
        </ThemedText>
      }

    default:
      // Default: wrap any text/number in ThemedText
      return (
        <ThemedText style={[{ fontSize: 12 }, style]} numberOfLines={2} ellipsizeMode="tail">
          {String(value)}
        </ThemedText>
      )
  }
})

/**
 * Determine badge variant based on status text
 */
function getStatusVariant(status: string | null | undefined): 'default' | 'secondary' | 'success' | 'warning' | 'destructive' {
  // Safety check for null/undefined
  if (!status || typeof status !== 'string') {
    return 'secondary'
  }

  const lowerStatus = status.toLowerCase()

  if (lowerStatus.includes('active') || lowerStatus.includes('ativo') ||
      lowerStatus.includes('approved') || lowerStatus.includes('aprovado') ||
      lowerStatus.includes('completed') || lowerStatus.includes('concluído')) {
    return 'success'
  }

  if (lowerStatus.includes('pending') || lowerStatus.includes('pendente') ||
      lowerStatus.includes('processing') || lowerStatus.includes('processando')) {
    return 'warning'
  }

  if (lowerStatus.includes('inactive') || lowerStatus.includes('inativo') ||
      lowerStatus.includes('cancelled') || lowerStatus.includes('cancelado') ||
      lowerStatus.includes('rejected') || lowerStatus.includes('rejeitado')) {
    return 'destructive'
  }

  return 'default'
}

/**
 * Get badge background color based on variant
 */
function getBadgeColor(variant: string): string {
  switch (variant) {
    case 'success':
      return '#22c55e' // green
    case 'warning':
      return '#f59e0b' // amber
    case 'destructive':
      return '#ef4444' // red
    case 'secondary':
      return '#6b7280' // gray
    default:
      return '#3b82f6' // blue
  }
}