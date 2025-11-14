import { Layout } from '@/components/list/Layout'
import { cuttingPlansListConfig } from '@/config/list/production/cutting-plans'

export default function CuttingPlanListScreen() {
  return <Layout config={cuttingPlansListConfig} />
}
