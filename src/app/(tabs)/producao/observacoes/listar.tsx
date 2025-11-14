import { Layout } from '@/components/list/Layout'
import { observationsListConfig } from '@/config/list/production/observations'

export default function ObservationListScreen() {
  return <Layout config={observationsListConfig} />
}
