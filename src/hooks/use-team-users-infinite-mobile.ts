import { useMemo } from "react";
import { useUsersInfinite } from './';
import { UserGetManyFormData } from '../schemas';
import { useInfiniteMobile } from "./use-infinite-mobile";

// Mobile-optimized page size for users
const MOBILE_USERS_PAGE_SIZE = 30;

/**
 * Mobile-optimized hook for infinite scrolling users in My Team section
 * Filters by sector and uses smaller page sizes for mobile
 */
export function useTeamUsersInfiniteMobile(
  params?: Partial<UserGetManyFormData> & { enabled?: boolean }
) {
  // Prepare parameters with mobile-optimized page size
  const queryParams = useMemo(
    () => ({
      ...params,
      limit: MOBILE_USERS_PAGE_SIZE,
    }),
    [params],
  );

  // Use the existing infinite query hook
  const infiniteQuery = useUsersInfinite(queryParams);

  // Apply mobile optimizations
  return useInfiniteMobile(infiniteQuery);
}
