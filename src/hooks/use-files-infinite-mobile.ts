import { useMemo } from "react";
import { useFilesInfinite } from './useFile';
import { FileGetManyFormData } from '@/schemas';
import { useInfiniteMobile } from "./use-infinite-mobile";

// Mobile-optimized page size for files
const MOBILE_FILES_PAGE_SIZE = 25;

/**
 * Mobile-optimized hook for infinite scrolling files
 * Uses smaller page sizes and provides flattened data for FlatList
 */
export function useFilesInfiniteMobile(params?: Partial<FileGetManyFormData> & { enabled?: boolean }) {
  // Prepare parameters with mobile-optimized page size
  const queryParams = useMemo(
    () => ({
      ...params,
      limit: MOBILE_FILES_PAGE_SIZE,
    }),
    [params],
  );

  // Use the existing infinite query hook
  const infiniteQuery = useFilesInfinite(queryParams);

  // Apply mobile optimizations
  return useInfiniteMobile(infiniteQuery);
}
