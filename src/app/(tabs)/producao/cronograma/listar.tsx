import { useCallback, useRef } from 'react'
import { View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { TaskScheduleLayout } from '@/components/production/task/schedule'
import { tasksListConfig } from '@/config/list/production/tasks'
import { queryClient } from '@/lib/query-client'
import { taskKeys } from '@/hooks/queryKeys'
import { useTutorialTarget, TUTORIAL_TARGETS } from '@/components/tutorial'

export default function TaskScheduleScreen() {
  // useScreenReady is called inside TaskScheduleLayout with data loading state

  const listTarget = useTutorialTarget(TUTORIAL_TARGETS.cronogramaList)

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

  return (
    <View ref={listTarget.ref} onLayout={listTarget.onLayout} style={{ flex: 1 }}>
      <TaskScheduleLayout config={tasksListConfig} />
    </View>
  )
}
