import { useMemo } from "react";
import { useUsersInfinite } from './useUser';
import { UserGetManyFormData } from '@/schemas';
import { useInfiniteMobile } from "./use-infinite-mobile";
import type { User } from '@/types';

// Mobile-optimized page size for users
const MOBILE_USERS_PAGE_SIZE = 25;

/**
 * Mobile-optimized hook for infinite scrolling users (employees)
 * Uses smaller page sizes and provides flattened data for FlatList
 */
export function useUsersInfiniteMobile(params?: Partial<UserGetManyFormData> & { enabled?: boolean }) {
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
  const mobileResult = useInfiniteMobile<User>(infiniteQuery);

  // Return with users alias for consistency with web app API
  return {
    ...mobileResult,
    users: mobileResult.items,
  };
}
