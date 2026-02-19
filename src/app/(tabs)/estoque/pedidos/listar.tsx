import { Layout } from '@/components/list/Layout'
import { ordersListConfig } from '@/config/list/inventory/orders'
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function OrderListScreen() {
  useScreenReady();
  return <Layout config={ordersListConfig} />
}
