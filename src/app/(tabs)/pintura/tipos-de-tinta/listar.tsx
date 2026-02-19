import { Layout } from '@/components/list/Layout'
import { paintTypesListConfig } from '@/config/list/painting/paint-types'
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function PaintTypeListScreen() {
  return <Layout config={paintTypesListConfig} />
}
