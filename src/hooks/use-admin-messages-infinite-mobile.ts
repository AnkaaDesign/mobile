import { useMemo } from "react";
import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { getMessages, getMessageById, deleteMessage, batchDeleteMessages, archiveMessage, activateMessage, getMessageStats } from "@/api-client/message";
import { messageKeys } from "./queryKeys";
import { useInfiniteMobile } from "./use-infinite-mobile";

const MOBILE_PAGE_SIZE = 25;

/**
 * Mobile-optimized hook for infinite scrolling admin messages.
 * Uses GET /messages which returns all messages system-wide.
 */
export function useAdminMessagesInfiniteMobile(
  params?: Record<string, any> & { enabled?: boolean }
) {
  const { enabled = true, ...filters } = params || {};

  const queryParams = useMemo(
    () => {
      const { orderBy, ...rest } = filters;

      let flatOrderBy: string | undefined;
      let flatOrder: "asc" | "desc" | undefined;
      if (orderBy && typeof orderBy === 'object') {
        const key = Object.keys(orderBy)[0];
        flatOrderBy = key;
        flatOrder = (orderBy as Record<string, string>)[key] as "asc" | "desc";
      } else if (typeof orderBy === 'string') {
        flatOrderBy = orderBy;
      }

      return {
        ...rest,
        ...(flatOrderBy ? { orderBy: flatOrderBy } : {}),
        ...(flatOrder ? { order: flatOrder } : {}),
        limit: MOBILE_PAGE_SIZE,
      };
    },
    [filters]
  );

  const infiniteQuery = useInfiniteQuery({
    queryKey: messageKeys.list(queryParams),
    queryFn: ({ pageParam = 1 }) =>
      getMessages({ ...queryParams, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: any) => {
      if (!lastPage.meta) return undefined;
      return lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined;
    },
    enabled,
    staleTime: 1000 * 30,
  });

  return useInfiniteMobile<any>(infiniteQuery);
}

/**
 * Hook for fetching a single message by ID
 */
export function useMessage(id: string, options?: { include?: any; enabled?: boolean }) {
  return useQuery({
    queryKey: messageKeys.detail(id, options?.include),
    queryFn: () => getMessageById(id, options?.include ? { include: options.include } : undefined),
    enabled: options?.enabled !== false && !!id,
  });
}

/**
 * Hook for fetching message stats
 */
export function useMessageStats(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: messageKeys.stats(id),
    queryFn: () => getMessageStats(id),
    enabled: options?.enabled !== false && !!id,
  });
}

/**
 * Hook for deleting a single message
 */
export function useDeleteMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteMessage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messageKeys.all });
    },
  });
}

/**
 * Hook for batch deleting messages
 */
export function useBatchDeleteMessages() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { ids: string[] }) => batchDeleteMessages(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messageKeys.all });
    },
  });
}

/**
 * Hook for archiving a message
 */
export function useArchiveMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => archiveMessage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messageKeys.all });
    },
  });
}

/**
 * Hook for activating a message
 */
export function useActivateMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => activateMessage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messageKeys.all });
    },
  });
}
