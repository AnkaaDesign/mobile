import { QueryClient } from '@tanstack/react-query'

// Create a client outside the component to prevent recreation on renders
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep data fresh for 5 minutes
      staleTime: 1000 * 60 * 5,
      // Keep data in cache for 24 hours
      gcTime: 1000 * 60 * 60 * 24,
      // Refetch when the app regains connectivity
      refetchOnReconnect: true,
      refetchOnWindowFocus: false, // Disable for mobile
      // Retry failed queries, but don't retry if they failed due to being offline
      retry: (failureCount, error: any) => {
        if (error?.isOffline) return false
        // Don't retry on 4xx errors (client errors)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false
        }
        return failureCount < 3
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    },
    mutations: {
      retry: (failureCount, error: any) => {
        if (error?.isOffline) return false
        // Never retry mutations on client errors
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false
        }
        // Only retry network errors once for mutations
        return failureCount < 1
      },
      retryDelay: 2000, // 2 second delay for mutation retries
    },
  },
})
