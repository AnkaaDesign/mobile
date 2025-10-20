import { useInfiniteQuery } from "@tanstack/react-query";
import { paintService } from '../api-client';
import { paintKeys } from './queryKeys';
import type { PaintGetManyFormData } from '../schemas';

export const usePaintsInfiniteMobile = (filters?: Partial<PaintGetManyFormData>) => {
  const pageSize = 40;

  const query = useInfiniteQuery({
    queryKey: paintKeys.list(filters),
    queryFn: async ({ pageParam = 1 }) => {
      const params: PaintGetManyFormData = {
        page: pageParam,
        perPage: pageSize,
        orderBy: filters?.orderBy || { createdAt: "desc" },
        include: {
          brand: true,
          type: true,
          catalog: true,
          formulas: {
            include: {
              components: {
                include: {
                  component: true,
                }
              }
            },
            take: 1,
          },
          productions: {
            orderBy: { createdAt: "desc" },
            take: 5,
          },
          _count: {
            select: {
              formulas: true,
              productions: true,
            }
          },
        },
        ...filters,
      };

      return paintService.getPaints(params);
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
    refresh: async () => {
      await query.refetch();
    },
  };
};