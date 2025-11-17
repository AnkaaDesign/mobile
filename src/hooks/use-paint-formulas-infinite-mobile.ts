import { useInfiniteQuery } from "@tanstack/react-query";
import { getPaintFormulas } from '@/api-client';
import { paintFormulaKeys } from './queryKeys';
import type { PaintFormulaGetManyFormData } from '@/schemas';

export const usePaintFormulasInfiniteMobile = (filters?: Partial<PaintFormulaGetManyFormData>) => {
  const pageSize = 40;

  const query = useInfiniteQuery({
    queryKey: paintFormulaKeys.list(filters),
    queryFn: async ({ pageParam = 1 }) => {
      const params: PaintFormulaGetManyFormData = {
        page: pageParam,
        perPage: pageSize,
        orderBy: filters?.orderBy || { createdAt: "desc" },
        include: {
          paint: {
            include: {
              paintType: true,
              paintBrand: true,
            },
          },
          _count: {
            select: {
              components: true,
              paintProduction: true,
            },
          },
        },
        ...filters,
      };

      return getPaintFormulas(params);
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
