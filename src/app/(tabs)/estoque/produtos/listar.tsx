import { Layout } from '@/components/list/Layout'
import { itemsListConfig } from '@/config/list/inventory/items'

export default function ItemListScreen() {
  return <Layout config={itemsListConfig} />
}
