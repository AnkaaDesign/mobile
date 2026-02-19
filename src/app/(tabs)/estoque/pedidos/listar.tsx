import { Layout } from '@/components/list/Layout'
import { ordersListConfig } from '@/config/list/inventory/orders'

export default function OrderListScreen() {
  return <Layout config={ordersListConfig} />
}
