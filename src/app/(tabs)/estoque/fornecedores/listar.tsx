import { Layout } from '@/components/list/Layout'
import { suppliersListConfig } from '@/config/list/inventory/suppliers'

export default function SuppliersListScreen() {
  return <Layout config={suppliersListConfig} />
}
