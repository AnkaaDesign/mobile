import { Layout } from '@/components/list/Layout'
import { personalPpeDeliveriesListConfig } from '@/config/list/personal'
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function MyPPEIndexScreen() {
  return <Layout config={personalPpeDeliveriesListConfig} />
}
