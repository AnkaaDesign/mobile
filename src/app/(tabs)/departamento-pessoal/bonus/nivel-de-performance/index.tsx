import { Layout } from '@/components/list/Layout'
import { performanceLevelsListConfig } from '@/config/list/personnel-department/performance-levels'
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function PerformanceLevelsListScreen() {
  return <Layout config={performanceLevelsListConfig} />
}
