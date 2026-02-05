import { useMemo } from "react";
import { useTasksInfinite } from './useTask';
import { TaskGetManyFormData } from '@/schemas';
import type { Task } from '@/types';
import { useInfiniteMobile } from "./use-infinite-mobile";

// Mobile-optimized page size for tasks (default for infinite scroll)
const MOBILE_TASKS_PAGE_SIZE = 25;

/**
 * Mobile-optimized hook for infinite scrolling tasks
 * Uses smaller page sizes and provides flattened data for FlatList
 *
 * Note: If a `limit` is explicitly passed in params, it will be respected.
 * This allows views like Agenda to fetch all items at once (limit: 1000)
 * while maintaining the default 25-item page size for normal infinite scroll.
 */
export function useTasksInfiniteMobile(params?: Partial<TaskGetManyFormData> & { enabled?: boolean }) {
  // Prepare parameters - respect passed limit or use default mobile page size
  const queryParams = useMemo(
    () => ({
      ...params,
      // Only use default page size if no limit was explicitly passed
      limit: params?.limit ?? MOBILE_TASKS_PAGE_SIZE,
    }),
    [params],
  );

  // Use the existing infinite query hook
  const infiniteQuery = useTasksInfinite(queryParams);

  // Apply mobile optimizations
  return useInfiniteMobile<Task>(infiniteQuery);
}