import { memo, useRef, useEffect, useCallback } from 'react'
import { View, TouchableOpacity, StyleSheet, Alert, Animated } from 'react-native'
import { Swipeable } from 'react-native-gesture-handler'
import { ThemedText } from '@/components/ui/themed-text'
import { useTheme } from '@/lib/theme'
import { useSwipeRow } from '@/contexts/swipe-row-context'
import { useRouter } from 'expo-router'
import { IconEye, IconEdit, IconTrash } from '@tabler/icons-react-native'
import type { TableAction } from '../types'

interface RowActionsProps<T extends { id: string }> {
  item: T
  actions: TableAction<T>[]
  children: (closeActions: () => void) => React.ReactNode
}

export const RowActions = memo(function RowActions<T extends { id: string }>({
  item,
  actions,
  children,
}: RowActionsProps<T>) {
  const { colors } = useTheme()
  const router = useRouter()
  const swipeableRef = useRef<Swipeable>(null)
  const { activeRowId, setActiveRowId, closeActiveRow } = useSwipeRow()
  const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Filter visible actions
  const visibleActions = actions.filter(
    (action) => !action.visible || action.visible(item)
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
      closeActions()

      if (action.confirm) {
        const message = typeof action.confirm.message === 'function'
          ? action.confirm.message(item)
          : action.confirm.message

        Alert.alert(
          action.confirm.title,
          message,
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Confirmar',
              style: action.variant === 'destructive' ? 'destructive' : 'default',
              onPress: async () => {
                if (action.onPress) {
                  await action.onPress(item, router)
                } else if (action.route) {
                  const route = typeof action.route === 'function' ? action.route(item) : action.route
                  router.push(route as any)
                }
              },
            },
          ]
        )
      } else {
        if (action.onPress) {
          await action.onPress(item, router)
        } else if (action.route) {
          const route = typeof action.route === 'function' ? action.route(item) : action.route
          router.push(route as any)
        }
      }
    },
    [item, closeActions, router]
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
            }

            return (
              <TouchableOpacity
                key={action.key}
                style={[styles.actionButton, { backgroundColor }]}
                onPress={() => handleAction(action)}
                activeOpacity={0.7}
              >
                <Icon size={20} color="#fff" />
                {action.label && (
                  <ThemedText style={styles.actionText}>{action.label}</ThemedText>
                )}
              </TouchableOpacity>
            )
          })}
        </View>
      )
    },
    [visibleActions, colors, handleAction]
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
  },
  actionButton: {
    width: 70,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
})
