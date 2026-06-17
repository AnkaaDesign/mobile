import { QueryClient, focusManager, onlineManager } from '@tanstack/react-query'
import { AppState, AppStateStatus } from 'react-native'
import NetInfo from '@react-native-community/netinfo'

// Set up React Query online manager to use NetInfo for mobile
// IMPORTANT: Use isConnected (has any network), NOT isInternetReachable.
// On LAN without internet, isInternetReachable is false but the local API
// server IS reachable. Using isInternetReachable would pause ALL queries
// even when the API works fine on the local network.
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    // isConnected = device has network (WiFi, cellular, ethernet)
    // This allows React Query to work on LAN without internet
    setOnline(state.isConnected === true)
  })
})

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
      // ALWAYS run queries regardless of onlineManager's online/offline state.
      // The default ('online') PAUSES queries whenever NetInfo reports
      // isConnected !== true — including the `null`/undetermined window that
      // occurs right after app resume or a WiFi handoff. A paused query sits in
      // status:'pending' / fetchStatus:'paused' forever (never runs, never
      // errors), which is what left navigation loading overlays stuck until a
      // minimize/maximize re-emitted `isConnected:true` and resumed them.
      // This app is meant to work on LAN-without-internet, so connectivity must
      // never gate execution — let axios/the API be the source of truth and
      // surface a real error (handled by `retry` below) instead of an infinite
      // pause. `refetchOnReconnect` still works via onlineManager transitions.
      networkMode: 'always',
      // Keep data fresh for 5 minutes. Lower than before (10m) so screens that
      // re-enter view get reasonably fresh data without paying for a refetch
      // every visit — the previous value made the app feel stuck.
      staleTime: 1000 * 60 * 5,
      // Keep data in cache for 2 hours. The previous 24h value kept a huge
      // working set in memory on long sessions, and `refetchOnReconnect`
      // (when set to `true`) would refetch ALL of it on a network blip.
      gcTime: 1000 * 60 * 60 * 2,
      // Only refetch on reconnect for queries that have actually gone stale.
      refetchOnReconnect: 'always',
      // Disable auto-refetch on window focus for better performance
      // Users can manually refresh with pull-to-refresh when needed
      refetchOnWindowFocus: false,
      // Default to NOT refetching on mount when there's cached data — this
      // removes the flash of loading every time you navigate back to a list.
      // List screens that need always-fresh data can opt-in per-query.
      refetchOnMount: false,
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
      // Reuse cached data across reference identities — fewer re-renders for
      // consumers when a refetch returns logically-equivalent data.
      structuralSharing: true,
    },
    mutations: {
      // Same rationale as queries: never let a transient offline/undetermined
      // NetInfo state pause a mutation into a permanent pending spinner.
      networkMode: 'always',
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
