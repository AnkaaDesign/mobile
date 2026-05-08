import { useCallback, useRef } from 'react'
import { View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Layout } from '@/components/list/Layout'
import { historyListConfig } from '@/config/list/production/history'
import { queryClient } from '@/lib/query-client'
import { taskKeys } from '@/hooks/queryKeys'
import { useTutorialTarget, TUTORIAL_TARGETS } from '@/components/tutorial'

export default function ProductionHistoryScreen() {
  // Tutorial targets
  const tabsTarget = useTutorialTarget(TUTORIAL_TARGETS.historicoTabs)
  const listTarget = useTutorialTarget(TUTORIAL_TARGETS.historicoList)

  // Refetch task lists when screen regains focus
  const isFirstMount = useRef(true)
  useFocusEffect(
    useCallback(() => {
      if (isFirstMount.current) {
        isFirstMount.current = false
        return
      }
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
    }, [])
  )

  // NOTE: This screen does NOT have a visible tab switcher between
  // concluídas/canceladas (those are separate routes: concluidos.tsx /
  // cancelados.tsx). historicoTabs is wired to the screen's status filter
  // area at the top so the tutorial has a sensible spotlight. If a real
  // tab switcher gets introduced later, rewire historicoTabs to it.
  return (
    <View ref={tabsTarget.ref} onLayout={tabsTarget.onLayout} style={{ flex: 1 }}>
      <View ref={listTarget.ref} onLayout={listTarget.onLayout} style={{ flex: 1 }}>
        <Layout config={historyListConfig} />
      </View>
    </View>
  )
}
