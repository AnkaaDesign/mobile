import { useCallback, useRef } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { TaskScheduleLayout } from '@/components/production/task/schedule'
import { tasksListConfig } from '@/config/list/production/tasks'
import { queryClient } from '@/lib/query-client'
import { taskKeys } from '@/hooks/queryKeys'

export default function TaskScheduleScreen() {
  // useScreenReady is called inside TaskScheduleLayout with data loading state

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

  return <TaskScheduleLayout config={tasksListConfig} />
}
