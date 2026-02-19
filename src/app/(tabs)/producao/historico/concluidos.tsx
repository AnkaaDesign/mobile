import { Layout } from '@/components/list/Layout'
import { historyCompletedListConfig } from '@/config/list/production/history-completed'
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function ProductionHistoryCompletedScreen() {
  useScreenReady();
  return <Layout config={historyCompletedListConfig} />
}
