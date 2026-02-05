import { useBorrowsInfinite } from './useBorrow';
import { useInfiniteMobile } from "./use-infinite-mobile";
import type { BorrowGetManyFormData } from '@/schemas';
import type { Borrow } from '@/types';
import { BORROW_SELECT_TABLE } from '@/api-client/select-patterns';

const DEFAULT_MOBILE_PAGE_SIZE = 40;

export const useBorrowsInfiniteMobile = (filters: Partial<BorrowGetManyFormData> = {}) => {
  // Extract select from filters if provided (from list config), otherwise use default
  const { select: filtersSelect, ...restFilters } = filters as any;

  // Base infinite query with mobile-optimized page size
  // Use select from config if provided, otherwise use default BORROW_SELECT_TABLE
  const baseQuery = useBorrowsInfinite({
    limit: DEFAULT_MOBILE_PAGE_SIZE,
    ...restFilters,
    // Prefer select over include for optimized data fetching (40-60% reduction)
    select: filtersSelect || BORROW_SELECT_TABLE,
  });

  return useInfiniteMobile<Borrow>(baseQuery);
};