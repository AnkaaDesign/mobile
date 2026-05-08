import React from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Layout } from '@/components/list/Layout'
import { observationsListConfig } from '@/config/list/production/observations'
import {
  TUTORIAL_TARGETS,
  useOptionalTutorial,
  useTutorialTarget,
} from '@/components/tutorial'

/**
 * Observation list screen.
 *
 * Tutorial wiring strategy:
 *   - the screen container registers `observacoesList` target.
 *   - the FAB's onPress is owned by `Layout` (we cannot modify it), so we
 *     register `observacoesFab` via an invisible Pressable overlay positioned
 *     to mirror the FAB exactly. During the FAB step the overlay receives the
 *     tap first (via `box-none` parent + child Pressable) and forwards both:
 *       1. tutorial.notifyAction("tap", { targetId: observacoesFab })
 *       2. router.push to the cadastrar screen
 *   - Outside tutorial mode the overlay is `pointerEvents="none"` so the real
 *     FAB receives every tap. Outside the FAB step the overlay still measures
 *     for the spotlight but is also non-interactive.
 *   - As a defensive fallback, the cadastrar.tsx screen fires the FAB tap event
 *     on mount whenever the active step is `observacoesFab` — this guarantees
 *     the tutorial advances even if the user somehow bypasses the overlay
 *     (e.g. via accessibility services, deep link, or a slightly-misaligned
 *     overlay rect).
 */
export default function ObservationListScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const tutorial = useOptionalTutorial()

  const listTarget = useTutorialTarget(TUTORIAL_TARGETS.observacoesList)
  const fabTarget = useTutorialTarget(TUTORIAL_TARGETS.observacoesFab)

  const isTutorialActive = !!tutorial?.isActive
  const isFabStep =
    tutorial?.currentStep?.targetId === TUTORIAL_TARGETS.observacoesFab

  // Position must mirror the FAB component (src/components/ui/fab.tsx):
  // bottom = max(24, insets.bottom + 32), right = 16, ~56x56 hit area.
  const fabBottom = Math.max(24, insets.bottom + 32)

  const handleFabTap = () => {
    // Fire the tutorial event FIRST so the engine sees the tap regardless of
    // navigation timing, then route. The engine's notifyAction is fire-and-
    // forget so this is non-blocking.
    fabTarget.onPress()
    router.push('/producao/observacoes/cadastrar' as any)
  }

  return (
    <View
      ref={listTarget.ref}
      onLayout={listTarget.onLayout}
      style={styles.flex}
    >
      <Layout config={observationsListConfig} />

      {/* Tutorial-only invisible overlay aligned with the FAB. The Pressable
          child catches the tap; the wrapper uses `box-none` so that outside
          the FAB step the spotlight engine can still measure this rect for
          the highlight without blocking other taps. */}
      <View
        ref={fabTarget.ref}
        onLayout={fabTarget.onLayout}
        pointerEvents={isTutorialActive && isFabStep ? 'box-none' : 'none'}
        style={[styles.fabOverlay, { bottom: fabBottom }]}
      >
        <Pressable
          onPress={handleFabTap}
          style={styles.fabHit}
          accessibilityLabel="Criar observação"
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  fabOverlay: {
    position: 'absolute',
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  fabHit: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
})
