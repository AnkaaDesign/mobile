import React, { memo, useState, useMemo } from 'react'
import { View, Text, useColorScheme, Image, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import { ThemedText } from '@/components/ui/themed-text'
import { FileTypeIcon } from '@/components/ui/file-type-icon'
import { formatDate, formatDateTime, formatCurrency } from '@/utils/formatters'
import { getBadgeVariant, BADGE_COLORS, type BadgeVariant } from '@/constants/badge-colors'
import { getCurrentApiUrl } from '@/api-client'
import {
  ORDER_STATUS_LABELS,
  USER_STATUS_LABELS,
  TASK_STATUS_LABELS,
  MAINTENANCE_STATUS_LABELS,
  VACATION_STATUS_LABELS,
  EXTERNAL_WITHDRAWAL_STATUS_LABELS,
  BORROW_STATUS_LABELS,
  PPE_REQUEST_STATUS_LABELS,
  PPE_DELIVERY_STATUS_LABELS,
  SERVICE_ORDER_STATUS_LABELS,
  CUT_STATUS_LABELS,
  COMMISSION_STATUS_LABELS,
} from '@/constants/enum-labels'
import type { CellFormat } from '../types'
import type { File as AnkaaFile } from '@/types'

// Pre-defined styles extracted from inline definitions for better performance
// These are created once and reused, preventing object recreation on each render
const cellStyles = StyleSheet.create({
  thumbnailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  thumbnailContainer: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: '#e5e5e5',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: 40,
    height: 40,
  },
  thumbnailLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e5e5e5',
  },
  thumbnailText: {
    fontSize: 12,
    flex: 1,
  },
  emptyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#6b7280',
    alignSelf: 'flex-start',
  },
  emptyBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  baseText: {
    fontSize: 12,
  },
  currencyText: {
    fontSize: 12,
    fontWeight: '500',
  },
})

// Entity label maps for badge display
const ENTITY_LABEL_MAPS: Record<string, Record<string, string>> = {
  ORDER: ORDER_STATUS_LABELS,
  USER: USER_STATUS_LABELS,
  TASK: TASK_STATUS_LABELS,
  MAINTENANCE: MAINTENANCE_STATUS_LABELS,
  VACATION: VACATION_STATUS_LABELS,
  EXTERNAL_WITHDRAWAL: EXTERNAL_WITHDRAWAL_STATUS_LABELS,
  BORROW: BORROW_STATUS_LABELS,
  PPE_REQUEST: PPE_REQUEST_STATUS_LABELS,
  PPE_DELIVERY: PPE_DELIVERY_STATUS_LABELS,
  SERVICE_ORDER: SERVICE_ORDER_STATUS_LABELS,
  CUT: CUT_STATUS_LABELS,
  COMMISSION_STATUS: COMMISSION_STATUS_LABELS,
}

/**
 * Get display label for a status value based on entity type
 */
function getStatusLabel(value: string, entity?: string): string {
  if (!entity || !ENTITY_LABEL_MAPS[entity]) {
    return value
  }
  return ENTITY_LABEL_MAPS[entity][value] || value
}

/**
 * Get thumbnail URL for a file
 */
function getFileThumbnailUrl(file: AnkaaFile, size: 'small' | 'medium' | 'large' = 'small'): string {
  const apiUrl = getCurrentApiUrl()

  if (file.thumbnailUrl) {
    if (file.thumbnailUrl.startsWith('http://') || file.thumbnailUrl.startsWith('https://')) {
      try {
        const urlObj = new URL(file.thumbnailUrl)
        const pathname = (urlObj as any).pathname || ''
        return `${apiUrl}${pathname}?size=${size}`
      } catch {
        return `${apiUrl}/files/thumbnail/${file.id}?size=${size}`
      }
    }
    return `${apiUrl}/files/thumbnail/${file.id}?size=${size}`
  }

  // For images without thumbnails, use serve endpoint
  const imageMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
  if (imageMimeTypes.includes(file.mimetype?.toLowerCase() || '')) {
    return `${apiUrl}/files/serve/${file.id}`
  }

  return ''
}

/**
 * File Thumbnail Component for table cells
 */
const FileThumbnail = memo(function FileThumbnail({
  file,
  onPress,
}: {
  file: AnkaaFile
  onPress?: () => void
}) {
  const [thumbnailError, setThumbnailError] = useState(false)
  const [thumbnailLoading, setThumbnailLoading] = useState(true)

  const thumbnailUrl = getFileThumbnailUrl(file, 'small')
  const hasThumbnail = !!thumbnailUrl
  const filename = file.filename || file.key || 'arquivo'

  const content = (
    <View style={cellStyles.thumbnailRow}>
      <View style={cellStyles.thumbnailContainer}>
        {hasThumbnail && !thumbnailError ? (
          <>
            <Image
              source={{ uri: thumbnailUrl, cache: 'force-cache' }}
              style={cellStyles.thumbnailImage}
              onLoad={() => setThumbnailLoading(false)}
              onError={() => {
                setThumbnailError(true)
                setThumbnailLoading(false)
              }}
              resizeMode="cover"
            />
            {thumbnailLoading && (
              <View style={cellStyles.thumbnailLoading}>
                <ActivityIndicator size="small" color="#737373" />
              </View>
            )}
          </>
        ) : (
          <FileTypeIcon filename={filename} mimeType={(file.mimetype || '') as string} size="sm" />
        )}
      </View>
      <ThemedText style={cellStyles.thumbnailText} numberOfLines={2} ellipsizeMode="middle">
        {filename as string}
      </ThemedText>
    </View>
  )

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        delayPressIn={100}
      >
        {content}
      </TouchableOpacity>
    )
  }

  return content
})

interface CellContentProps {
  value: any
  format?: CellFormat
  style?: any
  badgeEntity?: string // Entity type for badge color resolution (e.g., 'ORDER', 'TASK', 'USER')
  rawValue?: any // Raw value for badge color lookup (when different from rendered value)
  component?: string // Special component to render (e.g., 'file-thumbnail')
  onCellPress?: () => void // Callback when cell is pressed (for file-thumbnail)
}

// Export FileThumbnail for external use
export { FileThumbnail }

/**
 * Renders cell content with proper formatting
 * Ensures all text is wrapped in Text components
 */
export const CellContent = memo(function CellContent({
  value,
  format,
  style,
  badgeEntity,
  rawValue,
  component,
  onCellPress,
}: CellContentProps) {
  const colorScheme = useColorScheme()

  // Handle special component types first
  if (component === 'file-thumbnail' && value && typeof value === 'object' && 'id' in value) {
    return <FileThumbnail file={value as AnkaaFile} onPress={onCellPress} />
  }

  // Safety check - if no value and no format, return empty text
  if (value === undefined && !format) {
    return <ThemedText style={[cellStyles.baseText, style]} numberOfLines={2} ellipsizeMode="tail">-</ThemedText>
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
        <View style={cellStyles.emptyBadge}>
          <Text style={cellStyles.emptyBadgeText}>-</Text>
        </View>
      )
    }
    return <ThemedText style={[cellStyles.baseText, style]} variant="muted" numberOfLines={2} ellipsizeMode="tail">-</ThemedText>
  }

  // Format based on type
  switch (format) {
    case 'date':
      return (
        <ThemedText style={[cellStyles.baseText, { flexShrink: 0 }, style]} numberOfLines={1} ellipsizeMode="tail">
          {value ? formatDate(value) : '-'}
        </ThemedText>
      )

    case 'datetime':
      return (
        <ThemedText style={[cellStyles.baseText, style]} numberOfLines={2} ellipsizeMode="tail">
          {value ? formatDateTime(value) : '-'}
        </ThemedText>
      )

    case 'datetime-multiline': {
      if (!value) {
        return <ThemedText style={[cellStyles.baseText, style]}>-</ThemedText>
      }
      const date = new Date(value)
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = String(date.getFullYear()).slice(-2)
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return (
        <>
          <ThemedText style={[cellStyles.baseText, style]}>{`${day}/${month}/${year}`}</ThemedText>
          <ThemedText style={[cellStyles.baseText, { opacity: 0.7 }, style]}>{`${hours}:${minutes}`}</ThemedText>
        </>
      )
    }

    case 'currency':
      return (
        <ThemedText style={[cellStyles.currencyText, style]} numberOfLines={2} ellipsizeMode="tail">
          {value !== null && value !== undefined ? formatCurrency(value) : '-'}
        </ThemedText>
      )

    case 'number':
      return (
        <ThemedText style={[cellStyles.baseText, style]} numberOfLines={2} ellipsizeMode="tail">
          {typeof value === 'number' ? value.toLocaleString('pt-BR') : String(value)}
        </ThemedText>
      )

    case 'percentage':
      return (
        <ThemedText style={[cellStyles.baseText, style]} numberOfLines={2} ellipsizeMode="tail">
          {typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : String(value)}
        </ThemedText>
      )

    case 'boolean':
      return (
        <ThemedText style={[cellStyles.baseText, style]} numberOfLines={2} ellipsizeMode="tail">
          {value ? 'Sim' : 'Não'}
        </ThemedText>
      )

    case 'count-badge': {
      // Fixed-width default badge for count values (like itemsCount, taskCount)
      // Matches web: bg-neutral-500 (#737373)
      // Dark mode: lighter gray (#a3a3a3 neutral-400) for visibility
      const countBgColor = colorScheme === 'dark' ? '#a3a3a3' : '#737373'
      return (
        <View style={[cellStyles.countBadge, { backgroundColor: countBgColor }]}>
          <Text style={cellStyles.countBadgeText}>
            {value != null ? String(value) : '0'}
          </Text>
        </View>
      )
    }

    case 'badge':
    case 'status':
      try {
        // Ensure value is safely converted to string for display
        const stringValue = value != null && value !== '' ? String(value) : '-'

        // Use rawValue for badge lookup if provided, otherwise try to use the display value
        const lookupValue = rawValue != null ? String(rawValue) : stringValue

        // For numeric badges without entity (like itemsCount), always use default (gray)
        const isNumericWithoutEntity = !badgeEntity && !isNaN(Number(lookupValue))

        // Use centralized badge configuration with entity context
        const variant = isNumericWithoutEntity
          ? 'default' as BadgeVariant
          : getBadgeVariant(lookupValue, badgeEntity as any) as BadgeVariant
        const badgeColors = BADGE_COLORS[variant] || BADGE_COLORS.default

        // Use the rendered value for display (which may already be translated)
        const displayLabel = stringValue

        return (
          <View style={[cellStyles.statusBadge, { backgroundColor: badgeColors.bg }]}>
            <Text
              style={[cellStyles.statusBadgeText, { color: badgeColors.text }]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {displayLabel}
            </Text>
          </View>
        )
      } catch (error) {
        // Fallback if Badge fails
        console.warn('Badge rendering error:', error)
        return <ThemedText style={[cellStyles.baseText, style]} numberOfLines={2} ellipsizeMode="tail">
          {value != null ? String(value) : '-'}
        </ThemedText>
      }

    default:
      // Default: wrap any text/number in ThemedText
      return (
        <ThemedText style={[cellStyles.baseText, style]} numberOfLines={2} ellipsizeMode="tail">
          {String(value)}
        </ThemedText>
      )
  }
})