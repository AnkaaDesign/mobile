import { useInfiniteQuery } from "@tanstack/react-query";
import { ppeDeliveryService } from '@/api-client';
import { ppeDeliveryKeys } from './queryKeys';
import type { PpeDeliveryGetManyFormData } from '@/schemas';

export const usePpeDeliveriesInfiniteMobile = (filters?: Partial<PpeDeliveryGetManyFormData>) => {
  const pageSize = 40;

  const query = useInfiniteQuery({
    queryKey: ppeDeliveryKeys.list(filters),
    queryFn: async ({ pageParam = 1 }) => {
      const params: PpeDeliveryGetManyFormData = {
        page: pageParam,
        perPage: pageSize,
        orderBy: filters?.orderBy || { actualDeliveryDate: "desc" },
        include: {
          user: {
            include: {
              position: true,
              sector: true,
            }
          },
          item: {
            include: {
              category: true,
              brand: true,
            }
          },
          reviewedByUser: true,
          ppeSchedule: true,
        },
        ...filters,
      };

      return ppeDeliveryService.getPpeDeliveries(params);
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.meta?.hasNextPage) return undefined;
      return allPages.length + 1;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const allDeliveries = query.data?.pages.flatMap((page) => page.data || []) ?? [];
  const totalItemsLoaded = allDeliveries.length;
  const totalCount = query.data?.pages[0]?.meta?.totalRecords;

  return {
    items: allDeliveries,
    deliveries: allDeliveries, // Alias for backward compatibility
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
