
import { useActivitiesInfinite } from './useActivity';
import { useInfiniteMobile } from "./use-infinite-mobile";
import type { ActivityGetManyFormData } from '@/schemas';

const DEFAULT_MOBILE_PAGE_SIZE = 40;

export const useActivitiesInfiniteMobile = (filters: Partial<ActivityGetManyFormData> = {}) => {
  // Base infinite query with mobile-optimized page size and select patterns
  const baseQuery = useActivitiesInfinite({
    limit: DEFAULT_MOBILE_PAGE_SIZE,
    ...filters,
    select: {
      id: true,
      quantity: true,
      operation: true,
      reason: true,
      reasonOrder: true,
      createdAt: true,
      updatedAt: true,
      userId: true,
      itemId: true,
      orderId: true,
      item: {
        select: {
          id: true,
          name: true,
          uniCode: true,
          brand: {
            select: {
              id: true,
              name: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      order: {
        select: {
          id: true,
        },
      },
      orderItem: {
        select: {
          id: true,
        },
      },
    },
  });

  return useInfiniteMobile(baseQuery);
};