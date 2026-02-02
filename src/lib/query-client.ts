import { QueryClient, focusManager } from '@tanstack/react-query'
import { AppState, AppStateStatus } from 'react-native'

// Set up React Query focus manager to use AppState for mobile
// This enables refetchOnWindowFocus to work with app foreground/background
focusManager.setEventListener((handleFocus) => {
  const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
    // When app becomes active, tell React Query that focus changed
    handleFocus(state === 'active')
  })

  return () => {
    subscription.remove()
  }
})

// Create a client outside the component to prevent recreation on renders
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep data fresh for 10 minutes (increased for better performance)
      staleTime: 1000 * 60 * 10,
      // Keep data in cache for 24 hours
      gcTime: 1000 * 60 * 60 * 24,
      // Refetch when the app regains connectivity
      refetchOnReconnect: true,
      // Disable auto-refetch on window focus for better performance
      // Users can manually refresh with pull-to-refresh when needed
      refetchOnWindowFocus: false,
      // Retry failed queries less aggressively
      retry: (failureCount, error: any) => {
        if (error?.isOffline) return false
        // Don't retry on 4xx errors (client errors)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false
        }
        return failureCount < 2 // Reduced from 3 to 2 for faster failure
      },
      retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 5000), // Faster exponential backoff
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
