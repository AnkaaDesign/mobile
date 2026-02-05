import { useMemo } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useCurrentUser } from './useAuth';
import { useInfiniteMobile } from './use-infinite-mobile';
import { bonusService } from '@/api-client';
import { bonusKeys } from './queryKeys';
import type { BonusGetManyParams, Bonus } from '@/types';

/**
 * Custom infinite query hook that combines live current bonus with historical saved bonuses
 * - First page, first item: Live bonus for current period (if exists)
 * - Remaining items: Paginated historical saved bonuses (excluding current period)
 *
 * Compatible with the standard List system's infinite scroll
 */
export function useMyBonusesInfiniteMobile(
  params?: Partial<BonusGetManyParams> & { enabled?: boolean }
) {
  const { data: currentUser, isLoading: isLoadingUser } = useCurrentUser();

  // Get current payroll period (26th to 25th cycle)
  const currentDate = new Date();
  const currentDay = currentDate.getDate();

  // If we're before the 26th, the current period is the current month
  // If we're on or after the 26th, the current period is the next month
  let currentYear = currentDate.getFullYear();
  let currentMonth = currentDate.getMonth() + 1; // JS months are 0-indexed

  if (currentDay >= 26) {
    currentMonth += 1;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear += 1;
    }
  }

  // Fetch live bonus for current period using personal endpoint (no admin privileges required)
  const {
    data: liveData,
    isLoading: isLoadingLive,
  } = useQuery({
    queryKey: [...bonusKeys.all, 'my-live-bonus', currentYear, currentMonth],
    queryFn: async () => {
      const response = await bonusService.getMyLiveBonus({
        year: currentYear.toString(),
        month: currentMonth.toString(),
      });
      return response.data;
    },
    staleTime: 1000 * 30, // 30 seconds - fresh calculation data
    refetchInterval: 60000, // Refresh every minute
    enabled: !!currentUser?.id && (params?.enabled ?? true),
  });

  // Transform live bonus data to match Bonus entity structure
  const liveBonusForUser = useMemo(() => {
    if (!liveData?.data || !currentUser?.id) {
      return null;
    }

    const userBonus = liveData.data;

    // Transform to match Bonus entity structure
    // Live ID format: live-{userId}-{year}-{month} (matches backend's findByIdOrLive)
    return {
      id: `live-${currentUser.id}-${currentYear}-${currentMonth}`,
      userId: currentUser.id,
      year: currentYear,
      month: currentMonth,
      performanceLevel: userBonus.level || currentUser.performanceLevel || 3,
      baseBonus: userBonus.baseBonus || 0,
      netBonus: userBonus.netBonus || 0,
      weightedTasks: userBonus.weightedTasks || 0,
      averageTaskPerUser: userBonus.averageTaskPerUser || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: currentUser,
      bonusDiscounts: userBonus.bonusDiscounts || [],
      bonusExtras: userBonus.bonusExtras || [],
      isLive: true, // Special flag
    };
  }, [liveData, currentUser, currentYear, currentMonth]);

  // Infinite query for all saved bonuses using personal endpoint
  const infiniteQuery = useInfiniteQuery({
    queryKey: [...bonusKeys.all, 'my-bonuses-infinite', currentUser?.id, params],
    queryFn: async ({ pageParam = 1 }) => {
      const queryParams: BonusGetManyParams = {
        ...params,
        page: pageParam,
        take: 25,
        where: {
          ...params?.where,
          // NOTE: userId filter not needed - API automatically filters by current user
          // No period exclusion - show ALL saved bonuses
        },
        include: {
          user: {
            include: {
              position: true,
              sector: true,
            },
          },
          bonusDiscounts: true, bonusExtras: true,
          ...params?.include,
        },
        orderBy: params?.orderBy || [
          { year: 'desc' },
          { month: 'desc' },
        ],
      };

      // Use personal endpoint that automatically filters by current user
      const response = await bonusService.getMyBonuses(queryParams);
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.meta) return undefined;
      return lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!currentUser?.id && (params?.enabled ?? true) && !isLoadingUser,
  });

  // Combine live bonus with paginated results
  const combinedData = useMemo(() => {
    const pages = infiniteQuery.data?.pages || [];
    const allBonuses = pages.flatMap(page => page.data || []);

    // Check if there's already a saved bonus for the current period
    const hasCurrentPeriodSaved = allBonuses.some(
      bonus => bonus.year === currentYear && bonus.month === currentMonth
    );

    // Only add live bonus if there's NO saved bonus for current period
    if (liveBonusForUser && !hasCurrentPeriodSaved) {

      // Case 1: We have historical bonuses - inject live bonus at the start
      if (pages.length > 0) {
        const firstPage = pages[0];
        return {
          ...infiniteQuery.data,
          pages: [
            {
              ...firstPage,
              data: [liveBonusForUser, ...(firstPage.data || [])],
              meta: {
                ...firstPage.meta,
                totalRecords: (firstPage.meta?.totalRecords || 0) + 1,
              },
            },
            ...pages.slice(1),
          ],
        };
      }

      // Case 2: No historical bonuses yet - create a single page with just the live bonus
      return {
        pages: [
          {
            data: [liveBonusForUser],
            meta: {
              page: 1,
              take: 25,
              totalRecords: 1,
              totalPages: 1,
              hasNextPage: false,
              hasPreviousPage: false,
            },
          },
        ],
        pageParams: [1],
      };
    }

    // Return saved bonuses as-is
    return infiniteQuery.data;
  }, [infiniteQuery.data, liveBonusForUser, currentYear, currentMonth]);

  // Apply mobile optimizations (flattens pages into items array)
  // Create a modified query object with combined loading state
  const combinedQuery = {
    ...infiniteQuery,
    data: combinedData,
    isLoading: isLoadingUser || isLoadingLive || infiniteQuery.isLoading,
  } as typeof infiniteQuery;

  const result = useInfiniteMobile<Bonus>(combinedQuery);

  return result;
}
