import { useMemo } from "react";
import { useTasksInfinite } from './';
import { TaskGetManyFormData } from '../schemas';
import { useInfiniteMobile } from "./use-infinite-mobile";

// Mobile-optimized page size for tasks
const MOBILE_TASKS_PAGE_SIZE = 25;

/**
 * Mobile-optimized hook for infinite scrolling tasks
 * Uses smaller page sizes and provides flattened data for FlatList
 */
export function useTasksInfiniteMobile(params?: Partial<TaskGetManyFormData> & { enabled?: boolean }) {
  // Prepare parameters with mobile-optimized page size
  const queryParams = useMemo(
    () => ({
      ...params,
      limit: MOBILE_TASKS_PAGE_SIZE,
    }),
    [params],
  );

  // Use the existing infinite query hook
  const infiniteQuery = useTasksInfinite(queryParams);

  // Apply mobile optimizations
  return useInfiniteMobile(infiniteQuery as any);
}