import { Layout } from '@/components/list/Layout'
import { productionsListConfig } from '@/config/list/painting/productions'
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function ProductionsListScreen() {
  return <Layout config={productionsListConfig} />
}
