
import { useBorrowsInfinite } from './useBorrow';
import { useInfiniteMobile } from "./use-infinite-mobile";
import type { BorrowGetManyFormData } from '@/schemas';

const DEFAULT_MOBILE_PAGE_SIZE = 40;

export const useBorrowsInfiniteMobile = (filters: Partial<BorrowGetManyFormData> = {}) => {
  // Base infinite query with mobile-optimized page size and includes
  const baseQuery = useBorrowsInfinite({
    limit: DEFAULT_MOBILE_PAGE_SIZE,
    ...filters,
    include: {
      item: {
        include: {
          brand: true,
          category: true,
          supplier: true,
        },
      },
      user: {
        include: {
          position: true,
          sector: true,
        },
      },
    },
  });

  return useInfiniteMobile(baseQuery);
};