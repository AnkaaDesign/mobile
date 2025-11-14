import { Layout } from '@/components/list/Layout'
import { orderSchedulesListConfig } from '@/config/list/inventory/order-schedules'

export default function InventoryOrderSchedulesListScreen() {
  return <Layout config={orderSchedulesListConfig} />
}
