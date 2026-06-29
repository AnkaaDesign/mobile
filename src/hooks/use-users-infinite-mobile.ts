import { useMemo } from "react";
import { useUsersInfinite } from './useUser';
import { UserGetManyFormData } from '@/schemas';
import type { User } from '@/types';
import { CONTRACT_STATUS } from '@/constants';
import { useInfiniteMobile } from "./use-infinite-mobile";

// Mobile-optimized page size for users
const MOBILE_USERS_PAGE_SIZE = 25;

/**
 * Mobile-optimized hook for infinite scrolling users (employees)
 * Uses smaller page sizes and provides flattened data for FlatList
 */
export function useUsersInfiniteMobile(params?: Partial<UserGetManyFormData> & { enabled?: boolean }) {
  // Prepare parameters with mobile-optimized page size.
  // "Currently employed" is derived from the current vínculo situação — the
  // redundant User.isActive column was removed. Callers filter active users with
  // the API's `contractStatuses` convenience filter (maps to currentContractStatus).
  //
  // DEFAULT to ACTIVE-only (matching web behavior: hide dismissed users). A caller
  // / list filter can pass [TERMINATED] (Desligados) or the '__all__' sentinel
  // (Todos) to reach dismissed users.
  //
  // IMPORTANT: params reach the API RAW — getMany does NOT .parse(), so the mobile
  // user schema transform never runs. We resolve the "Exibir" selection here:
  //  • '__all__' sentinel (Todos)        → omit the filter (show all)
  //  • a single status string (Ativos/…) → wrap into a [status] array
  //  • an explicit array (direct callers) → pass through unchanged
  //  • nothing                           → default to [ACTIVE]
  const queryParams = useMemo(() => {
    const rest: any = { ...(params ?? {}) };
    const contractStatuses = rest.contractStatuses;
    delete rest.contractStatuses;

    let resolvedStatuses: CONTRACT_STATUS[] | undefined;
    if (contractStatuses === "__all__") {
      resolvedStatuses = undefined;
    } else if (Array.isArray(contractStatuses)) {
      resolvedStatuses = contractStatuses;
    } else if (typeof contractStatuses === "string") {
      resolvedStatuses = [contractStatuses as CONTRACT_STATUS];
    } else {
      resolvedStatuses = [CONTRACT_STATUS.ACTIVE];
    }

    return {
      ...(resolvedStatuses ? { contractStatuses: resolvedStatuses } : {}),
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
