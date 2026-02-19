import { Layout } from '@/components/list/Layout'
import { paintsListConfig } from '@/config/list/production/paints'
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function PaintsListScreen() {
  useScreenReady();
  return <Layout config={paintsListConfig} />
}
