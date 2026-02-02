import { Layout } from '@/components/list/Layout'
import { activitiesListOptimizedConfig } from '@/config/list/inventory/activities-optimized'

export default function ActivityListScreen() {
  // Using OPTIMIZED config to reduce API payload by ~70%
  return <Layout config={activitiesListOptimizedConfig} />
}
