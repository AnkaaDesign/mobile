import { Layout } from '@/components/list/Layout'
import { ppeItemsListConfig } from '@/config/list/hr/ppe-items'
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function PpeListScreen() {
  return <Layout config={ppeItemsListConfig} />
}
