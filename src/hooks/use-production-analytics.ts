// mobile/src/hooks/use-production-analytics.ts
//
// React-Query wrapper for the task production analytics endpoint. Mirrors the
// web hook (web/src/hooks/production/use-production-analytics.ts) so any
// number rendered on mobile widgets matches the productivity page.

import { useQuery } from "@tanstack/react-query";
import { getTaskProductionStats } from "../api-client/production-analytics";
import type {
  TaskProductionFilters,
  TaskProductionResponse,
} from "../types/production-analytics";

export const productionAnalyticsKeys = {
  all: ["production-analytics"] as const,
  taskProduction: (filters: TaskProductionFilters) =>
    [...productionAnalyticsKeys.all, "task-production", filters] as const,
};

export function useTaskProductionStats(filters: TaskProductionFilters) {
  return useQuery<TaskProductionResponse, Error>({
    // Serialize Date objects to ISO strings so TanStack Query compares keys by
    // value rather than by reference. Without this, a new `filters` object on
    // every render produces a new cache key, triggering an infinite refetch loop.
    queryKey: [
      ...productionAnalyticsKeys.all,
      "task-production",
      {
        ...filters,
        startDate: filters.startDate?.toISOString(),
        endDate: filters.endDate?.toISOString(),
      },
    ] as const,
    // Keep the original `filters` (with Date objects) for the API call —
    // serialization is only needed for the stable query key above.
    queryFn: () => getTaskProductionStats(filters),
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });
}
