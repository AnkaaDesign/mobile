import { Layout } from '@/components/list/Layout'
import { paintsListConfig } from '@/config/list/production/paints'

export default function PaintsListScreen() {
  return <Layout config={paintsListConfig} />
}
