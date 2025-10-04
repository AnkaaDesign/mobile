import { useInfiniteQuery } from "@tanstack/react-query";
import { maintenanceService } from '../api-client';
import { maintenanceKeys } from './';
import type { MaintenanceGetManyFormData } from '../schemas';

export const useMaintenanceInfiniteMobile = (filters?: Partial<MaintenanceGetManyFormData>) => {
  const pageSize = 40;

  const query = useInfiniteQuery({
    queryKey: maintenanceKeys.list(filters),
    queryFn: async ({ pageParam = 1 }) => {
      const params: MaintenanceGetManyFormData = {
        page: pageParam,
        perPage: pageSize,
        orderBy: filters?.orderBy || { createdAt: "desc" },
        include: {
          vehicle: {
            include: {
              vehicleModel: {
                include: {
                  manufacturer: true,
                }
              }
            }
          },
          items: {
            include: {
              item: {
                include: {
                  brand: true,
                  category: true,
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
              items: true,
            }
          },
        },
        ...filters,
      };

      return maintenanceService.getMaintenances(params);
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