import { Layout } from '@/components/list/Layout'
import { historyCompletedListConfig } from '@/config/list/production/history-completed'

export default function ProductionHistoryCompletedScreen() {
  return <Layout config={historyCompletedListConfig} />
}
