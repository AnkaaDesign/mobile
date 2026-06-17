import { useMemo } from "react";
import { useUsersInfinite } from './useUser';
import { UserGetManyFormData } from '@/schemas';
import type { User } from '@/types';
import { useInfiniteMobile } from "./use-infinite-mobile";

// Mobile-optimized page size for users
const MOBILE_USERS_PAGE_SIZE = 25;

/**
 * Mobile-optimized hook for infinite scrolling users (employees)
 * Uses smaller page sizes and provides flattened data for FlatList
 */
export function useUsersInfiniteMobile(params?: Partial<UserGetManyFormData> & { enabled?: boolean }) {
  // Prepare parameters with mobile-optimized page size.
  // DEFAULT to isActive: true (matching web behavior: hide dismissed users).
  // This is OVERRIDABLE: `...params` is spread AFTER, so a caller / list filter
  // can pass isActive:false (Demitidos) or isActive:'__all__' (Todos — stripped
  // by the schema transform → omits the filter) to reach dismissed users.
  // The userTransform maps isActive → currentContractStatus { not: TERMINATED } / TERMINATED.
  const queryParams = useMemo(
    () => ({
      isActive: true,
      ...params,
      limit: MOBILE_USERS_PAGE_SIZE,
    }),
    [params],
  );

  // Use the existing infinite query hook
  const infiniteQuery = useUsersInfinite(queryParams);

  // Apply mobile optimizations
  const mobileResult = useInfiniteMobile<User>(infiniteQuery);

  // Return with users alias for consistency with web app API
  return {
    ...mobileResult,
    users: mobileResult.items,
  };
}
