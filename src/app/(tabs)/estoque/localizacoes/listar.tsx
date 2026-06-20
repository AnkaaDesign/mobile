import { Layout } from '@/components/list/Layout'
import { warehouseLocationsListConfig } from '@/config/list/inventory/warehouse-locations'

export default function WarehouseLocationsListScreen() {
  return <Layout config={warehouseLocationsListConfig} />
}
