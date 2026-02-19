import { Layout } from '@/components/list/Layout'
import { serviceOrdersListConfig } from '@/config/list/production/service-orders'
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function ServiceOrderListScreen() {
  return <Layout config={serviceOrdersListConfig} />
}
