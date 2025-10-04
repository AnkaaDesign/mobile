import { useQueryClient } from "@tanstack/react-query";
import { useItems as useItemsOriginal } from './';
import type { ItemGetManyParams } from '../types';

/**
 * Safe wrapper for useItems that ensures React Query context is available
 */
export function useItemsSafe(params?: ItemGetManyParams, options?: any) {
  // First check if we have access to the query client
  try {
    const queryClient = useQueryClient();
    if (!queryClient) {
      throw new Error("QueryClient not available");
    }

    // If we reach here, context is available
    return useItemsOriginal(params, options);
  } catch (error) {
    console.error("React Query context not available:", error);
    // Return a mock response to prevent crashes
    return {
      data: null,
      isLoading: false,
      error: new Error("React Query context not initialized"),
      refetch: async () => {},
      isRefetching: false,
    };
  }
}
