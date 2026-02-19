import { useLocalSearchParams } from 'expo-router'
import { Layout } from '@/components/list/Layout'
import { createFormulaComponentsListConfig } from '@/config/list/painting/formula-components'
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function ComponentListScreen() {
  const { formulaId } = useLocalSearchParams<{ formulaId: string }>()

  // Create config with the formulaId parameter
  const config = createFormulaComponentsListConfig(formulaId!)

  return <Layout config={config} />
}