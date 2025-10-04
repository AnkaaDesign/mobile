import { useInfiniteQuery } from "@tanstack/react-query";
import { serviceOrderService } from '../api-client';
import { serviceOrderKeys } from './';
import type { ServiceOrderGetManyFormData } from '../schemas';

export const useServiceOrdersInfiniteMobile = (filters?: Partial<ServiceOrderGetManyFormData>) => {
  const pageSize = 40;

  const query = useInfiniteQuery({
    queryKey: serviceOrderKeys.list(filters),
    queryFn: async ({ pageParam = 1 }) => {
      const params: ServiceOrderGetManyFormData = {
        page: pageParam,
        perPage: pageSize,
        orderBy: filters?.orderBy || { createdAt: "desc" },
        include: {
          customer: true,
          services: {
            include: {
              service: true,
            }
          },
          vehicle: {
            include: {
              vehicleModel: {
                include: {
                  manufacturer: true,
                }
              }
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
              services: true,
            }
          },
        },
        ...filters,
      };

      return serviceOrderService.getServiceOrders(params);
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