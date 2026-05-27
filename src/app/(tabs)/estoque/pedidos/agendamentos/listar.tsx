import { Layout } from '@/components/list/Layout'
import { orderSchedulesListConfig } from '@/config/list/inventory/order-schedules'
import { ExpectedTotalProvider } from '@/components/inventory/order/schedule/expected-total-context'

export default function InventoryOrderSchedulesListScreen() {
  // ExpectedTotalProvider fires ONE batch /order-schedules/expected-totals request
  // for the visible schedule ids and exposes an id -> expectedTotal map that each
  // row's frequency cell reads to show "Preço esperado".
  return (
    <ExpectedTotalProvider>
      <Layout config={orderSchedulesListConfig} />
    </ExpectedTotalProvider>
  )
}
