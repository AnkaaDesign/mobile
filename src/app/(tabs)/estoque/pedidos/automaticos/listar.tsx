import { Layout } from '@/components/list/Layout'
import { orderSchedulesListConfig } from '@/config/list/inventory/order-schedules'
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function AutomaticOrderListScreen() {
  useScreenReady();
  return <Layout config={orderSchedulesListConfig} />
}
