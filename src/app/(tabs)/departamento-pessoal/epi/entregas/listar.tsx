import { Layout } from '@/components/list/Layout'
import { ppeDeliveriesListConfig } from '@/config/list/personnel-department/ppe-deliveries'
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function PpeDeliveryListScreen() {
  return <Layout config={ppeDeliveriesListConfig} />
}
