import { useInfiniteQuery } from "@tanstack/react-query";
import { itemService } from '../api-client';
import { itemKeys } from './queryKeys';
import type { ItemGetManyFormData } from '../schemas';

export const usePpeInfiniteMobile = (filters?: Partial<ItemGetManyFormData>) => {
  const pageSize = 40;

  const query = useInfiniteQuery({
    queryKey: itemKeys.list(filters),
    queryFn: async ({ pageParam = 1 }) => {
      const params: ItemGetManyFormData = {
        page: pageParam,
        perPage: pageSize,
        orderBy: filters?.orderBy || { createdAt: "desc" },
        include: {
          item: {
            include: {
              category: true,
              brand: true,
              supplier: true,
            }
          },
          user: {
            include: {
              position: true,
              sector: true,
            }
          },
          _count: {
            select: {
              deliveries: true,
            }
          },
        },
        ...filters,
      };

      return itemService.getItems(params);
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