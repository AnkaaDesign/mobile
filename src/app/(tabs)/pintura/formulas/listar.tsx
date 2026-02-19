import { Layout } from '@/components/list/Layout'
import { formulasListConfig } from '@/config/list/painting/formulas'
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function FormulasListScreen() {
  return <Layout config={formulasListConfig} />
}
