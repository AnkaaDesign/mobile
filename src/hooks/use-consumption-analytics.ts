// mobile/src/hooks/use-consumption-analytics.ts

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { getConsumptionComparison } from '@/api-client';
import type {
  ConsumptionAnalyticsFilters,
  ConsumptionAnalyticsResponse,
} from '@/types/consumption-analytics';

// =====================================================
// Query Keys
// =====================================================

export const consumptionAnalyticsKeys = {
  all: ['consumption-analytics'] as const,
  comparisons: () => [...consumptionAnalyticsKeys.all, 'comparisons'] as const,
  comparison: (filters: ConsumptionAnalyticsFilters) =>
    [...consumptionAnalyticsKeys.comparisons(), filters] as const,
};

// =====================================================
// Query Options Types
// =====================================================

export type UseConsumptionAnalyticsOptions = Omit<
  UseQueryOptions<ConsumptionAnalyticsResponse, Error>,
  'queryKey' | 'queryFn'
>;

// =====================================================
// Main Hook - Get Consumption Comparison
// =====================================================

/**
 * Hook to fetch consumption analytics with comparison support
 * Supports three modes:
 * - Simple view (no sectors or users, or only 1 of each)
 * - Sector comparison (2+ sectors selected)
 * - User comparison (2+ users selected)
 *
 * @param filters - Consumption analytics filters
 * @param options - React Query options
 * @returns Query result with consumption data
 *
 * @example
 * // Simple view - most consumed items
 * const { data, isLoading } = useConsumptionAnalytics({
 *   startDate: startOfMonth(new Date()),
 *   endDate: new Date(),
 * });
 *
 * @example
 * // Sector comparison - compare 2 sectors
 * const { data, isLoading } = useConsumptionAnalytics({
 *   startDate: startOfMonth(new Date()),
 *   endDate: new Date(),
 *   sectorIds: ['sector-1-id', 'sector-2-id'],
 * });
 *
 * @example
 * // User comparison with specific items
 * const { data, isLoading } = useConsumptionAnalytics({
 *   startDate: startOfMonth(new Date()),
 *   endDate: new Date(),
 *   userIds: ['user-1-id', 'user-2-id'],
 *   itemIds: ['item-1-id', 'item-2-id'], // Optional: filter specific items
 * });
 */
export function useConsumptionAnalytics(
  filters: ConsumptionAnalyticsFilters,
  options?: UseConsumptionAnalyticsOptions,
) {
  return useQuery<ConsumptionAnalyticsResponse, Error>({
    queryKey: consumptionAnalyticsKeys.comparison(filters),
    queryFn: async () => {
      const response = await getConsumptionComparison(filters);
      return response;
    },
    staleTime: 3 * 60 * 1000, // 3 minutes - analytics data can be slightly stale
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    ...options,
  });
}

// =====================================================
// Helper Functions
// =====================================================

/**
 * Helper to determine if filters are in comparison mode
 */
export function isComparisonMode(filters: ConsumptionAnalyticsFilters): boolean {
  const hasSectorComparison = filters.sectorIds && filters.sectorIds.length >= 2;
  const hasUserComparison = filters.userIds && filters.userIds.length >= 2;
  return !!(hasSectorComparison || hasUserComparison);
}

/**
 * Helper to get comparison type
 */
export function getComparisonType(
  filters: ConsumptionAnalyticsFilters,
): 'simple' | 'sectors' | 'users' {
  if (filters.sectorIds && filters.sectorIds.length >= 2) return 'sectors';
  if (filters.userIds && filters.userIds.length >= 2) return 'users';
  return 'simple';
}

/**
 * Helper to validate filters before making the query
 */
export function validateConsumptionFilters(filters: ConsumptionAnalyticsFilters): {
  valid: boolean;
  error?: string;
} {
  // Check if both sector and user comparisons are attempted
  const hasSectorComparison = filters.sectorIds && filters.sectorIds.length >= 2;
  const hasUserComparison = filters.userIds && filters.userIds.length >= 2;

  if (hasSectorComparison && hasUserComparison) {
    return {
      valid: false,
      error: 'Não é possível comparar setores e usuários simultaneamente',
    };
  }

  // Check if end date is before start date
  if (filters.endDate < filters.startDate) {
    return {
      valid: false,
      error: 'Data final deve ser maior ou igual à data inicial',
    };
  }

  return { valid: true };
}
