import { Layout } from '@/components/list/Layout'
import { maintenanceListConfig } from '@/config/list/inventory/maintenance'

export default function InventoryMaintenanceListScreen() {
  return <Layout config={maintenanceListConfig} />
}
