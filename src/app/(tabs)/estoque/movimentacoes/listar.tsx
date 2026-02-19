import { Layout } from '@/components/list/Layout'
import { activitiesListOptimizedConfig } from '@/config/list/inventory/activities-optimized'
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function ActivityListScreen() {
  useScreenReady();
  // Using OPTIMIZED config to reduce API payload by ~70%
  return <Layout config={activitiesListOptimizedConfig} />
}
