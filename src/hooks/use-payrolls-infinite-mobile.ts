import { useMemo } from "react";
import { usePayrollsInfinite } from './payroll';
import type { PayrollGetManyParams } from '@/types';
import { useInfiniteMobile } from "./use-infinite-mobile";

// Mobile-optimized page size for payrolls
const MOBILE_PAYROLLS_PAGE_SIZE = 25;

/**
 * Mobile-optimized hook for infinite scrolling payrolls
 * Uses smaller page sizes and provides flattened data for FlatList
 */
export function usePayrollsInfiniteMobile(params?: Partial<PayrollGetManyParams> & { enabled?: boolean }) {
  // Prepare parameters with mobile-optimized page size
  const queryParams = useMemo(
    () => ({
      ...params,
      limit: MOBILE_PAYROLLS_PAGE_SIZE,
      include: {
        user: {
          include: {
            position: true,
            sector: true,
          },
        },
        bonus: {
          include: {
            tasks: true,
            bonusDiscounts: true, bonusExtras: true,
          },
        },
        discounts: true,
        ...params?.include,
      },
    }),
    [params],
  );

  // Use the existing infinite query hook
  const infiniteQuery = usePayrollsInfinite(queryParams);

  // Apply mobile optimizations
  return useInfiniteMobile(infiniteQuery);
}
