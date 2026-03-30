import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { nfseService } from "@/api-client/nfse";
import { nfseKeys } from "./useNfse";
import type { ElotechNfseListItem } from "@/types/invoice";
import { useInfiniteMobile } from "./use-infinite-mobile";

// Mobile-optimized page size for NFS-e
const MOBILE_NFSE_PAGE_SIZE = 50;

/**
 * Mobile-optimized hook for infinite scrolling NFS-e list
 * Wraps the paginated Elotech API into the infinite query pattern
 * expected by the Layout component.
 */
export function useNfseListInfinite(params?: Record<string, any> & { enabled?: boolean }) {
  const { enabled, ...queryParams } = params || {};

  // Prepare parameters with mobile-optimized page size
  const finalParams = useMemo(
    () => ({
      ...queryParams,
      limit: MOBILE_NFSE_PAGE_SIZE,
    }),
    [queryParams],
  );

  // Use infinite query wrapping the paginated NFS-e API
  const infiniteQuery = useInfiniteQuery({
    queryKey: [...nfseKeys.all, "list-infinite", finalParams],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await nfseService.list({
        ...finalParams,
        page: pageParam,
        limit: MOBILE_NFSE_PAGE_SIZE,
      });

      // The Elotech API returns { data: [...], total, page, limit }
      const items = response?.data || [];
      const total = response?.total ?? 0;
      const currentPage = response?.page ?? pageParam;
      const limit = response?.limit ?? MOBILE_NFSE_PAGE_SIZE;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const hasNextPage = currentPage < totalPages;

      return {
        data: items,
        meta: {
          totalRecords: total,
          page: currentPage,
          hasNextPage,
        },
      };
    },
    getNextPageParam: (lastPage: any) => {
      if (!lastPage?.meta) return undefined;
      return lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: enabled ?? true,
  });

  // Apply mobile optimizations (flattening, deduplication, etc.)
  // Note: ElotechNfseListItem uses numeric `id`, cast to satisfy the { id: string } constraint
  const result = useInfiniteMobile<ElotechNfseListItem & { id: any }>(infiniteQuery);

  return {
    ...result,
    nfseItems: result.items,
  };
}
