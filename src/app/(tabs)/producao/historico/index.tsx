import { Layout } from '@/components/list/Layout'
import { historyListConfig } from '@/config/list/production/history'
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function ProductionHistoryScreen() {
  useScreenReady();
  return <Layout config={historyListConfig} />
}
