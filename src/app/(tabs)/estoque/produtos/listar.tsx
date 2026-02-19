import { Layout } from '@/components/list/Layout'
import { itemsListConfig } from '@/config/list/inventory/items'
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function ProdutosScreen() {
  useScreenReady();
  return <Layout config={itemsListConfig} />
}
