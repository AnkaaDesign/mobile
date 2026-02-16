import { memo, useRef, useEffect, useCallback, useState } from 'react'
import { View, TouchableOpacity, StyleSheet, Alert, Animated, ActivityIndicator } from 'react-native'
import { Swipeable } from 'react-native-gesture-handler'
import { ThemedText } from '@/components/ui/themed-text'
import { useTheme } from '@/lib/theme'
import { useSwipeRow } from '@/contexts/swipe-row-context'
import { useAuth } from '@/contexts/auth-context'
import { useRouter, usePathname } from 'expo-router'
import { useNavigationLoading } from '@/contexts/navigation-loading-context'
import { navigationTracker } from '@/utils/navigation-tracker'
import { IconEye, IconEdit, IconTrash, IconTruck, IconPlayerPlay, IconCircleCheck, IconCut, IconUsers, IconClipboardCopy, IconCalendarCheck, IconPhoto, IconX, IconCurrencyReal } from '@tabler/icons-react-native'
import type { TableAction, ActionMutationsContext, RenderContext } from '../types'

interface RowActionsProps<T extends { id: string }> {
  item: T
  actions: Array<TableAction<T>>
  /** Mutations for row actions (update, delete, etc.) */
  mutations?: ActionMutationsContext
  /** Render context with current route */
  renderContext?: RenderContext
  children: (closeActions: () => void) => React.ReactNode
}

export const RowActions = memo(function RowActions<T extends { id: string }>({
  item,
  actions,
  mutations,
  renderContext,
  children,
}: RowActionsProps<T>) {
  const { colors } = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const pathnameRef = useRef(pathname)
  pathnameRef.current = pathname
  const { user } = useAuth()
  const { pushWithLoading, isNavigatingRef, startNavigation, endNavigation } = useNavigationLoading()

  // Get current path - with multiple fallback strategies
  const getCurrentPath = useCallback(() => {
    // First try: usePathname hook (via ref to avoid re-renders)
    if (pathnameRef.current) return pathnameRef.current

    // Second try: renderContext might have route info
    if (renderContext?.route) return renderContext.route

    // Third try: Infer from renderContext.navigationRoute
    if (renderContext?.navigationRoute) {
      // Map navigationRoute to actual paths
      if (renderContext.navigationRoute === 'preparation') {
        return '/(tabs)/producao/agenda'
      } else if (renderContext.navigationRoute === 'schedule') {
        return '/(tabs)/producao/cronograma'
      } else if (renderContext.navigationRoute === 'history') {
        return '/(tabs)/producao/historico'
      }
    }

    // Fourth try: get from router state
    const state = router as any
    if (state?.state?.routes && state.state.routes.length > 0) {
      const currentRoute = state.state.routes[state.state.index]
      if (currentRoute?.name) {
        // Map route names to paths
        if (currentRoute.name.includes('agenda')) return '/(tabs)/producao/agenda'
        if (currentRoute.name.includes('cronograma')) return '/(tabs)/producao/cronograma'
        if (currentRoute.name.includes('historico')) return '/(tabs)/producao/historico'
        return currentRoute.name
      }
    }

    // Last resort fallback
    return '/(tabs)/inicio'
  }, [router, renderContext])
  const swipeableRef = useRef<Swipeable>(null)
  const { activeRowId, setActiveRowId, closeActiveRow } = useSwipeRow()
  const autoCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [activeActionKey, setActiveActionKey] = useState<string | null>(null)

  // Filter visible actions, excluding 'view' since it's handled by row click
  // Pass user to visible function for permission checks
  // Also check canPerform for permission-based action filtering
  const visibleActions = actions.filter(
    (action) => {
      // Always exclude 'view' action (handled by row click)
      if (action.key === 'view') return false

      // Check item-level visibility
      if (action.visible && !action.visible(item, user)) return false

      // Check user permission (canPerform)
      if (action.canPerform && !action.canPerform(user)) return false

      return true
    }
  )

  const handleOpen = useCallback(() => {
    if (activeRowId && activeRowId !== item.id) {
      closeActiveRow()
    }
    setActiveRowId(item.id)

    // Auto-close after 5 seconds
    autoCloseTimerRef.current = setTimeout(() => {
      swipeableRef.current?.close()
    }, 5000)
  }, [item.id, activeRowId, setActiveRowId, closeActiveRow])

  const handleClose = useCallback(() => {
    if (activeRowId === item.id) {
      setActiveRowId(null)
    }
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current)
      autoCloseTimerRef.current = null
    }
  }, [item.id, activeRowId, setActiveRowId])

  useEffect(() => {
    if (activeRowId && activeRowId !== item.id) {
      swipeableRef.current?.close()
    }
  }, [activeRowId, item.id])

  useEffect(() => {
    return () => {
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current)
      }
    }
  }, [])

  const closeActions = useCallback(() => {
    swipeableRef.current?.close()
  }, [])

  const handleAction = useCallback(
    async (action: TableAction<T>) => {
      // Prevent double-clicks while navigating
      if (isNavigatingRef.current) return

      closeActions()
      setActiveActionKey(action.key)

      // Build the context with mutations and render context for action handlers
      const actionContext: ActionMutationsContext = {
        ...mutations,
        user,
        route: renderContext?.route || getCurrentPath(), // Pass the current route
      }

      // Helper to execute the action (with navigation loading for route actions)
      const executeAction = async () => {
        if (action.onPress) {
          // Start navigation overlay, then defer action to next frame so overlay renders first
          startNavigation()
          const currentPath = getCurrentPath()
          navigationTracker.setSource(currentPath)
          requestAnimationFrame(async () => {
            try {
              await action.onPress!(item, router, actionContext)
            } catch (error) {
              console.error('[RowActions] Action error:', error)
              endNavigation()
            }
            setActiveActionKey(null)
          })
        } else if (action.route) {
          const route = typeof action.route === 'function' ? action.route(item) : action.route
          // Store navigation source for proper back navigation
          const currentPath = getCurrentPath()
          console.log('[RowActions] Storing navigation source:', currentPath)
          navigationTracker.setSource(currentPath)
          // Use pushWithLoading for proper navigation management
          pushWithLoading(route)
        }
      }

      if (action.confirm) {
        const message = typeof action.confirm.message === 'function'
          ? action.confirm.message(item)
          : action.confirm.message

        Alert.alert(
          action.confirm.title,
          message,
          [
            {
              text: 'Cancelar',
              style: 'cancel',
              onPress: () => setActiveActionKey(null)
            },
            {
              text: 'Confirmar',
              style: action.variant === 'destructive' ? 'destructive' : 'default',
              onPress: executeAction,
            },
          ]
        )
      } else {
        await executeAction()
      }
    },
    [item, closeActions, router, mutations, user, pushWithLoading, startNavigation, endNavigation]
  )

  const renderRightActions = useCallback(
    (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
      return (
        <View style={styles.actionsContainer}>
          {visibleActions.map((action, index) => {
            let backgroundColor = colors.primary
            let Icon = IconEye

            // Determine icon and color based on action key or variant
            if (action.key === 'edit' || action.icon === 'pencil') {
              backgroundColor = '#1d4ed8'
              Icon = IconEdit
            } else if (action.key === 'delete' || action.variant === 'destructive') {
              backgroundColor = '#ef4444'
              Icon = IconTrash
            } else if (action.key === 'view' || action.icon === 'eye') {
              backgroundColor = '#10b981'
              Icon = IconEye
            } else if (action.key === 'layout' || action.icon === 'truck') {
              backgroundColor = '#7c3aed' // violet-600
              Icon = IconTruck
            } else if (action.key === 'start' || action.icon === 'player-play') {
              backgroundColor = '#059669' // emerald-600
              Icon = IconPlayerPlay
            } else if (action.key === 'finish' || action.key === 'complete' || action.icon === 'circle-check' || action.icon === 'check') {
              backgroundColor = '#16a34a' // green-600
              Icon = IconCircleCheck
            } else if (action.key === 'request' || action.icon === 'cut') {
              backgroundColor = '#3b82f6' // blue-500
              Icon = IconCut
            } else if (action.key === 'change-sector' || action.icon === 'users') {
              backgroundColor = '#ea580c' // orange-600
              Icon = IconUsers
            } else if (action.key === 'copyFromTask' || action.icon === 'clipboardCopy') {
              backgroundColor = '#0d9488' // teal-600
              Icon = IconClipboardCopy
            } else if (action.key === 'release' || action.icon === 'calendar-check') {
              backgroundColor = '#0891b2' // cyan-600
              Icon = IconCalendarCheck
            } else if (action.key === 'addArtworks' || action.icon === 'photo') {
              backgroundColor = '#db2777' // pink-600
              Icon = IconPhoto
            } else if (action.key === 'pricing' || action.icon === 'currency-real') {
              backgroundColor = '#f59e0b' // amber-500
              Icon = IconCurrencyReal
            } else if (action.key === 'cancel' || action.icon === 'x') {
              backgroundColor = '#d97706' // amber-600 (different from delete-red and change-sector-orange)
              Icon = IconX
            }

            // Resolve dynamic label if it's a function
            const label = typeof action.label === 'function' ? action.label(item) : action.label

            const isActionActive = activeActionKey === action.key

            return (
              <TouchableOpacity
                key={action.key}
                style={[
                  styles.actionButton,
                  { backgroundColor },
                  isActionActive && { opacity: 0.6 }
                ]}
                onPress={() => handleAction(action)}
                activeOpacity={0.7}
                disabled={isActionActive}
              >
                {isActionActive ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Icon size={20} color="#fff" />
                )}
                {label && (
                  <ThemedText style={styles.actionText}>{label}</ThemedText>
                )}
              </TouchableOpacity>
            )
          })}
        </View>
      )
    },
    [visibleActions, colors, handleAction, activeActionKey]
  )

  if (visibleActions.length === 0) {
    return <>{children(closeActions)}</>
  }

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      onSwipeableOpen={handleOpen}
      onSwipeableClose={handleClose}
      rightThreshold={40}
      overshootRight={false}
    >
      {children(closeActions)}
    </Swipeable>
  )
})

const styles = StyleSheet.create({
  actionsContainer: {
    flexDirection: 'row',
    height: '100%',
  },
  actionButton: {
    width: 54,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  actionText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 10,
  },
})
