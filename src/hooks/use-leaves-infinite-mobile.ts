import { useMemo } from "react";
import { useLeavesInfinite } from "./useLeave";
import type { LeaveGetManyFormData } from "@/schemas";
import type { Leave } from "@/types";
import { useInfiniteMobile } from "./use-infinite-mobile";

const MOBILE_LEAVES_PAGE_SIZE = 25;

/**
 * Mobile-optimized infinite scroll hook for leaves (Afastamentos).
 * Resolved by name from the list-config `query.hook` string.
 */
export function useLeavesInfiniteMobile(params?: Partial<LeaveGetManyFormData> & { enabled?: boolean }) {
  const queryParams = useMemo(
    () => ({
      ...params,
      limit: MOBILE_LEAVES_PAGE_SIZE,
    }),
    [params],
  );

  const infiniteQuery = useLeavesInfinite(queryParams);

  return useInfiniteMobile<Leave>(infiniteQuery);
}
