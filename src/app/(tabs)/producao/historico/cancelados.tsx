import { Layout } from '@/components/list/Layout'
import { historyCancelledListConfig } from '@/config/list/production/history-cancelled'
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function ProductionHistoryCancelledScreen() {
  useScreenReady();
  return <Layout config={historyCancelledListConfig} />
}
