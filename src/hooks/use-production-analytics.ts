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
    queryKey: productionAnalyticsKeys.taskProduction(filters),
    queryFn: () => getTaskProductionStats(filters),
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });
}
