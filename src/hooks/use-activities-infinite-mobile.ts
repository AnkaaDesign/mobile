
import { useActivitiesInfinite } from './useActivity';
import { useInfiniteMobile } from "./use-infinite-mobile";
import type { ActivityGetManyFormData } from '@/schemas';

const DEFAULT_MOBILE_PAGE_SIZE = 40;

export const useActivitiesInfiniteMobile = (filters: Partial<ActivityGetManyFormData> = {}) => {
  // Base infinite query with mobile-optimized page size and includes
  const baseQuery = useActivitiesInfinite({
    limit: DEFAULT_MOBILE_PAGE_SIZE,
    ...filters,
    include: {
      item: {
        include: {
          brand: true,
          category: true,
          supplier: true,
          prices: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
      user: {
        include: {
          position: true,
          sector: true,
        },
      },
      order: true,
      orderItem: true,
    },
  });

  return useInfiniteMobile(baseQuery);
};