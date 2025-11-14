import { Layout } from '@/components/list/Layout'
import { orderSchedulesListConfig } from '@/config/list/inventory/order-schedules'

export default function AutomaticOrderListScreen() {
  return <Layout config={orderSchedulesListConfig} />
}
