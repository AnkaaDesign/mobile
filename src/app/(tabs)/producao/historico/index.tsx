import { useCallback, useRef } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { Layout } from '@/components/list/Layout'
import { historyListConfig } from '@/config/list/production/history'
import { queryClient } from '@/lib/query-client'
import { taskKeys } from '@/hooks/queryKeys'

export default function ProductionHistoryScreen() {
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

  return <Layout config={historyListConfig} />
}
