import { Layout } from '@/components/list/Layout'
import { ppeSizesListConfig } from '@/config/list/hr/ppe-sizes'
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function PpeSizeListScreen() {
  return <Layout config={ppeSizesListConfig} />
}
