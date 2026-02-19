import { Layout } from '@/components/list/Layout'
import { paintBrandsListConfig } from '@/config/list/painting'
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function PaintBrandListScreen() {
  return <Layout config={paintBrandsListConfig} />
}
