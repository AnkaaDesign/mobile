import { Layout } from '@/components/list/Layout'
import { suppliersListConfig } from '@/config/list/inventory/suppliers'
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function SuppliersListScreen() {
  useScreenReady();
  return <Layout config={suppliersListConfig} />
}
