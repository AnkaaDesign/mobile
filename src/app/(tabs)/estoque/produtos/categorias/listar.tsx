import { Layout } from '@/components/list/Layout'
import { categoriesListConfig } from '@/config/list/inventory/categories'
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function CategoriasScreen() {
  useScreenReady();
  return <Layout config={categoriesListConfig} />
}
