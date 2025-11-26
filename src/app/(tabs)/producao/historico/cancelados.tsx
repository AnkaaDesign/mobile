import { Layout } from '@/components/list/Layout'
import { historyCancelledListConfig } from '@/config/list/production/history-cancelled'

export default function ProductionHistoryCancelledScreen() {
  return <Layout config={historyCancelledListConfig} />
}
