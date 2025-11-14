import { Layout } from '@/components/list/Layout'
import { serviceOrdersListConfig } from '@/config/list/production/service-orders'

export default function ServiceOrderListScreen() {
  return <Layout config={serviceOrdersListConfig} />
}
