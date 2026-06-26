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
  // A caller / list filter can pass isActive:false (Demitidos) or
  // isActive:'__all__' (Todos) to reach dismissed users.
  //
  // IMPORTANT: params reach the API RAW — getMany does NOT .parse(), so the
  // mobile user schema's transform that strips the '__all__' sentinel never
  // runs. The API's isActive is z.boolean(), so a raw '__all__' string → 400.
  // We resolve the sentinel here: '__all__' means "omit the isActive filter".
  const queryParams = useMemo(() => {
    const { isActive, ...rest } = params ?? {};
    return {
      ...(isActive === "__all__" ? {} : { isActive: isActive ?? true }),
      ...rest,
      limit: MOBILE_USERS_PAGE_SIZE,
    };
  }, [params]);

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
