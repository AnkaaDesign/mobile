import React, { memo, useMemo } from 'react'
import { View, StyleSheet } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { ThemedView } from '@/components/ui/themed-view'
import { ThemedText } from '@/components/ui/themed-text'
import { useTheme } from '@/lib/theme'
import { Layout } from './index'
import type { ListConfig } from '../types'

/**
 * Props for NestedLayout component
 *
 * NestedLayout is used for list pages that depend on a parent entity (route parameter).
 * It extracts the parameter from the route, builds a where clause, and applies it to the config.
 *
 * Example:
 * ```tsx
 * <NestedLayout
 *   config={orderItemsListConfig}
 *   paramKey="orderId"
 *   buildWhere={(orderId) => ({ orderId })}
 * />
 * ```
 */
export interface NestedLayoutProps<T extends { id: string }> {
  /**
   * The list configuration to use
   * This config will be modified with the where clause from buildWhere
   */
  config: ListConfig<T>

  /**
   * The route parameter key to extract from useLocalSearchParams
   * Examples: 'orderId', 'formulaId', 'itemId'
   */
  paramKey: string

  /**
   * Optional function to build the where clause from the route parameter
   * If not provided, defaults to: { [paramKey.replace('Id', '')]: paramValue }
   *
   * @param paramValue The extracted parameter value
   * @returns A Prisma where clause object
   *
   * Example for simple case:
   * ```tsx
   * (orderId) => ({ orderId })
   * ```
   *
   * Example for complex case with AND logic:
   * ```tsx
   * (formulaId) => ({
   *   AND: [
   *     { formulaPaintId: formulaId },
   *     { isActive: true }
   *   ]
   * })
   * ```
   */
  buildWhere?: (paramValue: string) => any

  /**
   * Optional callback when parameter is missing or invalid
   * Useful for custom error handling
   */
  onParamError?: (paramKey: string, paramValue: any) => React.ReactNode

  /**
   * Whether to validate that the parameter exists and is a non-empty string
   * Default: true
   */
  validateParam?: boolean
}

/**
 * NestedLayout Component
 *
 * Handles nested list pages that depend on a parent entity ID from the route.
 *
 * Features:
 * - Extracts route parameters using useLocalSearchParams
 * - Validates parameter existence
 * - Builds and applies where clause filter
 * - Merges with existing config where clause if present
 * - Provides error handling for missing parameters
 *
 * Typical Use Cases:
 * 1. Order Items: List items within a specific order
 * 2. Formula Components: List components within a formula
 * 3. Employee PPE: List PPE assignments for an employee
 *
 * @example
 * ```tsx
 * import { NestedLayout } from '@/components/list/NestedLayout'
 * import { orderItemsListConfig } from '@/config/list/inventory/order-items'
 *
 * export default function OrderItemsListScreen() {
 *   return (
 *     <NestedLayout
 *       config={orderItemsListConfig}
 *       paramKey="orderId"
 *       buildWhere={(orderId) => ({ orderId })}
 *     />
 *   )
 * }
 * ```
 */
export const NestedLayout = memo(function NestedLayout<T extends { id: string }>({
  config,
  paramKey,
  buildWhere,
  onParamError,
  validateParam = true,
}: NestedLayoutProps<T>) {
  const { colors } = useTheme()
  const params = useLocalSearchParams()

  // Extract the parameter value
  const paramValue = params[paramKey] as string | undefined

  // Validate parameter if requested
  if (validateParam && (!paramValue || paramValue.trim() === '')) {
    return (
      <ThemedView style={styles.container}>
        {onParamError ? (
          onParamError(paramKey, paramValue)
        ) : (
          <View style={styles.errorContainer}>
            <ThemedText style={styles.errorTitle}>Parâmetro não encontrado</ThemedText>
            <ThemedText style={styles.errorMessage}>
              O parâmetro "{paramKey}" é obrigatório para acessar esta página.
            </ThemedText>
          </View>
        )}
      </ThemedView>
    )
  }

  // Build the where clause
  const whereClause = useMemo(() => {
    if (!paramValue) return config.query.where || {}

    // Use custom buildWhere function if provided
    if (buildWhere) {
      const customWhere = buildWhere(paramValue)
      // Merge with existing where clause if present
      return config.query.where
        ? { AND: [config.query.where, customWhere] }
        : customWhere
    }

    // Default behavior: convert paramKey 'orderId' to 'order' or 'orderId' to 'orderId'
    const fieldKey = paramKey.endsWith('Id')
      ? paramKey.slice(0, -2) // Remove 'Id' suffix for camelCase field names
      : paramKey

    const defaultWhere = { [fieldKey]: paramValue }

    // Merge with existing where clause
    return config.query.where
      ? { AND: [config.query.where, defaultWhere] }
      : defaultWhere
  }, [paramValue, buildWhere, config.query.where, paramKey])

  // Create modified config with the where clause
  const modifiedConfig: ListConfig<T> = useMemo(
    () => ({
      ...config,
      query: {
        ...config.query,
        where: whereClause,
      },
    }),
    [config, whereClause]
  )

  return <Layout config={modifiedConfig} />
})

NestedLayout.displayName = 'NestedLayout'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  errorContainer: {
    alignItems: 'center',
    gap: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
})
