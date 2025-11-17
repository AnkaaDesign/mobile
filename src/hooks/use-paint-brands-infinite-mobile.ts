import { useInfiniteQuery } from "@tanstack/react-query";
import { getPaintBrands } from '@/api-client';
import { paintBrandKeys } from './queryKeys';
import type { PaintBrandGetManyFormData } from '@/schemas';

export const usePaintBrandsInfiniteMobile = (filters?: Partial<PaintBrandGetManyFormData>) => {
  const pageSize = 40;

  const query = useInfiniteQuery({
    queryKey: paintBrandKeys.list(filters),
    queryFn: async ({ pageParam = 1 }) => {
      const params: PaintBrandGetManyFormData = {
        page: pageParam,
        perPage: pageSize,
        orderBy: filters?.orderBy || { name: "asc" },
        include: {
          _count: {
            select: {
              paints: true,
            }
          },
        },
        ...filters,
      };

      return getPaintBrands(params);
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.meta?.hasNextPage) return undefined;
      return allPages.length + 1;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const allItems = query.data?.pages.flatMap((page) => page.data || []) ?? [];
  const totalItemsLoaded = allItems.length;
  const totalCount = query.data?.pages[0]?.meta?.totalRecords;

  return {
    items: allItems,
    paintBrands: allItems, // Alias for backward compatibility
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
    loadMore: query.fetchNextPage,
    canLoadMore: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    totalItemsLoaded,
    totalCount,
    refresh: async () => {
      await query.refetch();
    },
  };
};
