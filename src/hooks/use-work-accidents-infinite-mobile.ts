import { useMemo } from "react";
import { useWorkAccidentReportsInfinite } from "./useWorkAccident";
import type { WorkAccidentReportGetManyFormData } from "@/schemas";
import type { WorkAccidentReport } from "@/types";
import { useInfiniteMobile } from "./use-infinite-mobile";

const MOBILE_WORK_ACCIDENTS_PAGE_SIZE = 25;

/**
 * Mobile-optimized infinite scroll hook for work-accident reports (CAT).
 * Resolved by name from the list-config `query.hook` string.
 */
export function useWorkAccidentReportsInfiniteMobile(params?: Partial<WorkAccidentReportGetManyFormData> & { enabled?: boolean }) {
  const queryParams = useMemo(
    () => ({
      ...params,
      limit: MOBILE_WORK_ACCIDENTS_PAGE_SIZE,
    }),
    [params],
  );

  const infiniteQuery = useWorkAccidentReportsInfinite(queryParams);

  return useInfiniteMobile<WorkAccidentReport>(infiniteQuery);
}
