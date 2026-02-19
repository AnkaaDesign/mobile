import { Layout } from '@/components/list/Layout'
import { positionsListConfig } from '@/config/list/hr/positions'
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function PositionListScreen() {
  return <Layout config={positionsListConfig} />
}
