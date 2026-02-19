import { Layout } from '@/components/list/Layout'
import { brandsListConfig } from '@/config/list/inventory/brands'
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function MarcasScreen() {
  useScreenReady();
  return <Layout config={brandsListConfig} />
}
